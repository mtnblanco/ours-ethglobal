// Smart Contract configurations for the marketplace
export const CONTRACT_ADDRESSES = {
  // World Chain Sepolia deployed addresses - 2025-11-22
  PROPERTY_REGISTRY: process.env.NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS || '0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6',
  SALE_MANAGER: process.env.NEXT_PUBLIC_SALE_MANAGER_ADDRESS || '0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4',
  REVENUE_DISTRIBUTOR: process.env.NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS || '0xD99C9ad06FeD65FcB3AE660316DBbCC285786712',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388',
};

// PropertyRegistry ABI (minimal for marketplace use)
export const PROPERTY_REGISTRY_ABI = [
  // View functions
  "function getProperty(address token) external view returns (tuple(address token, address issuer, string name, string location, uint256 totalArea, uint256 units, uint256 constructionStart, uint256 estimatedCompletion, uint256 actualCompletion, uint8 status, string ipfsHash, string cadastralNumber, address legalOwner, uint256 registeredAt, bool isActive, uint256 totalTokenSupply, uint256 totalInvestmentTarget, uint256 estimatedSalePrice) property)",
  "function getAllProperties() external view returns (address[] memory)",
  "function properties(address token) external view returns (address token, address issuer, string memory name, string memory location, uint256 totalArea, uint256 units, uint256 constructionStart, uint256 estimatedCompletion, uint256 actualCompletion, uint8 status, string memory ipfsHash, string memory cadastralNumber, address legalOwner, uint256 registeredAt, bool isActive, uint256 totalTokenSupply, uint256 totalInvestmentTarget, uint256 estimatedSalePrice)",
  "function getIssuerProperties(address issuer) external view returns (address[] memory)",
  "function isPropertyAvailable(address token) external view returns (bool)",
  "function getConstructionProgress(address token) external view returns (uint256)",
  "function getInvestmentProjection(address token, uint256 tokenAmount, uint256 pricePerToken) external view returns (uint256 investmentCost, uint256 ownershipPercentageBps, uint256 estimatedReturn, uint256 estimatedROIBps)",
  "function getFinancialInfo(address token) external view returns (uint256 totalTokenSupply, uint256 totalInvestmentTarget, uint256 estimatedSalePrice, uint256 pricePerTokenTarget, uint256 expectedProfitMarginBps)",
  "function getMaximumROI(address token) external view returns (uint256 maxROIBps)",
  "function propertyExists(address token) external view returns (bool)",
  "function propertyCount() external view returns (uint256)"
];

// SaleManager ABI (minimal for marketplace use)
export const SALE_MANAGER_ABI = [
  // View functions
  "function getSale(address token) external view returns (tuple(address token, address issuer, uint256 pricePerToken, bool isActive, uint256 totalRaised, uint256 withdrawableBalance) sale)",
  "function sales(address token) external view returns (address token, address issuer, uint256 pricePerToken, bool isActive, uint256 totalRaised, uint256 withdrawableBalance)",
  "function calculateCost(address token, uint256 amount) external view returns (uint256 totalCost, uint256 platformFee, uint256 issuerAmount)",
  "function isSaleActive(address token) external view returns (bool)",
  "function getPropertyAndSaleInfo(address token) external view returns (tuple(address token, address issuer, string name, string location, uint256 totalArea, uint256 units, uint256 constructionStart, uint256 estimatedCompletion, uint256 actualCompletion, uint8 status, string ipfsHash, string cadastralNumber, address legalOwner, uint256 registeredAt, bool isActive, uint256 totalTokenSupply, uint256 totalInvestmentTarget, uint256 estimatedSalePrice) property, tuple(address token, address issuer, uint256 pricePerToken, bool isActive, uint256 totalRaised, uint256 withdrawableBalance) sale, bool saleIsActive)",
  "function getIssuerActiveSales(address issuer) external view returns (address[] memory tokens)",
  "function canCreateSale(address token) external view returns (bool isReady, string memory reason)",
  "function getInvestmentProjection(address token, uint256 tokenAmount) external view returns (uint256 investmentCost, uint256 ownershipPercentageBps, uint256 estimatedReturn, uint256 estimatedROIBps)",

  // Transaction functions
  "function buyFractions(address token, uint256 amount) external",
  
  // Events
  "event TokensPurchased(address indexed buyer, address indexed token, uint256 amount, uint256 totalCost, uint256 platformFee)"
];

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