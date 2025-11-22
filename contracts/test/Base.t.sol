// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { Test } from "forge-std/Test.sol";
import { PropertyRegistry } from "../contracts/PropertyRegistry.sol";
import { SaleManager } from "../contracts/SaleManager.sol";
import { RevenueDistributor } from "../contracts/RevenueDistributor.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockERC3643Token } from "./mocks/MockERC3643Token.sol";

/**
 * @title BaseTest
 * @notice Contrato base para todos los tests, proporciona setup común y utilidades
 * @dev Extiende forge-std Test para tener acceso a vm.* y assertions
 */
contract BaseTest is Test {
    
    /*//////////////////////////////////////////////////////////////
                            CONTRATOS DE PRUEBA
    //////////////////////////////////////////////////////////////*/
    
    PropertyRegistry internal propertyRegistry;
    SaleManager internal saleManager;
    RevenueDistributor internal revenueDistributor;
    
    MockERC20 internal stablecoin; // USDC simulado
    MockERC3643Token internal propertyToken; // Token ERC-3643 de la propiedad
    
    /*//////////////////////////////////////////////////////////////
                            DIRECCIONES DE PRUEBA
    //////////////////////////////////////////////////////////////*/
    
    address internal admin = makeAddr("admin");
    address internal propertyIssuer = makeAddr("propertyIssuer");
    address internal verifier = makeAddr("verifier");
    address internal investor1 = makeAddr("investor1");
    address internal investor2 = makeAddr("investor2");
    address internal investor3 = makeAddr("investor3");
    
    /*//////////////////////////////////////////////////////////////
                            CONSTANTES
    //////////////////////////////////////////////////////////////*/
    
    bytes32 internal constant PROPERTY_ISSUER_ROLE = keccak256("PROPERTY_ISSUER_ROLE");
    bytes32 internal constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0x00;
    
    /*//////////////////////////////////////////////////////////////
                            SETUP
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Función invocada antes de cada test
    function setUp() public virtual {
        // Deploy mocks primero
        stablecoin = new MockERC20("USD Coin", "USDC", 6); // 6 decimals como USDC real
        propertyToken = new MockERC3643Token("Property Token", "PROP");
        
        // Deploy contratos como admin
        vm.startPrank(admin);
        
        propertyRegistry = new PropertyRegistry();
        saleManager = new SaleManager(
            address(stablecoin),       // _stablecoin
            address(propertyRegistry), // _propertyRegistry
            500                        // _platformFeeBps (5%)
        );
        revenueDistributor = new RevenueDistributor(
            address(stablecoin),       // _stablecoin
            address(propertyRegistry), // _propertyRegistry
            500                        // _platformFeeBps (5%)
        );
        
        // Configurar roles
        propertyRegistry.grantRole(PROPERTY_ISSUER_ROLE, propertyIssuer);
        propertyRegistry.grantRole(VERIFIER_ROLE, verifier);
        saleManager.grantRole(PROPERTY_ISSUER_ROLE, propertyIssuer);
        revenueDistributor.grantRole(PROPERTY_ISSUER_ROLE, propertyIssuer);
        
        vm.stopPrank();
        
        // Dar balances iniciales de USDC a los inversores
        stablecoin.mint(investor1, 1_000_000e6); // 1M USDC
        stablecoin.mint(investor2, 1_000_000e6); // 1M USDC
        stablecoin.mint(investor3, 1_000_000e6); // 1M USDC
        
        // Label addresses para mejor debugging
        vm.label(admin, "Admin");
        vm.label(propertyIssuer, "Property Issuer");
        vm.label(verifier, "Verifier");
        vm.label(investor1, "Investor 1");
        vm.label(investor2, "Investor 2");
        vm.label(investor3, "Investor 3");
        vm.label(address(propertyToken), "Property Token");
        vm.label(address(stablecoin), "USDC Stablecoin");
    }
    
    /*//////////////////////////////////////////////////////////////
                            HELPERS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Crea parámetros válidos para registrar una propiedad
     * @return params PropertyParams con valores válidos por defecto
     */
    function _createValidPropertyParams() internal view returns (PropertyRegistry.PropertyParams memory params) {
        params = PropertyRegistry.PropertyParams({
            token: address(propertyToken),
            name: "Edificio Palermo Tower",
            location: "Av. Santa Fe 1234, Buenos Aires",
            totalArea: 5000, // 5000 m²
            units: 50,
            constructionStart: block.timestamp + 30 days,
            estimatedCompletion: block.timestamp + 730 days, // 2 años
            ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
            cadastralNumber: "14-23-456-7890",
            totalTokenSupply: 1_000_000e18, // 1 millón de tokens
            totalInvestmentTarget: 500_000e6, // 500k USDC
            estimatedSalePrice: 750_000e6 // 750k USDC (50% ganancia)
        });
    }
    
    /**
     * @notice Helper para crear una venta activa
     * @param token Dirección del token a vender
     * @param pricePerToken Precio por token en USDC (con 6 decimales)
     */
    function _createActiveSale(address token, uint256 pricePerToken) internal {
        vm.prank(propertyIssuer);
        saleManager.createSale(token, pricePerToken);
    }
    
    /**
     * @notice Helper para dar approval de USDC al SaleManager
     * @param investor Dirección del inversor
     * @param amount Cantidad de USDC a aprobar
     */
    function _approveStablecoin(address investor, uint256 amount) internal {
        vm.prank(investor);
        stablecoin.approve(address(saleManager), amount);
    }
}

