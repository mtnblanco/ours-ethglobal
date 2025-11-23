import { useReadContracts, useAccount } from 'wagmi';
import { Address, erc20Abi } from 'viem';
import { useAllProperties, usePropertiesWithSales } from './usePropertyRegistry';

export interface UserHolding {
  propertyAddress: Address;
  propertyName: string;
  location: string;
  tokenBalance: bigint;
  tokenPrice: bigint;
  totalValue: bigint;
  totalInvestmentTarget: bigint;
  totalRaised: bigint;
  estimatedSalePrice: bigint;
  ipfsHash: string;
}

/**
 * Hook to get all user token holdings across all properties
 */
export function useUserHoldings() {
  const { address: userAddress } = useAccount();
  const { propertyAddresses, isLoading: isLoadingAddresses } = useAllProperties();
  const { properties: allProperties, isLoading: isLoadingProperties } = usePropertiesWithSales(propertyAddresses);

  // Create balance check contracts for all property tokens
  const balanceContracts = propertyAddresses?.map((propertyAddress) => ({
    address: propertyAddress as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  })) || [];

  const { data: balances, isLoading: isLoadingBalances } = useReadContracts({
    contracts: balanceContracts,
  });

  // Combine property data with user balances
  const holdings: UserHolding[] = [];

  if (allProperties && balances && userAddress) {
    allProperties.forEach((propWithSale, index) => {
      const balanceResult = balances[index];

      if (balanceResult.status === 'success' && balanceResult.result) {
        const balance = balanceResult.result as bigint;

        // Only include if user has tokens
        if (balance > BigInt(0)) {
          holdings.push({
            propertyAddress: propWithSale.property.token as Address,
            propertyName: propWithSale.property.name,
            location: propWithSale.property.location,
            tokenBalance: balance,
            tokenPrice: propWithSale.sale.pricePerToken,
            totalValue: balance * propWithSale.sale.pricePerToken,
            totalInvestmentTarget: propWithSale.property.totalInvestmentTarget,
            totalRaised: propWithSale.sale.totalRaised,
            estimatedSalePrice: propWithSale.property.estimatedSalePrice,
            ipfsHash: propWithSale.property.ipfsHash,
          });
        }
      }
    });
  }

  return {
    holdings,
    isLoading: isLoadingAddresses || isLoadingProperties || isLoadingBalances,
    userAddress,
  };
}

/**
 * Hook to get user's USDC balance
 */
export function useUSDCBalance() {
  const { address: userAddress } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: process.env.NEXT_PUBLIC_USDC_ADDRESS as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
      },
      {
        address: process.env.NEXT_PUBLIC_USDC_ADDRESS as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
  });

  let balance: bigint = BigInt(0);
  let decimals: number = 6; // USDC default

  if (data && data[0]?.status === 'success' && data[0]?.result) {
    balance = data[0].result as bigint;
  }

  if (data && data[1]?.status === 'success' && data[1]?.result) {
    decimals = data[1].result as number;
  }

  return {
    balance,
    decimals,
    formatted: (Number(balance) / Math.pow(10, decimals)).toFixed(2),
    isLoading,
  };
}
