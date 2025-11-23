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
    console.log(`\n=== Processing result ${index} ===`);
    console.log('Result status:', result.status);
    console.log('Result error:', result.error);

    if (result.status === 'success' && result.result) {
      // Handle both array and object formats from Wagmi/Viem
      const resultData = result.result as any;

      console.log('usePropertiesWithSales - Raw result data type:', typeof resultData);
      console.log('usePropertiesWithSales - Is array?', Array.isArray(resultData));
      console.log('usePropertiesWithSales - Constructor:', resultData?.constructor?.name);
      console.log('usePropertiesWithSales - Keys:', resultData ? Object.keys(resultData) : 'no keys');
      console.log('usePropertiesWithSales - Full result:', JSON.stringify(resultData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));

      // Check if it's an array (tuple) or object format
      let property: Property;
      let sale: Sale;
      let saleIsActive: boolean;

      if (Array.isArray(resultData)) {
        // Tuple format: [property, sale, saleIsActive]
        console.log('usePropertiesWithSales - Processing as array, length:', resultData.length);
        [property, sale, saleIsActive] = resultData as [Property, Sale, boolean];
      } else {
        // Object format: {property, sale, saleIsActive} or {0, 1, 2}
        console.log('usePropertiesWithSales - Processing as object');
        console.log('usePropertiesWithSales - resultData.property type:', typeof resultData.property);
        console.log('usePropertiesWithSales - resultData[0] type:', typeof resultData[0]);
        property = resultData.property || resultData[0];
        sale = resultData.sale || resultData[1];
        saleIsActive = resultData.saleIsActive ?? resultData[2];
      }

      console.log('usePropertiesWithSales - Extracted property type:', typeof property);
      console.log('usePropertiesWithSales - Extracted property:', property);
      console.log('usePropertiesWithSales - Extracted sale type:', typeof sale);
      console.log('usePropertiesWithSales - Extracted sale:', sale);
      console.log('usePropertiesWithSales - saleIsActive:', saleIsActive);

      return {
        property,
        sale,
        saleIsActive,
      };
    }

    console.log('Result was not successful or had no result');
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
    // Handle both array and object formats from Wagmi/Viem
    const resultData = data as any;

    let property: Property;
    let sale: Sale;
    let saleIsActive: boolean;

    if (Array.isArray(resultData)) {
      // Tuple format: [property, sale, saleIsActive]
      [property, sale, saleIsActive] = resultData as [Property, Sale, boolean];
    } else {
      // Object format: {property, sale, saleIsActive} or {0, 1, 2}
      property = resultData.property || resultData[0];
      sale = resultData.sale || resultData[1];
      saleIsActive = resultData.saleIsActive ?? resultData[2];
    }

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
 * Note: This hook requires pricePerToken from the sale to calculate projection
 */
export function useInvestmentProjection(
  tokenAddress: Address | undefined,
  tokenAmount: bigint | undefined,
  pricePerToken: bigint | undefined
) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_REGISTRY as Address,
    abi: PROPERTY_REGISTRY_ABI,
    functionName: 'getInvestmentProjection',
    args: tokenAddress && tokenAmount && pricePerToken ? [tokenAddress, tokenAmount, pricePerToken] : undefined,
  });

  let projection: {
    investmentCost: bigint;
    ownershipPercentageBps: bigint;
    estimatedReturn: bigint;
    estimatedROIBps: bigint;
  } | undefined;

  if (data) {
    // Handle both array and object formats from Wagmi/Viem
    const resultData = data as any;

    if (Array.isArray(resultData)) {
      const [investmentCost, ownershipPercentageBps, estimatedReturn, estimatedROIBps] = resultData;
      projection = {
        investmentCost,
        ownershipPercentageBps,
        estimatedReturn,
        estimatedROIBps,
      };
    } else {
      projection = {
        investmentCost: resultData.investmentCost || resultData[0],
        ownershipPercentageBps: resultData.ownershipPercentageBps || resultData[1],
        estimatedReturn: resultData.estimatedReturn || resultData[2],
        estimatedROIBps: resultData.estimatedROIBps || resultData[3],
      };
    }
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
