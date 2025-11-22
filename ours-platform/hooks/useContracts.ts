import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  PROPERTY_REGISTRY_ABI, 
  SALE_MANAGER_ABI,
  REVENUE_DISTRIBUTOR_ABI,
  USDC_ABI,
  Property, 
  Sale, 
  PropertyWithSale,
  PROPERTY_STATUS,
  NETWORK_CONFIG 
} from '@/lib/contracts';

// Hook for Web3 provider and wallet connection
export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    if (typeof window !== 'undefined' && window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      // Check if already connected
      web3Provider.listAccounts().then(accounts => {
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          web3Provider.getSigner().then(setSigner);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(web3Provider);
      setSigner(signer);
      setAccount(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    provider,
    signer,
    account,
    isConnecting,
    error,
    connectWallet,
    isConnected: !!account
  };
}

// Hook for property marketplace data
export function usePropertyMarketplace() {
  const { provider, signer } = useWeb3();
  const [properties, setProperties] = useState<PropertyWithSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get all available properties with sale information
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if contracts are deployed and configured
      if (provider && CONTRACT_ADDRESSES.PROPERTY_REGISTRY && CONTRACT_ADDRESSES.SALE_MANAGER) {
        // Try to fetch from actual contracts
        const propertyRegistry = new ethers.Contract(
          CONTRACT_ADDRESSES.PROPERTY_REGISTRY,
          PROPERTY_REGISTRY_ABI,
          provider
        );

        const saleManager = new ethers.Contract(
          CONTRACT_ADDRESSES.SALE_MANAGER,
          SALE_MANAGER_ABI,
          provider
        );

        // Get total property count
        const propertyCount = await propertyRegistry.propertyCount();
        console.log('Total properties:', propertyCount.toString());

        // For now, we'll need to implement a way to get all properties
        // Since there's no getAllProperties function, we'll need to either:
        // 1. Listen to PropertyRegistered events, or
        // 2. Add a function to get properties by index, or
        // 3. Use mock data initially
      }

      // Using mock data for demo purposes
      console.log('Loading mock properties for demo...');
      const mockProperties: PropertyWithSale[] = [
        {
          property: {
            token: '0x1234567890123456789012345678901234567890',
            issuer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            name: 'Skyline Commercial Tower',
            location: 'Financial District, NY',
            totalArea: BigInt(15000),
            units: BigInt(50),
            constructionStart: BigInt(Math.floor(Date.now() / 1000) - 86400 * 30),
            estimatedCompletion: BigInt(Math.floor(Date.now() / 1000) + 86400 * 365),
            actualCompletion: BigInt(0),
            status: 1, // InConstruction
            ipfsHash: 'QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            cadastralNumber: 'NYC-2024-001',
            legalOwner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            registeredAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 30),
            isActive: true,
            totalTokenSupply: BigInt(1000000),
            totalInvestmentTarget: BigInt(50000000), // $50M USDC (6 decimals)
            estimatedSalePrice: BigInt(62000000) // $62M USDC
          },
          sale: {
            token: '0x1234567890123456789012345678901234567890',
            issuer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            pricePerToken: BigInt(50000000), // $50 USDC (6 decimals)
            isActive: true,
            totalRaised: BigInt(39000000), // $39M USDC raised
            withdrawableBalance: BigInt(37000000) // $37M USDC available to withdraw
          },
          saleIsActive: true
        },
        {
          property: {
            token: '0x2234567890123456789012345678901234567890',
            issuer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            name: 'Miami Beach Resort',
            location: 'South Beach, Miami, FL',
            totalArea: BigInt(8500),
            units: BigInt(25),
            constructionStart: BigInt(Math.floor(Date.now() / 1000) - 86400 * 60),
            estimatedCompletion: BigInt(Math.floor(Date.now() / 1000) + 86400 * 180),
            actualCompletion: BigInt(0),
            status: 1, // InConstruction
            ipfsHash: 'QmYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
            cadastralNumber: 'MIA-2024-002',
            legalOwner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            registeredAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 60),
            isActive: true,
            totalTokenSupply: BigInt(750000),
            totalInvestmentTarget: BigInt(30000000), // $30M USDC (6 decimals)
            estimatedSalePrice: BigInt(37500000) // $37.5M USDC
          },
          sale: {
            token: '0x2234567890123456789012345678901234567890',
            issuer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            pricePerToken: BigInt(40000000), // $40 USDC (6 decimals)
            isActive: true,
            totalRaised: BigInt(18000000), // $18M USDC raised
            withdrawableBalance: BigInt(17100000) // $17.1M USDC available to withdraw
          },
          saleIsActive: true
        },
        {
          property: {
            token: '0x3234567890123456789012345678901234567890',
            issuer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            name: 'Austin Tech Campus',
            location: 'Downtown Austin, TX',
            totalArea: BigInt(12000),
            units: BigInt(35),
            constructionStart: BigInt(Math.floor(Date.now() / 1000) - 86400 * 90),
            estimatedCompletion: BigInt(Math.floor(Date.now() / 1000) + 86400 * 270),
            actualCompletion: BigInt(0),
            status: 1, // InConstruction
            ipfsHash: 'QmZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
            cadastralNumber: 'AUS-2024-003',
            legalOwner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            registeredAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 90),
            isActive: true,
            totalTokenSupply: BigInt(800000),
            totalInvestmentTarget: BigInt(40000000), // $40M USDC (6 decimals)
            estimatedSalePrice: BigInt(50000000) // $50M USDC
          },
          sale: {
            token: '0x3234567890123456789012345678901234567890',
            issuer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            pricePerToken: BigInt(50000000), // $50 USDC (6 decimals)
            isActive: true,
            totalRaised: BigInt(32000000), // $32M USDC raised
            withdrawableBalance: BigInt(30400000) // $30.4M USDC available to withdraw
          },
          saleIsActive: true
        }
      ];

      console.log('Mock properties loaded:', mockProperties.length);
      setProperties(mockProperties);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  // Get property details by token address
  const getPropertyDetails = async (tokenAddress: string) => {
    if (!provider) return null;

    try {
      const saleManager = new ethers.Contract(
        CONTRACT_ADDRESSES.SALE_MANAGER,
        SALE_MANAGER_ABI,
        provider
      );

      const [property, sale, saleIsActive] = await saleManager.getPropertyAndSaleInfo(tokenAddress);
      
      return {
        property: property as Property,
        sale: sale as Sale,
        saleIsActive
      };
    } catch (err) {
      console.error('Failed to get property details:', err);
      return null;
    }
  };

  // Purchase tokens
  const purchaseTokens = async (tokenAddress: string, amount: number) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const saleManager = new ethers.Contract(
        CONTRACT_ADDRESSES.SALE_MANAGER,
        SALE_MANAGER_ABI,
        signer
      );

      // Calculate cost first
      const [totalCost, platformFee, issuerAmount] = await saleManager.calculateCost(
        tokenAddress, 
        amount
      );

      // Check USDC allowance and approve if necessary
      const usdcContract = new ethers.Contract(
        CONTRACT_ADDRESSES.USDC,
        USDC_ABI,
        signer
      );

      const allowance = await usdcContract.allowance(
        await signer.getAddress(),
        CONTRACT_ADDRESSES.SALE_MANAGER
      );

      if (allowance < totalCost) {
        console.log('Approving USDC spend...');
        const approveTx = await usdcContract.approve(
          CONTRACT_ADDRESSES.SALE_MANAGER,
          totalCost
        );
        await approveTx.wait();
      }

      // Purchase tokens
      console.log('Purchasing tokens...');
      const purchaseTx = await saleManager.buyFractions(tokenAddress, amount);
      const receipt = await purchaseTx.wait();

      return receipt;
    } catch (err) {
      console.error('Purchase failed:', err);
      throw err;
    }
  };

  useEffect(() => {
    // Load properties immediately (using mock data for demo)
    fetchProperties();
  }, []); // Removed provider dependency to load mock data immediately

  return {
    properties,
    loading,
    error,
    fetchProperties,
    getPropertyDetails,
    purchaseTokens
  };
}

// Hook for revenue distribution (claims)
export function useRevenue() {
  const { provider, signer, account } = useWeb3();

  // Get claimable distributions for user
  const getClaimableDistributions = async () => {
    if (!provider || !account) return [];

    try {
      // This would require indexing events or a backend service
      // For now, return empty array
      return [];
    } catch (err) {
      console.error('Failed to get claimable distributions:', err);
      return [];
    }
  };

  // Claim revenue distribution
  const claimRevenue = async (tokenAddress: string, amount: string, merkleProof: string[]) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const revenueDistributor = new ethers.Contract(
        CONTRACT_ADDRESSES.REVENUE_DISTRIBUTOR,
        REVENUE_DISTRIBUTOR_ABI,
        signer
      );

      const claimTx = await revenueDistributor.claim(
        tokenAddress,
        ethers.parseUnits(amount, 6), // USDC has 6 decimals
        merkleProof
      );

      return await claimTx.wait();
    } catch (err) {
      console.error('Claim failed:', err);
      throw err;
    }
  };

  return {
    getClaimableDistributions,
    claimRevenue
  };
}

// Utility functions
export const formatUSDC = (amount: bigint): string => {
  return (Number(amount) / 1e6).toFixed(2);
};

export const formatTokens = (amount: bigint): string => {
  return (Number(amount) / 1e18).toFixed(0);
};

export const formatPercentage = (bps: bigint): string => {
  return (Number(bps) / 100).toFixed(1) + '%';
};

export const getPropertyStatusText = (status: number): string => {
  return PROPERTY_STATUS[status as keyof typeof PROPERTY_STATUS] || 'Unknown';
};

export const calculateFundingPercentage = (totalRaised: bigint, target: bigint): number => {
  if (target === BigInt(0)) return 0;
  return Math.min(100, Number(totalRaised * BigInt(100) / target));
};