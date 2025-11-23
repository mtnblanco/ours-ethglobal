// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { SaleManager } from "../../contracts/SaleManager.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title CreateSaleTest
 * @notice Tests para SaleManager.createSale siguiendo BTT (Branching Tree Technique)
 */
contract CreateSaleTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event SaleCreated(
        address indexed token,
        address indexed issuer,
        uint256 pricePerToken
    );
    
    /*//////////////////////////////////////////////////////////////
                            TEST VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    address internal propertyToken2;
    uint256 internal pricePerToken = 500e6; // $500 USDC per token
    
    /*//////////////////////////////////////////////////////////////
                                SETUP
    //////////////////////////////////////////////////////////////*/
    
    function setUp() public override {
        super.setUp();
        
        // Registrar una propiedad válida para los tests
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        vm.prank(propertyIssuer);
        propertyRegistry.registerProperty(params);
        
        // Crear un segundo token para algunos tests
        // propertyToken2 = address(new MockERC3643Token("Property Token 2", "PROP2")); // Temporary disabled
        propertyToken2 = address(0x101112); // Temporary fix for compilation
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - REVERT CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the caller lacks PROPERTY_ISSUER_ROLE
    function test_RevertWhen_TheCallerLacksPropertyIssuerRole() external {
        vm.startPrank(investor1);
        vm.expectRevert(
            bytes(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        _toAsciiString(investor1),
                        " is missing role ",
                        _toHexString(uint256(PROPERTY_ISSUER_ROLE))
                    )
                )
            )
        );
        saleManager.createSale(address(propertyToken), pricePerToken);
        vm.stopPrank();
    }
    
    /// @dev when the contract is paused
    function test_RevertWhen_TheContractIsPaused() external {
        vm.prank(admin);
        saleManager.pause();
        
        vm.startPrank(propertyIssuer);
        vm.expectRevert("Pausable: paused");
        saleManager.createSale(address(propertyToken), pricePerToken);
        vm.stopPrank();
    }
    
    /// @dev when the token address is zero
    function test_RevertWhen_TheTokenAddressIsZero() external {
        vm.startPrank(propertyIssuer);
        vm.expectRevert(SaleManager.InvalidToken.selector);
        saleManager.createSale(address(0), pricePerToken);
        vm.stopPrank();
    }
    
    /// @dev when the price per token is zero
    function test_RevertWhen_ThePricePerTokenIsZero() external {
        vm.startPrank(propertyIssuer);
        vm.expectRevert(SaleManager.InvalidPrice.selector);
        saleManager.createSale(address(propertyToken), 0);
        vm.stopPrank();
    }
    
    /// @dev when a sale already exists for this token
    function test_RevertWhen_ASaleAlreadyExistsForThisToken() external {
        // Crear la primera venta
        vm.startPrank(propertyIssuer);
        saleManager.createSale(address(propertyToken), pricePerToken);
        
        // Intentar crear otra venta para el mismo token
        vm.expectRevert(SaleManager.SaleAlreadyExists.selector);
        saleManager.createSale(address(propertyToken), pricePerToken);
        vm.stopPrank();
    }
    
    /// @dev when the property is not registered in PropertyRegistry
    function test_RevertWhen_ThePropertyIsNotRegistered() external {
        vm.startPrank(propertyIssuer);
        vm.expectRevert(SaleManager.PropertyNotRegistered.selector);
        saleManager.createSale(propertyToken2, pricePerToken);
        vm.stopPrank();
    }
    
    /// @dev when the property is not available (cancelled or sold)
    function test_RevertWhen_ThePropertyIsNotAvailable() external {
        // Registrar una segunda propiedad y cancelarla
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.token = propertyToken2;
        params.cadastralNumber = "different-cadastral";
        
        vm.startPrank(propertyIssuer);
        propertyRegistry.registerProperty(params);
        
        // Cambiar a verifier para actualizar el status
        vm.stopPrank();
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(propertyToken2, PropertyRegistry.PropertyStatus.Cancelled);
        
        // Intentar crear venta para propiedad cancelada
        vm.startPrank(propertyIssuer);
        vm.expectRevert(SaleManager.PropertyNotAvailable.selector);
        saleManager.createSale(propertyToken2, pricePerToken);
        vm.stopPrank();
    }
    
    /// @dev when the caller is not the property issuer
    function test_RevertWhen_TheCallerIsNotThePropertyIssuer() external {
        // Dar rol PROPERTY_ISSUER_ROLE a investor1 pero no es el issuer de la propiedad
        vm.prank(admin);
        saleManager.grantRole(PROPERTY_ISSUER_ROLE, investor1);
        
        vm.startPrank(investor1);
        vm.expectRevert(SaleManager.NotSaleIssuer.selector);
        saleManager.createSale(address(propertyToken), pricePerToken);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when all parameters are valid
    ///      ├── it should create the sale with correct data
    ///      ├── it should mark saleExists as true
    ///      ├── it should add the token to allSales array
    ///      ├── it should set isActive to true
    ///      └── it should emit SaleCreated event
    function test_CreateSale_Success() external {
        vm.startPrank(propertyIssuer);
        
        // Verificar que el evento se emite correctamente
        vm.expectEmit(true, true, false, true);
        emit SaleCreated(address(propertyToken), propertyIssuer, pricePerToken);
        
        saleManager.createSale(address(propertyToken), pricePerToken);
        
        vm.stopPrank();
        
        // Verificar que la venta existe
        assertTrue(saleManager.saleExists(address(propertyToken)), "Sale should exist");
        
        // Verificar datos de la venta
        (
            address token,
            address issuer,
            uint256 price,
            bool isActive,
            uint256 totalRaised,
            uint256 withdrawableBalance
        ) = saleManager.sales(address(propertyToken));
        
        assertEq(token, address(propertyToken), "Token address should match");
        assertEq(issuer, propertyIssuer, "Issuer should match");
        assertEq(price, pricePerToken, "Price should match");
        assertTrue(isActive, "Sale should be active");
        assertEq(totalRaised, 0, "Total raised should start at 0");
        assertEq(withdrawableBalance, 0, "Withdrawable balance should start at 0");
        
        // Verificar que se agregó a allSales
        address[] memory allSales = saleManager.getAllSales();
        assertEq(allSales.length, 1, "Should have 1 sale");
        assertEq(allSales[0], address(propertyToken), "Sale token should be in array");
    }
    
    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    function _toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = '0';
        s[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2+2*i] = _char(hi);
            s[2+2*i+1] = _char(lo);
        }
        return string(s);
    }
    
    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
    
    function _toHexString(uint256 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(64);
        for (uint256 i = 63; i > 0; i--) {
            buffer[i] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        buffer[0] = bytes1(uint8(48 + uint256(value % 10)));
        return string(abi.encodePacked("0x", buffer));
    }
}

