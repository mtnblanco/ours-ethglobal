import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI } from '@/lib/contracts';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js';

const USDC_DECIMALS = 6;

export interface BuyTokensParams {
  propertyAddress: Address;
  tokenAmount: bigint;
  pricePerToken: bigint;
}

export function useBuyTokens() {
  const { address: userAddress } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Buy tokens using MiniKit payment
   */
  const buyTokens = useCallback(async ({ propertyAddress, tokenAmount, pricePerToken }: BuyTokensParams) => {
    try {
      setError(null);

      if (!userAddress) {
        throw new Error('Please connect your wallet');
      }

      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not installed. Please use World App.');
      }

      // Calculate total cost in USDC
      const totalCost = (tokenAmount * pricePerToken) / BigInt(10 ** 18); // pricePerToken is in 18 decimals
      const totalCostInUSDC = Number(totalCost) / Math.pow(10, USDC_DECIMALS);

      console.log('Buy tokens:', {
        propertyAddress,
        tokenAmount: tokenAmount.toString(),
        pricePerToken: pricePerToken.toString(),
        totalCost: totalCost.toString(),
        totalCostInUSDC,
      });

      // Create MiniKit payment payload
      const paymentPayload: PayCommandInput = {
        reference: `buy-property-tokens-${propertyAddress}-${Date.now()}`,
        to: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
        tokens: [
          {
            symbol: Tokens.USDC,
            token_amount: tokenToDecimals(totalCostInUSDC, Tokens.USDC).toString(),
          },
        ],
        description: `Purchase ${tokenAmount.toString()} property tokens`,
      };

      console.log('MiniKit payment payload:', paymentPayload);

      // Send payment via MiniKit
      const { finalPayload } = await MiniKit.commandsAsync.pay(paymentPayload);

      if (finalPayload.status === 'error') {
        throw new Error(finalPayload.error_code || 'Payment failed');
      }

      if (finalPayload.status !== 'success') {
        throw new Error('Payment was not successful');
      }

      console.log('Payment successful, transaction hash:', finalPayload.transaction_id);

      // After payment, call the contract to buy fractions
      writeContract({
        address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
        abi: SALE_MANAGER_ABI,
        functionName: 'buyFractions',
        args: [propertyAddress, tokenAmount],
      });

      return { success: true, transactionId: finalPayload.transaction_id };
    } catch (err: any) {
      console.error('Error buying tokens:', err);
      const errorMessage = err.message || 'Failed to buy tokens';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [userAddress, writeContract]);

  /**
   * Buy tokens with traditional approval flow (fallback)
   */
  const buyTokensWithApproval = useCallback(async ({ propertyAddress, tokenAmount }: BuyTokensParams) => {
    try {
      setError(null);
      setIsApproving(true);

      if (!userAddress) {
        throw new Error('Please connect your wallet');
      }

      // Call buyFractions directly (assumes user has already approved USDC)
      writeContract({
        address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
        abi: SALE_MANAGER_ABI,
        functionName: 'buyFractions',
        args: [propertyAddress, tokenAmount],
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error buying tokens:', err);
      const errorMessage = err.message || 'Failed to buy tokens';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsApproving(false);
    }
  }, [userAddress, writeContract]);

  return {
    buyTokens,
    buyTokensWithApproval,
    isApproving,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
    isError: isWriteError,
    error: error || writeError?.message,
    hash,
  };
}
