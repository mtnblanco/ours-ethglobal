// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { ChainlinkKYCIssuer } from "../../contracts/ChainlinkKYCIssuer.sol";
import { SaleManager } from "../../contracts/SaleManager.sol";
import { IIdentity } from "@onchain-id/solidity/contracts/interface/IIdentity.sol";

/**
 * @title KYCFlowTest
 * @notice Test de integración completa del flujo KYC con ERC-3643
 * @dev Verifica que todo el sistema funcione end-to-end:
 *      1. Usuario solicita KYC con World ID
 *      2. Chainlink aprueba KYC
 *      3. Se crea OnchainID automáticamente
 *      4. Se registra en IdentityRegistry
 *      5. Usuario puede invertir (buyFractions)
 */
contract KYCFlowTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                             TEST SETUP
    //////////////////////////////////////////////////////////////*/
    
    address testUser;
    
    function setUp() public virtual override {
        super.setUp();
        testUser = makeAddr("testUser");
        
        // Dar USDC al test user
        stablecoin.mint(testUser, 1_000_000e6); // 1M USDC
    }
    
    /*//////////////////////////////////////////////////////////////
                      INTEGRATION TESTS - FULL FLOW
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @dev Test del flujo completo:
     *      given un usuario nuevo sin KYC
     *      when solicita KYC y es aprobado
     *      then puede invertir en propiedades
     */
    function test_FullKYCFlow_FromRequestToInvestment() external {
        // ========== ARRANGE ==========
        
        // 1. Registrar propiedad y crear sale (setup estándar)
        vm.prank(propertyIssuer);
        propertyRegistry.registerProperty(_createValidPropertyParams());
        
        vm.prank(propertyIssuer);
        saleManager.createSale(address(propertyToken), 1); // 1 wei per token
        
        // 2. Verificar que usuario NO tiene KYC inicialmente
        assertFalse(kycIssuer.isKYCVerified(testUser), "User should NOT have KYC initially");
        
        // 3. Verificar que usuario NO está registrado en IdentityRegistry
        IIdentity userIdentity = identityRegistry.identity(testUser);
        assertEq(address(userIdentity), address(0), "User should NOT be in IdentityRegistry");
        
        // ========== ACT ==========
        
        // PASO 1: Usuario solicita KYC con World ID (simulado)
        vm.prank(admin); // admin simula el request para testing
        kycIssuer.mockRequestKYCForTesting(testUser);
        
        // Verificar estado intermedio
        ChainlinkKYCIssuer.KYCData memory dataAfterRequest = kycIssuer.getKYCData(testUser);
        assertEq(
            uint256(dataAfterRequest.status), 
            uint256(ChainlinkKYCIssuer.KYCStatus.WORLD_ID_VERIFIED),
            "Status should be WORLD_ID_VERIFIED"
        );
        assertFalse(kycIssuer.isKYCVerified(testUser), "User should NOT be verified yet");
        
        // PASO 2: Chainlink DON aprueba KYC
        vm.prank(admin); // admin tiene CHAINLINK_DON_ROLE
        kycIssuer.fulfillKYC(
            testUser,
            true, // approved
            keccak256(abi.encodePacked("kyc_data_", testUser))
        );
        
        // ========== ASSERT ==========
        
        // 4. Verificar que usuario AHORA tiene KYC aprobado
        assertTrue(kycIssuer.isKYCVerified(testUser), "User should have KYC after approval");
        
        // 5. Verificar estado completo del KYC
        ChainlinkKYCIssuer.KYCData memory dataAfterApproval = kycIssuer.getKYCData(testUser);
        assertEq(
            uint256(dataAfterApproval.status), 
            uint256(ChainlinkKYCIssuer.KYCStatus.FULL_KYC),
            "Status should be FULL_KYC"
        );
        assertGt(dataAfterApproval.approvedAt, 0, "approvedAt should be set");
        assertEq(
            dataAfterApproval.kycDataHash, 
            keccak256(abi.encodePacked("kyc_data_", testUser)),
            "kycDataHash should match"
        );
        
        // 6. Verificar que OnchainID fue creado
        assertNotEq(
            dataAfterApproval.onchainIDAddress, 
            address(0), 
            "OnchainID should be created"
        );
        
        // 7. Verificar que usuario está registrado en IdentityRegistry
        IIdentity userIdentityAfter = identityRegistry.identity(testUser);
        assertEq(
            address(userIdentityAfter), 
            dataAfterApproval.onchainIDAddress,
            "User should be registered in IdentityRegistry with correct OnchainID"
        );
        
        // 8. Verificar que el management key del OnchainID es el usuario
        // Esto asegura que el usuario controla su propia identidad
        bytes32 userKeyHash = keccak256(abi.encode(testUser));
        assertTrue(
            userIdentityAfter.keyHasPurpose(userKeyHash, 1),
            "User should have management key in their OnchainID"
        );
        
        // 9. PRUEBA FINAL: Usuario puede invertir
        uint256 purchaseAmount = 1000; // 1000 wei de tokens
        uint256 totalCost = purchaseAmount * 1; // pricePerToken = 1
        
        // Aprobar USDC
        vm.prank(testUser);
        stablecoin.approve(address(saleManager), totalCost);
        
        // Comprar tokens (esto debe funcionar porque tiene KYC)
        vm.prank(testUser);
        saleManager.buyFractions(address(propertyToken), purchaseAmount);
        
        // Verificar que recibió los tokens
        assertEq(
            propertyToken.balanceOf(testUser), 
            purchaseAmount,
            "User should receive property tokens after KYC"
        );
    }
    
    /**
     * @dev Test que verifica que usuario sin KYC NO puede invertir
     */
    function test_UserWithoutKYC_CannotInvest() external {
        // Setup: propiedad y sale
        vm.prank(propertyIssuer);
        propertyRegistry.registerProperty(_createValidPropertyParams());
        
        vm.prank(propertyIssuer);
        saleManager.createSale(address(propertyToken), 1);
        
        // Usuario nuevo SIN KYC
        address userWithoutKYC = makeAddr("userWithoutKYC");
        stablecoin.mint(userWithoutKYC, 1_000_000e6);
        
        // Verificar que NO tiene KYC
        assertFalse(kycIssuer.isKYCVerified(userWithoutKYC), "User should NOT have KYC");
        
        // Intentar comprar (debe fallar)
        uint256 purchaseAmount = 1000;
        uint256 totalCost = purchaseAmount * 1;
        
        vm.prank(userWithoutKYC);
        stablecoin.approve(address(saleManager), totalCost);
        
        vm.prank(userWithoutKYC);
        vm.expectRevert(SaleManager.KYCNotVerified.selector);
        saleManager.buyFractions(address(propertyToken), purchaseAmount);
    }
    
    /**
     * @dev Test que verifica que un usuario puede ser rechazado
     */
    function test_RejectedKYC_CannotInvest() external {
        // Solicitar KYC
        vm.prank(admin);
        kycIssuer.mockRequestKYCForTesting(testUser);
        
        // Rechazar KYC
        vm.prank(admin);
        kycIssuer.fulfillKYC(
            testUser,
            false, // RECHAZADO
            keccak256(abi.encodePacked("kyc_rejection_reason"))
        );
        
        // Verificar estado REJECTED
        ChainlinkKYCIssuer.KYCData memory data = kycIssuer.getKYCData(testUser);
        assertEq(
            uint256(data.status), 
            uint256(ChainlinkKYCIssuer.KYCStatus.REJECTED),
            "Status should be REJECTED"
        );
        
        // Verificar que NO está verificado
        assertFalse(kycIssuer.isKYCVerified(testUser), "Rejected user should NOT be verified");
        
        // Verificar que NO está registrado en IdentityRegistry
        IIdentity userIdentity = identityRegistry.identity(testUser);
        assertEq(address(userIdentity), address(0), "Rejected user should NOT be in IdentityRegistry");
    }
    
    /**
     * @dev Test que verifica que usuario con KYC completo NO puede solicitarlo de nuevo
     */
    function test_UserWithFullKYC_CannotRequestAgain() external {
        // Primera aprobación de KYC
        vm.prank(admin);
        kycIssuer.mockRequestKYCForTesting(testUser);
        
        vm.prank(admin);
        kycIssuer.fulfillKYC(testUser, true, keccak256("data1"));
        
        // Verificar que tiene KYC completo
        assertTrue(kycIssuer.isKYCVerified(testUser), "User should have FULL_KYC");
        
        // Intentar solicitar KYC de nuevo (debe fallar)
        vm.prank(admin);
        vm.expectRevert(ChainlinkKYCIssuer.KYCAlreadyCompleted.selector);
        kycIssuer.mockRequestKYCForTesting(testUser);
    }
    
    /**
     * @dev Test que verifica el contador totalKYCsApproved
     */
    function test_TotalKYCsApproved_IsIncremented() external {
        uint256 initialCount = kycIssuer.totalKYCsApproved();
        
        // Aprobar KYC para testUser
        vm.prank(admin);
        kycIssuer.mockRequestKYCForTesting(testUser);
        vm.prank(admin);
        kycIssuer.fulfillKYC(testUser, true, keccak256("data1"));
        
        assertEq(
            kycIssuer.totalKYCsApproved(),
            initialCount + 1,
            "totalKYCsApproved should increment"
        );
        
        // Aprobar KYC para otro usuario
        address user2 = makeAddr("user2");
        vm.prank(admin);
        kycIssuer.mockRequestKYCForTesting(user2);
        vm.prank(admin);
        kycIssuer.fulfillKYC(user2, true, keccak256("data2"));
        
        assertEq(
            kycIssuer.totalKYCsApproved(),
            initialCount + 2,
            "totalKYCsApproved should increment again"
        );
    }
}

