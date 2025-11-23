// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { RevenueDistributor } from "../../contracts/RevenueDistributor.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title ClaimTest
 * @notice Tests para RevenueDistributor.claim siguiendo BTT
 */
contract ClaimTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event Claimed(
        address indexed token,
        address indexed holder,
        uint256 amount
    );
    
    /*//////////////////////////////////////////////////////////////
                            TEST VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    bytes32 internal merkleRoot;
    uint256 internal distributionAmount = 100_000e6;
    uint256 internal claimAmount = 10_000e6; // 10k USDC para investor1
    bytes32[] internal merkleProof;
    
    /*//////////////////////////////////////////////////////////////
                                SETUP
    //////////////////////////////////////////////////////////////*/
    
    function setUp() public override {
        super.setUp();
        
        // Registrar propiedad
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        vm.prank(propertyIssuer);
        propertyRegistry.registerProperty(params);
        
        // Crear merkle tree simple (en producción usarías merkletreejs)
        // Para tests, creamos un root que valide investor1
        bytes32 leaf = keccak256(abi.encodePacked(investor1, claimAmount));
        merkleRoot = keccak256(abi.encodePacked(leaf)); // Root simple para test
        
        // Crear distribución
        stablecoin.mint(propertyIssuer, distributionAmount);
        vm.startPrank(propertyIssuer);
        stablecoin.approve(address(revenueDistributor), distributionAmount);
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            90 days
        );
        vm.stopPrank();
        
        // Setup merkle proof (vacío para este root simple)
        merkleProof = new bytes32[](0);
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - REVERT CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the distribution does not exist
    function test_RevertWhen_TheDistributionDoesNotExist() external {
        address nonExistentToken = address(new MockERC3643Token("FAKE", "FAKE"));
        
        vm.startPrank(investor1);
        vm.expectRevert(RevenueDistributor.DistributionDoesNotExist.selector);
        revenueDistributor.claim(nonExistentToken, claimAmount, merkleProof);
        vm.stopPrank();
    }
    
    /// @dev when the distribution is not active
    function test_RevertWhen_TheDistributionIsNotActive() external {
        // Desactivar distribución
        vm.prank(propertyIssuer);
        revenueDistributor.setDistributionStatus(address(propertyToken), false);
        
        vm.startPrank(investor1);
        vm.expectRevert(RevenueDistributor.DistributionNotActive.selector);
        revenueDistributor.claim(address(propertyToken), claimAmount, merkleProof);
        vm.stopPrank();
    }
    
    /// @dev when the claim deadline has passed
    function test_RevertWhen_TheClaimDeadlineHasPassed() external {
        // Avanzar tiempo más allá del deadline
        vm.warp(block.timestamp + 91 days);
        
        vm.startPrank(investor1);
        vm.expectRevert(RevenueDistributor.ClaimDeadlinePassed.selector);
        revenueDistributor.claim(address(propertyToken), claimAmount, merkleProof);
        vm.stopPrank();
    }
    
    /// @dev when the user has already claimed
    function test_RevertWhen_TheUserHasAlreadyClaimed() external {
        // Primera reclamación exitosa
        vm.startPrank(investor1);
        revenueDistributor.claim(address(propertyToken), claimAmount, merkleProof);
        
        // Intentar reclamar de nuevo
        vm.expectRevert(RevenueDistributor.AlreadyClaimed.selector);
        revenueDistributor.claim(address(propertyToken), claimAmount, merkleProof);
        vm.stopPrank();
    }
    
    /// @dev when the merkle proof is invalid (simulado con root incorrecto)
    function test_RevertWhen_TheMerkleProofIsInvalid() external {
        // Usar un amount diferente al esperado por el merkle root
        uint256 wrongAmount = 5_000e6;
        
        vm.startPrank(investor1);
        vm.expectRevert(RevenueDistributor.InvalidProof.selector);
        revenueDistributor.claim(address(propertyToken), wrongAmount, merkleProof);
        vm.stopPrank();
    }
    
    /// @dev when the amount is zero
    function test_RevertWhen_TheAmountIsZero() external {
        vm.startPrank(investor1);
        vm.expectRevert(RevenueDistributor.InvalidAmount.selector);
        revenueDistributor.claim(address(propertyToken), 0, merkleProof);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when all validations pass
    function test_Claim_Success() external {
        uint256 investorBalanceBefore = stablecoin.balanceOf(investor1);
        uint256 contractBalanceBefore = stablecoin.balanceOf(address(revenueDistributor));
        
        vm.startPrank(investor1);
        
        // Verificar evento
        vm.expectEmit(true, true, false, true);
        emit Claimed(address(propertyToken), investor1, claimAmount);
        
        revenueDistributor.claim(address(propertyToken), claimAmount, merkleProof);
        
        vm.stopPrank();
        
        // Verificar transferencia
        assertEq(
            stablecoin.balanceOf(investor1),
            investorBalanceBefore + claimAmount,
            "Investor should receive tokens"
        );
        assertEq(
            stablecoin.balanceOf(address(revenueDistributor)),
            contractBalanceBefore - claimAmount,
            "Contract balance should decrease"
        );
        
        // Verificar que marcó como claimed
        assertTrue(
            revenueDistributor.hasClaimed(address(propertyToken), investor1),
            "Should be marked as claimed"
        );
        
        // Verificar actualización de amounts en distribución
        (
            ,
            ,
            ,
            ,
            uint256 claimedAmount,
            uint256 remainingAmount,
            ,
            ,
            ,
        ) = revenueDistributor.distributions(address(propertyToken));
        
        assertEq(claimedAmount, claimAmount, "Claimed amount should update");
        assertEq(
            remainingAmount,
            distributionAmount - claimAmount,
            "Remaining should decrease"
        );
    }
}

