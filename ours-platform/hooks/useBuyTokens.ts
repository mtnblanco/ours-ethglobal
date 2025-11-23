import { useState, useCallback } from 'react';
import { Address, erc20Abi } from 'viem';
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI } from '@/lib/contracts';
import { MiniKit } from '@worldcoin/minikit-js';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address;
const USDC_DECIMALS = 6;

export interface BuyTokensParams {
  propertyAddress: Address;
  tokenAmount: bigint;
  pricePerToken: bigint;
}

export function useBuyTokens() {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  /**
   * Buy tokens using MiniKit sendTransaction
   */
  const buyTokens = useCallback(async ({ propertyAddress, tokenAmount, pricePerToken }: BuyTokensParams) => {
    try {
      setError(null);
      setIsPending(true);
      setIsConfirmed(false);

      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not installed. Please use World App.');
      }

      // Calculate total cost in USDC (pricePerToken is in 6 decimals for USDC)
      const totalCost = (tokenAmount * pricePerToken) / BigInt(10 ** 18); // Convert from 18 decimals to raw amount

      console.log('Buying tokens:', {
        propertyAddress,
        tokenAmount: tokenAmount.toString(),
        pricePerToken: pricePerToken.toString(),
        totalCost: totalCost.toString(),
        totalCostFormatted: Number(totalCost) / Math.pow(10, USDC_DECIMALS),
      });

      // Step 1: Approve USDC spending
      console.log('Step 1: Approving USDC...');
      setIsPending(true);

      const { finalPayload: approvePayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.SALE_MANAGER as Address, totalCost],
          },
        ],
      });

      if (approvePayload.status === 'error') {
        throw new Error(approvePayload.error_code || 'Failed to approve USDC');
      }

      if (approvePayload.status !== 'success') {
        throw new Error('USDC approval was not successful');
      }

      console.log('USDC approved, transaction:', approvePayload.transaction_id);

      // Step 2: Buy fractions
      console.log('Step 2: Buying fractions...');
      setIsPending(false);
      setIsConfirming(true);

      const { finalPayload: buyPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
            abi: SALE_MANAGER_ABI,
            functionName: 'buyFractions',
            args: [propertyAddress, tokenAmount],
          },
        ],
      });

      if (buyPayload.status === 'error') {
        throw new Error(buyPayload.error_code || 'Failed to buy tokens');
      }

      if (buyPayload.status !== 'success') {
        throw new Error('Token purchase was not successful');
      }

      console.log('Purchase successful, transaction:', buyPayload.transaction_id);

      setHash(buyPayload.transaction_id || null);
      setIsConfirming(false);
      setIsConfirmed(true);

      return {
        success: true,
        transactionId: buyPayload.transaction_id,
        hash: buyPayload.transaction_id,
      };
    } catch (err: any) {
      console.error('Error buying tokens:', err);
      const errorMessage = err.message || 'Failed to buy tokens';
      setError(errorMessage);
      setIsPending(false);
      setIsConfirming(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setIsPending(false);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);
    setHash(null);
  }, []);

  return {
    buyTokens,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    reset,
  };
}
