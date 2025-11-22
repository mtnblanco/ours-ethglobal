// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../lib/ERC3643/contracts/token/IToken.sol";
import "./PropertyRegistry.sol";
import "./ChainlinkKYCIssuer.sol";

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
 * - PROPERTY_ISSUER_ROLE: Constructoras que tokenizаn propiedades
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

    /// @notice Registro de propiedades tokenizadas
    PropertyRegistry public propertyRegistry;
    
    /// @notice Sistema de KYC con World ID + Chainlink + Onfido
    ChainlinkKYCIssuer public kycIssuer;

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
    
    /// @notice Array de todas las direcciones de tokens con ventas (para iteración)
    address[] public allSales;

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

    /**
     * @notice Emitido cuando se actualiza el PropertyRegistry
     * @param oldRegistry Dirección anterior
     * @param newRegistry Nueva dirección
     */
    event PropertyRegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry
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
    error InvalidRegistry();
    error InvalidRecipient();
    error NotSaleIssuer();
    error NoFundsToWithdraw();
    error InsufficientBalance();
    error PropertyNotRegistered();
    error PropertyNotAvailable();
    error KYCNotVerified();

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
     * @param _propertyRegistry Dirección del PropertyRegistry
     * @param _platformFeeBps Comisión inicial de la plataforma en basis points
     */
    constructor(
        address _stablecoin, 
        address _propertyRegistry,
        address _kycIssuer,
        uint256 _platformFeeBps
    ) {
        if (_stablecoin == address(0)) revert InvalidStablecoin();
        if (_propertyRegistry == address(0)) revert InvalidRegistry();
        if (_kycIssuer == address(0)) revert InvalidRegistry();
        if (_platformFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidFee();

        stablecoin = IERC20(_stablecoin);
        propertyRegistry = PropertyRegistry(_propertyRegistry);
        kycIssuer = ChainlinkKYCIssuer(_kycIssuer);
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
        _unpause(); //esto es de openzeppelin
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
     * @notice Crea una nueva venta para un token de propiedad
     * @dev Solo puede ser llamada por una dirección con rol PROPERTY_ISSUER_ROLE
     *      La propiedad debe estar previamente registrada en el PropertyRegistry
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
        
        // Validar que la propiedad está registrada en el PropertyRegistry
        if (!propertyRegistry.propertyExists(token)) revert PropertyNotRegistered();
        
        // Validar que la propiedad está disponible para venta
        if (!propertyRegistry.isPropertyAvailable(token)) revert PropertyNotAvailable();
        
        // Validar que el caller es el issuer de la propiedad registrada
        (,address propertyIssuer,,,,,,,,,,,,,,,,) = propertyRegistry.properties(token);
        if (propertyIssuer != msg.sender) revert NotSaleIssuer();

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
        allSales.push(token);

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
        sales[token].isActive = isActive; //este parametro llega true o false

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
        
        // 1. Verificar KYC (CRÍTICO para cumplimiento regulatorio)
        // POR QUÉ PRIMERO:
        // - Más importante que amount o balance
        // - Sin KYC → no puede invertir (regulación)
        // - Falla rápido si no tiene KYC (ahorra gas)
        if (!kycIssuer.isKYCVerified(msg.sender)) {
            revert KYCNotVerified();
        }
        
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
        // IMPORTANTE: El token ERC-3643 internamente verifica:
        //   - identityRegistry.isVerified(msg.sender)
        //   - compliance.canTransfer(address(0), msg.sender, amount)
        // Si el comprador NO tiene KYC válido, mint() hará revert
        // y toda la transacción se revertirá (incluyendo la transferencia de USDC)
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
     * @notice Obtiene TODAS las sales registradas
     * @return Array de direcciones de tokens con sales
     */
    function getAllSales() 
        external 
        view 
        returns (address[] memory) 
    {
        return allSales;
    }
    
    /**
     * @notice Obtiene todas las sales activas (isActive = true)
     * @return Array de direcciones de tokens con sales activas
     */
    function getActiveSales() 
        external 
        view 
        returns (address[] memory) 
    {
        // Contar sales activas primero
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allSales.length; i++) {
            if (sales[allSales[i]].isActive) {
                activeCount++;
            }
        }
        
        // Crear array del tamaño correcto
        address[] memory active = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < allSales.length; i++) {
            if (sales[allSales[i]].isActive) {
                active[currentIndex] = allSales[i];
                currentIndex++;
            }
        }
        
        return active;
    }
    
    /**
     * @notice Obtiene propiedades con sales activas y disponibles para invertir
     * @dev Combina datos de PropertyRegistry y SaleManager
     * @return tokens Array de direcciones de tokens
     * @return names Array de nombres de propiedades
     * @return prices Array de precios por token
     * @return raised Array de totales recaudados
     */
    function getInvestableProperties() 
        external 
        view 
        returns (
            address[] memory tokens,
            string[] memory names,
            uint256[] memory prices,
            uint256[] memory raised
        ) 
    {
        // Contar propiedades invertibles
        uint256 count = 0;
        for (uint256 i = 0; i < allSales.length; i++) {
            address token = allSales[i];
            if (sales[token].isActive && 
                propertyRegistry.propertyExists(token) &&
                propertyRegistry.isPropertyAvailable(token)) {
                count++;
            }
        }
        
        // Crear arrays del tamaño correcto
        tokens = new address[](count);
        names = new string[](count);
        prices = new uint256[](count);
        raised = new uint256[](count);
        
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < allSales.length; i++) {
            address token = allSales[i];
            if (sales[token].isActive && 
                propertyRegistry.propertyExists(token) &&
                propertyRegistry.isPropertyAvailable(token)) {
                
                tokens[currentIndex] = token;
                prices[currentIndex] = sales[token].pricePerToken;
                raised[currentIndex] = sales[token].totalRaised;
                
                // Obtener nombre de la propiedad
                (,, string memory name,,,,,,,,,,,,,,,) = propertyRegistry.properties(token);
                names[currentIndex] = name;
                
                currentIndex++;
            }
        }
        
        return (tokens, names, prices, raised);
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

    /*//////////////////////////////////////////////////////////////
                INTEGRATION VIEW FUNCTIONS (PROPERTY + SALE)
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Obtiene información completa combinada de propiedad y venta
     * @param token Dirección del token
     * @return property Struct Property con información de la propiedad
     * @return sale Struct Sale con información de la venta
     * @return saleIsActive Si la venta está activa y disponible
     */
    function getPropertyAndSaleInfo(address token) 
        external 
        view 
        returns (
            PropertyRegistry.Property memory property,
            Sale memory sale,
            bool saleIsActive
        ) 
    {
        // Obtener información de la propiedad
        if (propertyRegistry.propertyExists(token)) {
            property = propertyRegistry.getProperty(token);
        }
        
        // Obtener información de la venta
        if (saleExists[token]) {
            sale = sales[token];
            saleIsActive = sales[token].isActive && !paused();
        }
        
        return (property, sale, saleIsActive);
    }

    /**
     * @notice Obtiene todas las ventas activas de un issuer con su información de propiedad
     * @param issuer Dirección del issuer
     * @return tokens Array de direcciones de tokens con ventas activas
     */
    function getIssuerActiveSales(address issuer) 
        external 
        view 
        returns (address[] memory tokens) 
    {
        // Obtener todas las propiedades del issuer
        address[] memory allProperties = propertyRegistry.getIssuerProperties(issuer);
        
        // Contar cuántas tienen ventas activas
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allProperties.length; i++) {
            if (saleExists[allProperties[i]] && sales[allProperties[i]].isActive) {
                activeCount++;
            }
        }
        
        // Crear array con solo las activas
        tokens = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allProperties.length; i++) {
            if (saleExists[allProperties[i]] && sales[allProperties[i]].isActive) {
                tokens[index] = allProperties[i];
                index++;
            }
        }
        
        return tokens;
    }

    /**
     * @notice Verifica si una propiedad está lista para crear una venta
     * @dev Útil para validar antes de llamar a createSale
     * @param token Dirección del token
     * @return isReady True si cumple todos los requisitos
     * @return reason Mensaje descriptivo del estado
     */
    function canCreateSale(address token) 
        external 
        view 
        returns (bool isReady, string memory reason) 
    {
        // Verificar que no exista ya una venta
        if (saleExists[token]) {
            return (false, "Sale already exists");
        }
        
        // Verificar que la propiedad está registrada
        if (!propertyRegistry.propertyExists(token)) {
            return (false, "Property not registered");
        }
        
        // Verificar que la propiedad está disponible
        if (!propertyRegistry.isPropertyAvailable(token)) {
            return (false, "Property not available");
        }
        
        return (true, "Ready to create sale");
    }

    /**
     * @notice Obtiene estadísticas combinadas de una venta
     * @param token Dirección del token
     * @return totalUnitsAvailable Unidades totales de la propiedad
     * @return totalRaised Total recaudado en stablecoin
     * @return constructionProgress Progreso de construcción (0-100)
     * @return propertyStatus Estado de la propiedad
     */
    function getSaleStats(address token) 
        external 
        view 
        returns (
            uint256 totalUnitsAvailable,
            uint256 totalRaised,
            uint256 constructionProgress,
            PropertyRegistry.PropertyStatus propertyStatus
        ) 
    {
        if (propertyRegistry.propertyExists(token)) {
            (,,,,,uint256 units,,,,,,,,,,,,) = propertyRegistry.properties(token);
            totalUnitsAvailable = units;
            constructionProgress = propertyRegistry.getConstructionProgress(token);
            PropertyRegistry.Property memory prop = propertyRegistry.getProperty(token);
            propertyStatus = prop.status;
        }
        
        if (saleExists[token]) {
            totalRaised = sales[token].totalRaised;
        }
        
        return (totalUnitsAvailable, totalRaised, constructionProgress, propertyStatus);
    }

    /**
     * @notice Obtiene la proyección de inversión para una compra
     * @dev Combina precio de venta actual con proyección financiera de la propiedad
     * @param token Dirección del token
     * @param tokenAmount Cantidad de tokens que planea comprar
     * @return investmentCost Costo total con comisión de plataforma
     * @return netInvestment Inversión neta (sin comisión)
     * @return ownershipPercentageBps Porcentaje de propiedad en bps
     * @return estimatedReturn Ganancia estimada al vender la propiedad
     * @return estimatedROIBps ROI estimado en basis points
     */
    function getInvestmentProjection(address token, uint256 tokenAmount)
        external
        view
        returns (
            uint256 investmentCost,
            uint256 netInvestment,
            uint256 ownershipPercentageBps,
            uint256 estimatedReturn,
            uint256 estimatedROIBps
        )
    {
        if (!saleExists[token]) revert SaleDoesNotExist();
        
        Sale memory sale = sales[token];
        
        // Calcular costo con comisión
        uint256 totalCost = sale.pricePerToken * tokenAmount;
        uint256 platformFee = (totalCost * platformFeeBps) / 10000;
        
        investmentCost = totalCost;
        netInvestment = totalCost - platformFee;
        
        // Obtener proyección de PropertyRegistry
        (
            , 
            ownershipPercentageBps, 
            estimatedReturn, 
            estimatedROIBps
        ) = propertyRegistry.getInvestmentProjection(
            token, 
            tokenAmount, 
            sale.pricePerToken
        );
        
        return (
            investmentCost,
            netInvestment,
            ownershipPercentageBps,
            estimatedReturn,
            estimatedROIBps
        );
    }

    /**
     * @notice Obtiene información financiera completa para decisión de inversión
     * @param token Dirección del token
     * @return pricePerToken Precio actual por token en la venta
     * @return totalTokenSupply Total de tokens de la propiedad
     * @return totalInvestmentTarget Meta de recaudación
     * @return estimatedSalePrice Precio estimado de venta final
     * @return expectedROIBps ROI máximo esperado en bps
     * @return totalRaised Total ya recaudado
     * @return remainingTokens Tokens disponibles para compra
     */
    function getInvestmentInfo(address token)
        external
        view
        returns (
            uint256 pricePerToken,
            uint256 totalTokenSupply,
            uint256 totalInvestmentTarget,
            uint256 estimatedSalePrice,
            uint256 expectedROIBps,
            uint256 totalRaised,
            uint256 remainingTokens
        )
    {
        if (!saleExists[token]) revert SaleDoesNotExist();
        
        Sale memory sale = sales[token];
        pricePerToken = sale.pricePerToken;
        totalRaised = sale.totalRaised;
        
        // Obtener info financiera de PropertyRegistry
        (
            totalTokenSupply,
            totalInvestmentTarget,
            estimatedSalePrice,
            ,
            expectedROIBps
        ) = propertyRegistry.getFinancialInfo(token);
        
        // Calcular tokens restantes (aproximado basado en recaudación)
        uint256 tokensSold = totalRaised / pricePerToken;
        remainingTokens = totalTokenSupply > tokensSold ? totalTokenSupply - tokensSold : 0;
        
        return (
            pricePerToken,
            totalTokenSupply,
            totalInvestmentTarget,
            estimatedSalePrice,
            expectedROIBps,
            totalRaised,
            remainingTokens
        );
    }

    /**
     * @notice Ejemplo de cómo se vería una inversión
     * @dev Útil para mostrar en el frontend un ejemplo con diferentes cantidades
     * @param token Dirección del token
     * @return example1 Proyección para 1 token
     * @return example10 Proyección para 10 tokens
     * @return example100 Proyección para 100 tokens
     */
    function getInvestmentExamples(address token)
        external
        view
        returns (
            string memory example1,
            string memory example10,
            string memory example100
        )
    {
        if (!saleExists[token]) revert SaleDoesNotExist();
        
        Sale memory sale = sales[token];
        
        // Ejemplo 1 token
        (uint256 cost1, , , uint256 return1, uint256 roi1) = 
            this.getInvestmentProjection(token, 1);
        
        // Ejemplo 10 tokens
        (uint256 cost10, , , uint256 return10, uint256 roi10) = 
            this.getInvestmentProjection(token, 10);
        
        // Ejemplo 100 tokens  
        (uint256 cost100, , , uint256 return100, uint256 roi100) = 
            this.getInvestmentProjection(token, 100);
        
        // Formatear ejemplos (simplificado, en frontend se formatearía mejor)
        example1 = "1 token";
        example10 = "10 tokens";
        example100 = "100 tokens";
        
        return (example1, example10, example100);
    }
}

