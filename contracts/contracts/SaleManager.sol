// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../lib/ERC3643/contracts/token/IToken.sol";

/**
 * @title SaleManager
 * @author Ours Platform
 * @notice Gestiona la venta primaria de múltiples tokens de propiedades tokenizadas (ERC-3643)
 * @dev Implementa patrones de seguridad:
 *      - Check-Effects-Interactions (CEI)
 *      - Emergency Stop (Pausable)
 *      - Pull over Push for payments (withdraw pattern)
 *      - ReentrancyGuard para prevenir ataques de reentrada
 * 
 * Arquitectura de roles:
 * - DEFAULT_ADMIN_ROLE: Administrador de la plataforma (owner)
 * - PROPERTY_ISSUER_ROLE: Constructoras que tokenizан propiedades
 * - Los inversores no necesitan rol especial, solo KYC verificado en el token
 */
contract SaleManager is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Rol para las constructoras que emiten tokens de propiedades
    bytes32 public constant PROPERTY_ISSUER_ROLE = keccak256("PROPERTY_ISSUER_ROLE");

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Stablecoin utilizada para las compras (USDC)
    IERC20 public stablecoin;

    /// @notice Comisión de la plataforma en basis points (100 = 1%)
    uint256 public platformFeeBps;

    /// @notice Límite máximo de la comisión (10% = 1000 bps)
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000;

    /// @notice Fondos acumulados de comisiones de la plataforma
    uint256 public accumulatedPlatformFees;

    /*//////////////////////////////////////////////////////////////
                              STRUCTURES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Estructura que representa una venta de tokens de propiedad
     * @param token Dirección del token ERC-3643 de la propiedad
     * @param issuer Dirección de la constructora que emitió el token
     * @param pricePerToken Precio en stablecoin por cada token (con decimales del stablecoin)
     * @param isActive Estado de la venta (activa/pausada)
     * @param totalRaised Total de stablecoin recaudado por esta venta
     * @param withdrawableBalance Balance disponible para retiro por el issuer
     */
    struct Sale {
        address token;
        address issuer;
        uint256 pricePerToken;
        bool isActive;
        uint256 totalRaised;
        uint256 withdrawableBalance;
    }

    /*//////////////////////////////////////////////////////////////
                                MAPPINGS
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapeo de dirección de token a su información de venta
    mapping(address => Sale) public sales;

    /// @notice Mapeo para verificar si un token ya tiene una venta creada
    mapping(address => bool) public saleExists;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitido cuando se crea una nueva venta de tokens
     * @param token Dirección del token ERC-3643
     * @param issuer Dirección de la constructora
     * @param pricePerToken Precio por token en stablecoin
     */
    event SaleCreated(
        address indexed token,
        address indexed issuer,
        uint256 pricePerToken
    );

    /**
     * @notice Emitido cuando se actualiza el precio de una venta
     * @param token Dirección del token
     * @param oldPrice Precio anterior
     * @param newPrice Nuevo precio
     */
    event PriceUpdated(
        address indexed token,
        uint256 oldPrice,
        uint256 newPrice
    );

    /**
     * @notice Emitido cuando se cambia el estado activo de una venta
     * @param token Dirección del token
     * @param isActive Nuevo estado
     */
    event SaleStatusChanged(
        address indexed token,
        bool isActive
    );

    /**
     * @notice Emitido cuando un usuario compra tokens
     * @param buyer Dirección del comprador
     * @param token Dirección del token comprado
     * @param amount Cantidad de tokens comprados
     * @param totalCost Costo total en stablecoin
     * @param platformFee Comisión cobrada por la plataforma
     */
    event TokensPurchased(
        address indexed buyer,
        address indexed token,
        uint256 amount,
        uint256 totalCost,
        uint256 platformFee
    );

    /**
     * @notice Emitido cuando un issuer retira fondos
     * @param issuer Dirección del issuer
     * @param token Dirección del token
     * @param amount Cantidad retirada
     */
    event FundsWithdrawn(
        address indexed issuer,
        address indexed token,
        uint256 amount
    );

    /**
     * @notice Emitido cuando se retiran las comisiones de la plataforma
     * @param recipient Dirección que recibe las comisiones
     * @param amount Cantidad retirada
     */
    event PlatformFeesWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Emitido cuando se actualiza la stablecoin
     * @param oldStablecoin Dirección anterior
     * @param newStablecoin Nueva dirección
     */
    event StablecoinUpdated(
        address indexed oldStablecoin,
        address indexed newStablecoin
    );

    /**
     * @notice Emitido cuando se actualiza la comisión de la plataforma
     * @param oldFee Comisión anterior en bps
     * @param newFee Nueva comisión en bps
     */
    event PlatformFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error SaleAlreadyExists();
    error SaleDoesNotExist();
    error SaleNotActive();
    error InvalidToken();
    error InvalidPrice();
    error InvalidAmount();
    error InvalidStablecoin();
    error InvalidFee();
    error NotSaleIssuer();
    error NoFundsToWithdraw();
    error InsufficientBalance();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verifica que la venta existe y está activa
     * @param token Dirección del token a verificar
     */
    modifier saleActive(address token) {
        if (!saleExists[token]) revert SaleDoesNotExist();
        if (!sales[token].isActive) revert SaleNotActive();
        _;
    }

    /**
     * @notice Verifica que el caller es el issuer del token especificado
     * @param token Dirección del token
     */
    modifier onlyIssuer(address token) {
        if (sales[token].issuer != msg.sender) revert NotSaleIssuer();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Constructor del contrato
     * @param _stablecoin Dirección del stablecoin (USDC)
     * @param _platformFeeBps Comisión inicial de la plataforma en basis points
     */
    constructor(address _stablecoin, uint256 _platformFeeBps) {
        if (_stablecoin == address(0)) revert InvalidStablecoin();
        if (_platformFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidFee();

        stablecoin = IERC20(_stablecoin);
        platformFeeBps = _platformFeeBps;

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
        if (recipient == address(0)) revert InvalidStablecoin();
        
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
     * @notice Crea una nueva venta para un token de propiedad
     * @dev Solo puede ser llamada por una dirección con rol PROPERTY_ISSUER_ROLE
     * @param token Dirección del token ERC-3643 de la propiedad
     * @param pricePerToken Precio en stablecoin por cada token
     */
    function createSale(
        address token,
        uint256 pricePerToken
    ) 
        external 
        onlyRole(PROPERTY_ISSUER_ROLE)
        whenNotPaused
    {
        // CHECK
        if (token == address(0)) revert InvalidToken();
        if (pricePerToken == 0) revert InvalidPrice();
        if (saleExists[token]) revert SaleAlreadyExists();

        // EFFECTS
        sales[token] = Sale({
            token: token,
            issuer: msg.sender,
            pricePerToken: pricePerToken,
            isActive: true,
            totalRaised: 0,
            withdrawableBalance: 0
        });

        saleExists[token] = true;

        emit SaleCreated(token, msg.sender, pricePerToken);
    }

    /**
     * @notice Actualiza el precio de una venta existente
     * @dev Solo puede ser llamada por el issuer del token
     * @param token Dirección del token
     * @param newPrice Nuevo precio por token
     */
    function setPrice(address token, uint256 newPrice) 
        external 
        onlyIssuer(token)
        whenNotPaused
    {
        // CHECK
        if (!saleExists[token]) revert SaleDoesNotExist();
        if (newPrice == 0) revert InvalidPrice();

        // EFFECTS
        uint256 oldPrice = sales[token].pricePerToken;
        sales[token].pricePerToken = newPrice;

        emit PriceUpdated(token, oldPrice, newPrice);
    }

    /**
     * @notice Activa o desactiva una venta
     * @dev Solo puede ser llamada por el issuer del token
     * @param token Dirección del token
     * @param isActive Nuevo estado de la venta
     */
    function setSaleActive(address token, bool isActive) 
        external 
        onlyIssuer(token)
    {
        // CHECK
        if (!saleExists[token]) revert SaleDoesNotExist();

        // EFFECTS
        sales[token].isActive = isActive;

        emit SaleStatusChanged(token, isActive);
    }

    /**
     * @notice Retira los fondos acumulados de una venta (pull pattern)
     * @dev Solo puede ser llamada por el issuer del token
     * @param token Dirección del token
     */
    function withdrawFunds(address token) 
        external 
        onlyIssuer(token)
        nonReentrant
    {
        // CHECK
        if (!saleExists[token]) revert SaleDoesNotExist();
        
        uint256 amount = sales[token].withdrawableBalance;
        if (amount == 0) revert NoFundsToWithdraw();

        // EFFECTS
        sales[token].withdrawableBalance = 0;

        // INTERACTIONS
        stablecoin.safeTransfer(msg.sender, amount);

        emit FundsWithdrawn(msg.sender, token, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Compra tokens de una propiedad
     * @dev El comprador debe:
     *      1. Tener KYC verificado en el token ERC-3643
     *      2. Haber aprobado el stablecoin al SaleManager
     *      3. La venta debe estar activa
     * 
     * Patrón CEI (Check-Effects-Interactions):
     * - Check: Validaciones de estado y saldo
     * - Effects: Actualizar estado del contrato
     * - Interactions: Transferencias externas y mint
     * 
     * @param token Dirección del token a comprar
     * @param amount Cantidad de tokens a comprar
     */
    function buyFractions(address token, uint256 amount) 
        external 
        whenNotPaused
        nonReentrant
        saleActive(token)
    {
        // ========== CHECK ==========
        if (amount == 0) revert InvalidAmount();

        Sale storage sale = sales[token];
        
        // Calcular costos
        uint256 totalCost = sale.pricePerToken * amount;
        uint256 platformFee = (totalCost * platformFeeBps) / 10000;
        uint256 issuerAmount = totalCost - platformFee;

        // Verificar que el comprador tenga suficiente balance
        if (stablecoin.balanceOf(msg.sender) < totalCost) {
            revert InsufficientBalance();
        }

        // ========== EFFECTS ==========
        sale.totalRaised += totalCost;
        sale.withdrawableBalance += issuerAmount;
        accumulatedPlatformFees += platformFee;

        // ========== INTERACTIONS ==========
        
        // 1. Transferir stablecoin del comprador al contrato
        stablecoin.safeTransferFrom(msg.sender, address(this), totalCost);

        // 2. Mintear tokens al comprador
        // El token ERC-3643 internamente verifica que el comprador esté KYC-verificado
        IToken(token).mint(msg.sender, amount);

        emit TokensPurchased(msg.sender, token, amount, totalCost, platformFee);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Obtiene la información completa de una venta
     * @param token Dirección del token
     * @return Sale struct con toda la información
     */
    function getSale(address token) external view returns (Sale memory) {
        if (!saleExists[token]) revert SaleDoesNotExist();
        return sales[token];
    }

    /**
     * @notice Calcula el costo total para comprar una cantidad de tokens
     * @param token Dirección del token
     * @param amount Cantidad de tokens
     * @return totalCost Costo total en stablecoin
     * @return platformFee Comisión de la plataforma
     * @return issuerAmount Cantidad que recibirá el issuer
     */
    function calculateCost(address token, uint256 amount) 
        external 
        view 
        returns (
            uint256 totalCost,
            uint256 platformFee,
            uint256 issuerAmount
        ) 
    {
        if (!saleExists[token]) revert SaleDoesNotExist();
        
        totalCost = sales[token].pricePerToken * amount;
        platformFee = (totalCost * platformFeeBps) / 10000;
        issuerAmount = totalCost - platformFee;
    }

    /**
     * @notice Verifica si una venta está activa y disponible para compra
     * @param token Dirección del token
     * @return bool True si la venta está activa
     */
    function isSaleActive(address token) external view returns (bool) {
        return saleExists[token] && sales[token].isActive && !paused();
    }
}

