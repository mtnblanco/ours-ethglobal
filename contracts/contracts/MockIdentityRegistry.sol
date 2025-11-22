// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@onchain-id/solidity/contracts/interface/IIdentity.sol";

/**
 * @title MockIdentityRegistry
 * @dev Mock implementation of IdentityRegistry for testing KYC integration
 * 
 * En producción, usarías el IdentityRegistry real de ERC-3643
 * Este mock simplifica el testing del flujo de KYC
 */
contract MockIdentityRegistry {
    
    // Mapping de usuario a su OnchainID
    mapping(address => IIdentity) public identities;
    
    // Mapping de usuarios registrados
    mapping(address => bool) public isRegistered;
    
    // Mapping de países por usuario
    mapping(address => uint16) public countries;
    
    // Eventos
    event IdentityRegistered(address indexed user, IIdentity indexed identity, uint16 country);
    event IdentityUpdated(address indexed user, IIdentity indexed identity);
    
    /**
     * @notice Registra una identidad para un usuario
     * @param user Dirección del usuario
     * @param identity Contrato OnchainID del usuario
     * @param country Código de país (ej: 32 para Argentina)
     */
    function registerIdentity(
        address user, 
        IIdentity identity, 
        uint16 country
    ) external {
        require(user != address(0), "Invalid user address");
        require(address(identity) != address(0), "Invalid identity address");
        require(!isRegistered[user], "User already registered");
        
        identities[user] = identity;
        countries[user] = country;
        isRegistered[user] = true;
        
        emit IdentityRegistered(user, identity, country);
    }
    
    /**
     * @notice Actualiza la identidad de un usuario registrado
     * @param user Dirección del usuario
     * @param identity Nueva dirección de OnchainID
     */
    function updateIdentity(address user, IIdentity identity) external {
        require(isRegistered[user], "User not registered");
        require(address(identity) != address(0), "Invalid identity address");
        
        identities[user] = identity;
        
        emit IdentityUpdated(user, identity);
    }
    
    /**
     * @notice Obtiene la identidad OnchainID de un usuario
     * @param user Dirección del usuario
     * @return Contrato IIdentity del usuario
     */
    function identity(address user) external view returns (IIdentity) {
        return identities[user];
    }
    
    /**
     * @notice Verifica si un usuario está registrado y verificado
     * @param user Dirección del usuario
     * @return True si el usuario está registrado
     */
    function isVerified(address user) external view returns (bool) {
        return isRegistered[user];
    }
    
    /**
     * @notice Obtiene el país de un usuario
     * @param user Dirección del usuario
     * @return Código de país
     */
    function investorCountry(address user) external view returns (uint16) {
        return countries[user];
    }
    
    /**
     * @notice Elimina el registro de un usuario (solo para testing)
     * @param user Dirección del usuario a eliminar
     */
    function removeUser(address user) external {
        require(isRegistered[user], "User not registered");
        
        delete identities[user];
        delete countries[user];
        delete isRegistered[user];
    }
    
    /**
     * @notice Verifica si una transferencia es válida según el registro
     * @param from Dirección origen
     * @param to Dirección destino  
     * @param value Cantidad (no usado en el mock)
     * @return True si ambos usuarios están registrados
     */
    function isVerifiedTransfer(
        address from, 
        address to, 
        uint256 value
    ) external view returns (bool) {
        value; // Silenciar warning de parámetro no usado
        return isRegistered[from] && isRegistered[to];
    }
}