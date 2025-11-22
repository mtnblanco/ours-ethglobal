'use client';

import { useState, useEffect } from 'react';
import { useWorldID } from './useWorldID';

// Mock data types for demo
interface Property {
  token: string;
  name: string;
  location: string;
  totalInvestmentTarget: bigint;
  totalTokenSupply: bigint;
}

interface Sale {
  token: string;
  pricePerToken: bigint;
  totalRaised: bigint;
  isActive: boolean;
}

interface PropertyWithSale {
  property: Property;
  sale: Sale;
  saleIsActive: boolean;
}

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

// Property marketplace hook
export function usePropertyMarketplace() {
  const { isConnected } = useWeb3();
  const worldID = useWorldID();
  const [properties, setProperties] = useState<PropertyWithSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getMockProperties = (): PropertyWithSale[] => {
    return [
      {
        property: {
          token: '0x9174c2eAf7F3db2642c24319Edc3af8708465FB0',
          name: 'Luxury Apartment Complex - Bogotá',
          location: 'Chapinero, Bogotá, Colombia',
          totalInvestmentTarget: BigInt(250000000000), // $250,000 USDC (6 decimals)
          totalTokenSupply: BigInt(1000),
        },
        sale: {
          token: '0x9174c2eAf7F3db2642c24319Edc3af8708465FB0',
          pricePerToken: BigInt(250000000), // $250 USDC per token
          totalRaised: BigInt(50000000000), // $50,000 raised
          isActive: true,
        },
        saleIsActive: true
      },
      {
        property: {
          token: '0x6916Bf9dBc14e2a50e2c70Eb5efe684eA1d94cA5',
          name: 'Modern Office Tower - Medellín',
          location: 'El Poblado, Medellín, Colombia',
          totalInvestmentTarget: BigInt(500000000000), // $500,000 USDC
          totalTokenSupply: BigInt(2000),
        },
        sale: {
          token: '0x6916Bf9dBc14e2a50e2c70Eb5efe684eA1d94cA5',
          pricePerToken: BigInt(250000000), // $250 USDC per token
          totalRaised: BigInt(125000000000), // $125,000 raised
          isActive: true,
        },
        saleIsActive: true
      }
    ];
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      console.log('🔗 Loading demo properties');
      const mockProps = getMockProperties();
      setProperties(mockProps);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      setLoading(false);
    }
  };

  const purchaseTokens = async (tokenAddress: string, amount: number) => {
    if (!isConnected) {
      throw new Error('Please verify with World ID first');
    }

    try {
      console.log(`🛒 Purchasing ${amount} tokens of ${tokenAddress}`);
      
      // Simulate transaction
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
