// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { RevenueDistributor } from "../../contracts/RevenueDistributor.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title CreateDistributionTest
 * @notice Tests para RevenueDistributor.createDistribution siguiendo BTT
 */
contract CreateDistributionTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event DistributionCreated(
        address indexed token,
        bytes32 merkleRoot,
        uint256 totalAmount,
        uint256 platformFee,
        uint256 claimDeadline
    );
    
    /*//////////////////////////////////////////////////////////////
                            TEST VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    bytes32 internal merkleRoot = keccak256("test_merkle_root");
    uint256 internal distributionAmount = 100_000e6; // 100k USDC
    uint256 internal claimWindow = 90 days;
    
    /*//////////////////////////////////////////////////////////////
                                SETUP
    //////////////////////////////////////////////////////////////*/
    
    function setUp() public override {
        super.setUp();
        
        // Registrar propiedad
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        vm.prank(propertyIssuer);
        propertyRegistry.registerProperty(params);
        
        // Dar USDC al issuer para distribución
        stablecoin.mint(propertyIssuer, distributionAmount);
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
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /// @dev when the contract is paused
    function test_RevertWhen_TheContractIsPaused() external {
        vm.prank(admin);
        revenueDistributor.pause();
        
        vm.startPrank(propertyIssuer);
        vm.expectRevert("Pausable: paused");
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /// @dev when the token address is zero
    function test_RevertWhen_TheTokenAddressIsZero() external {
        vm.startPrank(propertyIssuer);
        vm.expectRevert(RevenueDistributor.InvalidToken.selector);
        revenueDistributor.createDistribution(
            address(0),
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /// @dev when the merkle root is empty
    function test_RevertWhen_TheMerkleRootIsEmpty() external {
        vm.startPrank(propertyIssuer);
        vm.expectRevert(RevenueDistributor.InvalidMerkleRoot.selector);
        revenueDistributor.createDistribution(
            address(propertyToken),
            bytes32(0),
            distributionAmount,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /// @dev when the amount is zero
    function test_RevertWhen_TheAmountIsZero() external {
        vm.startPrank(propertyIssuer);
        vm.expectRevert(RevenueDistributor.InvalidAmount.selector);
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            0,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /// @dev when a distribution already exists for this token
    function test_RevertWhen_ADistributionAlreadyExists() external {
        // Aprobar y crear primera distribución
        vm.startPrank(propertyIssuer);
        stablecoin.approve(address(revenueDistributor), distributionAmount);
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        
        // Intentar crear otra
        vm.expectRevert(RevenueDistributor.DistributionAlreadyExists.selector);
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /// @dev when the property is not registered
    function test_RevertWhen_ThePropertyIsNotRegistered() external {
        address unregisteredToken = address(new MockERC3643Token("Unregistered", "UNREG"));
        
        vm.startPrank(propertyIssuer);
        vm.expectRevert(RevenueDistributor.PropertyNotRegistered.selector);
        revenueDistributor.createDistribution(
            unregisteredToken,
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /// @dev when the caller is not the property issuer
    function test_RevertWhen_TheCallerIsNotThePropertyIssuer() external {
        // Dar rol a investor1 pero no es el issuer
        vm.prank(admin);
        revenueDistributor.grantRole(PROPERTY_ISSUER_ROLE, investor1);
        
        vm.startPrank(investor1);
        vm.expectRevert(RevenueDistributor.NotPropertyIssuer.selector);
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when all parameters are valid
    function test_CreateDistribution_Success() external {
        vm.startPrank(propertyIssuer);
        
        // Aprobar transferencia
        stablecoin.approve(address(revenueDistributor), distributionAmount);
        
        uint256 issuerBalanceBefore = stablecoin.balanceOf(propertyIssuer);
        uint256 contractBalanceBefore = stablecoin.balanceOf(address(revenueDistributor));
        
        // Calcular fee esperado (5% configurado en BaseTest)
        uint256 expectedFee = (distributionAmount * 500) / 10000;
        uint256 expectedDeadline = block.timestamp + claimWindow;
        
        // Verificar evento
        vm.expectEmit(true, false, false, true);
        emit DistributionCreated(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            expectedFee,
            expectedDeadline
        );
        
        revenueDistributor.createDistribution(
            address(propertyToken),
            merkleRoot,
            distributionAmount,
            claimWindow
        );
        
        vm.stopPrank();
        
        // Verificar transferencia de fondos
        assertEq(
            stablecoin.balanceOf(propertyIssuer),
            issuerBalanceBefore - distributionAmount,
            "Issuer balance should decrease"
        );
        assertEq(
            stablecoin.balanceOf(address(revenueDistributor)),
            contractBalanceBefore + distributionAmount,
            "Contract balance should increase"
        );
        
        // Verificar datos de distribución
        (
            address token,
            bytes32 storedRoot,
            uint256 totalAmount,
            uint256 platformFee,
            uint256 claimedAmount,
            uint256 remainingAmount,
            uint256 createdAt,
            uint256 claimDeadline,
            bool isActive,
            address issuer
        ) = revenueDistributor.distributions(address(propertyToken));
        
        assertEq(token, address(propertyToken), "Token should match");
        assertEq(storedRoot, merkleRoot, "Merkle root should match");
        assertEq(totalAmount, distributionAmount, "Total amount should match");
        assertEq(platformFee, expectedFee, "Platform fee should be 5%");
        assertEq(claimedAmount, 0, "Claimed amount should start at 0");
        assertEq(remainingAmount, distributionAmount, "Remaining should equal total initially");
        assertEq(createdAt, block.timestamp, "Created at should be current timestamp");
        assertEq(claimDeadline, expectedDeadline, "Deadline should be correct");
        assertTrue(isActive, "Distribution should be active");
        assertEq(issuer, propertyIssuer, "Issuer should match");
        
        // Verificar que existe
        assertTrue(
            revenueDistributor.distributionExists(address(propertyToken)),
            "Distribution should exist"
        );
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

