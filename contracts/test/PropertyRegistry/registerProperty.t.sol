// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title RegisterPropertyTest
 * @notice Tests para PropertyRegistry.registerProperty siguiendo BTT (Branching Tree Technique)
 */
contract RegisterPropertyTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Eventos redeclarados para testing
    event PropertyRegistered(
        address indexed token,
        address indexed issuer,
        string name,
        string cadastralNumber
    );
    
    event FinancialDataUpdated(
        address indexed token,
        uint256 totalTokenSupply,
        uint256 totalInvestmentTarget,
        uint256 estimatedSalePrice
    );
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - REVERT CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the caller lacks PROPERTY_ISSUER_ROLE
    ///      └── it should revert with AccessControl error (OpenZeppelin 4.x string error)
    function test_RevertWhen_TheCallerLacksPropertyIssuerRole() external {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        vm.startPrank(investor1); // investor1 no tiene el rol
        // OpenZeppelin 4.x usa strings, no custom errors
        vm.expectRevert(
            bytes(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        _toAsciiString(investor1), // Ya incluye 0x y es lowercase
                        " is missing role ",
                        _toHexString(uint256(PROPERTY_ISSUER_ROLE))
                    )
                )
            )
        );
        propertyRegistry.registerProperty(params);
        vm.stopPrank();
    }
    
    /// @dev when the contract is paused
    ///      └── it should revert with Pausable error (OpenZeppelin 4.x string error)
    function test_RevertWhen_TheContractIsPaused() external {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        // Admin pausa el contrato
        vm.prank(admin);
        propertyRegistry.pause();
        
        vm.startPrank(propertyIssuer);
        // OpenZeppelin 4.x usa strings, no custom errors
        vm.expectRevert("Pausable: paused");
        propertyRegistry.registerProperty(params);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                MODIFIER: CALLER HAS ROLE AND NOT PAUSED
    //////////////////////////////////////////////////////////////*/
    
    modifier whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused() {
        vm.startPrank(propertyIssuer);
        _;
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
            TESTS - VALIDATION ERRORS (WITH VALID PERMISSIONS)
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the token address is zero
    ///      └── it should revert with InvalidToken
    function test_RevertWhen_TheTokenAddressIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.token = address(0);
        
        vm.expectRevert(PropertyRegistry.InvalidToken.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the token already has a registered property
    ///      └── it should revert with PropertyAlreadyExists
    function test_RevertWhen_TheTokenAlreadyHasARegisteredProperty() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        // Primera vez - éxito
        propertyRegistry.registerProperty(params);
        
        // Segunda vez - debe revertir
        vm.expectRevert(PropertyRegistry.PropertyAlreadyExists.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the property name is empty
    ///      └── it should revert with InvalidName
    function test_RevertWhen_ThePropertyNameIsEmpty() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.name = "";
        
        vm.expectRevert(PropertyRegistry.InvalidName.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the location is empty
    ///      └── it should revert with InvalidLocation
    function test_RevertWhen_TheLocationIsEmpty() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.location = "";
        
        vm.expectRevert(PropertyRegistry.InvalidLocation.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the total area is zero
    ///      └── it should revert with InvalidArea
    function test_RevertWhen_TheTotalAreaIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.totalArea = 0;
        
        vm.expectRevert(PropertyRegistry.InvalidArea.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the units count is zero
    ///      └── it should revert with InvalidUnits
    function test_RevertWhen_TheUnitsCountIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.units = 0;
        
        vm.expectRevert(PropertyRegistry.InvalidUnits.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the construction start is zero
    ///      └── it should revert with InvalidDates
    function test_RevertWhen_TheConstructionStartIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.constructionStart = 0;
        
        vm.expectRevert(PropertyRegistry.InvalidDates.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the estimated completion is zero
    ///      └── it should revert with InvalidDates
    function test_RevertWhen_TheEstimatedCompletionIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.estimatedCompletion = 0;
        
        vm.expectRevert(PropertyRegistry.InvalidDates.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the estimated completion is before or equal to construction start
    ///      └── it should revert with InvalidDates
    function test_RevertWhen_TheEstimatedCompletionIsBeforeOrEqualToConstructionStart() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.estimatedCompletion = params.constructionStart; // Igual
        
        vm.expectRevert(PropertyRegistry.InvalidDates.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the cadastral number is empty
    ///      └── it should revert with InvalidCadastralNumber
    function test_RevertWhen_TheCadastralNumberIsEmpty() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.cadastralNumber = "";
        
        vm.expectRevert(PropertyRegistry.InvalidCadastralNumber.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the cadastral number is already used
    ///      └── it should revert with CadastralNumberAlreadyUsed
    function test_RevertWhen_TheCadastralNumberIsAlreadyUsed() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        // Primera propiedad
        propertyRegistry.registerProperty(params);
        
        // Segunda propiedad con el mismo número catastral
        params.token = makeAddr("anotherToken");
        vm.expectRevert(PropertyRegistry.CadastralNumberAlreadyUsed.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the total token supply is zero
    ///      └── it should revert with InvalidTokenSupply
    function test_RevertWhen_TheTotalTokenSupplyIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.totalTokenSupply = 0;
        
        vm.expectRevert(PropertyRegistry.InvalidTokenSupply.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the total investment target is zero
    ///      └── it should revert with InvalidInvestmentTarget
    function test_RevertWhen_TheTotalInvestmentTargetIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.totalInvestmentTarget = 0;
        
        vm.expectRevert(PropertyRegistry.InvalidInvestmentTarget.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the estimated sale price is zero
    ///      └── it should revert with InvalidSalePrice
    function test_RevertWhen_TheEstimatedSalePriceIsZero() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.estimatedSalePrice = 0;
        
        vm.expectRevert(PropertyRegistry.InvalidSalePrice.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when the estimated sale price is less than or equal to investment target
    ///      └── it should revert with InvalidSalePrice
    function test_RevertWhen_TheEstimatedSalePriceIsLessThanOrEqualToInvestmentTarget() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        params.estimatedSalePrice = params.totalInvestmentTarget; // Igual, sin ganancia
        
        vm.expectRevert(PropertyRegistry.InvalidSalePrice.selector);
        propertyRegistry.registerProperty(params);
    }
    
    /*//////////////////////////////////////////////////////////////
                    TESTS - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when all parameters are valid
    ///      └── it should store the property with correct data
    function test_WhenAllParametersAreValid_ShouldStoreThePropertyWithCorrectData() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        propertyRegistry.registerProperty(params);
        
        // Verificar que se almacenó correctamente
        (
            address token,
            address issuer,
            string memory name,
            string memory location,
            uint256 totalArea,
            uint256 units,
            uint256 constructionStart,
            uint256 estimatedCompletion,
            uint256 actualCompletion,
            PropertyRegistry.PropertyStatus status,
            string memory ipfsHash,
            string memory cadastralNumber,
            address legalOwner,
            uint256 registeredAt,
            bool isActive,
            uint256 totalTokenSupply,
            uint256 totalInvestmentTarget,
            uint256 estimatedSalePrice
        ) = propertyRegistry.properties(mockToken);
        
        assertEq(token, params.token, "Token address mismatch");
        assertEq(issuer, propertyIssuer, "Issuer mismatch");
        assertEq(name, params.name, "Name mismatch");
        assertEq(location, params.location, "Location mismatch");
        assertEq(totalArea, params.totalArea, "Total area mismatch");
        assertEq(units, params.units, "Units mismatch");
        assertEq(constructionStart, params.constructionStart, "Construction start mismatch");
        assertEq(estimatedCompletion, params.estimatedCompletion, "Estimated completion mismatch");
        assertEq(actualCompletion, 0, "Actual completion should be 0");
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.Planning), "Status should be Planning");
        assertEq(ipfsHash, params.ipfsHash, "IPFS hash mismatch");
        assertEq(cadastralNumber, params.cadastralNumber, "Cadastral number mismatch");
        assertEq(legalOwner, propertyIssuer, "Legal owner mismatch");
        assertEq(registeredAt, block.timestamp, "Registered at mismatch");
        assertTrue(isActive, "Should be active");
        assertEq(totalTokenSupply, params.totalTokenSupply, "Total token supply mismatch");
        assertEq(totalInvestmentTarget, params.totalInvestmentTarget, "Investment target mismatch");
        assertEq(estimatedSalePrice, params.estimatedSalePrice, "Sale price mismatch");
    }
    
    /// @dev when all parameters are valid
    ///      └── it should mark the property as existing
    function test_WhenAllParametersAreValid_ShouldMarkThePropertyAsExisting() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        assertFalse(propertyRegistry.propertyExists(mockToken), "Should not exist before");
        
        propertyRegistry.registerProperty(params);
        
        assertTrue(propertyRegistry.propertyExists(mockToken), "Should exist after");
    }
    
    /// @dev when all parameters are valid
    ///      └── it should increment the property count
    function test_WhenAllParametersAreValid_ShouldIncrementThePropertyCount() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        uint256 countBefore = propertyRegistry.propertyCount();
        
        propertyRegistry.registerProperty(params);
        
        uint256 countAfter = propertyRegistry.propertyCount();
        
        assertEq(countAfter, countBefore + 1, "Property count should increment by 1");
    }
    
    /// @dev when all parameters are valid
    ///      └── it should add the token to issuer's properties
    function test_WhenAllParametersAreValid_ShouldAddTheTokenToIssuerProperties() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        propertyRegistry.registerProperty(params);
        
        address[] memory issuerProps = propertyRegistry.getIssuerProperties(propertyIssuer);
        
        assertEq(issuerProps.length, 1, "Issuer should have 1 property");
        assertEq(issuerProps[0], mockToken, "Token should be in issuer's properties");
    }
    
    /// @dev when all parameters are valid
    ///      └── it should map cadastral number to token
    function test_WhenAllParametersAreValid_ShouldMapCadastralNumberToToken() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        propertyRegistry.registerProperty(params);
        
        address tokenFromCadastral = propertyRegistry.getTokenByCadastral(params.cadastralNumber);
        
        assertEq(tokenFromCadastral, mockToken, "Cadastral number should map to token");
    }
    
    /// @dev when all parameters are valid
    ///      └── it should emit PropertyRegistered event
    function test_WhenAllParametersAreValid_ShouldEmitPropertyRegisteredEvent() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        vm.expectEmit(true, true, false, true, address(propertyRegistry));
        emit PropertyRegistered(
            params.token, 
            propertyIssuer, 
            params.name, 
            params.cadastralNumber
        );
        
        propertyRegistry.registerProperty(params);
    }
    
    /// @dev when all parameters are valid
    ///      └── it should emit FinancialDataUpdated event
    function test_WhenAllParametersAreValid_ShouldEmitFinancialDataUpdatedEvent() 
        external 
        whenTheCallerHasPropertyIssuerRoleAndContractIsNotPaused 
    {
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit FinancialDataUpdated(
            params.token, 
            params.totalTokenSupply, 
            params.totalInvestmentTarget, 
            params.estimatedSalePrice
        );
        
        propertyRegistry.registerProperty(params);
    }
    
    /*//////////////////////////////////////////////////////////////
                            HELPERS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Convierte address a string ASCII con prefijo 0x
    function _toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42); // 0x + 40 chars
        s[0] = '0';
        s[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i + 2] = _char(hi);
            s[2*i + 3] = _char(lo);
        }
        return string(s);
    }
    
    /// @dev Convierte uint256 a string hexadecimal con prefijo 0x
    function _toHexString(uint256 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(66);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint256 i = 65; i > 1; --i) {
            buffer[i] = _char(bytes1(uint8(value & 0xf)));
            value >>= 4;
        }
        return string(buffer);
    }
    
    /// @dev Convierte string a lowercase
    function _toLowercase(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint256 i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }
    
    /// @dev Convierte byte a char hexadecimal
    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}

