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

      // Check if sendTransaction is available
      if (!MiniKit.commandsAsync?.sendTransaction) {
        throw new Error('MiniKit sendTransaction is not available. Please update World App.');
      }

      // Calculate total cost in USDC (pricePerToken is in 6 decimals for USDC)
      const totalCost = (tokenAmount * pricePerToken) / BigInt(10 ** 18); // Convert from 18 decimals to raw amount

      console.log('🚀 Starting token purchase...');
      console.log('Buying tokens:', {
        propertyAddress,
        tokenAmount: tokenAmount.toString(),
        pricePerToken: pricePerToken.toString(),
        totalCost: totalCost.toString(),
        totalCostFormatted: Number(totalCost) / Math.pow(10, USDC_DECIMALS),
      });
      console.log('MiniKit info:', {
        isInstalled: MiniKit.isInstalled(),
        hasCommandsAsync: !!MiniKit.commandsAsync,
        hasSendTransaction: !!MiniKit.commandsAsync?.sendTransaction,
      });

      // Step 1: Approve USDC spending
      console.log('Step 1: Approving USDC...');
      console.log('Approve params:', {
        usdcAddress: USDC_ADDRESS,
        spender: CONTRACT_ADDRESSES.SALE_MANAGER,
        amount: totalCost.toString(),
      });
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

      console.log('Approve response:', approvePayload);

      if (approvePayload.status === 'error') {
        console.error('Approve error details:', {
          status: approvePayload.status,
          error_code: approvePayload.error_code,
          full_payload: approvePayload,
        });

        // Handle specific error codes
        if (approvePayload.error_code === 'disallowed_operation') {
          throw new Error(
            'Transaction not allowed. Please ensure:\n' +
            '1. You are using the latest version of World App\n' +
            '2. Your app has transaction permissions in Worldcoin Developer Portal\n' +
            '3. You are on the correct network (World Chain Sepolia)\n' +
            '4. The USDC contract address is correct for the network'
          );
        }

        throw new Error(`Failed to approve USDC: ${approvePayload.error_code || 'Unknown error'}`);
      }

      if (approvePayload.status !== 'success') {
        console.error('Approve not successful:', approvePayload);
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
