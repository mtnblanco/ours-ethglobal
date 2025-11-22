// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { Test } from "forge-std/Test.sol";
import { PropertyRegistry } from "../contracts/PropertyRegistry.sol";
import { SaleManager } from "../contracts/SaleManager.sol";
import { RevenueDistributor } from "../contracts/RevenueDistributor.sol";

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
    
    /*//////////////////////////////////////////////////////////////
                            DIRECCIONES DE PRUEBA
    //////////////////////////////////////////////////////////////*/
    
    address internal admin = makeAddr("admin");
    address internal propertyIssuer = makeAddr("propertyIssuer");
    address internal verifier = makeAddr("verifier");
    address internal investor1 = makeAddr("investor1");
    address internal investor2 = makeAddr("investor2");
    address internal investor3 = makeAddr("investor3");
    address internal mockToken = makeAddr("mockToken");
    address internal mockStablecoin = makeAddr("mockStablecoin");
    
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
        // Deploy contratos como admin
        vm.startPrank(admin);
        
        propertyRegistry = new PropertyRegistry();
        saleManager = new SaleManager(
            mockStablecoin,           // _stablecoin
            address(propertyRegistry), // _propertyRegistry
            500                        // _platformFeeBps (5%)
        );
        revenueDistributor = new RevenueDistributor(
            mockStablecoin,           // _stablecoin
            address(propertyRegistry), // _propertyRegistry
            500                        // _platformFeeBps (5%)
        );
        
        // Configurar roles
        propertyRegistry.grantRole(PROPERTY_ISSUER_ROLE, propertyIssuer);
        propertyRegistry.grantRole(VERIFIER_ROLE, verifier);
        saleManager.grantRole(PROPERTY_ISSUER_ROLE, propertyIssuer);
        revenueDistributor.grantRole(PROPERTY_ISSUER_ROLE, propertyIssuer);
        
        vm.stopPrank();
        
        // Label addresses para mejor debugging
        vm.label(admin, "Admin");
        vm.label(propertyIssuer, "Property Issuer");
        vm.label(verifier, "Verifier");
        vm.label(investor1, "Investor 1");
        vm.label(investor2, "Investor 2");
        vm.label(investor3, "Investor 3");
        vm.label(mockToken, "Mock ERC-3643 Token");
        vm.label(mockStablecoin, "Mock Stablecoin");
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
            token: mockToken,
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
}

