// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@onchain-id/solidity/contracts/interface/IIdentity.sol";

/**
 * @title IIdentityRegistry
 * @notice Interface for ERC3643 Identity Registry
 * @dev Minimal interface containing only the methods we need for ChainlinkKYCIssuer
 */
interface IIdentityRegistry {
    /**
     * @notice Returns the identity associated with a user address
     * @param user The user address to query
     * @return The IIdentity contract for the user
     */
    function identity(address user) external view returns (IIdentity);
    
    /**
     * @notice Registers a new identity for a user
     * @param user The user address
     * @param identity The identity contract address
     * @param country The country code
     */
    function registerIdentity(
        address user,
        IIdentity identity,
        uint256 country
    ) external;
    
    /**
     * @notice Checks if a user is verified
     * @param user The user address
     * @return True if the user is verified
     */
    function isVerified(address user) external view returns (bool);
}