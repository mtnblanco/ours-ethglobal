// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title UpdateMetadataTest
 * @notice Tests para PropertyRegistry.updateMetadata siguiendo BTT (Branching Tree Technique)
 */
contract UpdateMetadataTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event PropertyMetadataUpdated(
        address indexed token,
        string ipfsHash
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
        propertyRegistry.updateMetadata(nonExistentToken, "QmNewHash");
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
        propertyRegistry.updateMetadata(address(propertyToken), "QmNewHash");
    }
    
    /*//////////////////////////////////////////////////////////////
                MODIFIER: CALLER IS PROPERTY ISSUER
    //////////////////////////////////////////////////////////////*/
    
    modifier whenTheCallerIsThePropertyIssuer() {
        // No hacemos prank aquí, cada test lo maneja según necesite
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
        propertyRegistry.updateMetadata(address(propertyToken), "QmNewHash");
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
        // Desactivar la propiedad primero
        vm.prank(propertyIssuer);
        propertyRegistry.setPropertyActive(address(propertyToken), false);
        
        vm.prank(propertyIssuer);
        vm.expectRevert(PropertyRegistry.PropertyNotActive.selector);
        propertyRegistry.updateMetadata(address(propertyToken), "QmNewHash");
    }
    
    /*//////////////////////////////////////////////////////////////
                    MODIFIER: PROPERTY IS ACTIVE
    //////////////////////////////////////////////////////////////*/
    
    modifier whenThePropertyIsActive() {
        // Por defecto está activa después de registrarse
        _;
    }
    
    /*//////////////////////////////////////////////////////////////
                    TESTS - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the new IPFS hash is empty
    ///      └── it should update to empty hash and emit event
    function test_WhenTheNewIpfsHashIsEmpty_ShouldUpdateToEmptyHashAndEmitEvent() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        string memory emptyHash = "";
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyMetadataUpdated(address(propertyToken), emptyHash);
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), emptyHash);
        
        // Verificar que se actualizó
        (, , , , , , , , , , string memory ipfsHash, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(ipfsHash, emptyHash, "IPFS hash should be empty");
    }
    
    /// @dev when the new IPFS hash is the same as current
    ///      └── it should update anyway and emit event
    function test_WhenTheNewIpfsHashIsTheSameAsCurrent_ShouldUpdateAnywayAndEmitEvent() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        // Obtener el hash actual
        (, , , , , , , , , , string memory currentHash, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyMetadataUpdated(address(propertyToken), currentHash);
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), currentHash);
        
        // Verificar que sigue igual (idempotencia)
        (, , , , , , , , , , string memory ipfsHash, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(ipfsHash, currentHash, "IPFS hash should remain the same");
    }
    
    /// @dev when the new IPFS hash is different
    ///      └── it should update the IPFS hash
    function test_WhenTheNewIpfsHashIsDifferent_ShouldUpdateTheIpfsHash() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        string memory newHash = "QmNewHashDifferentFromOriginal123456";
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), newHash);
        
        // Verificar actualización
        (, , , , , , , , , , string memory ipfsHash, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(ipfsHash, newHash, "IPFS hash should be updated");
    }
    
    /// @dev when the new IPFS hash is different
    ///      └── it should emit PropertyMetadataUpdated event
    function test_WhenTheNewIpfsHashIsDifferent_ShouldEmitPropertyMetadataUpdatedEvent() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        string memory newHash = "QmNewHashForEventTest";
        
        vm.expectEmit(true, false, false, true, address(propertyRegistry));
        emit PropertyMetadataUpdated(address(propertyToken), newHash);
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), newHash);
    }
    
    /// @dev when the new IPFS hash is different
    ///      └── it should preserve all other property data
    function test_WhenTheNewIpfsHashIsDifferent_ShouldPreserveAllOtherPropertyData() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        string memory newHash = "QmNewHashPreserveDataTest";
        
        // Capturar algunos campos clave antes (en chunks para evitar stack too deep)
        address issuerBefore;
        string memory nameBefore;
        uint256 totalAreaBefore;
        uint256 unitsBefore;
        PropertyRegistry.PropertyStatus statusBefore;
        
        {
            (, address _issuer, string memory _name, , uint256 _totalArea, uint256 _units, , , , PropertyRegistry.PropertyStatus _status, , , , , , , , ) = propertyRegistry.properties(address(propertyToken));
            issuerBefore = _issuer;
            nameBefore = _name;
            totalAreaBefore = _totalArea;
            unitsBefore = _units;
            statusBefore = _status;
        }
        
        // Actualizar metadata
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), newHash);
        
        // Verificar preservación de campos clave
        (, address issuerAfter, string memory nameAfter, , uint256 totalAreaAfter, uint256 unitsAfter, , , , PropertyRegistry.PropertyStatus statusAfter, string memory ipfsHashAfter, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        
        assertEq(issuerAfter, issuerBefore, "Issuer should not change");
        assertEq(nameAfter, nameBefore, "Name should not change");
        assertEq(totalAreaAfter, totalAreaBefore, "Total area should not change");
        assertEq(unitsAfter, unitsBefore, "Units should not change");
        assertEq(uint256(statusAfter), uint256(statusBefore), "Status should not change");
        
        // Verificar que SÍ cambió el hash
        assertEq(ipfsHashAfter, newHash, "IPFS hash should be updated");
    }
    
    /// @dev when the new IPFS hash is different
    ///      └── it should work regardless of property status (Planning, InConstruction, Completed)
    function test_WhenTheNewIpfsHashIsDifferent_ShouldWorkForPropertyInPlanningStatus() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        // La propiedad ya está en Planning por defecto
        string memory newHash = "QmHashForPlanning";
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), newHash);
        
        (, , , , , , , , , , string memory ipfsHash, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(ipfsHash, newHash, "Should update metadata in Planning status");
    }
    
    function test_WhenTheNewIpfsHashIsDifferent_ShouldWorkForPropertyInInConstructionStatus() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        // Cambiar a InConstruction
        vm.prank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        
        string memory newHash = "QmHashForInConstruction";
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), newHash);
        
        (, , , , , , , , , , string memory ipfsHash, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(ipfsHash, newHash, "Should update metadata in InConstruction status");
    }
    
    function test_WhenTheNewIpfsHashIsDifferent_ShouldWorkForPropertyInCompletedStatus() 
        external 
        whenThePropertyExists
        whenTheCallerIsThePropertyIssuer
        whenTheContractIsNotPaused
        whenThePropertyIsActive 
    {
        // Transición correcta: Planning -> InConstruction -> Completed
        vm.startPrank(verifier);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.InConstruction);
        propertyRegistry.updatePropertyStatus(address(propertyToken), PropertyRegistry.PropertyStatus.Completed);
        vm.stopPrank();
        
        string memory newHash = "QmHashForCompleted";
        
        vm.prank(propertyIssuer);
        propertyRegistry.updateMetadata(address(propertyToken), newHash);
        
        (, , , , , , , , , , string memory ipfsHash, , , , , , , ) = propertyRegistry.properties(address(propertyToken));
        assertEq(ipfsHash, newHash, "Should update metadata in Completed status");
    }
}

