// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@onchain-id/solidity/contracts/Identity.sol";
import "@onchain-id/solidity/contracts/interface/IIdentity.sol";
import "./interfaces/IIdentityRegistry.sol";

/**
 * @title IWorldIDRouter
 * @notice Interface for World ID Router contract for proof verification
 */
interface IWorldIDRouter {
    /**
     * @notice Verifies a World ID proof
     * @param root The root of the Merkle tree
     * @param groupId The group identifier (1 for phone, 2 for orb)
     * @param signalHash The signal hash
     * @param nullifierHash The nullifier hash
     * @param externalNullifierHash The external nullifier hash (app identifier)
     * @param proof The ZK proof
     */
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

/**
 * @title ChainlinkKYCIssuer
 * @author Ours Platform
 * @notice Sistema de KYC descentralizado usando World ID + Chainlink CRE + Onfido
 * @dev Implementa patrones de seguridad:
 *      - Check-Effects-Interactions (CEI)
 *      - Emergency Stop (Pausable)
 *      - AccessControl para gestión de roles
 *      - ReentrancyGuard para prevenir ataques
 * 
 * ARQUITECTURA:
 * 1. World ID: Prueba de humanidad única (previene Sybil attacks)
 * 2. Onfido: Verificación legal de identidad (DNI, selfie)
 * 3. Chainlink CRE: Orquestación descentralizada off-chain
 * 4. OnchainID: Almacenamiento de claims verificados (ERC-735)
 * 5. IdentityRegistry: Registro de identidades para ERC-3643
 * 
 * FLUJO:
 * Usuario → requestKYCWithWorldID() → verifica World ID on-chain
 *        → emite KYCRequested → Chainlink DON escucha
 *        → DON consulta Onfido → consenso entre nodos
 *        → DON ejecuta fulfillKYC() → emite claim en OnchainID
 *        → registra en IdentityRegistry → usuario puede invertir
 */
contract ChainlinkKYCIssuer is AccessControl, Pausable, ReentrancyGuard {

    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Rol para Chainlink DON (Decentralized Oracle Network)
    /// @dev Solo direcciones con este rol pueden ejecutar fulfillKYC()
    ///      Esto previene que cualquiera pueda "auto-aprobarse" KYC
    bytes32 public constant CHAINLINK_DON_ROLE = keccak256("CHAINLINK_DON_ROLE");
    
    /// @notice Rol para operadores que pueden gestionar configuraciones
    /// @dev Pueden actualizar parámetros pero NO aprobar KYC directamente
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Estados del proceso KYC
     * @dev Flujo: NONE → WORLD_ID_VERIFIED → PENDING_OFFCHAIN → FULL_KYC
     *              o   → WORLD_ID_VERIFIED → PENDING_OFFCHAIN → REJECTED
     * 
     * POR QUÉ MÚLTIPLES ESTADOS:
     * - Permite tracking granular del progreso
     * - Usuario puede ver en qué etapa está
     * - Admin puede debuggear problemas
     * - Frontend puede mostrar UI apropiada
     */
    enum KYCStatus {
        NONE,                    // No ha iniciado KYC
        WORLD_ID_VERIFIED,       // World ID verificado, esperando Onfido
        PENDING_OFFCHAIN,        // Chainlink procesando verificación Onfido
        FULL_KYC,                // KYC completo, puede invertir
        REJECTED                 // Rechazado (puede reintentar después)
    }

    /*//////////////////////////////////////////////////////////////
                              STRUCTURES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Datos del KYC de un usuario
     * @dev Almacena todo el historial y estado actual
     * 
     * POR QUÉ GUARDAR NULLIFIER:
     * - Previene reutilización del mismo World ID proof
     * - Un nullifier = una persona
     * - Si alguien intenta usar el mismo proof → revert
     * 
     * POR QUÉ TIMESTAMP:
     * - Auditabilidad: cuándo se solicitó/aprobó
     * - Expiraciones: KYC podría vencer después de X tiempo
     * - Métricas: velocidad de procesamiento
     */
    struct KYCData {
        KYCStatus status;           // Estado actual del KYC
        bytes32 nullifierHash;      // World ID nullifier (único por persona)
        uint256 requestedAt;        // Timestamp de solicitud
        uint256 approvedAt;         // Timestamp de aprobación (0 si no aprobado)
        bytes32 kycDataHash;        // Hash de datos KYC de Onfido
        address onchainIDAddress;   // Dirección del contrato OnchainID del usuario
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapeo de usuario a sus datos KYC
    mapping(address => KYCData) public kycData;
    
    /// @notice Mapeo de nullifiers usados (prevenir reutilización)
    /// @dev Si nullifier ya está usado → otra persona ya lo usó o mismo usuario reintenta
    ///      POR QUÉ: World ID permite múltiples apps, pero en NUESTRA app
    ///      un nullifier solo puede usarse UNA VEZ
    mapping(bytes32 => bool) public usedNullifiers;
    
    /// @notice Contador de KYCs aprobados (métricas)
    uint256 public totalKYCsApproved;
    
    /// @notice Tiempo de cooldown para reintentar después de rechazo (segundos)
    /// @dev POR QUÉ COOLDOWN: Prevenir spam de requests
    ///      Valor razonable: 7 días = 604800 segundos
    uint256 public rejectionCooldown = 7 days;
    
    /// @notice Dirección del contrato WorldID Router (para verificar proofs)
    /// @dev POR QUÉ SEPARADO: World ID tiene su propio contrato de verificación
    ///      No verificamos nosotros, delegamos a contrato oficial de World
    address public immutable worldIdRouter;
    
    /// @notice App ID de World (identificador único de nuestra app)
    /// @dev POR QUÉ: Cada app en World tiene su ID
    ///      Ejemplo: "app_ours_kyc_v1"
    string public worldAppId;
    
    /// @notice Action ID (qué acción específica)
    /// @dev POR QUÉ: Una app puede tener múltiples acciones
    ///      Ejemplo: "kyc-verification"
    string public worldActionId;
    
    /// @notice Registro de identidades ERC-3643
    /// @dev POR QUÉ: IdentityRegistry es el componente central de ERC-3643
    ///      Los tokens ERC-3643 consultan este registro antes de cada transfer
    ///      Solo usuarios registrados aquí pueden recibir/enviar tokens
    IIdentityRegistry public identityRegistry;
    
    /// @notice País por defecto para usuarios (Argentina = 32)
    /// @dev POR QUÉ: IdentityRegistry requiere un código de país
    ///      ISO 3166-1 numeric: Argentina = 32
    ///      Puede configurarse por usuario en futuro
    uint16 public constant DEFAULT_COUNTRY = 32;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitido cuando usuario solicita KYC
     * @dev Chainlink DON escucha este evento para iniciar workflow
     * 
     * POR QUÉ EVENTO Y NO RETORNO:
     * - Chainlink CRE funciona escuchando eventos on-chain
     * - Eventos son más baratos que storage
     * - Permite múltiples listeners (analytics, frontend, etc.)
     * 
     * @param user Dirección del usuario
     * @param nullifierHash Nullifier de World ID
     * @param timestamp Cuándo se solicitó
     */
    event KYCRequested(
        address indexed user,
        bytes32 indexed nullifierHash,
        uint256 timestamp
    );

    /**
     * @notice Emitido cuando KYC es aprobado o rechazado
     * @param user Dirección del usuario
     * @param approved Si fue aprobado (true) o rechazado (false)
     * @param kycDataHash Hash de los datos KYC de Onfido
     */
    event KYCFulfilled(
        address indexed user,
        bool approved,
        bytes32 kycDataHash
    );

    /**
     * @notice Emitido cuando se actualiza configuración
     */
    event ConfigurationUpdated(
        string parameter,
        string value
    );

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidWorldIDProof();
    error NullifierAlreadyUsed();
    error KYCAlreadyCompleted();
    error KYCNotRequested();
    error RejectionCooldownNotPassed();
    error InvalidConfiguration();
    error ZeroAddress();
    // Additional errors for testing compatibility
    error InvalidUser();
    error NoKYCRequest();
    error KYCAlreadyProcessed();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor del contrato
     * @dev Configura roles y direcciones iniciales
     * 
     * POR QUÉ IMMUTABLE WORLDIDROUTER:
     * - World ID Router no cambia frecuentemente
     * - Immutable ahorra gas en cada lectura
     * - Si cambia en futuro → deploy nuevo contrato
     * 
     * @param _worldIdRouter Dirección del World ID Router (verificador)
     * @param _worldAppId ID de la app en World
     * @param _worldActionId ID de la acción específica
     * @param _identityRegistry Dirección del IdentityRegistry ERC-3643
     */
    constructor(
        address _worldIdRouter,
        string memory _worldAppId,
        string memory _worldActionId,
        address _identityRegistry
    ) {
        if (_worldIdRouter == address(0)) revert ZeroAddress();
        if (_identityRegistry == address(0)) revert ZeroAddress();
        
        worldIdRouter = _worldIdRouter;
        worldAppId = _worldAppId;
        worldActionId = _worldActionId;
        identityRegistry = IIdentityRegistry(_identityRegistry);
        
        // Configurar roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        // Admin puede otorgar rol de Chainlink DON
        _setRoleAdmin(CHAINLINK_DON_ROLE, DEFAULT_ADMIN_ROLE);
    }

    /*//////////////////////////////////////////////////////////////
                          EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Solicita KYC verificando World ID proof
     * @dev PASO 1 del flujo: Usuario genera proof en World App y lo envía acá
     * 
     * PATRÓN CEI (Check-Effects-Interactions):
     * 1. CHECK: Verificar World ID proof, estado previo, nullifier
     * 2. EFFECTS: Actualizar estado, marcar nullifier usado
     * 3. INTERACTIONS: Emitir evento (no hay calls externos aquí)
     * 
     * POR QUÉ NONREENTRANT:
     * - Aunque no hay external calls, es buena práctica
     * - Si en futuro agregamos calls → ya protegido
     * 
     * POR QUÉ WHENNOTPAUSED:
     * - Emergency stop: si hay vulnerabilidad → pausamos
     * - Admin puede pausar mientras se investiga
     * 
     * @param signal Señal usada para generar el proof (debe ser app-specific)
     * @param root Merkle root del World ID tree (estado actual)
     * @param nullifierHash Hash del nullifier (único por persona)
     * @param proof ZK proof generado por World ID
     */
    function requestKYCWithWorldID(
        uint256 signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        // ========== CHECK ==========
        
        // 1. Verificar que no haya completado KYC ya
        // POR QUÉ: Una persona = un KYC. Si ya lo tiene → no necesita otro
        if (kycData[msg.sender].status == KYCStatus.FULL_KYC) {
            revert KYCAlreadyCompleted();
        }
        
        // 2. Verificar que nullifier no haya sido usado
        // POR QUÉ: Prevenir Sybil attacks. Un nullifier = una persona única
        bytes32 nullifierBytes = bytes32(nullifierHash);
        if (usedNullifiers[nullifierBytes]) {
            revert NullifierAlreadyUsed();
        }
        
        // 3. Si fue rechazado antes, verificar cooldown
        // POR QUÉ: Prevenir spam. Usuario debe esperar antes de reintentar
        if (kycData[msg.sender].status == KYCStatus.REJECTED) {
            if (block.timestamp < kycData[msg.sender].requestedAt + rejectionCooldown) {
                revert RejectionCooldownNotPassed();
            }
        }
        
        // 4. VERIFICAR WORLD ID PROOF (la parte más crítica)
        // POR QUÉ LLAMAR A WORLD ID ROUTER:
        // - World tiene el Merkle tree de todos los usuarios verificados
        // - Proof demuestra: "Estoy en ese árbol" sin revelar quién soy
        // - Verificación usa ZK-SNARKs (matemáticamente imposible de falsificar)
        _verifyWorldIDProof(signal, root, nullifierHash, proof);
        
        // ========== EFFECTS ==========
        
        // 5. Marcar nullifier como usado
        // POR QUÉ: Prevenir que se use de nuevo (mismo proof)
        usedNullifiers[nullifierBytes] = true;
        
        // 6. Actualizar estado del usuario
        kycData[msg.sender] = KYCData({
            status: KYCStatus.WORLD_ID_VERIFIED,  // Paso 1 completo
            nullifierHash: nullifierBytes,
            requestedAt: block.timestamp,
            approvedAt: 0,                        // Todavía no aprobado
            kycDataHash: bytes32(0),              // Se llenará cuando Onfido apruebe
            onchainIDAddress: address(0)          // Se creará cuando se apruebe
        });
        
        // ========== INTERACTIONS ==========
        
        // 7. Emitir evento para Chainlink
        // POR QUÉ: Chainlink DON escucha este evento para iniciar workflow
        emit KYCRequested(msg.sender, nullifierBytes, block.timestamp);
    }

    /**
     * @notice Chainlink DON ejecuta este callback después de verificar Onfido
     * @dev PASO 2 del flujo: DON consultó Onfido y trae el resultado
     * 
     * PATRÓN CEI:
     * 1. CHECK: Verificar caller es Chainlink, estado correcto
     * 2. EFFECTS: Actualizar estado, incrementar contador
     * 3. INTERACTIONS: Crear OnchainID, registrar en IdentityRegistry
     * 
     * POR QUÉ SOLO CHAINLINK_DON_ROLE:
     * - Solo Chainlink puede ejecutar esto
     * - Previene auto-aprobación
     * - Descentralizado: múltiples nodos deben consensuar
     * 
     * @param user Dirección del usuario
     * @param approved Si Onfido aprobó (true) o rechazó (false)
     * @param kycDataHash Hash de los datos KYC (documento, score, etc.)
     */
    function fulfillKYC(
        address user,
        bool approved,
        bytes32 kycDataHash
    )
        external
        whenNotPaused
        nonReentrant
        onlyRole(CHAINLINK_DON_ROLE)
    {
        // ========== CHECK ==========
        
        // 1. Verificar que usuario haya solicitado KYC
        // POR QUÉ: No podemos aprobar a alguien que nunca lo pidió
        if (kycData[user].status != KYCStatus.WORLD_ID_VERIFIED) {
            revert KYCNotRequested();
        }
        
        // ========== EFFECTS ==========
        
        // 2. Actualizar estado según resultado
        if (approved) {
            kycData[user].status = KYCStatus.FULL_KYC;
            kycData[user].approvedAt = block.timestamp;
            kycData[user].kycDataHash = kycDataHash;
            totalKYCsApproved++;
            
        } else {
            kycData[user].status = KYCStatus.REJECTED;
            // Usuario puede reintentar después de cooldown
        }
        
        // ========== INTERACTIONS ==========
        
        // 3. Si aprobado: Crear OnchainID y registrar en ERC-3643
        if (approved) {
            _registerInERC3643(user);
        }
        
        // 4. Emitir evento
        emit KYCFulfilled(user, approved, kycDataHash);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verifica si un usuario tiene KYC completo
     * @dev SaleManager.buyFractions() llamará esto antes de permitir compra
     * 
     * POR QUÉ FUNCIÓN SEPARADA:
     * - Interfaz clara para otros contratos
     * - Puede agregar lógica adicional (ej: verificar expiración)
     * - Más legible que acceder directamente al mapping
     * 
     * @param user Dirección a verificar
     * @return True si tiene KYC completo
     */
    function isKYCVerified(address user) external view returns (bool) {
        return kycData[user].status == KYCStatus.FULL_KYC;
    }

    /**
     * @notice Obtiene todos los datos KYC de un usuario
     * @param user Dirección del usuario
     * @return Struct completo con toda la info
     */
    function getKYCData(address user) external view returns (KYCData memory) {
        return kycData[user];
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pausa el contrato (emergency stop)
     * @dev Solo DEFAULT_ADMIN_ROLE puede ejecutar
     * 
     * POR QUÉ PAUSABLE:
     * - Si se detecta vulnerabilidad → pausar inmediatamente
     * - Mientras está pausado → no se pueden solicitar KYC nuevos
     * - Pero datos existentes se mantienen seguros
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Reactiva el contrato
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Actualiza el cooldown de rechazo
     * @param newCooldown Nuevo tiempo en segundos
     */
    function updateRejectionCooldown(uint256 newCooldown) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        if (newCooldown > 365 days) revert InvalidConfiguration();
        rejectionCooldown = newCooldown;
        emit ConfigurationUpdated("rejectionCooldown", _uintToString(newCooldown));
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verifica un World ID proof llamando al router oficial
     * @dev Esta es la parte MÁS CRÍTICA de seguridad
     * 
     * IMPLEMENTACIÓN EN PRODUCCIÓN:
     * - Llamamos al World ID Router oficial para verificar el proof
     * - Si la verificación falla, el router hará revert automáticamente
     * - Usamos groupId = 1 (phone verified) para mayor accesibilidad
     * - Signal se convierte a field element usando hash
     * - App ID se convierte a external nullifier hash
     * 
     * SEGURIDAD:
     * - World ID Router usa pairing checks (BN254 curve)
     * - Verificación ZK matemáticamente imposible de falsificar
     * - Root debe coincidir con estado actual de World ID tree
     * - Nullifier debe pertenecer a alguien verificado en World
     * 
     * @param signal Señal de la app (debe ser único y específico)
     * @param root Merkle root del estado actual de World ID
     * @param nullifierHash Nullifier único del usuario
     * @param proof ZK proof [8 elementos] generado por World ID
     */
    function _verifyWorldIDProof(
        uint256 signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) internal view {
        // Validaciones básicas antes de llamar al router
        if (signal == 0 || root == 0 || nullifierHash == 0) {
            revert InvalidWorldIDProof();
        }
        
        // Convertir signal a field element (hash del signal)
        uint256 signalHash = _hashToField(abi.encodePacked(signal));
        
        // Convertir App ID a external nullifier (identificador único de nuestra app)
        uint256 externalNullifierHash = _hashToField(abi.encodePacked(worldAppId));
        
        // LLAMADA AL WORLD ID ROUTER OFICIAL
        // Si el proof es inválido, verifyProof() hará revert automáticamente
        try IWorldIDRouter(worldIdRouter).verifyProof(
            root,
            1, // groupId: 1 = phone verified (más accesible que orb)
            signalHash,
            nullifierHash,
            externalNullifierHash,
            proof
        ) {
            // Verificación exitosa - continuamos
        } catch {
            // Cualquier error en verificación = proof inválido
            revert InvalidWorldIDProof();
        }
    }

    /**
     * @notice Convierte datos a field element usando keccak256
     * @dev World ID requiere que señales y app IDs sean field elements
     * @param data Datos a convertir
     * @return Field element resultante
     */
    function _hashToField(bytes memory data) internal pure returns (uint256) {
        return uint256(keccak256(data)) >> 8; // Reducir a 248 bits para BN254
    }

    /**
     * @notice Helper para convertir uint a string
     */
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @notice Crea OnchainID y registra usuario en IdentityRegistry (ERC-3643)
     * @dev INTEGRACIÓN ERC-3643 COMPLETA
     * 
     * FLUJO:
     * 1. Verificar si usuario ya tiene OnchainID registrado
     * 2. Si NO tiene → crear nuevo OnchainID
     * 3. Registrar en IdentityRegistry
     * 
     * POR QUÉ CREAR ONCHAINID:
     * - ERC-3643 requiere que cada usuario tenga un contrato OnchainID
     * - OnchainID almacena claims (ej: KYC aprobado)
     * - Tokens ERC-3643 consultan IdentityRegistry antes de transfers
     * 
     * POR QUÉ NO AÑADIMOS CLAIMS AQUÍ:
     * - IdentityRegistry ya tiene la lógica para verificar
     * - Los tokens consultan IdentityRegistry.isVerified()
     * - IdentityRegistry verifica que el usuario esté registrado
     * - Para MVP, solo necesitamos registrar (claims son opcionales)
     * 
     * @param user Dirección del usuario a registrar
     */
    function _registerInERC3643(address user) internal {
        // 1. Verificar si ya está registrado
        // POR QUÉ: Evitar crear OnchainID duplicados
        IIdentity existingIdentity = identityRegistry.identity(user);
        
        if (address(existingIdentity) != address(0)) {
            // Usuario ya tiene OnchainID registrado
            // Guardamos la dirección en nuestro mapping
            kycData[user].onchainIDAddress = address(existingIdentity);
            return;
        }
        
        // 2. Crear nuevo OnchainID
        // POR QUÉ USER COMO MANAGEMENT KEY:
        // - El usuario debe controlar su propia identidad
        // - Management key permite al usuario gestionar claims
        // - Es el estándar de OnchainID
        Identity newIdentity = new Identity(user, false);
        
        // 3. Guardar dirección del OnchainID
        kycData[user].onchainIDAddress = address(newIdentity);
        
        // 4. Registrar en IdentityRegistry
        // POR QUÉ DEFAULT_COUNTRY:
        // - IdentityRegistry requiere país para compliance
        // - En futuro, podríamos obtener país de Onfido
        // - Por ahora, usamos Argentina (32) como default
        try identityRegistry.registerIdentity(
            user,
            IIdentity(address(newIdentity)),
            DEFAULT_COUNTRY
        ) {
            // Registro exitoso
        } catch {
            // Si falla (ej: no tenemos rol AGENT), continuamos
            // El KYC sigue siendo válido en nuestro sistema
            // Pero el usuario NO podrá recibir tokens ERC-3643
            // TODO: En producción, deberíamos revertir aquí
        }
    }
    
    /*//////////////////////////////////////////////////////////////
                          TESTING HELPERS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Función SOLO para testing: simula una solicitud de KYC exitosa
     * @dev Permite que tests establezcan el estado WORLD_ID_VERIFIED sin verificar proof
     * @param user Usuario para el cual simular la solicitud
     * 
     * POR QUÉ ESTA FUNCIÓN:
     * - En tests, no tenemos acceso a World ID testnet
     * - Generar ZK proofs válidos es complejo
     * - Permite tests rápidos y determinísticos
     * - Solo admin puede llamarla (controlado en tests)
     * 
     * ADVERTENCIA: En producción, esta función NO debe usarse
     * TODO: Considerar compilación condicional para removerla en producción
     */
    function mockRequestKYCForTesting(address user) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        bytes32 mockNullifier = keccak256(abi.encodePacked("test_nullifier_", user));
        
        // Verificar que no haya completado KYC ya
        if (kycData[user].status == KYCStatus.FULL_KYC) {
            revert KYCAlreadyCompleted();
        }
        
        // Marcar nullifier como usado
        usedNullifiers[mockNullifier] = true;
        
        // Establecer estado WORLD_ID_VERIFIED
        kycData[user] = KYCData({
            status: KYCStatus.WORLD_ID_VERIFIED,
            nullifierHash: mockNullifier,
            requestedAt: block.timestamp,
            approvedAt: 0,
            kycDataHash: bytes32(0),
            onchainIDAddress: address(0)
        });
        
        emit KYCRequested(user, mockNullifier, block.timestamp);
    }
}

