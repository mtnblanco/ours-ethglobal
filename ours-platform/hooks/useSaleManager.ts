import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI, USDC_ABI } from '@/lib/contracts';
import { Address, parseUnits } from 'viem';

/**
 * Hook to check if a sale is active
 * NOTE: Not used - we use MiniKit for transactions
 */
export function useIsSaleActive(tokenAddress: Address | undefined) {
  // This function is not implemented as the ABI doesn't include isSaleActive
  // Sale status is checked via getPropertyAndSaleInfo instead
  return {
    isActive: undefined as boolean | undefined,
    isLoading: false,
    error: new Error('Not implemented - use getPropertyAndSaleInfo instead'),
  };
}

/**
 * Hook to calculate the cost of buying tokens
 * NOTE: Not used - we calculate cost manually in the component
 */
export function useCalculateCost(tokenAddress: Address | undefined, amount: bigint | undefined) {
  // This function is not implemented as the ABI doesn't include calculateCost
  // Cost is calculated manually: (tokenAmount * pricePerToken) / 10^18
  return {
    cost: undefined,
    isLoading: false,
    error: new Error('Not implemented - calculate cost manually'),
  };
}

/**
 * Hook to buy property fractions
 */
export function useBuyFractions() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const buyFractions = async (tokenAddress: Address, amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
      abi: SALE_MANAGER_ABI,
      functionName: 'buyFractions',
      args: [tokenAddress, amount],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    buyFractions,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to approve USDC spending
 */
export function useApproveUSDC() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const approve = async (amount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.USDC as Address,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.SALE_MANAGER as Address, amount],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook to check USDC allowance
 */
export function useUSDCAllowance(userAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC as Address,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, CONTRACT_ADDRESSES.SALE_MANAGER as Address] : undefined,
  });

  return {
    allowance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check USDC balance
 */
export function useUSDCBalance(userAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC as Address,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Utility to format USDC amount (6 decimals)
 */
export function formatUSDC(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2);
}

/**
 * Utility to parse USDC amount (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6);
}
