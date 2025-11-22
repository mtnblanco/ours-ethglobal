// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title UpdateConstructionDatesTest
 * @notice Tests para PropertyRegistry.updateConstructionDates siguiendo BTT (Branching Tree Technique)
 */
contract UpdateConstructionDatesTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event ConstructionDatesUpdated(
        address indexed token,
        uint256 constructionStart,
        uint256 estimatedCompletion
    );
    
    /*//////////////////////////////////////////////////////////////
                            TEST SETUP
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Registra una propiedad antes de cada test
    function setUp() public virtual override {
        super.setUp();
        
        // Registrar una propiedad como propertyIssuer para los tests
        vm.prank(propertyIssuer);
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        propertyRegistry.registerProperty(params);
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - REVERT CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the property does not exist
    ///      └── it should revert with PropertyDoesNotExist
    function test_RevertWhen_ThePropertyDoesNotExist() external {
        address nonExistentToken = makeAddr("nonExistentToken");
        
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.PropertyDoesNotExist.selector);
        propertyRegistry.updateConstructionDates(
            nonExistentToken,
            block.timestamp + 30 days,
            block.timestamp + 365 days
        );
    }
    
    /*//////////////////////////////////////////////////////////////
                    MODIFIER: PROPERTY EXISTS
    //////////////////////////////////////////////////////////////*/
    
    modifier whenThePropertyExists() {
        // La propiedad ya fue registrada en setUp()
        _;
    }
    
    /// @dev when the caller is not the property issuer
    ///      └── it should revert with NotPropertyIssuer
    function test_RevertWhen_TheCallerIsNotThePropertyIssuer() 
        external 
        whenThePropertyExists 
    {
        vm.prank(investor1); // investor1 no es el issuer
        vm.expectRevert(PropertyRegistry.NotPropertyIssuer.selector);
        propertyRegistry.updateConstructionDates(
            mockToken,
            block.timestamp + 30 days,
            block.timestamp + 365 days
        );
    }
    
    /*//////////////////////////////////////////////////////////////
                MODIFIER: CALLER IS PROPERTY ISSUER
    //////////////////////////////////////////////////////////////*/
    
    modifier whenTheCallerIsThePropertyIssuer() {
        // Cada test maneja su propio prank
        _;
    }
    
    /// @dev when the contract is paused
    ///      └── it should revert with EnforcedPause
    function test_RevertWhen_TheContractIsPaused() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer 
    {
        // Admin pausa el contrato
        vm.prank(admin);
        propertyRegistry.pause();
        
        vm.prank(propertyIssuer);
        vm.expectRevert("Pausable: paused");
        propertyRegistry.updateConstructionDates(
            mockToken,
            block.timestamp + 30 days,
            block.timestamp + 365 days
        );
    }
    
    /*//////////////////////////////////////////////////////////////
                MODIFIER: CONTRACT NOT PAUSED
    //////////////////////////////////////////////////////////////*/
    
    modifier whenTheContractIsNotPaused() {
        // Por defecto no está pausado
        _;
    }
    
    /// @dev when the property is not active
    ///      └── it should revert with PropertyNotActive
    function test_RevertWhen_ThePropertyIsNotActive() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused 
    {
        // Desactivar la propiedad
        vm.prank(propertyIssuer);
        propertyRegistry.setPropertyActive(mockToken, false);
        
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.PropertyNotActive.selector);
        propertyRegistry.updateConstructionDates(
            mockToken,
            block.timestamp + 30 days,
            block.timestamp + 365 days
        );
    }
    
    /*//////////////////////////////////////////////////////////////
                    MODIFIER: PROPERTY IS ACTIVE
    //////////////////////////////////////////////////////////////*/
    
    modifier whenThePropertyIsActive() {
        // Por defecto está activa después de registrarse
        _;
    }
    
    /// @dev when the new construction start is zero
    ///      └── it should revert with InvalidDates
    function test_RevertWhen_TheNewConstructionStartIsZero() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.InvalidDates.selector);
        propertyRegistry.updateConstructionDates(
            mockToken,
            0, // Zero construction start
            block.timestamp + 365 days
        );
    }
    
    /// @dev when the new estimated completion is zero
    ///      └── it should revert with InvalidDates
    function test_RevertWhen_TheNewEstimatedCompletionIsZero() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.InvalidDates.selector);
        propertyRegistry.updateConstructionDates(
            mockToken,
            block.timestamp + 30 days,
            0 // Zero estimated completion
        );
    }
    
    /// @dev when the new estimated completion is before or equal to construction start
    ///      └── it should revert with InvalidDates
    function test_RevertWhen_TheNewEstimatedCompletionIsBeforeOrEqualToConstructionStart() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        uint256 startDate = block.timestamp + 30 days;
        
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.InvalidDates.selector);
        propertyRegistry.updateConstructionDates(
            mockToken,
            startDate,
            startDate // Igual, no mayor
        );
    }
    
    /// @dev when the property status is Completed
    ///      └── it should revert with PropertyAlreadyCompleted
    function test_RevertWhen_ThePropertyStatusIsCompleted() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        // Transición correcta: Planning -> InConstruction -> Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.Completed);
        vm.stopPrank();
        
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.PropertyAlreadyCompleted.selector);
        propertyRegistry.updateConstructionDates(
            mockToken,
            block.timestamp + 30 days,
            block.timestamp + 365 days
        );
    }
    
    /// @dev when the property status is Sold
    ///      └── it should revert with PropertyAlreadyCompleted
    function test_RevertWhen_ThePropertyStatusIsSold() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        // Transición correcta: Planning -> InConstruction -> Completed -> Sold
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.Completed);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.Sold);
        vm.stopPrank();
        
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.PropertyAlreadyCompleted.selector);
        propertyRegistry.updateConstructionDates(
            mockToken,
            block.timestamp + 30 days,
            block.timestamp + 365 days
        );
    }
    
    /*//////////////////////////////////////////////////////////////
            MODIFIER: DATES VALID AND STATUS ALLOWS UPDATES
    //////////////////////////////////////////////////////////////*/
    
    modifier whenDatesAreValidAndStatusAllowsUpdates() {
        // Planning o InConstruction permiten updates
        _;
    }
    
    /*//////////////////////////////////////////////////////////////
                    TESTS - SUCCESS CASES (PLANNING)
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when status is Planning
    ///      └── it should update both dates
    function test_WhenStatusIsPlanning_ShouldUpdateBothDates() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive
        whenDatesAreValidAndStatusAllowsUpdates 
    {
        uint256 newStart = block.timestamp + 60 days;
        uint256 newCompletion = block.timestamp + 800 days;
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateConstructionDates(mockToken, newStart, newCompletion);
        
        // Verificar actualización
        (, , , , , , uint256 constructionStart, uint256 estimatedCompletion, , , , , , , , , , ) = propertyRegistry.properties(mockToken);
        
        assertEq(constructionStart, newStart, "Construction start should be updated");
        assertEq(estimatedCompletion, newCompletion, "Estimated completion should be updated");
    }
    
    /// @dev when status is Planning
    ///      └── it should emit ConstructionDatesUpdated event
    function test_WhenStatusIsPlanning_ShouldEmitConstructionDatesUpdatedEvent() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive
        whenDatesAreValidAndStatusAllowsUpdates 
    {
        uint256 newStart = block.timestamp + 60 days;
        uint256 newCompletion = block.timestamp + 800 days;
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit ConstructionDatesUpdated(mockToken, newStart, newCompletion);
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateConstructionDates(mockToken, newStart, newCompletion);
    }
    
    /// @dev when status is Planning
    ///      └── it should preserve all other property data
    function test_WhenStatusIsPlanning_ShouldPreserveAllOtherPropertyData() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive
        whenDatesAreValidAndStatusAllowsUpdates 
    {
        // Capturar datos clave antes
        address issuerBefore;
        string memory nameBefore;
        uint256 totalAreaBefore;
        PropertyRegistry.PropertyStatus statusBefore;
        
        {
            (, address _issuer, string memory _name, , uint256 _area, , , , , PropertyRegistry.PropertyStatus _status, , , , , , , , ) = propertyRegistry.properties(mockToken);
            issuerBefore = _issuer;
            nameBefore = _name;
            totalAreaBefore = _area;
            statusBefore = _status;
        }
        
        uint256 newStart = block.timestamp + 60 days;
        uint256 newCompletion = block.timestamp + 800 days;
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateConstructionDates(mockToken, newStart, newCompletion);
        
        // Verificar preservación
        (, address issuerAfter, string memory nameAfter, , uint256 totalAreaAfter, , uint256 constructionStartAfter, uint256 estimatedCompletionAfter, , PropertyRegistry.PropertyStatus statusAfter, , , , , , , , ) = propertyRegistry.properties(mockToken);
        
        assertEq(issuerAfter, issuerBefore, "Issuer should not change");
        assertEq(nameAfter, nameBefore, "Name should not change");
        assertEq(totalAreaAfter, totalAreaBefore, "Total area should not change");
        assertEq(uint256(statusAfter), uint256(statusBefore), "Status should not change");
        
        // Verificar que SÍ cambiaron las fechas
        assertEq(constructionStartAfter, newStart, "Construction start should be updated");
        assertEq(estimatedCompletionAfter, newCompletion, "Estimated completion should be updated");
    }
    
    /*//////////////////////////////////////////////////////////////
                TESTS - SUCCESS CASES (IN CONSTRUCTION)
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when status is InConstruction
    ///      └── it should update both dates
    function test_WhenStatusIsInConstruction_ShouldUpdateBothDates() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive
        whenDatesAreValidAndStatusAllowsUpdates 
    {
        // Cambiar a InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.InConstruction);
        
        uint256 newStart = block.timestamp + 90 days;
        uint256 newCompletion = block.timestamp + 1000 days;
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateConstructionDates(mockToken, newStart, newCompletion);
        
        // Verificar actualización
        (, , , , , , uint256 constructionStart, uint256 estimatedCompletion, , , , , , , , , , ) = propertyRegistry.properties(mockToken);
        
        assertEq(constructionStart, newStart, "Construction start should be updated");
        assertEq(estimatedCompletion, newCompletion, "Estimated completion should be updated");
    }
    
    /// @dev when status is InConstruction
    ///      └── it should emit ConstructionDatesUpdated event
    function test_WhenStatusIsInConstruction_ShouldEmitConstructionDatesUpdatedEvent() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive
        whenDatesAreValidAndStatusAllowsUpdates 
    {
        // Cambiar a InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.InConstruction);
        
        uint256 newStart = block.timestamp + 90 days;
        uint256 newCompletion = block.timestamp + 1000 days;
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit ConstructionDatesUpdated(mockToken, newStart, newCompletion);
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateConstructionDates(mockToken, newStart, newCompletion);
    }
    
    /// @dev when status is InConstruction
    ///      └── it should allow extending deadlines
    function test_WhenStatusIsInConstruction_ShouldAllowExtendingDeadlines() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive
        whenDatesAreValidAndStatusAllowsUpdates 
    {
        // Cambiar a InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(mockToken, PropertyRegistry.PropertyStatus.InConstruction);
        
        // Obtener fechas actuales
        (, , , , , , uint256 oldStart, uint256 oldCompletion, , , , , , , , , , ) = propertyRegistry.properties(mockToken);
        
        // Extender fechas (común en construcción real)
        uint256 extendedStart = oldStart + 30 days;
        uint256 extendedCompletion = oldCompletion + 180 days; // 6 meses de retraso
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateConstructionDates(mockToken, extendedStart, extendedCompletion);
        
        // Verificar extensión
        (, , , , , , uint256 newStart, uint256 newCompletion, , , , , , , , , , ) = propertyRegistry.properties(mockToken);
        
        assertEq(newStart, extendedStart, "Start date should be extended");
        assertEq(newCompletion, extendedCompletion, "Completion date should be extended");
        assertTrue(newCompletion > oldCompletion, "Completion should be later than before");
    }
    
    /*//////////////////////////////////////////////////////////////
                    TESTS - EDGE CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when dates are the same as current
    ///      └── it should update anyway (idempotence)
    function test_WhenDatesAreTheSameAsCurrent_ShouldUpdateAnyway() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive
        whenDatesAreValidAndStatusAllowsUpdates 
    {
        // Obtener fechas actuales
        (, , , , , , uint256 currentStart, uint256 currentCompletion, , , , , , , , , , ) = propertyRegistry.properties(mockToken);
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit ConstructionDatesUpdated(mockToken, currentStart, currentCompletion);
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateConstructionDates(mockToken, currentStart, currentCompletion);
        
        // Verificar que siguen igual (idempotencia)
        (, , , , , , uint256 newStart, uint256 newCompletion, , , , , , , , , , ) = propertyRegistry.properties(mockToken);
        
        assertEq(newStart, currentStart, "Start date should remain the same");
        assertEq(newCompletion, currentCompletion, "Completion date should remain the same");
    }
}

