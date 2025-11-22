// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { BaseTest } from "../Base.t.sol";
import { SaleManager } from "../../contracts/SaleManager.sol";
import { PropertyRegistry } from "../../contracts/PropertyRegistry.sol";

/**
 * @title BuyFractionsTest
 * @notice Tests para SaleManager.buyFractions siguiendo BTT (Branching Tree Technique)
 * @dev Testea exhaustivamente la función más crítica del negocio: compra de tokens
 */
contract BuyFractionsTest is BaseTest {
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event TokensPurchased(
        address indexed buyer,
        address indexed token,
        uint256 amount,
        uint256 totalCost,
        uint256 platformFee
    );
    
    /*//////////////////////////////////////////////////////////////
                            TEST CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    // El contrato hace: totalCost = pricePerToken * amount (sin división)
    // Si amount = 1e18 (1 token) y queremos que cueste 1 USDC (1e6):
    // pricePerToken debe ser 1 (entonces 1 * 1e18 = 1e18 wei, interpretado como USDC)
    // Pero USDC tiene 6 decimals, así que necesitamos ajustar las cantidades
    uint256 constant PRICE_PER_TOKEN = 1; // Precio mínimo
    uint256 constant PURCHASE_AMOUNT = 1000; // 1000 wei de tokens (cantidad pequeña para testing)
    uint256 constant PLATFORM_FEE_BPS = 500; // 5%
    
    /// @dev Helper para calcular el costo total como lo hace el contrato
    function _calculateTotalCost(uint256 amount) internal pure returns (uint256) {
        return PRICE_PER_TOKEN * amount;
    }
    
    /*//////////////////////////////////////////////////////////////
                            TEST SETUP
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Configura una propiedad registrada y sale activa antes de cada test
    function setUp() public virtual override {
        super.setUp();
        
        // 1. Registrar propiedad
        vm.prank(propertyIssuer);
        PropertyRegistry.PropertyParams memory params = _createValidPropertyParams();
        propertyRegistry.registerProperty(params);
        
        // 2. Crear venta activa
        _createActiveSale(address(propertyToken), PRICE_PER_TOKEN);
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTS - REVERT CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the contract is paused
    ///      └── it should revert with EnforcedPause
    function test_RevertWhen_TheContractIsPaused() external {
        // Pausar el contrato
        vm.prank(admin);
        saleManager.pause();
        
        // Preparar compra
        _approveStablecoin(investor1, PURCHASE_AMOUNT * PRICE_PER_TOKEN / 1e18);
        
        vm.prank(investor1);
        vm.expectRevert("Pausable: paused");
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
    }
    
    /// @dev when the sale does not exist
    ///      └── it should revert with SaleDoesNotExist
    function test_RevertWhen_TheSaleDoesNotExist() external {
        address nonExistentToken = makeAddr("nonExistentToken");
        
        vm.prank(investor1);
        vm.expectRevert(SaleManager.SaleDoesNotExist.selector);
        saleManager.buyFractions(nonExistentToken, PURCHASE_AMOUNT);
    }
    
    /// @dev when the sale exists but is not active
    ///      └── it should revert with SaleNotActive
    function test_RevertWhen_TheSaleExistsButIsNotActive() external {
        // Desactivar la venta
        vm.prank(propertyIssuer);
        saleManager.setSaleActive(address(propertyToken), false);
        
        vm.prank(investor1);
        vm.expectRevert(SaleManager.SaleNotActive.selector);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
    }
    
    /*//////////////////////////////////////////////////////////////
                MODIFIER: SALE IS ACTIVE
    //////////////////////////////////////////////////////////////*/
    
    modifier whenTheSaleIsActive() {
        // Sale ya está activa del setUp
        _;
    }
    
    /// @dev when the buyer does not have KYC verified
    ///      └── it should revert with KYCNotVerified
    function test_RevertWhen_TheBuyerDoesNotHaveKycVerified() external whenTheSaleIsActive {
        // investor1 NO tiene KYC aprobado (setUp ya no aprueba por defecto)
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        _approveStablecoin(investor1, totalCost);
        
        vm.prank(investor1);
        vm.expectRevert(SaleManager.KYCNotVerified.selector);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
    }
    
    /*//////////////////////////////////////////////////////////////
                MODIFIER: BUYER HAS KYC
    //////////////////////////////////////////////////////////////*/
    
    modifier whenTheBuyerHasKycVerified() {
        // Aprobar KYC para investor1 (usado en la mayoría de tests)
        _approveKYC(investor1);
        _;
    }
    
    /// @dev when the amount is zero
    ///      └── it should revert with InvalidAmount
    function test_RevertWhen_TheAmountIsZero() external whenTheSaleIsActive whenTheBuyerHasKycVerified {
        vm.prank(investor1);
        vm.expectRevert(SaleManager.InvalidAmount.selector);
        saleManager.buyFractions(address(propertyToken), 0);
    }
    
    /// @dev when the buyer has insufficient USDC balance
    ///      └── it should revert with InsufficientBalance
    function test_RevertWhen_TheBuyerHasInsufficientUsdcBalance() external whenTheSaleIsActive whenTheBuyerHasKycVerified {
        // Crear comprador sin balance
        address poorInvestor = makeAddr("poorInvestor");
        _approveKYC(poorInvestor); // Pero con KYC
        
        vm.prank(poorInvestor);
        vm.expectRevert(SaleManager.InsufficientBalance.selector);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
    }
    
    /// @dev when the buyer has sufficient balance but insufficient approval
    ///      └── it should revert with ERC20InsufficientAllowance
    function test_RevertWhen_TheBuyerHasSufficientBalanceButInsufficientApproval() external whenTheSaleIsActive whenTheBuyerHasKycVerified {
        // investor1 tiene balance pero no approval
        vm.prank(investor1);
        vm.expectRevert(); // ERC20: insufficient allowance
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
    }
    
    /*//////////////////////////////////////////////////////////////
        MODIFIER: BUYER HAS BALANCE AND APPROVAL
    //////////////////////////////////////////////////////////////*/
    
    modifier whenTheBuyerHasSufficientBalanceAndApproval() {
        // Aprobar KYC para todos los inversores (necesario para buyFractions)
        _approveKYC(investor1);
        _approveKYC(investor2);
        _approveKYC(investor3);
        _;
    }
    
    /*//////////////////////////////////////////////////////////////
                    TESTS - SUCCESS CASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when the buyer has sufficient balance and approval
    ///      └── it should transfer USDC from buyer to contract
    function test_WhenTheBuyerHasBalanceAndApproval_ShouldTransferUsdcFromBuyerToContract() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Capturar balances antes
        uint256 buyerBalanceBefore = stablecoin.balanceOf(investor1);
        uint256 contractBalanceBefore = stablecoin.balanceOf(address(saleManager));
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar transferencia
        uint256 buyerBalanceAfter = stablecoin.balanceOf(investor1);
        uint256 contractBalanceAfter = stablecoin.balanceOf(address(saleManager));
        
        assertEq(buyerBalanceAfter, buyerBalanceBefore - totalCost, "Buyer USDC should decrease by totalCost");
        assertEq(contractBalanceAfter, contractBalanceBefore + totalCost, "Contract USDC should increase by totalCost");
    }
    
    /// @dev when the buyer has sufficient balance and approval
    ///      └── it should mint property tokens to buyer
    function test_WhenTheBuyerHasBalanceAndApproval_ShouldMintPropertyTokensToBuyer() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Capturar balance de tokens antes
        uint256 tokenBalanceBefore = propertyToken.balanceOf(investor1);
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar minteo
        uint256 tokenBalanceAfter = propertyToken.balanceOf(investor1);
        
        assertEq(tokenBalanceAfter, tokenBalanceBefore + PURCHASE_AMOUNT, "Buyer should receive tokens");
    }
    
    /// @dev when the buyer has sufficient balance and approval
    ///      └── it should update totalRaised correctly
    function test_WhenTheBuyerHasBalanceAndApproval_ShouldUpdateTotalRaisedCorrectly() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar totalRaised
        SaleManager.Sale memory sale = saleManager.getSale(address(propertyToken));
        assertEq(sale.totalRaised, totalCost, "totalRaised should equal totalCost");
    }
    
    /// @dev when the buyer has sufficient balance and approval
    ///      └── it should update withdrawableBalance for issuer
    function test_WhenTheBuyerHasBalanceAndApproval_ShouldUpdateWithdrawableBalanceForIssuer() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        uint256 platformFee = (totalCost * PLATFORM_FEE_BPS) / 10000;
        uint256 issuerAmount = totalCost - platformFee;
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar withdrawableBalance
        SaleManager.Sale memory sale = saleManager.getSale(address(propertyToken));
        assertEq(sale.withdrawableBalance, issuerAmount, "withdrawableBalance should be totalCost minus platform fee");
    }
    
    /// @dev when the buyer has sufficient balance and approval
    ///      └── it should accumulate platform fees
    function test_WhenTheBuyerHasBalanceAndApproval_ShouldAccumulatePlatformFees() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        uint256 platformFee = (totalCost * PLATFORM_FEE_BPS) / 10000;
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Capturar fees antes
        uint256 feesBefore = saleManager.accumulatedPlatformFees();
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar acumulación de fees
        uint256 feesAfter = saleManager.accumulatedPlatformFees();
        assertEq(feesAfter, feesBefore + platformFee, "Platform fees should accumulate");
    }
    
    /// @dev when the buyer has sufficient balance and approval
    ///      └── it should emit TokensPurchased event
    function test_WhenTheBuyerHasBalanceAndApproval_ShouldEmitTokensPurchasedEvent() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        uint256 platformFee = (totalCost * PLATFORM_FEE_BPS) / 10000;
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Expect event
        vm.expectEmit(true, true, false, true, address(saleManager));
        emit TokensPurchased(
            investor1,
            address(propertyToken),
            PURCHASE_AMOUNT,
            totalCost,
            platformFee
        );
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
    }
    
    /*//////////////////////////////////////////////////////////////
                TESTS - MULTIPLE PURCHASES
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when making multiple purchases
    ///      └── it should accumulate totalRaised across purchases
    function test_WhenMakingMultiplePurchases_ShouldAccumulateTotalRaisedAcrossPurchases() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        
        // Primera compra
        _approveStablecoin(investor1, totalCost);
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Segunda compra
        _approveStablecoin(investor1, totalCost);
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar acumulación
        SaleManager.Sale memory sale = saleManager.getSale(address(propertyToken));
        assertEq(sale.totalRaised, totalCost * 2, "totalRaised should accumulate across purchases");
    }
    
    /// @dev when making multiple purchases
    ///      └── it should accumulate platform fees across purchases
    function test_WhenMakingMultiplePurchases_ShouldAccumulatePlatformFeesAcrossPurchases() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        uint256 platformFee = (totalCost * PLATFORM_FEE_BPS) / 10000;
        
        // Primera compra
        _approveStablecoin(investor1, totalCost);
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Segunda compra
        _approveStablecoin(investor1, totalCost);
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar acumulación de fees
        uint256 accumulatedFees = saleManager.accumulatedPlatformFees();
        assertEq(accumulatedFees, platformFee * 2, "Platform fees should accumulate across purchases");
    }
    
    /// @dev when making multiple purchases
    ///      └── it should allow multiple buyers
    function test_WhenMakingMultiplePurchases_ShouldAllowMultipleBuyers() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        
        // Investor1 compra
        _approveStablecoin(investor1, totalCost);
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Investor2 compra
        _approveStablecoin(investor2, totalCost);
        vm.prank(investor2);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Investor3 compra
        _approveStablecoin(investor3, totalCost);
        vm.prank(investor3);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar que todos recibieron tokens
        assertEq(propertyToken.balanceOf(investor1), PURCHASE_AMOUNT, "Investor1 should have tokens");
        assertEq(propertyToken.balanceOf(investor2), PURCHASE_AMOUNT, "Investor2 should have tokens");
        assertEq(propertyToken.balanceOf(investor3), PURCHASE_AMOUNT, "Investor3 should have tokens");
        
        // Verificar totalRaised
        SaleManager.Sale memory sale = saleManager.getSale(address(propertyToken));
        assertEq(sale.totalRaised, totalCost * 3, "totalRaised should reflect all purchases");
    }
    
    /*//////////////////////////////////////////////////////////////
                    TESTS - FEE CALCULATIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev when calculating fees
    ///      └── it should calculate platform fee correctly (5%)
    function test_WhenCalculatingFees_ShouldCalculatePlatformFeeCorrectly() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        uint256 expectedPlatformFee = (totalCost * PLATFORM_FEE_BPS) / 10000; // 5%
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar fee
        uint256 accumulatedFees = saleManager.accumulatedPlatformFees();
        assertEq(accumulatedFees, expectedPlatformFee, "Platform fee should be 5% of totalCost");
        
        // Verificar que el 5% está bien calculado
        assertEq(accumulatedFees, totalCost * 5 / 100, "Platform fee should be exactly 5%");
    }
    
    /// @dev when calculating fees
    ///      └── it should split payment between issuer and platform correctly
    function test_WhenCalculatingFees_ShouldSplitPaymentBetweenIssuerAndPlatformCorrectly() 
        external 
        whenTheSaleIsActive
        whenTheBuyerHasSufficientBalanceAndApproval 
    {
        uint256 totalCost = _calculateTotalCost(PURCHASE_AMOUNT);
        uint256 platformFee = (totalCost * PLATFORM_FEE_BPS) / 10000;
        uint256 issuerAmount = totalCost - platformFee;
        
        // Aprobar USDC
        _approveStablecoin(investor1, totalCost);
        
        // Comprar
        vm.prank(investor1);
        saleManager.buyFractions(address(propertyToken), PURCHASE_AMOUNT);
        
        // Verificar split correcto
        SaleManager.Sale memory sale = saleManager.getSale(address(propertyToken));
        uint256 accumulatedFees = saleManager.accumulatedPlatformFees();
        
        assertEq(sale.withdrawableBalance, issuerAmount, "Issuer should get totalCost - platformFee");
        assertEq(accumulatedFees, platformFee, "Platform should get platformFee");
        assertEq(sale.withdrawableBalance + accumulatedFees, totalCost, "Split should equal totalCost");
    }
}

