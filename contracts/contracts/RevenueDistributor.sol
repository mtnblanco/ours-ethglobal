// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./PropertyRegistry.sol";

/**
 * @title RevenueDistributor
 * @author Ours Platform
 * @notice Distribuye ganancias de venta de propiedades a holders de tokens usando Merkle Tree
 * @dev Implementa patrones de seguridad:
 *      - Check-Effects-Interactions (CEI)
 *      - Emergency Stop (Pausable)
 *      - Pull over Push for payments (claim pattern)
 *      - ReentrancyGuard para prevenir ataques de reentrada
 *      - Merkle Proof para verificación eficiente de elegibilidad
 * 
 * Flujo de uso:
 * 1. Constructora vende propiedad física
 * 2. Backend hace snapshot de holders del token
 * 3. Backend genera merkle tree con distribución
 * 4. Constructora llama setupDistribution() con merkleRoot y transfiere USDC
 * 5. Holders llaman claim() con su proof para retirar su parte
 * 6. Después de CLAIM_PERIOD, fondos no reclamados pueden ser devueltos
 * 
 * Arquitectura de roles:
 * - DEFAULT_ADMIN_ROLE: Administrador de la plataforma
 * - PROPERTY_ISSUER_ROLE: Constructoras que pueden crear distribuciones
 */
contract RevenueDistributor is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Rol para las constructoras que pueden crear distribuciones
    bytes32 public constant PROPERTY_ISSUER_ROLE = keccak256("PROPERTY_ISSUER_ROLE");

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Stablecoin utilizada para distribuciones (USDC)
    IERC20 public stablecoin;

    /// @notice Registro de propiedades tokenizadas
    PropertyRegistry public propertyRegistry;

    /// @notice Período durante el cual holders pueden reclamar (180 días por defecto)
    uint256 public claimPeriod;

    /// @notice Período por defecto de reclamo (180 días)
    uint256 public constant DEFAULT_CLAIM_PERIOD = 180 days;

    /// @notice Comisión de la plataforma en basis points (100 = 1%)
    uint256 public platformFeeBps;

    /// @notice Límite máximo de la comisión (5% = 500 bps)
    uint256 public constant MAX_PLATFORM_FEE_BPS = 500;

    /// @notice Fondos acumulados de comisiones de la plataforma
    uint256 public accumulatedPlatformFees;

    /*//////////////////////////////////////////////////////////////
                              STRUCTURES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Estructura que representa una distribución de ganancias
     * @param token Dirección del token ERC-3643 de la propiedad
     * @param merkleRoot Root hash del merkle tree con la distribución
     * @param totalAmount Cantidad total de USDC a distribuir (sin comisión)
     * @param platformFee Comisión cobrada por la plataforma
     * @param claimedAmount Cantidad ya reclamada por holders
     * @param remainingAmount Cantidad disponible para reclamar
     * @param createdAt Timestamp de creación de la distribución
     * @param claimDeadline Timestamp límite para reclamar
     * @param isActive Si la distribución está activa
     * @param issuer Constructora que creó la distribución
     */
    struct Distribution {
        address token;
        bytes32 merkleRoot;
        uint256 totalAmount;
        uint256 platformFee;
        uint256 claimedAmount;
        uint256 remainingAmount;
        uint256 createdAt;
        uint256 claimDeadline;
        bool isActive;
        address issuer;
    }

    /*//////////////////////////////////////////////////////////////
                                MAPPINGS
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapeo de token a su distribución activa
    mapping(address => Distribution) public distributions;

    /// @notice Mapeo de token a si existe una distribución
    mapping(address => bool) public distributionExists;

    /// @notice Mapeo para verificar si un holder ya reclamó: token => holder => claimed
    mapping(address => mapping(address => bool)) public hasClaimed;

    /// @notice Contador de distribuciones totales
    uint256 public distributionCount;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitido cuando se crea una nueva distribución
     * @param token Dirección del token
     * @param issuer Constructora que creó la distribución
     * @param merkleRoot Root del merkle tree
     * @param totalAmount Cantidad total a distribuir
     * @param platformFee Comisión de la plataforma
     * @param claimDeadline Fecha límite para reclamar
     */
    event DistributionCreated(
        address indexed token,
        address indexed issuer,
        bytes32 merkleRoot,
        uint256 totalAmount,
        uint256 platformFee,
        uint256 claimDeadline
    );

    /**
     * @notice Emitido cuando un holder reclama su parte
     * @param token Dirección del token
     * @param holder Dirección del holder
     * @param amount Cantidad reclamada
     */
    event Claimed(
        address indexed token,
        address indexed holder,
        uint256 amount
    );

    /**
     * @notice Emitido cuando se devuelven fondos no reclamados
     * @param token Dirección del token
     * @param recipient Dirección que recibe los fondos
     * @param amount Cantidad devuelta
     */
    event UnclaimedFundsReturned(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Emitido cuando se actualiza el período de reclamo
     * @param oldPeriod Período anterior
     * @param newPeriod Nuevo período
     */
    event ClaimPeriodUpdated(
        uint256 oldPeriod,
        uint256 newPeriod
    );

    /**
     * @notice Emitido cuando se actualiza la comisión de la plataforma
     * @param oldFee Comisión anterior
     * @param newFee Nueva comisión
     */
    event PlatformFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );

    /**
     * @notice Emitido cuando se retiran comisiones de la plataforma
     * @param recipient Dirección que recibe las comisiones
     * @param amount Cantidad retirada
     */
    event PlatformFeesWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Emitido cuando se actualiza el PropertyRegistry
     * @param oldRegistry Dirección anterior
     * @param newRegistry Nueva dirección
     */
    event PropertyRegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry
    );

    /**
     * @notice Emitido cuando se actualiza el stablecoin
     * @param oldStablecoin Dirección anterior
     * @param newStablecoin Nueva dirección
     */
    event StablecoinUpdated(
        address indexed oldStablecoin,
        address indexed newStablecoin
    );

    /**
     * @notice Emitido cuando se cancela una distribución
     * @param token Dirección del token
     * @param refundedAmount Cantidad devuelta
     */
    event DistributionCancelled(
        address indexed token,
        uint256 refundedAmount
    );

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error DistributionAlreadyExists();
    error DistributionDoesNotExist();
    error DistributionNotActive();
    error InvalidToken();
    error InvalidMerkleRoot();
    error InvalidAmount();
    error InvalidStablecoin();
    error InvalidRegistry();
    error InvalidRecipient();
    error InvalidFee();
    error InvalidClaimPeriod();
    error AlreadyClaimed();
    error InvalidProof();
    error ClaimPeriodNotEnded();
    error ClaimPeriodEnded();
    error NoFundsToWithdraw();
    error InsufficientBalance();
    error PropertyNotCompleted();
    error PropertyNotRegistered();
    error NotPropertyIssuer();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verifica que la distribución existe
     * @param token Dirección del token a verificar
     */
    modifier distributionActive(address token) {
        if (!distributionExists[token]) revert DistributionDoesNotExist();
        if (!distributions[token].isActive) revert DistributionNotActive();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor del contrato
     * @param _stablecoin Dirección del stablecoin (USDC)
     * @param _propertyRegistry Dirección del PropertyRegistry
     * @param _platformFeeBps Comisión inicial de la plataforma en basis points
     */
    constructor(
        address _stablecoin,
        address _propertyRegistry,
        uint256 _platformFeeBps
    ) {
        if (_stablecoin == address(0)) revert InvalidStablecoin();
        if (_propertyRegistry == address(0)) revert InvalidRegistry();
        if (_platformFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidFee();

        stablecoin = IERC20(_stablecoin);
        propertyRegistry = PropertyRegistry(_propertyRegistry);
        platformFeeBps = _platformFeeBps;
        claimPeriod = DEFAULT_CLAIM_PERIOD;

        // El deployer recibe el rol de admin por defecto
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Actualiza la dirección del stablecoin
     * @dev Solo puede ser llamada por el admin
     * @param _newStablecoin Nueva dirección del stablecoin
     */
    function setStablecoin(address _newStablecoin)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_newStablecoin == address(0)) revert InvalidStablecoin();

        address oldStablecoin = address(stablecoin);
        stablecoin = IERC20(_newStablecoin);

        emit StablecoinUpdated(oldStablecoin, _newStablecoin);
    }

    /**
     * @notice Actualiza la dirección del PropertyRegistry
     * @dev Solo puede ser llamada por el admin
     * @param _newRegistry Nueva dirección del PropertyRegistry
     */
    function setPropertyRegistry(address _newRegistry)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_newRegistry == address(0)) revert InvalidRegistry();

        address oldRegistry = address(propertyRegistry);
        propertyRegistry = PropertyRegistry(_newRegistry);

        emit PropertyRegistryUpdated(oldRegistry, _newRegistry);
    }

    /**
     * @notice Actualiza el período de reclamo
     * @dev Solo puede ser llamada por el admin
     * @param _newPeriod Nuevo período en segundos
     */
    function setClaimPeriod(uint256 _newPeriod)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_newPeriod < 30 days || _newPeriod > 365 days) revert InvalidClaimPeriod();

        uint256 oldPeriod = claimPeriod;
        claimPeriod = _newPeriod;

        emit ClaimPeriodUpdated(oldPeriod, _newPeriod);
    }

    /**
     * @notice Actualiza la comisión de la plataforma
     * @dev Solo puede ser llamada por el admin
     * @param _newFeeBps Nueva comisión en basis points
     */
    function setPlatformFee(uint256 _newFeeBps)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_newFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidFee();

        uint256 oldFee = platformFeeBps;
        platformFeeBps = _newFeeBps;

        emit PlatformFeeUpdated(oldFee, _newFeeBps);
    }

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

    /**
     * @notice Retira las comisiones acumuladas de la plataforma (pull pattern)
     * @dev Solo puede ser llamada por el admin
     * @param recipient Dirección que recibirá las comisiones
     */
    function withdrawPlatformFees(address recipient)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        if (recipient == address(0)) revert InvalidRecipient();

        // CHECK
        uint256 amount = accumulatedPlatformFees;
        if (amount == 0) revert NoFundsToWithdraw();

        // EFFECTS
        accumulatedPlatformFees = 0;

        // INTERACTIONS
        stablecoin.safeTransfer(recipient, amount);

        emit PlatformFeesWithdrawn(recipient, amount);
    }

    /*//////////////////////////////////////////////////////////////
                    PROPERTY ISSUER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Configura una nueva distribución de ganancias
     * @dev Solo puede ser llamada por PROPERTY_ISSUER_ROLE
     *      La propiedad debe estar en estado Completed
     *      Transfiere USDC del caller al contrato
     *      Actualiza el estado de la propiedad a Sold
     * @param token Dirección del token ERC-3643 de la propiedad
     * @param merkleRoot Root hash del merkle tree con la distribución
     * @param totalAmount Cantidad total de USDC a distribuir (incluyendo comisión)
     */
    function setupDistribution(
        address token,
        bytes32 merkleRoot,
        uint256 totalAmount
    )
        external
        onlyRole(PROPERTY_ISSUER_ROLE)
        whenNotPaused
        nonReentrant
    {
        // ========== CHECK ==========
        if (token == address(0)) revert InvalidToken();
        if (merkleRoot == bytes32(0)) revert InvalidMerkleRoot();
        if (totalAmount == 0) revert InvalidAmount();
        if (distributionExists[token]) revert DistributionAlreadyExists();

        // Verificar que la propiedad está registrada y completada
        if (!propertyRegistry.propertyExists(token)) revert PropertyNotRegistered();

        PropertyRegistry.Property memory property = propertyRegistry.getProperty(token);
        if (property.status != PropertyRegistry.PropertyStatus.Completed) {
            revert PropertyNotCompleted();
        }

        // Verificar que el caller es el issuer de la propiedad
        if (property.issuer != msg.sender) revert NotPropertyIssuer();

        // Calcular comisión y monto neto
        uint256 platformFee = (totalAmount * platformFeeBps) / 10000;
        uint256 netAmount = totalAmount - platformFee;

        // Verificar saldo del caller
        if (stablecoin.balanceOf(msg.sender) < totalAmount) {
            revert InsufficientBalance();
        }

        // ========== EFFECTS ==========
        distributions[token] = Distribution({
            token: token,
            merkleRoot: merkleRoot,
            totalAmount: netAmount,
            platformFee: platformFee,
            claimedAmount: 0,
            remainingAmount: netAmount,
            createdAt: block.timestamp,
            claimDeadline: block.timestamp + claimPeriod,
            isActive: true,
            issuer: msg.sender
        });

        distributionExists[token] = true;
        distributionCount++;
        accumulatedPlatformFees += platformFee;

        // ========== INTERACTIONS ==========

        // 1. Transferir USDC del issuer al contrato
        stablecoin.safeTransferFrom(msg.sender, address(this), totalAmount);

        // 2. Actualizar estado de la propiedad a Sold
        propertyRegistry.updatePropertyStatus(token, PropertyRegistry.PropertyStatus.Sold);

        emit DistributionCreated(
            token,
            msg.sender,
            merkleRoot,
            netAmount,
            platformFee,
            block.timestamp + claimPeriod
        );
    }

    /**
     * @notice Cancela una distribución y devuelve fondos
     * @dev Solo puede ser llamada por el issuer de la distribución
     *      Solo se puede cancelar si nadie ha reclamado aún
     * @param token Dirección del token
     */
    function cancelDistribution(address token)
        external
        distributionActive(token)
        nonReentrant
    {
        Distribution storage dist = distributions[token];

        // CHECK
        if (dist.issuer != msg.sender) revert NotPropertyIssuer();
        if (dist.claimedAmount > 0) revert DistributionNotActive(); // Ya se reclamó algo

        // EFFECTS
        uint256 refundAmount = dist.remainingAmount;
        dist.isActive = false;
        dist.remainingAmount = 0;

        // INTERACTIONS
        stablecoin.safeTransfer(msg.sender, refundAmount);

        emit DistributionCancelled(token, refundAmount);
    }

    /**
     * @notice Devuelve fondos no reclamados después del período de reclamo
     * @dev Solo puede ser llamada por el issuer después del deadline
     * @param token Dirección del token
     */
    function returnUnclaimedFunds(address token)
        external
        distributionActive(token)
        nonReentrant
    {
        Distribution storage dist = distributions[token];

        // CHECK
        if (dist.issuer != msg.sender) revert NotPropertyIssuer();
        if (block.timestamp < dist.claimDeadline) revert ClaimPeriodNotEnded();

        uint256 unclaimedAmount = dist.remainingAmount;
        if (unclaimedAmount == 0) revert NoFundsToWithdraw();

        // EFFECTS
        dist.remainingAmount = 0;
        dist.isActive = false;

        // INTERACTIONS
        stablecoin.safeTransfer(msg.sender, unclaimedAmount);

        emit UnclaimedFundsReturned(token, msg.sender, unclaimedAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Reclama la parte correspondiente de ganancias
     * @dev Verifica la prueba merkle y transfiere USDC
     *      Patrón CEI (Check-Effects-Interactions)
     * @param token Dirección del token de la propiedad
     * @param amount Cantidad a reclamar en USDC
     * @param merkleProof Prueba merkle para verificar elegibilidad
     */
    function claim(
        address token,
        uint256 amount,
        bytes32[] calldata merkleProof
    )
        external
        whenNotPaused
        nonReentrant
        distributionActive(token)
    {
        // ========== CHECK ==========
        Distribution storage dist = distributions[token];

        // Verificar que no haya expirado el período de reclamo
        if (block.timestamp > dist.claimDeadline) revert ClaimPeriodEnded();

        // Verificar que no haya reclamado antes
        if (hasClaimed[token][msg.sender]) revert AlreadyClaimed();

        // Verificar que haya fondos suficientes
        if (amount > dist.remainingAmount) revert InsufficientBalance();

        // Verificar merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        if (!MerkleProof.verify(merkleProof, dist.merkleRoot, leaf)) {
            revert InvalidProof();
        }

        // ========== EFFECTS ==========
        hasClaimed[token][msg.sender] = true;
        dist.claimedAmount += amount;
        dist.remainingAmount -= amount;

        // ========== INTERACTIONS ==========
        stablecoin.safeTransfer(msg.sender, amount);

        emit Claimed(token, msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Obtiene la información completa de una distribución
     * @param token Dirección del token
     * @return Distribution struct con toda la información
     */
    function getDistribution(address token)
        external
        view
        returns (Distribution memory)
    {
        if (!distributionExists[token]) revert DistributionDoesNotExist();
        return distributions[token];
    }

    /**
     * @notice Verifica si un holder puede reclamar con una prueba dada
     * @param token Dirección del token
     * @param holder Dirección del holder
     * @param amount Cantidad a reclamar
     * @param merkleProof Prueba merkle
     * @return canClaim True si puede reclamar
     * @return reason Razón si no puede reclamar
     */
    function canClaim(
        address token,
        address holder,
        uint256 amount,
        bytes32[] calldata merkleProof
    )
        external
        view
        returns (bool canClaim, string memory reason)
    {
        if (!distributionExists[token]) {
            return (false, "Distribution does not exist");
        }

        Distribution memory dist = distributions[token];

        if (!dist.isActive) {
            return (false, "Distribution not active");
        }

        if (block.timestamp > dist.claimDeadline) {
            return (false, "Claim period ended");
        }

        if (hasClaimed[token][holder]) {
            return (false, "Already claimed");
        }

        if (amount > dist.remainingAmount) {
            return (false, "Insufficient remaining amount");
        }

        bytes32 leaf = keccak256(abi.encodePacked(holder, amount));
        if (!MerkleProof.verify(merkleProof, dist.merkleRoot, leaf)) {
            return (false, "Invalid merkle proof");
        }

        return (true, "Can claim");
    }

    /**
     * @notice Obtiene el progreso de reclamos de una distribución
     * @param token Dirección del token
     * @return totalAmount Cantidad total a distribuir
     * @return claimedAmount Cantidad ya reclamada
     * @return remainingAmount Cantidad disponible
     * @return claimPercentage Porcentaje reclamado (0-100)
     */
    function getClaimProgress(address token)
        external
        view
        returns (
            uint256 totalAmount,
            uint256 claimedAmount,
            uint256 remainingAmount,
            uint256 claimPercentage
        )
    {
        if (!distributionExists[token]) revert DistributionDoesNotExist();

        Distribution memory dist = distributions[token];

        totalAmount = dist.totalAmount;
        claimedAmount = dist.claimedAmount;
        remainingAmount = dist.remainingAmount;
        claimPercentage = totalAmount > 0 ? (claimedAmount * 100) / totalAmount : 0;

        return (totalAmount, claimedAmount, remainingAmount, claimPercentage);
    }

    /**
     * @notice Verifica si una distribución está activa y disponible
     * @param token Dirección del token
     * @return bool True si está activa y dentro del período de reclamo
     */
    function isDistributionActive(address token)
        external
        view
        returns (bool)
    {
        if (!distributionExists[token]) return false;

        Distribution memory dist = distributions[token];

        return dist.isActive && block.timestamp <= dist.claimDeadline;
    }
}

