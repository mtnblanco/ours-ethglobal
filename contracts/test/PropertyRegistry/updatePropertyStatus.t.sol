// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title UpdatePropertyStatusTest
 * @notice Tests para PropertyRegistry.updatePropertyStatus siguiendo BTT (Branching Tree Technique)
 * @dev Testea exhaustivamente la máquina de estados y todas las transiciones válidas/inválidas
 */
contract UpdatePropertyStatusTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event PropertyStatusUpdated(
        address indexed token,
        PropertyRegistry.PropertyStatus oldStatus,
        PropertyRegistry.PropertyStatus newStatus,
        address indexed updater
    );
    
    event PropertyCompleted(
        address indexed token,
        uint256 actualCompletion
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
                        TESTS - BASIC REVERT CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the property does not exist
    ///      └── it should revert with PropertyDoesNotExist
    function test_RevertWhen_ThePropertyDoesNotExist() external {
        address nonExistentToken = makeAddr("nonExistentToken");
        
        vm.prank(verifier);
        vm.expectRevert(PropertyRegistry.PropertyDoesNotExist.selector);
        propertyRegistry.updatePropertyStatus(
            nonExistentToken,
            PropertyRegistry.PropertyStatus.InConstruction
        );
    }
    
    /// @dev when the caller is neither verifier nor property issuer
    ///      └── it should revert with NotPropertyIssuer
    function test_RevertWhen_TheCallerIsNeitherVerifierNorPropertyIssuer() external {
        vm.prank(investor1); // No tiene permisos
        vm.expectRevert(PropertyRegistry.NotPropertyIssuer.selector);
        propertyRegistry.updatePropertyStatus(
            address(propertyToken),
            PropertyRegistry.PropertyStatus.InConstruction
        );
    }
    
    /// @dev when the contract is paused
    ///      └── it should revert with EnforcedPause
    function test_RevertWhen_TheContractIsPaused() external {
        // Admin pausa el contrato
        vm.prank(admin);
        propertyRegistry.pause();
        
        vm.prank(verifier);
        vm.expectRevert("Pausable: paused");
        propertyRegistry.updatePropertyStatus(
            address(propertyToken),
            PropertyRegistry.PropertyStatus.InConstruction
        );
    }
    
    /*//////////////////////////////////////////////////////////////
            TESTS - VALID TRANSITIONS FROM PLANNING
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when transitioning from Planning to InConstruction
    ///      └── it should update the status
    function test_WhenTransitioningFromPlanningToInConstruction_ShouldUpdateTheStatus() external {
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        (, , , , , , , , , PropertyRegistry.PropertyStatus status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.InConstruction), "Status should be InConstruction");
    }
    
    /// @dev when transitioning from Planning to InConstruction
    ///      └── it should emit PropertyStatusUpdated event
    function test_WhenTransitioningFromPlanningToInConstruction_ShouldEmitPropertyStatusUpdatedEvent() external {
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyStatusUpdated(
            address(propertyToken),
            PropertyRegistry.PropertyStatus.Planning,
            PropertyRegistry.PropertyStatus.InConstruction,
            verifier
        );
        
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
    }
    
    /// @dev when transitioning from Planning to Cancelled
    ///      └── it should update the status
    function test_WhenTransitioningFromPlanningToCancelled_ShouldUpdateTheStatus() external {
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        
        (, , , , , , , , , PropertyRegistry.PropertyStatus status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.Cancelled), "Status should be Cancelled");
    }
    
    /// @dev when transitioning from Planning to Cancelled
    ///      └── it should emit PropertyStatusUpdated event
    function test_WhenTransitioningFromPlanningToCancelled_ShouldEmitPropertyStatusUpdatedEvent() external {
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyStatusUpdated(
            address(propertyToken),
            PropertyRegistry.PropertyStatus.Planning,
            PropertyRegistry.PropertyStatus.Cancelled,
            verifier
        );
        
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
    }
    
    /*//////////////////////////////////////////////////////////////
            TESTS - INVALID TRANSITIONS FROM PLANNING
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when trying Planning to Planning (same state)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingPlanningToPlanning() external {
        vm.prank(verifier);
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Planning);
    }
    
    /// @dev when trying Planning to Completed (skip state)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingPlanningToCompleted() external {
        vm.prank(verifier);
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
    }
    
    /// @dev when trying Planning to Sold (skip states)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingPlanningToSold() external {
        vm.prank(verifier);
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
    }
    
    /*//////////////////////////////////////////////////////////////
        TESTS - VALID TRANSITIONS FROM IN CONSTRUCTION
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when transitioning from InConstruction to Completed
    ///      └── it should update the status
    function test_WhenTransitioningFromInConstructionToCompleted_ShouldUpdateTheStatus() external {
        // Setup: Planning → InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Test: InConstruction → Completed
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        (, , , , , , , , , PropertyRegistry.PropertyStatus status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.Completed), "Status should be Completed");
    }
    
    /// @dev when transitioning from InConstruction to Completed
    ///      └── it should set actualCompletion timestamp
    function test_WhenTransitioningFromInConstructionToCompleted_ShouldSetActualCompletionTimestamp() external {
        // Setup: Planning → InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Verificar que actualCompletion es 0 antes
        (, , , , , , , , uint256 actualCompletionBefore, , , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(actualCompletionBefore, 0, "actualCompletion should be 0 before");
        
        // Test: InConstruction → Completed
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        // Verificar que actualCompletion se actualizó
        (, , , , , , , , uint256 actualCompletionAfter, , , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(actualCompletionAfter, block.timestamp, "actualCompletion should be current timestamp");
    }
    
    /// @dev when transitioning from InConstruction to Completed
    ///      └── it should emit PropertyCompleted event
    function test_WhenTransitioningFromInConstructionToCompleted_ShouldEmitPropertyCompletedEvent() external {
        // Setup: Planning → InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Test: Expect both events
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyCompleted(address(propertyToken), block.timestamp);
        
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
    }
    
    /// @dev when transitioning from InConstruction to Completed
    ///      └── it should emit PropertyStatusUpdated event
    function test_WhenTransitioningFromInConstructionToCompleted_ShouldEmitPropertyStatusUpdatedEvent() external {
        // Setup: Planning → InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Test: Expect status updated event
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyStatusUpdated(
            address(propertyToken),
            PropertyRegistry.PropertyStatus.InConstruction,
            PropertyRegistry.PropertyStatus.Completed,
            verifier
        );
        
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
    }
    
    /// @dev when transitioning from InConstruction to Cancelled
    ///      └── it should update the status
    function test_WhenTransitioningFromInConstructionToCancelled_ShouldUpdateTheStatus() external {
        // Setup: Planning → InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Test: InConstruction → Cancelled
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        
        (, , , , , , , , , PropertyRegistry.PropertyStatus status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.Cancelled), "Status should be Cancelled");
    }
    
    /// @dev when transitioning from InConstruction to Cancelled
    ///      └── it should emit PropertyStatusUpdated event
    function test_WhenTransitioningFromInConstructionToCancelled_ShouldEmitPropertyStatusUpdatedEvent() external {
        // Setup: Planning → InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyStatusUpdated(
            address(propertyToken),
            PropertyRegistry.PropertyStatus.InConstruction,
            PropertyRegistry.PropertyStatus.Cancelled,
            verifier
        );
        
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
    }
    
    /*//////////////////////////////////////////////////////////////
        TESTS - INVALID TRANSITIONS FROM IN CONSTRUCTION
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when trying InConstruction to InConstruction (same state)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingInConstructionToInConstruction() external {
        // Setup: Planning → InConstruction
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Test: InConstruction → InConstruction
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        vm.stopPrank();
    }
    
    /// @dev when trying InConstruction to Planning (backwards)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingInConstructionToPlanning() external {
        // Setup: Planning → InConstruction
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Test: InConstruction → Planning (backwards)
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Planning);
        vm.stopPrank();
    }
    
    /// @dev when trying InConstruction to Sold (skip state)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingInConstructionToSold() external {
        // Setup: Planning → InConstruction
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        // Test: InConstruction → Sold (skip Completed)
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
            TESTS - VALID TRANSITIONS FROM COMPLETED
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when transitioning from Completed to Sold
    ///      └── it should update the status
    function test_WhenTransitioningFromCompletedToSold_ShouldUpdateTheStatus() external {
        // Setup: Planning → InConstruction → Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        // Test: Completed → Sold
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        vm.stopPrank();
        
        (, , , , , , , , , PropertyRegistry.PropertyStatus status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.Sold), "Status should be Sold");
    }
    
    /// @dev when transitioning from Completed to Sold
    ///      └── it should emit PropertyStatusUpdated event
    function test_WhenTransitioningFromCompletedToSold_ShouldEmitPropertyStatusUpdatedEvent() external {
        // Setup: Planning → InConstruction → Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        // Test: Expect event
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyStatusUpdated(
            address(propertyToken),
            PropertyRegistry.PropertyStatus.Completed,
            PropertyRegistry.PropertyStatus.Sold,
            verifier
        );
        
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
            TESTS - INVALID TRANSITIONS FROM COMPLETED
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when trying Completed to Completed (same state)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCompletedToCompleted() external {
        // Setup: Planning → InConstruction → Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        // Test: Completed → Completed
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        vm.stopPrank();
    }
    
    /// @dev when trying Completed to Planning (backwards)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCompletedToPlanning() external {
        // Setup: Planning → InConstruction → Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        // Test: Completed → Planning
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Planning);
        vm.stopPrank();
    }
    
    /// @dev when trying Completed to InConstruction (backwards)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCompletedToInConstruction() external {
        // Setup: Planning → InConstruction → Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        // Test: Completed → InConstruction
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        vm.stopPrank();
    }
    
    /// @dev when trying Completed to Cancelled (not allowed)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCompletedToCancelled() external {
        // Setup: Planning → InConstruction → Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        
        // Test: Completed → Cancelled (not allowed)
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
        TESTS - INVALID TRANSITIONS FROM SOLD (FINAL STATE)
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when trying Sold to Planning
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingSoldToPlanning() external {
        // Setup: Planning → InConstruction → Completed → Sold
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        
        // Test: Sold → Planning (final state, no transitions)
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Planning);
        vm.stopPrank();
    }
    
    /// @dev when trying Sold to InConstruction
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingSoldToInConstruction() external {
        // Setup: Planning → InConstruction → Completed → Sold
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        
        // Test: Sold → InConstruction
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        vm.stopPrank();
    }
    
    /// @dev when trying Sold to Completed
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingSoldToCompleted() external {
        // Setup: Planning → InConstruction → Completed → Sold
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        
        // Test: Sold → Completed
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        vm.stopPrank();
    }
    
    /// @dev when trying Sold to Sold (same state)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingSoldToSold() external {
        // Setup: Planning → InConstruction → Completed → Sold
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        
        // Test: Sold → Sold
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        vm.stopPrank();
    }
    
    /// @dev when trying Sold to Cancelled
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingSoldToCancelled() external {
        // Setup: Planning → InConstruction → Completed → Sold
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        
        // Test: Sold → Cancelled
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
    TESTS - INVALID TRANSITIONS FROM CANCELLED (FINAL STATE)
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when trying Cancelled to Planning
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCancelledToPlanning() external {
        // Setup: Planning → Cancelled
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        
        // Test: Cancelled → Planning
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Planning);
        vm.stopPrank();
    }
    
    /// @dev when trying Cancelled to InConstruction
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCancelledToInConstruction() external {
        // Setup: Planning → Cancelled
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        
        // Test: Cancelled → InConstruction
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        vm.stopPrank();
    }
    
    /// @dev when trying Cancelled to Completed
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCancelledToCompleted() external {
        // Setup: Planning → Cancelled
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        
        // Test: Cancelled → Completed
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        vm.stopPrank();
    }
    
    /// @dev when trying Cancelled to Sold
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCancelledToSold() external {
        // Setup: Planning → Cancelled
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        
        // Test: Cancelled → Sold
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Sold);
        vm.stopPrank();
    }
    
    /// @dev when trying Cancelled to Cancelled (same state)
    ///      └── it should revert with InvalidStatusTransition
    function test_RevertWhen_TryingCancelledToCancelled() external {
        // Setup: Planning → Cancelled
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        
        // Test: Cancelled → Cancelled
        vm.expectRevert(PropertyRegistry.InvalidStatusTransition.selector);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Cancelled);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                    TESTS - PERMISSION TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when caller is verifier
    ///      └── it should allow status updates
    function test_WhenCallerIsVerifier_ShouldAllowStatusUpdates() external {
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        (, , , , , , , , , PropertyRegistry.PropertyStatus status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.InConstruction), "Verifier should be able to update status");
    }
    
    /// @dev when caller is issuer
    ///      └── it should allow status updates
    function test_WhenCallerIsIssuer_ShouldAllowStatusUpdates() external {
        vm.prank(propertyIssuer); // issuer, not verifier
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        (, , , , , , , , , PropertyRegistry.PropertyStatus status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(uint256(status), uint256(PropertyRegistry.PropertyStatus.InConstruction), "Issuer should be able to update status");
    }
}

