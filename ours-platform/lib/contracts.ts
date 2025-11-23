// Smart Contract configurations for the marketplace
export const CONTRACT_ADDRESSES = {
  // World Chain Sepolia deployed addresses - 2025-11-22
  PROPERTY_REGISTRY: process.env.NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS || '0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6',
  SALE_MANAGER: process.env.NEXT_PUBLIC_SALE_MANAGER_ADDRESS || '0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4',
  REVENUE_DISTRIBUTOR: process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS || '0xD99C9ad06FeD65FcB3AE660316DBbCC285786712',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388',
  KYC_ISSUER: process.env.NEXT_PUBLIC_CHAINLINK_KYC_ISSUER_ADDRESS || '0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE',
};

// PropertyRegistry ABI (from compiled contract)
export const PROPERTY_REGISTRY_ABI = [
  {
    "inputs": [],
    "name": "getAllProperties",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getProperty",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "token", "type": "address"},
        {"internalType": "address", "name": "issuer", "type": "address"},
        {"internalType": "string", "name": "name", "type": "string"},
        {"internalType": "string", "name": "location", "type": "string"},
        {"internalType": "uint256", "name": "totalArea", "type": "uint256"},
        {"internalType": "uint256", "name": "units", "type": "uint256"},
        {"internalType": "uint256", "name": "constructionStart", "type": "uint256"},
        {"internalType": "uint256", "name": "estimatedCompletion", "type": "uint256"},
        {"internalType": "uint256", "name": "actualCompletion", "type": "uint256"},
        {"internalType": "uint8", "name": "status", "type": "uint8"},
        {"internalType": "string", "name": "ipfsHash", "type": "string"},
        {"internalType": "string", "name": "cadastralNumber", "type": "string"},
        {"internalType": "address", "name": "legalOwner", "type": "address"},
        {"internalType": "uint256", "name": "registeredAt", "type": "uint256"},
        {"internalType": "bool", "name": "isActive", "type": "bool"},
        {"internalType": "uint256", "name": "totalTokenSupply", "type": "uint256"},
        {"internalType": "uint256", "name": "totalInvestmentTarget", "type": "uint256"},
        {"internalType": "uint256", "name": "estimatedSalePrice", "type": "uint256"}
      ],
      "internalType": "struct PropertyRegistry.Property",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "properties",
    "outputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "address", "name": "issuer", "type": "address"},
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "location", "type": "string"},
      {"internalType": "uint256", "name": "totalArea", "type": "uint256"},
      {"internalType": "uint256", "name": "units", "type": "uint256"},
      {"internalType": "uint256", "name": "constructionStart", "type": "uint256"},
      {"internalType": "uint256", "name": "estimatedCompletion", "type": "uint256"},
      {"internalType": "uint256", "name": "actualCompletion", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "string", "name": "cadastralNumber", "type": "string"},
      {"internalType": "address", "name": "legalOwner", "type": "address"},
      {"internalType": "uint256", "name": "registeredAt", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint256", "name": "totalTokenSupply", "type": "uint256"},
      {"internalType": "uint256", "name": "totalInvestmentTarget", "type": "uint256"},
      {"internalType": "uint256", "name": "estimatedSalePrice", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "issuer", "type": "address"}],
    "name": "getIssuerProperties",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "isPropertyAvailable",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getConstructionProgress",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "pricePerToken", "type": "uint256"}
    ],
    "name": "getInvestmentProjection",
    "outputs": [
      {"internalType": "uint256", "name": "investmentCost", "type": "uint256"},
      {"internalType": "uint256", "name": "ownershipPercentageBps", "type": "uint256"},
      {"internalType": "uint256", "name": "estimatedReturn", "type": "uint256"},
      {"internalType": "uint256", "name": "estimatedROIBps", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getFinancialInfo",
    "outputs": [
      {"internalType": "uint256", "name": "totalTokenSupply", "type": "uint256"},
      {"internalType": "uint256", "name": "totalInvestmentTarget", "type": "uint256"},
      {"internalType": "uint256", "name": "estimatedSalePrice", "type": "uint256"},
      {"internalType": "uint256", "name": "pricePerTokenTarget", "type": "uint256"},
      {"internalType": "uint256", "name": "expectedProfitMarginBps", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getMaximumROI",
    "outputs": [{"internalType": "uint256", "name": "maxROIBps", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "propertyExists",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertyCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// SaleManager ABI (from compiled contract)
export const SALE_MANAGER_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getPropertyAndSaleInfo",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "address", "name": "issuer", "type": "address"},
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "location", "type": "string"},
          {"internalType": "uint256", "name": "totalArea", "type": "uint256"},
          {"internalType": "uint256", "name": "units", "type": "uint256"},
          {"internalType": "uint256", "name": "constructionStart", "type": "uint256"},
          {"internalType": "uint256", "name": "estimatedCompletion", "type": "uint256"},
          {"internalType": "uint256", "name": "actualCompletion", "type": "uint256"},
          {"internalType": "uint8", "name": "status", "type": "uint8"},
          {"internalType": "string", "name": "ipfsHash", "type": "string"},
          {"internalType": "string", "name": "cadastralNumber", "type": "string"},
          {"internalType": "address", "name": "legalOwner", "type": "address"},
          {"internalType": "uint256", "name": "registeredAt", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "totalTokenSupply", "type": "uint256"},
          {"internalType": "uint256", "name": "totalInvestmentTarget", "type": "uint256"},
          {"internalType": "uint256", "name": "estimatedSalePrice", "type": "uint256"}
        ],
        "internalType": "struct PropertyRegistry.Property",
        "name": "property",
        "type": "tuple"
      },
      {
        "components": [
          {"internalType": "address", "name": "token", "type": "address"},
          {"internalType": "address", "name": "issuer", "type": "address"},
          {"internalType": "uint256", "name": "pricePerToken", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "totalRaised", "type": "uint256"},
          {"internalType": "uint256", "name": "withdrawableBalance", "type": "uint256"}
        ],
        "internalType": "struct SaleManager.Sale",
        "name": "sale",
        "type": "tuple"
      },
      {"internalType": "bool", "name": "saleIsActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
    "name": "getSale",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "token", "type": "address"},
        {"internalType": "address", "name": "issuer", "type": "address"},
        {"internalType": "uint256", "name": "pricePerToken", "type": "uint256"},
        {"internalType": "bool", "name": "isActive", "type": "bool"},
        {"internalType": "uint256", "name": "totalRaised", "type": "uint256"},
        {"internalType": "uint256", "name": "withdrawableBalance", "type": "uint256"}
      ],
      "internalType": "struct SaleManager.Sale",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "sales",
    "outputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "address", "name": "issuer", "type": "address"},
      {"internalType": "uint256", "name": "pricePerToken", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint256", "name": "totalRaised", "type": "uint256"},
      {"internalType": "uint256", "name": "withdrawableBalance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertyRegistry",
    "outputs": [{"internalType": "contract PropertyRegistry", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "kycIssuer",
    "outputs": [{"internalType": "contract ChainlinkKYCIssuer", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// RevenueDistributor ABI (minimal for marketplace use)
export const REVENUE_DISTRIBUTOR_ABI = [
  // View functions
  "function getDistribution(address token) external view returns (tuple(address token, bytes32 merkleRoot, uint256 totalAmount, uint256 platformFee, uint256 claimedAmount, uint256 remainingAmount, uint256 createdAt, uint256 claimDeadline, bool isActive, address issuer) distribution)",
  "function canClaim(address token, address holder, uint256 amount, bytes32[] calldata merkleProof) external view returns (bool canClaim, string memory reason)",
  "function getClaimProgress(address token) external view returns (uint256 totalAmount, uint256 claimedAmount, uint256 remainingAmount, uint256 claimPercentage)",
  "function isDistributionActive(address token) external view returns (bool)",
  "function hasClaimed(address token, address holder) external view returns (bool)",

  // Transaction functions
  "function claim(address token, uint256 amount, bytes32[] calldata merkleProof) external",

  // Events
  "event Claimed(address indexed token, address indexed holder, uint256 amount)"
];

// USDC ABI (minimal for approvals and transfers)
export const USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

// Property Status enum mapping
export const PROPERTY_STATUS = {
  0: 'Planning',
  1: 'InConstruction', 
  2: 'Completed',
  3: 'Sold',
  4: 'Cancelled'
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || '4801', // World Chain Sepolia testnet
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://worldchain-sepolia.g.alchemy.com/public',
  blockExplorer: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://worldchain-sepolia.explorer.alchemy.com',
};

// Type definitions for contract data
export interface Property {
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

export interface Sale {
  token: string;
  issuer: string;
  pricePerToken: bigint;
  isActive: boolean;
  totalRaised: bigint;
  withdrawableBalance: bigint;
}

export interface PropertyWithSale {
  property: Property;
  sale: Sale;
  saleIsActive: boolean;
}

// ChainlinkKYCIssuer ABI (for KYC verification)
export const KYC_ISSUER_ABI = [
  // View functions
  "function isKYCVerified(address user) external view returns (bool)",
  "function getKYCData(address user) external view returns (tuple(uint8 status, bytes32 nullifierHash, uint256 requestedAt, uint256 approvedAt, bytes32 kycDataHash, address onchainIDAddress) kycData)",
  "function kycData(address user) external view returns (uint8 status, bytes32 nullifierHash, uint256 requestedAt, uint256 approvedAt, bytes32 kycDataHash, address onchainIDAddress)",
  "function usedNullifiers(bytes32 nullifierHash) external view returns (bool)",
  "function totalKYCsApproved() external view returns (uint256)",
  "function rejectionCooldown() external view returns (uint256)",
  
  // Transaction functions
  "function requestKYCWithWorldID(uint256 signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) external",
  "function fulfillKYC(address user, bool approved, bytes32 kycDataHash) external",
  
  // Testing functions (only available in development)
  "function mockRequestKYCForTesting(address user) external",
  
  // Events
  "event KYCRequested(address indexed user, bytes32 indexed nullifierHash, uint256 timestamp)",
  "event KYCFulfilled(address indexed user, bool approved, bytes32 kycDataHash)"
];