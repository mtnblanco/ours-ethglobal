'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { useWorldID } from './useWorldID';
import {
  CONTRACT_ADDRESSES,
  PROPERTY_REGISTRY_ABI,
  SALE_MANAGER_ABI,
  NETWORK_CONFIG
} from '@/lib/contracts';

// Types for blockchain data
interface Property {
  token: string;
  issuer: string;
  name: string;
  location: string;
  totalArea: bigint;
  units: bigint;
  constructionStart: bigint;
  estimatedCompletion: bigint;
  actualCompletion: bigint;
  status: number;
  ipfsHash: string;
  cadastralNumber: string;
  legalOwner: string;
  registeredAt: bigint;
  isActive: boolean;
  totalTokenSupply: bigint;
  totalInvestmentTarget: bigint;
  estimatedSalePrice: bigint;
}

interface Sale {
  token: string;
  issuer: string;
  pricePerToken: bigint;
  isActive: boolean;
  totalRaised: bigint;
  withdrawableBalance: bigint;
}

interface PropertyWithSale {
  property: Property;
  sale: Sale;
  saleIsActive: boolean;
}

// Create viem public client for reading from blockchain
const publicClient = createPublicClient({
  transport: http(NETWORK_CONFIG.rpcUrl),
});

// Web3 hook using World ID
export function useWeb3() {
  const worldID = useWorldID();

  return {
    account: worldID.user?.address || null,
    isConnected: worldID.isConnected && worldID.isVerified,
    isConnecting: worldID.isLoading,
    error: worldID.error,
    connectWallet: worldID.verifyWorldID,
  };
}

// Property marketplace hook - NOW WITH REAL BLOCKCHAIN DATA
export function usePropertyMarketplace() {
  const { isConnected } = useWeb3();
  const worldID = useWorldID();
  const [properties, setProperties] = useState<PropertyWithSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all active sales from the SaleManager contract
   */
  const fetchActiveSales = async (): Promise<string[]> => {
    try {
      console.log('📡 Fetching active sales from SaleManager...');
      console.log('📍 SaleManager address:', CONTRACT_ADDRESSES.SALE_MANAGER);

      const activeSales = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.SALE_MANAGER as `0x${string}`,
        abi: SALE_MANAGER_ABI,
        functionName: 'getActiveSales',
      }) as string[];

      console.log(`✅ Found ${activeSales.length} active sales`);
      return activeSales;
    } catch (err) {
      console.error('❌ Error fetching active sales:', err);
      throw err;
    }
  };

  /**
   * Fetch property and sale information for a specific token
   */
  const fetchPropertyAndSaleInfo = async (tokenAddress: string): Promise<PropertyWithSale> => {
    try {
      console.log(`📋 Fetching info for property: ${tokenAddress}`);

      // Call getPropertyAndSaleInfo from SaleManager
      // This returns: (Property property, Sale sale, bool saleIsActive)
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.SALE_MANAGER as `0x${string}`,
        abi: SALE_MANAGER_ABI,
        functionName: 'getPropertyAndSaleInfo',
        args: [tokenAddress as `0x${string}`],
      }) as [Property, Sale, boolean];

      const [property, sale, saleIsActive] = result;

      console.log(`✅ Property: ${property.name}`);
      console.log(`   Location: ${property.location}`);
      console.log(`   Price: ${formatUSDC(sale.pricePerToken)} USDC per token`);
      console.log(`   Raised: ${formatUSDC(sale.totalRaised)} USDC`);

      return {
        property,
        sale,
        saleIsActive,
      };
    } catch (err) {
      console.error(`❌ Error fetching property ${tokenAddress}:`, err);
      throw err;
    }
  };

  /**
   * Main function to fetch all properties from blockchain
   */
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting to fetch properties from World Chain Sepolia...');
      console.log('🌐 RPC URL:', NETWORK_CONFIG.rpcUrl);
      console.log('📍 Contract addresses:', CONTRACT_ADDRESSES);

      // Step 1: Get all active sales
      const activeSaleTokens = await fetchActiveSales();

      if (activeSaleTokens.length === 0) {
        console.log('⚠️  No active sales found');
        setProperties([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch detailed info for each property
      console.log(`📊 Fetching details for ${activeSaleTokens.length} properties...`);

      const propertiesData = await Promise.all(
        activeSaleTokens.map(tokenAddress => fetchPropertyAndSaleInfo(tokenAddress))
      );

      console.log(`✅ Successfully loaded ${propertiesData.length} properties from blockchain`);
      setProperties(propertiesData);
      setLoading(false);

    } catch (err) {
      console.error('❌ Failed to fetch properties from blockchain:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch properties from blockchain');
      setLoading(false);

      // Don't set empty array on error, keep previous data if available
    }
  };

  const purchaseTokens = async (tokenAddress: string, amount: number) => {
    if (!isConnected) {
      throw new Error('Please verify with World ID first');
    }

    try {
      console.log(`🛒 Purchasing ${amount} tokens of ${tokenAddress}`);

      // TODO: Implement real transaction via MiniKit
      // For now, just simulate
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Purchase successful!');
      return 'mock_transaction_hash';
    } catch (err) {
      console.error('Purchase failed:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return {
    properties,
    loading,
    error,
    fetchProperties,
    purchaseTokens
  };
}

// Utility functions
export const formatUSDC = (amount: bigint): string => {
  return (Number(amount) / 1e6).toFixed(2);
};

export const calculateFundingPercentage = (totalRaised: bigint, target: bigint): number => {
  if (target === BigInt(0)) return 0;
  return Math.min(100, Number(totalRaised * BigInt(100) / target));
};
