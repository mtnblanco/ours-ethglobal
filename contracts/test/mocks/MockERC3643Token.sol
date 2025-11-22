// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC3643Token
 * @notice Mock simplificado de un token ERC-3643 para testing
 * @dev En producción, este sería un token T-REX completo con KYC
 *      Para tests, simplificamos sin validaciones de compliance
 */
contract MockERC3643Token is ERC20 {
    address public owner;
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        owner = msg.sender;
    }
    
    /**
     * @notice Mintea tokens (en ERC-3643 real validaría KYC)
     * @dev Simplificado para testing - sin validaciones de compliance
     */
    function mint(address to, uint256 amount) external {
        // En ERC-3643 real: validaría identityRegistry.isVerified(to)
        // Para tests: mint directo
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

