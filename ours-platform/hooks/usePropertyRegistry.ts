import { useReadContract, useReadContracts } from 'wagmi';
import {
  CONTRACT_ADDRESSES,
  PROPERTY_REGISTRY_ABI,
  SALE_MANAGER_ABI,
  Property,
  Sale,
  PropertyWithSale,
  PROPERTY_STATUS
} from '@/lib/contracts';
import { Address } from 'viem';

/**
 * Hook to fetch all properties from the blockchain
 */
export function useAllProperties() {
  // First, get all property token addresses
  const { data: propertyAddresses, isLoading: isLoadingAddresses, error: errorAddresses } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_REGISTRY as Address,
    abi: PROPERTY_REGISTRY_ABI,
    functionName: 'getAllProperties',
  });

  return {
    propertyAddresses: propertyAddresses as Address[] | undefined,
    isLoading: isLoadingAddresses,
    error: errorAddresses,
  };
}

/**
 * Hook to fetch detailed property and sale information for multiple properties
 */
export function usePropertiesWithSales(propertyAddresses: Address[] | undefined) {
  // Create contract calls for each property to get property + sale info
  const contracts = propertyAddresses?.map(address => ({
    address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
    abi: SALE_MANAGER_ABI,
    functionName: 'getPropertyAndSaleInfo',
    args: [address],
  })) || [];

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
  });

  // Transform the data into a more usable format
  const properties: PropertyWithSale[] | undefined = data?.map((result, index) => {
    if (result.status === 'success' && result.result) {
      const [property, sale, saleIsActive] = result.result as [Property, Sale, boolean];
      return {
        property,
        sale,
        saleIsActive,
      };
    }
    return null;
  }).filter((p): p is PropertyWithSale => p !== null);

  return {
    properties,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single property with sale information
 */
export function usePropertyWithSale(tokenAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
    abi: SALE_MANAGER_ABI,
    functionName: 'getPropertyAndSaleInfo',
    args: tokenAddress ? [tokenAddress] : undefined,
  });

  let propertyWithSale: PropertyWithSale | undefined;

  if (data) {
    const [property, sale, saleIsActive] = data as [Property, Sale, boolean];
    propertyWithSale = {
      property,
      sale,
      saleIsActive,
    };
  }

  return {
    property: propertyWithSale,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get construction progress for a property
 */
export function useConstructionProgress(tokenAddress: Address | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_REGISTRY as Address,
    abi: PROPERTY_REGISTRY_ABI,
    functionName: 'getConstructionProgress',
    args: tokenAddress ? [tokenAddress] : undefined,
  });

  return {
    progress: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get investment projection
 */
export function useInvestmentProjection(
  tokenAddress: Address | undefined,
  tokenAmount: bigint | undefined
) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
    abi: SALE_MANAGER_ABI,
    functionName: 'getInvestmentProjection',
    args: tokenAddress && tokenAmount ? [tokenAddress, tokenAmount] : undefined,
  });

  let projection: {
    investmentCost: bigint;
    ownershipPercentageBps: bigint;
    estimatedReturn: bigint;
    estimatedROIBps: bigint;
  } | undefined;

  if (data) {
    const [investmentCost, ownershipPercentageBps, estimatedReturn, estimatedROIBps] = data as [bigint, bigint, bigint, bigint];
    projection = {
      investmentCost,
      ownershipPercentageBps,
      estimatedReturn,
      estimatedROIBps,
    };
  }

  return {
    projection,
    isLoading,
    error,
  };
}

/**
 * Utility function to convert property status number to string
 */
export function getPropertyStatusText(status: number): string {
  return PROPERTY_STATUS[status as keyof typeof PROPERTY_STATUS] || 'Unknown';
}

/**
 * Utility function to format bigint values to human-readable format
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(2);
}

/**
 * Utility function to format basis points to percentage
 */
export function formatBasisPoints(bps: bigint): string {
  return (Number(bps) / 100).toFixed(2);
}
