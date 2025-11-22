// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PropertyRegistry
 * @author Ours Platform
 * @notice Registro de propiedades inmobiliarias tokenizadas con metadata on-chain y off-chain
 * @dev Implementa patrones de seguridad:
 *      - Check-Effects-Interactions (CEI)
 *      - Emergency Stop (Pausable)
 *      - AccessControl para gestión de roles
 * 
 * Arquitectura de roles:
 * - DEFAULT_ADMIN_ROLE: Administrador de la plataforma
 * - PROPERTY_ISSUER_ROLE: Constructoras que pueden registrar propiedades
 * - VERIFIER_ROLE: Entidades autorizadas a verificar y actualizar estados
 * 
 * Cada propiedad está vinculada a un token ERC-3643 único
 */
contract PropertyRegistry is AccessControl, Pausable {

    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Rol para las constructoras que registran propiedades
    bytes32 public constant PROPERTY_ISSUER_ROLE = keccak256("PROPERTY_ISSUER_ROLE");

    /// @notice Rol para verificadores que pueden actualizar estados de construcción
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Estados posibles de una propiedad
     * @dev Planning: En planificación
     *      InConstruction: En construcción activa
     *      Completed: Construcción completada
     *      Sold: Propiedad vendida, ganancias distribuidas
     *      Cancelled: Proyecto cancelado
     */
    enum PropertyStatus {
        Planning,
        InConstruction,
        Completed,
        Sold,
        Cancelled
    }

    /*//////////////////////////////////////////////////////////////
                              STRUCTURES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Parámetros para registrar una nueva propiedad
     * @param token Dirección del token ERC-3643
     * @param name Nombre del proyecto
     * @param location Dirección física
     * @param totalArea Área total en m²
     * @param units Cantidad de unidades
     * @param constructionStart Timestamp de inicio de construcción
     * @param estimatedCompletion Timestamp estimado de finalización
     * @param ipfsHash Hash IPFS con documentación
     * @param cadastralNumber Número catastral
     * @param totalTokenSupply Total de tokens a emitir
     * @param totalInvestmentTarget Meta de recaudación total
     * @param estimatedSalePrice Precio estimado de venta final de la propiedad
     */
    struct PropertyParams {
        address token;
        string name;
        string location;
        uint256 totalArea;
        uint256 units;
        uint256 constructionStart;
        uint256 estimatedCompletion;
        string ipfsHash;
        string cadastralNumber;
        uint256 totalTokenSupply;
        uint256 totalInvestmentTarget;
        uint256 estimatedSalePrice;
    }

    /**
     * @notice Estructura que representa una propiedad inmobiliaria tokenizada
     * @param token Dirección del token ERC-3643 que representa esta propiedad
     * @param issuer Constructora/desarrolladora que registró la propiedad
     * @param name Nombre del proyecto (ej: "Edificio Palermo Tower")
     * @param location Dirección física de la propiedad
     * @param totalArea Área total en metros cuadrados (m²)
     * @param units Cantidad de unidades en la propiedad
     * @param constructionStart Timestamp de inicio de construcción
     * @param estimatedCompletion Timestamp estimado de finalización
     * @param actualCompletion Timestamp real de finalización (0 si no completado)
     * @param status Estado actual de la propiedad
     * @param ipfsHash Hash IPFS con fotos, planos y documentación
     * @param cadastralNumber Número catastral/registro legal
     * @param legalOwner Propietario legal de la propiedad (constructora)
     * @param registeredAt Timestamp de registro en el contrato
     * @param isActive Si el registro está activo
     * @param totalTokenSupply Total de tokens que representa la propiedad
     * @param totalInvestmentTarget Meta de recaudación (costo del proyecto)
     * @param estimatedSalePrice Precio estimado de venta final
     */
    struct Property {
        address token;
        address issuer;
        string name;
        string location;
        uint256 totalArea;
        uint256 units;
        uint256 constructionStart;
        uint256 estimatedCompletion;
        uint256 actualCompletion;
        PropertyStatus status;
        string ipfsHash;
        string cadastralNumber;
        address legalOwner;
        uint256 registeredAt;
        bool isActive;
        uint256 totalTokenSupply;
        uint256 totalInvestmentTarget;
        uint256 estimatedSalePrice;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Contador de propiedades registradas
    uint256 public propertyCount;
    
    /// @notice Array de todas las direcciones de tokens de propiedades (para iteración)
    address[] public allProperties;

    /*//////////////////////////////////////////////////////////////
                                MAPPINGS
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapeo de dirección de token a información de la propiedad
    mapping(address => Property) public properties;

    /// @notice Mapeo para verificar si un token ya tiene una propiedad registrada
    mapping(address => bool) public propertyExists;

    /// @notice Mapeo de issuer a lista de tokens de sus propiedades
    mapping(address => address[]) public issuerProperties;

    /// @notice Mapeo de número catastral a token (prevenir duplicados)
    mapping(string => address) public cadastralToToken;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitido cuando se registra una nueva propiedad
     * @param token Dirección del token ERC-3643
     * @param issuer Constructora que registró
     * @param name Nombre de la propiedad
     * @param cadastralNumber Número catastral
     */
    event PropertyRegistered(
        address indexed token,
        address indexed issuer,
        string name,
        string cadastralNumber
    );

    /**
     * @notice Emitido cuando se actualiza el estado de una propiedad
     * @param token Dirección del token
     * @param oldStatus Estado anterior
     * @param newStatus Nuevo estado
     * @param updatedBy Dirección que actualizó
     */
    event PropertyStatusUpdated(
        address indexed token,
        PropertyStatus oldStatus,
        PropertyStatus newStatus,
        address indexed updatedBy
    );

    /**
     * @notice Emitido cuando se actualiza la metadata de una propiedad
     * @param token Dirección del token
     * @param ipfsHash Nuevo hash IPFS
     */
    event PropertyMetadataUpdated(
        address indexed token,
        string ipfsHash
    );

    /**
     * @notice Emitido cuando se actualiza información de construcción
     * @param token Dirección del token
     * @param constructionStart Nueva fecha de inicio
     * @param estimatedCompletion Nueva fecha estimada de finalización
     */
    event ConstructionDatesUpdated(
        address indexed token,
        uint256 constructionStart,
        uint256 estimatedCompletion
    );

    /**
     * @notice Emitido cuando se marca una propiedad como completada
     * @param token Dirección del token
     * @param actualCompletion Fecha real de finalización
     */
    event PropertyCompleted(
        address indexed token,
        uint256 actualCompletion
    );

    /**
     * @notice Emitido cuando se actualiza el propietario legal
     * @param token Dirección del token
     * @param oldOwner Propietario anterior
     * @param newOwner Nuevo propietario
     */
    event LegalOwnerUpdated(
        address indexed token,
        address indexed oldOwner,
        address indexed newOwner
    );

    /**
     * @notice Emitido cuando se activa/desactiva una propiedad
     * @param token Dirección del token
     * @param isActive Nuevo estado
     */
    event PropertyActiveStatusChanged(
        address indexed token,
        bool isActive
    );

    /**
     * @notice Emitido cuando se actualizan datos financieros
     * @param token Dirección del token
     * @param totalTokenSupply Total de tokens
     * @param totalInvestmentTarget Meta de inversión
     * @param estimatedSalePrice Precio estimado de venta
     */
    event FinancialDataUpdated(
        address indexed token,
        uint256 totalTokenSupply,
        uint256 totalInvestmentTarget,
        uint256 estimatedSalePrice
    );

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error PropertyAlreadyExists();
    error PropertyDoesNotExist();
    error InvalidToken();
    error InvalidIssuer();
    error InvalidName();
    error InvalidLocation();
    error InvalidArea();
    error InvalidUnits();
    error InvalidDates();
    error InvalidCadastralNumber();
    error CadastralNumberAlreadyUsed();
    error NotPropertyIssuer();
    error PropertyNotActive();
    error InvalidStatusTransition();
    error PropertyAlreadyCompleted();
    error InvalidTokenSupply();
    error InvalidInvestmentTarget();
    error InvalidSalePrice();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verifica que la propiedad existe
     * @param token Dirección del token a verificar
     */
    modifier propertyRegistered(address token) {
        if (!propertyExists[token]) revert PropertyDoesNotExist();
        _;
    }

    /**
     * @notice Verifica que el caller es el issuer de la propiedad
     * @param token Dirección del token
     */
    modifier onlyPropertyIssuer(address token) {
        if (properties[token].issuer != msg.sender) revert NotPropertyIssuer();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor del contrato
     */
    constructor() {
        // El deployer recibe el rol de admin por defecto
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pausa todas las operaciones del contrato (emergency stop)
     * @dev Solo puede ser llamada por el admin
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Reanuda las operaciones del contrato
     * @dev Solo puede ser llamada por el admin
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                    PROPERTY ISSUER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Registra una nueva propiedad en el sistema
     * @dev Solo puede ser llamada por una dirección con rol PROPERTY_ISSUER_ROLE
     * @param params Struct PropertyParams con todos los datos de la propiedad
     */
    function registerProperty(PropertyParams calldata params)
        external
        onlyRole(PROPERTY_ISSUER_ROLE)
        whenNotPaused
    {
        // CHECK
        if (params.token == address(0)) revert InvalidToken();
        if (propertyExists[params.token]) revert PropertyAlreadyExists();
        if (bytes(params.name).length == 0) revert InvalidName();
        if (bytes(params.location).length == 0) revert InvalidLocation();
        if (params.totalArea == 0) revert InvalidArea();
        if (params.units == 0) revert InvalidUnits();
        if (params.constructionStart == 0 || params.estimatedCompletion == 0) revert InvalidDates();
        if (params.estimatedCompletion <= params.constructionStart) revert InvalidDates();
        if (bytes(params.cadastralNumber).length == 0) revert InvalidCadastralNumber();
        if (cadastralToToken[params.cadastralNumber] != address(0)) revert CadastralNumberAlreadyUsed();
        
        // Validaciones financieras
        if (params.totalTokenSupply == 0) revert InvalidTokenSupply();
        if (params.totalInvestmentTarget == 0) revert InvalidInvestmentTarget();
        if (params.estimatedSalePrice == 0) revert InvalidSalePrice();
        if (params.estimatedSalePrice <= params.totalInvestmentTarget) revert InvalidSalePrice();

        // EFFECTS
        properties[params.token] = Property({
            token: params.token,
            issuer: msg.sender,
            name: params.name,
            location: params.location,
            totalArea: params.totalArea,
            units: params.units,
            constructionStart: params.constructionStart,
            estimatedCompletion: params.estimatedCompletion,
            actualCompletion: 0,
            status: PropertyStatus.Planning,
            ipfsHash: params.ipfsHash,
            cadastralNumber: params.cadastralNumber,
            legalOwner: msg.sender,
            registeredAt: block.timestamp,
            isActive: true,
            totalTokenSupply: params.totalTokenSupply,
            totalInvestmentTarget: params.totalInvestmentTarget,
            estimatedSalePrice: params.estimatedSalePrice
        });

        propertyExists[params.token] = true;
        propertyCount++;
        allProperties.push(params.token);
        issuerProperties[msg.sender].push(params.token);
        cadastralToToken[params.cadastralNumber] = params.token;

        emit PropertyRegistered(params.token, msg.sender, params.name, params.cadastralNumber);
        emit FinancialDataUpdated(
            params.token, 
            params.totalTokenSupply, 
            params.totalInvestmentTarget, 
            params.estimatedSalePrice
        );
    }

    /**
     * @notice Actualiza la metadata IPFS de una propiedad
     * @dev Solo puede ser llamada por el issuer de la propiedad
     * @param token Dirección del token
     * @param newIpfsHash Nuevo hash IPFS
     */
    function updateMetadata(address token, string memory newIpfsHash)
        external
        propertyRegistered(token)
        onlyPropertyIssuer(token)
        whenNotPaused
    {
        // CHECK
        if (!properties[token].isActive) revert PropertyNotActive();

        // EFFECTS
        properties[token].ipfsHash = newIpfsHash;

        emit PropertyMetadataUpdated(token, newIpfsHash);
    }

    /**
     * @notice Actualiza las fechas de construcción
     * @dev Solo puede ser llamada por el issuer de la propiedad
     * @param token Dirección del token
     * @param newConstructionStart Nueva fecha de inicio
     * @param newEstimatedCompletion Nueva fecha estimada de finalización
     */
    function updateConstructionDates(
        address token,
        uint256 newConstructionStart,
        uint256 newEstimatedCompletion
    )
        external
        propertyRegistered(token)
        onlyPropertyIssuer(token)
        whenNotPaused
    {
        // CHECK
        if (!properties[token].isActive) revert PropertyNotActive();
        if (newConstructionStart == 0 || newEstimatedCompletion == 0) revert InvalidDates();
        if (newEstimatedCompletion <= newConstructionStart) revert InvalidDates();
        if (properties[token].status == PropertyStatus.Completed) revert PropertyAlreadyCompleted();
        if (properties[token].status == PropertyStatus.Sold) revert PropertyAlreadyCompleted();

        // EFFECTS
        properties[token].constructionStart = newConstructionStart;
        properties[token].estimatedCompletion = newEstimatedCompletion;

        emit ConstructionDatesUpdated(token, newConstructionStart, newEstimatedCompletion);
    }

    /**
     * @notice Actualiza el propietario legal de la propiedad
     * @dev Solo puede ser llamada por el issuer actual
     * @param token Dirección del token
     * @param newOwner Nueva dirección del propietario legal
     */
    function updateLegalOwner(address token, address newOwner)
        external
        propertyRegistered(token)
        onlyPropertyIssuer(token)
        whenNotPaused
    {
        // CHECK
        if (newOwner == address(0)) revert InvalidIssuer();
        if (!properties[token].isActive) revert PropertyNotActive();

        // EFFECTS
        address oldOwner = properties[token].legalOwner;
        properties[token].legalOwner = newOwner;

        emit LegalOwnerUpdated(token, oldOwner, newOwner);
    }

    /**
     * @notice Activa o desactiva el registro de una propiedad
     * @dev Solo puede ser llamada por el issuer o admin
     * @param token Dirección del token
     * @param isActive Nuevo estado
     */
    function setPropertyActive(address token, bool isActive)
        external
        propertyRegistered(token)
    {
        // CHECK - Solo issuer o admin pueden cambiar el estado
        if (properties[token].issuer != msg.sender && 
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotPropertyIssuer();
        }

        // EFFECTS
        properties[token].isActive = isActive;

        emit PropertyActiveStatusChanged(token, isActive);
    }

    /*//////////////////////////////////////////////////////////////
                        VERIFIER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Actualiza el estado de una propiedad
     * @dev Solo puede ser llamada por VERIFIER_ROLE o el issuer
     * @param token Dirección del token
     * @param newStatus Nuevo estado
     */
    function updatePropertyStatus(address token, PropertyStatus newStatus)
        external
        propertyRegistered(token)
        whenNotPaused
    {
        // CHECK
        if (!hasRole(VERIFIER_ROLE, msg.sender) && 
            properties[token].issuer != msg.sender) {
            revert NotPropertyIssuer();
        }

        PropertyStatus oldStatus = properties[token].status;
        
        // Validar transiciones de estado válidas
        if (!_isValidStatusTransition(oldStatus, newStatus)) {
            revert InvalidStatusTransition();
        }

        // EFFECTS
        properties[token].status = newStatus;

        // Si se marca como completada, registrar fecha real
        if (newStatus == PropertyStatus.Completed && oldStatus != PropertyStatus.Completed) {
            properties[token].actualCompletion = block.timestamp;
            emit PropertyCompleted(token, block.timestamp);
        }

        emit PropertyStatusUpdated(token, oldStatus, newStatus, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Obtiene la información completa de una propiedad
     * @param token Dirección del token
     * @return Property struct con toda la información
     */
    function getProperty(address token) 
        external 
        view 
        propertyRegistered(token)
        returns (Property memory) 
    {
        return properties[token];
    }

    /**
     * @notice Obtiene todas las propiedades de un issuer
     * @param issuer Dirección del issuer
     * @return Array de direcciones de tokens
     */
    function getIssuerProperties(address issuer) 
        external 
        view 
        returns (address[] memory) 
    {
        return issuerProperties[issuer];
    }
    
    /**
     * @notice Obtiene TODAS las propiedades registradas
     * @return Array de direcciones de tokens
     */
    function getAllProperties() 
        external 
        view 
        returns (address[] memory) 
    {
        return allProperties;
    }
    
    /**
     * @notice Obtiene todas las propiedades activas (isActive = true)
     * @return Array de direcciones de tokens activos
     */
    function getActiveProperties() 
        external 
        view 
        returns (address[] memory) 
    {
        // Contar propiedades activas primero
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allProperties.length; i++) {
            if (properties[allProperties[i]].isActive) {
                activeCount++;
            }
        }
        
        // Crear array del tamaño correcto
        address[] memory active = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < allProperties.length; i++) {
            if (properties[allProperties[i]].isActive) {
                active[currentIndex] = allProperties[i];
                currentIndex++;
            }
        }
        
        return active;
    }
    
    /**
     * @notice Obtiene propiedades filtradas por estado
     * @param status Estado de la propiedad
     * @return Array de direcciones de tokens con ese estado
     */
    function getPropertiesByStatus(PropertyStatus status) 
        external 
        view 
        returns (address[] memory) 
    {
        // Contar propiedades con ese estado
        uint256 count = 0;
        for (uint256 i = 0; i < allProperties.length; i++) {
            if (properties[allProperties[i]].status == status) {
                count++;
            }
        }
        
        // Crear array del tamaño correcto
        address[] memory filtered = new address[](count);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < allProperties.length; i++) {
            if (properties[allProperties[i]].status == status) {
                filtered[currentIndex] = allProperties[i];
                currentIndex++;
            }
        }
        
        return filtered;
    }

    /**
     * @notice Obtiene el token asociado a un número catastral
     * @param cadastralNumber Número catastral
     * @return Dirección del token (address(0) si no existe)
     */
    function getTokenByCadastral(string memory cadastralNumber) 
        external 
        view 
        returns (address) 
    {
        return cadastralToToken[cadastralNumber];
    }

    /**
     * @notice Verifica si una propiedad está activa y en buen estado
     * @param token Dirección del token
     * @return bool True si está activa y no cancelada/vendida
     */
    function isPropertyAvailable(address token) 
        external 
        view 
        returns (bool) 
    {
        if (!propertyExists[token]) return false;
        
        Property memory prop = properties[token];
        
        return prop.isActive && 
               prop.status != PropertyStatus.Cancelled && 
               prop.status != PropertyStatus.Sold;
    }

    /**
     * @notice Calcula el progreso de construcción como porcentaje
     * @param token Dirección del token
     * @return Porcentaje de progreso (0-100)
     */
    function getConstructionProgress(address token) 
        external 
        view 
        propertyRegistered(token)
        returns (uint256) 
    {
        Property memory prop = properties[token];
        
        if (prop.status == PropertyStatus.Planning) {
            return 0;
        }
        
        if (prop.status == PropertyStatus.Completed || prop.status == PropertyStatus.Sold) {
            return 100;
        }
        
        if (prop.status == PropertyStatus.Cancelled) {
            return 0;
        }
        
        // Para propiedades en construcción, calcular basado en tiempo
        if (block.timestamp < prop.constructionStart) {
            return 0;
        }
        
        if (block.timestamp >= prop.estimatedCompletion) {
            return 100;
        }
        
        uint256 elapsed = block.timestamp - prop.constructionStart;
        uint256 total = prop.estimatedCompletion - prop.constructionStart;
        
        return (elapsed * 100) / total;
    }

    /**
     * @notice Calcula la proyección de inversión para una cantidad de tokens
     * @dev Útil para mostrar al inversor qué obtendría por su inversión
     * @param token Dirección del token
     * @param tokenAmount Cantidad de tokens que planea comprar
     * @param pricePerToken Precio actual por token en USDC
     * @return investmentCost Costo total de la inversión
     * @return ownershipPercentageBps Porcentaje de propiedad en basis points (100 = 1%)
     * @return estimatedReturn Ganancia estimada en USDC
     * @return estimatedROIBps ROI estimado en basis points (5000 = 50%)
     */
    function getInvestmentProjection(
        address token,
        uint256 tokenAmount,
        uint256 pricePerToken
    )
        external
        view
        propertyRegistered(token)
        returns (
            uint256 investmentCost,
            uint256 ownershipPercentageBps,
            uint256 estimatedReturn,
            uint256 estimatedROIBps
        )
    {
        Property memory prop = properties[token];

        // Costo de inversión
        investmentCost = tokenAmount * pricePerToken;

        // Porcentaje de propiedad en basis points (10000 = 100%)
        ownershipPercentageBps = (tokenAmount * 10000) / prop.totalTokenSupply;

        // Ganancia estimada basada en el porcentaje de propiedad
        estimatedReturn = (prop.estimatedSalePrice * ownershipPercentageBps) / 10000;

        // ROI en basis points
        if (investmentCost > 0) {
            // ROI = ((estimatedReturn - investmentCost) / investmentCost) * 10000
            if (estimatedReturn > investmentCost) {
                estimatedROIBps = ((estimatedReturn - investmentCost) * 10000) / investmentCost;
            } else {
                estimatedROIBps = 0;
            }
        }

        return (investmentCost, ownershipPercentageBps, estimatedReturn, estimatedROIBps);
    }

    /**
     * @notice Obtiene toda la información financiera de una propiedad
     * @param token Dirección del token
     * @return totalTokenSupply Total de tokens que representa la propiedad
     * @return totalInvestmentTarget Meta de recaudación
     * @return estimatedSalePrice Precio estimado de venta
     * @return pricePerTokenTarget Precio objetivo por token (investmentTarget / tokenSupply)
     * @return expectedProfitMarginBps Margen de ganancia esperado en bps
     */
    function getFinancialInfo(address token)
        external
        view
        propertyRegistered(token)
        returns (
            uint256 totalTokenSupply,
            uint256 totalInvestmentTarget,
            uint256 estimatedSalePrice,
            uint256 pricePerTokenTarget,
            uint256 expectedProfitMarginBps
        )
    {
        Property memory prop = properties[token];

        totalTokenSupply = prop.totalTokenSupply;
        totalInvestmentTarget = prop.totalInvestmentTarget;
        estimatedSalePrice = prop.estimatedSalePrice;

        // Precio objetivo por token
        pricePerTokenTarget = totalInvestmentTarget / totalTokenSupply;

        // Margen de ganancia esperado en basis points
        if (totalInvestmentTarget > 0) {
            expectedProfitMarginBps = ((estimatedSalePrice - totalInvestmentTarget) * 10000) / totalInvestmentTarget;
        }

        return (
            totalTokenSupply,
            totalInvestmentTarget,
            estimatedSalePrice,
            pricePerTokenTarget,
            expectedProfitMarginBps
        );
    }

    /**
     * @notice Calcula el ROI máximo posible para esta propiedad
     * @param token Dirección del token
     * @return maxROIBps ROI máximo en basis points si se compra al precio objetivo
     */
    function getMaximumROI(address token)
        external
        view
        propertyRegistered(token)
        returns (uint256 maxROIBps)
    {
        Property memory prop = properties[token];

        if (prop.totalInvestmentTarget > 0) {
            // ROI máximo = ((estimatedSalePrice - totalInvestmentTarget) / totalInvestmentTarget) * 10000
            maxROIBps = ((prop.estimatedSalePrice - prop.totalInvestmentTarget) * 10000) / prop.totalInvestmentTarget;
        }

        return maxROIBps;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Valida si una transición de estado es válida
     * @param oldStatus Estado actual
     * @param newStatus Estado propuesto
     * @return bool True si la transición es válida
     */
    function _isValidStatusTransition(PropertyStatus oldStatus, PropertyStatus newStatus) 
        internal    
        pure 
        returns (bool) 
    {
        // Planning puede ir a InConstruction o Cancelled
        if (oldStatus == PropertyStatus.Planning) {
            return newStatus == PropertyStatus.InConstruction || 
                   newStatus == PropertyStatus.Cancelled;
        }
        
        // InConstruction puede ir a Completed o Cancelled
        if (oldStatus == PropertyStatus.InConstruction) {
            return newStatus == PropertyStatus.Completed || 
                   newStatus == PropertyStatus.Cancelled;
        }
        
        // Completed solo puede ir a Sold
        if (oldStatus == PropertyStatus.Completed) {
            return newStatus == PropertyStatus.Sold;
        }
        
        // Sold y Cancelled son estados finales
        return false;
    }
}

