// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { ChainlinkKYCIssuer } from "../../contracts/ChainlinkKYCIssuer.sol";

/**
 * @title FulfillKYCTest
 * @notice Tests para ChainlinkKYCIssuer.fulfillKYC siguiendo BTT
 */
contract FulfillKYCTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event KYCFulfilled(
        address indexed user,
        bool approved,
        bytes32 kycDataHash
    );
    
    /*//////////////////////////////////////////////////////////////
                            TEST VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    bytes32 internal kycDataHash = keccak256("test_kyc_data");
    
    /*//////////////////////////////////////////////////////////////
                                SETUP
    //////////////////////////////////////////////////////////////*/
    
    function setUp() public override {
        super.setUp();
        
        // Request KYC para investor1 (simula el paso previo)
        vm.prank(admin);
        kycIssuer.mockRequestKYCForTesting(investor1);
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - REVERT CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the caller lacks CHAINLINK_DON_ROLE
    function test_RevertWhen_TheCallerLacksChainlinkDonRole() external {
        vm.startPrank(investor2);
        vm.expectRevert(
            bytes(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        _toAsciiString(investor2),
                        " is missing role ",
                        _toHexString(uint256(CHAINLINK_DON_ROLE))
                    )
                )
            )
        );
        kycIssuer.fulfillKYC(investor1, true, kycDataHash);
        vm.stopPrank();
    }
    
    /// @dev when the user address is zero
    function test_RevertWhen_TheUserAddressIsZero() external {
        vm.startPrank(admin);
        vm.expectRevert(ChainlinkKYCIssuer.InvalidUser.selector);
        kycIssuer.fulfillKYC(address(0), true, kycDataHash);
        vm.stopPrank();
    }
    
    /// @dev when no KYC request exists for the user
    function test_RevertWhen_NoKYCRequestExists() external {
        vm.startPrank(admin);
        vm.expectRevert(ChainlinkKYCIssuer.NoKYCRequest.selector);
        kycIssuer.fulfillKYC(investor2, true, kycDataHash); // investor2 no ha requestado
        vm.stopPrank();
    }
    
    /// @dev when the KYC is already approved or rejected
    function test_RevertWhen_TheKYCIsAlreadyProcessed() external {
        // Aprobar el KYC primero
        vm.startPrank(admin);
        kycIssuer.fulfillKYC(investor1, true, kycDataHash);
        
        // Intentar procesarlo de nuevo
        vm.expectRevert(ChainlinkKYCIssuer.KYCAlreadyProcessed.selector);
        kycIssuer.fulfillKYC(investor1, true, kycDataHash);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the KYC is approved
    function test_FulfillKYC_Approved_Success() external {
        uint256 totalKYCsBefore = kycIssuer.totalKYCsApproved();
        
        vm.startPrank(admin);
        
        // Verificar evento
        vm.expectEmit(true, false, false, true);
        emit KYCFulfilled(investor1, true, kycDataHash);
        
        kycIssuer.fulfillKYC(investor1, true, kycDataHash);
        
        vm.stopPrank();
        
        // Verificar que está verificado
        assertTrue(kycIssuer.isKYCVerified(investor1), "Should be KYC verified");
        
        // Verificar datos del KYC
        (
            uint8 status,
            bytes32 nullifierHash,
            uint256 requestedAt,
            uint256 approvedAt,
            bytes32 storedHash,
            address onchainIDAddress
        ) = kycIssuer.kycData(investor1);
        
        assertEq(status, 2, "Status should be Approved (2)"); // Approved = 2
        assertTrue(nullifierHash != bytes32(0), "Should have nullifier hash");
        assertTrue(requestedAt > 0, "Should have requested timestamp");
        assertEq(approvedAt, block.timestamp, "Approved at should be current");
        assertEq(storedHash, kycDataHash, "Should store the hash");
        assertTrue(onchainIDAddress != address(0), "Should have OnchainID");
        
        // Verificar contador incrementado
        assertEq(
            kycIssuer.totalKYCsApproved(),
            totalKYCsBefore + 1,
            "Total KYCs should increment"
        );
        
        // Verificar que el OnchainID existe en el registry
        assertTrue(
            identityRegistry.contains(onchainIDAddress),
            "OnchainID should be registered"
        );
    }
    
    /// @dev when the KYC is rejected
    function test_FulfillKYC_Rejected_Success() external {
        uint256 totalKYCsBefore = kycIssuer.totalKYCsApproved();
        
        vm.startPrank(admin);
        
        // Verificar evento
        vm.expectEmit(true, false, false, true);
        emit KYCFulfilled(investor1, false, kycDataHash);
        
        kycIssuer.fulfillKYC(investor1, false, kycDataHash);
        
        vm.stopPrank();
        
        // Verificar que NO está verificado
        assertFalse(kycIssuer.isKYCVerified(investor1), "Should NOT be KYC verified");
        
        // Verificar datos del KYC
        (
            uint8 status,
            ,
            ,
            uint256 approvedAt,
            bytes32 storedHash,
            address onchainIDAddress
        ) = kycIssuer.kycData(investor1);
        
        assertEq(status, 3, "Status should be Rejected (3)"); // Rejected = 3
        assertEq(approvedAt, 0, "Approved at should be 0 for rejection");
        assertEq(storedHash, kycDataHash, "Should store the hash even when rejected");
        assertEq(onchainIDAddress, address(0), "Should NOT have OnchainID");
        
        // Verificar contador NO incrementado
        assertEq(
            kycIssuer.totalKYCsApproved(),
            totalKYCsBefore,
            "Total KYCs should NOT increment for rejection"
        );
    }
    
    /// @dev test multiple approvals
    function test_FulfillKYC_MultipleUsers() external {
        // Preparar más usuarios
        address[] memory users = new address[](3);
        users[0] = investor1;
        users[1] = investor2;
        users[2] = investor3;
        
        // Request KYC para todos
        vm.startPrank(admin);
        kycIssuer.mockRequestKYCForTesting(investor2);
        kycIssuer.mockRequestKYCForTesting(investor3);
        
        uint256 totalBefore = kycIssuer.totalKYCsApproved();
        
        // Aprobar todos
        for (uint i = 0; i < users.length; i++) {
            bytes32 hash = keccak256(abi.encodePacked("kyc_data", i));
            kycIssuer.fulfillKYC(users[i], true, hash);
        }
        
        vm.stopPrank();
        
        // Verificar todos aprobados
        for (uint i = 0; i < users.length; i++) {
            assertTrue(
                kycIssuer.isKYCVerified(users[i]),
                string(abi.encodePacked("User ", i, " should be verified"))
            );
        }
        
        // Verificar contador
        assertEq(
            kycIssuer.totalKYCsApproved(),
            totalBefore + 3,
            "Should have 3 more approvals"
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

