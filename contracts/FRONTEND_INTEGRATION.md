# Frontend Integration Guide - Ours Platform Contracts

This document provides all the information needed to build a World App miniapp that interacts with the Ours real estate tokenization platform smart contracts.

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Contract Addresses & ABIs](#contract-addresses--abis)
3. [User Flows](#user-flows)
4. [Contract Integration Details](#contract-integration-details)
5. [World ID Integration](#world-id-integration)
6. [Data Models & Types](#data-models--types)
7. [Error Handling](#error-handling)
8. [Gas Optimization Tips](#gas-optimization-tips)

---

## Platform Overview

**Ours** is a Web3 real estate tokenization platform that enables fractional investment in properties. The platform uses ERC-3643 compliance tokens to ensure regulatory compliance through on-chain KYC verification.

### Core Functionality

1. **Property Registration** - Property developers register tokenized properties
2. **Token Sales** - Investors purchase fractional ownership tokens with USDC
3. **Revenue Distribution** - When properties are sold, profits are distributed to token holders

### Key Concepts

- **ERC-3643 Tokens** - Compliance tokens that validate KYC before transfers
- **USDC** - Stablecoin used for all payments
- **Merkle Proofs** - Used for gas-efficient profit distribution claims
- **Basis Points (bps)** - Financial calculations use bps where 100 = 1%, 10000 = 100%

---

## Contract Addresses & ABIs

### Deployed Contracts

**Note**: Update these addresses after deployment to your target network (World Chain, Optimism, etc.)

```typescript
export const CONTRACT_ADDRESSES = {
  // Core Platform Contracts
  propertyRegistry: "0x...", // PropertyRegistry.sol
  saleManager: "0x...",      // SaleManager.sol
  revenueDistributor: "0x...", // RevenueDistributor.sol

  // Token & Payment
  usdc: "0x...",             // USDC stablecoin address

  // Example Property Token (ERC-3643)
  examplePropertyToken: "0x...",
};
```

### ABI Files

Generate ABIs after compilation:

```bash
cd contracts
npx hardhat compile
# ABIs will be in: artifacts/contracts/**/*.json
```

Import ABIs in your frontend:

```typescript
import PropertyRegistryABI from './abis/PropertyRegistry.json';
import SaleManagerABI from './abis/SaleManager.json';
import RevenueDistributorABI from './abis/RevenueDistributor.json';
import ERC20ABI from './abis/IERC20.json';
import ERC3643ABI from './abis/IToken.json';
```

---

## User Flows

### Flow 1: Browse Properties (Read-Only)

**No wallet connection required**

```typescript
// 1. Get all properties from PropertyRegistry
const propertyCount = await propertyRegistry.propertyCount();

// 2. Get property details
const property = await propertyRegistry.getProperty(tokenAddress);

// 3. Get sale information
const sale = await saleManager.getSale(tokenAddress);

// 4. Get combined info (recommended)
const { property, sale, saleIsActive } =
  await saleManager.getPropertyAndSaleInfo(tokenAddress);

// 5. Calculate investment projection
const [investmentCost, netInvestment, ownershipBps, estimatedReturn, estimatedROI] =
  await saleManager.getInvestmentProjection(tokenAddress, tokenAmount);
```

### Flow 2: Purchase Property Tokens (Investor)

**Prerequisites**:
- User must have World ID verified (for KYC)
- User must have USDC in wallet
- Sale must be active

```typescript
// Step 1: Check if sale is active
const isActive = await saleManager.isSaleActive(tokenAddress);

// Step 2: Calculate total cost
const [totalCost, platformFee, issuerAmount] =
  await saleManager.calculateCost(tokenAddress, tokenAmount);

// Step 3: Check user's USDC balance
const usdcBalance = await usdc.balanceOf(userAddress);
if (usdcBalance < totalCost) {
  throw new Error("Insufficient USDC balance");
}

// Step 4: Approve USDC to SaleManager
const approveTx = await usdc.approve(saleManagerAddress, totalCost);
await approveTx.wait();

// Step 5: Purchase tokens (this will verify KYC automatically)
const buyTx = await saleManager.buyFractions(tokenAddress, tokenAmount);
await buyTx.wait();

// Step 6: Verify tokens received
const tokenBalance = await propertyToken.balanceOf(userAddress);
```

**Important**: The `buyFractions()` call will automatically verify:
- User has valid KYC through the ERC-3643 IdentityRegistry
- User meets compliance requirements
- If KYC is invalid, the transaction will revert

### Flow 3: Claim Revenue Distribution (Investor)

**Prerequisites**:
- Distribution must be active for the property
- User must have a valid Merkle proof
- User must not have claimed already

```typescript
// Step 1: Check if distribution exists and is active
const isActive = await revenueDistributor.isDistributionActive(tokenAddress);

// Step 2: Get user's claim info from backend/API
// Backend should generate Merkle tree and provide proof
const claimData = await fetch(`/api/distributions/${tokenAddress}/proof/${userAddress}`);
const { amount, proof } = await claimData.json();

// Step 3: Verify user can claim
const [canClaim, reason] = await revenueDistributor.canClaim(
  tokenAddress,
  userAddress,
  amount,
  proof
);

if (!canClaim) {
  throw new Error(`Cannot claim: ${reason}`);
}

// Step 4: Claim USDC
const claimTx = await revenueDistributor.claim(
  tokenAddress,
  amount,
  proof
);
await claimTx.wait();

// Step 5: Verify USDC received
const usdcBalance = await usdc.balanceOf(userAddress);
```

### Flow 4: Register Property (Property Issuer)

**Prerequisites**:
- User must have `PROPERTY_ISSUER_ROLE`
- ERC-3643 token must be deployed first

```typescript
// Prepare property parameters
const propertyParams = {
  token: propertyTokenAddress,
  name: "Palermo Tower",
  location: "Av. Santa Fe 1234, CABA, Argentina",
  totalArea: 5000, // m²
  units: 24,
  constructionStart: Math.floor(Date.now() / 1000), // Current timestamp
  estimatedCompletion: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
  ipfsHash: "QmXxx...", // IPFS hash with photos/documents
  cadastralNumber: "1234-5678-90",
  totalTokenSupply: 1000000, // 1 million tokens
  totalInvestmentTarget: 500000000000, // $500k in USDC (6 decimals)
  estimatedSalePrice: 750000000000, // $750k in USDC (6 decimals)
};

// Register property
const registerTx = await propertyRegistry.registerProperty(propertyParams);
await registerTx.wait();
```

### Flow 5: Create Token Sale (Property Issuer)

**Prerequisites**:
- Property must be registered in PropertyRegistry
- Property must be available (not sold/cancelled)

```typescript
// Step 1: Check if can create sale
const [isReady, reason] = await saleManager.canCreateSale(tokenAddress);
if (!isReady) {
  throw new Error(`Cannot create sale: ${reason}`);
}

// Step 2: Set price per token (in USDC with 6 decimals)
const pricePerToken = 500000; // $0.50 per token (500000 = 0.5 USDC)

// Step 3: Create sale
const createTx = await saleManager.createSale(tokenAddress, pricePerToken);
await createTx.wait();

// Step 4: Activate sale if needed
const activateTx = await saleManager.setSaleActive(tokenAddress, true);
await activateTx.wait();
```

---

## Contract Integration Details

### PropertyRegistry Contract

**Purpose**: Registry of all tokenized properties with metadata and financial projections.

#### Key Read Functions

```typescript
// Get single property
interface Property {
  token: string;           // ERC-3643 token address
  issuer: string;          // Property developer address
  name: string;            // "Palermo Tower"
  location: string;        // Physical address
  totalArea: BigNumber;    // m²
  units: BigNumber;        // Number of units
  constructionStart: BigNumber;     // Unix timestamp
  estimatedCompletion: BigNumber;   // Unix timestamp
  actualCompletion: BigNumber;      // Unix timestamp (0 if not completed)
  status: number;          // 0=Planning, 1=InConstruction, 2=Completed, 3=Sold, 4=Cancelled
  ipfsHash: string;        // IPFS hash for photos/docs
  cadastralNumber: string; // Legal cadastral number
  legalOwner: string;      // Legal owner address
  registeredAt: BigNumber; // Registration timestamp
  isActive: boolean;       // If property is active
  totalTokenSupply: BigNumber;      // Total tokens representing property
  totalInvestmentTarget: BigNumber; // Funding goal in USDC
  estimatedSalePrice: BigNumber;    // Expected sale price in USDC
}

const property: Property = await propertyRegistry.getProperty(tokenAddress);
```

```typescript
// Get construction progress (0-100)
const progress: BigNumber = await propertyRegistry.getConstructionProgress(tokenAddress);
```

```typescript
// Get investment projection
const [investmentCost, ownershipBps, estimatedReturn, estimatedROI] =
  await propertyRegistry.getInvestmentProjection(
    tokenAddress,
    tokenAmount,
    pricePerToken
  );

// Example: buying 1000 tokens at $0.50 each
// investmentCost: $500
// ownershipBps: 100 (1% if 100k total supply)
// estimatedReturn: $7500 (1% of $750k sale price)
// estimatedROI: 1400 (14% ROI in basis points)
```

```typescript
// Get financial info
const [
  totalTokenSupply,
  totalInvestmentTarget,
  estimatedSalePrice,
  pricePerTokenTarget,
  expectedProfitMarginBps
] = await propertyRegistry.getFinancialInfo(tokenAddress);
```

```typescript
// Check if property is available for sale
const isAvailable: boolean = await propertyRegistry.isPropertyAvailable(tokenAddress);
```

#### Property Status Enum

```typescript
enum PropertyStatus {
  Planning = 0,        // Property in planning phase
  InConstruction = 1,  // Construction started
  Completed = 2,       // Construction completed
  Sold = 3,           // Property sold, distribution in progress
  Cancelled = 4       // Project cancelled
}
```

### SaleManager Contract

**Purpose**: Manages primary market sales of property tokens for USDC.

#### Key Read Functions

```typescript
// Get sale information
interface Sale {
  token: string;                    // Property token address
  issuer: string;                   // Property developer
  pricePerToken: BigNumber;         // Price in USDC (with 6 decimals)
  isActive: boolean;                // If sale is active
  totalRaised: BigNumber;           // Total USDC raised
  withdrawableBalance: BigNumber;   // Issuer's withdrawable balance
}

const sale: Sale = await saleManager.getSale(tokenAddress);
```

```typescript
// Calculate purchase cost
const [totalCost, platformFee, issuerAmount] =
  await saleManager.calculateCost(tokenAddress, tokenAmount);

// Example: 100 tokens at $0.50 each with 2% platform fee
// totalCost: $50 (100 * 0.50)
// platformFee: $1 (2% of $50)
// issuerAmount: $49 (goes to property developer)
```

```typescript
// Get combined property + sale info (RECOMMENDED)
const { property, sale, saleIsActive } =
  await saleManager.getPropertyAndSaleInfo(tokenAddress);
```

```typescript
// Get investment info with ROI calculations
const [
  pricePerToken,
  totalTokenSupply,
  totalInvestmentTarget,
  estimatedSalePrice,
  expectedROIBps,
  totalRaised,
  remainingTokens
] = await saleManager.getInvestmentInfo(tokenAddress);
```

```typescript
// Get sale statistics
const [totalUnitsAvailable, totalRaised, constructionProgress, propertyStatus] =
  await saleManager.getSaleStats(tokenAddress);
```

#### Key Write Functions

```typescript
// Purchase tokens (main investor function)
// Prerequisites:
// 1. USDC approval to SaleManager
// 2. Valid KYC (verified automatically)
// 3. Active sale
await saleManager.buyFractions(tokenAddress, tokenAmount);
```

#### Platform Fees

```typescript
// Get current platform fee
const platformFeeBps: BigNumber = await saleManager.platformFeeBps();
// Example: 200 = 2% fee
```

### RevenueDistributor Contract

**Purpose**: Distributes property sale profits to token holders using Merkle proofs.

#### Key Read Functions

```typescript
// Get distribution information
interface Distribution {
  token: string;                 // Property token address
  merkleRoot: string;            // Merkle tree root hash
  totalAmount: BigNumber;        // Total USDC to distribute
  platformFee: BigNumber;        // Platform fee collected
  claimedAmount: BigNumber;      // Already claimed USDC
  remainingAmount: BigNumber;    // Available to claim
  createdAt: BigNumber;          // Creation timestamp
  claimDeadline: BigNumber;      // Deadline to claim
  isActive: boolean;             // If distribution is active
  issuer: string;                // Property developer who created it
}

const distribution: Distribution =
  await revenueDistributor.getDistribution(tokenAddress);
```

```typescript
// Check if user can claim
const [canClaim, reason] = await revenueDistributor.canClaim(
  tokenAddress,
  userAddress,
  amount,
  merkleProof
);

// Possible reasons:
// - "Can claim"
// - "Distribution does not exist"
// - "Distribution not active"
// - "Claim period ended"
// - "Already claimed"
// - "Insufficient remaining amount"
// - "Invalid merkle proof"
```

```typescript
// Get claim progress
const [totalAmount, claimedAmount, remainingAmount, claimPercentage] =
  await revenueDistributor.getClaimProgress(tokenAddress);

// claimPercentage: 0-100
```

```typescript
// Check if distribution is active
const isActive: boolean =
  await revenueDistributor.isDistributionActive(tokenAddress);
```

```typescript
// Check if user already claimed
const hasClaimed: boolean =
  await revenueDistributor.hasClaimed(tokenAddress, userAddress);
```

#### Key Write Functions

```typescript
// Claim revenue (main investor function)
// Parameters:
// - tokenAddress: Property token address
// - amount: Amount user is eligible to claim (from Merkle tree)
// - merkleProof: Array of proof hashes (from backend API)
await revenueDistributor.claim(tokenAddress, amount, merkleProof);
```

#### Merkle Proof Generation

**Note**: Merkle tree generation happens OFF-CHAIN (backend/server-side).

Your backend should:
1. Take snapshot of all token holders at distribution time
2. Calculate each holder's share based on their token balance
3. Generate Merkle tree with leaves: `keccak256(abi.encodePacked(holderAddress, amount))`
4. Store Merkle root on-chain via `setupDistribution()`
5. Store Merkle tree and proofs in database
6. Provide API endpoint for users to fetch their proof

Example API endpoint your backend should provide:

```typescript
// GET /api/distributions/{tokenAddress}/proof/{userAddress}
// Response:
{
  "eligible": true,
  "amount": "1500000000", // 1500 USDC (in wei with 6 decimals)
  "proof": [
    "0xabc123...",
    "0xdef456...",
    "0x789012..."
  ],
  "distribution": {
    "totalAmount": "100000000000",
    "claimDeadline": 1735689600,
    "isActive": true
  }
}
```

---

## World ID Integration

### World ID for KYC Verification

The Ours platform uses ERC-3643 tokens which require KYC verification. World ID can serve as the KYC verification mechanism.

#### Integration Flow

```typescript
// 1. User proves World ID verification in your miniapp
import { IDKitWidget, ISuccessResult } from '@worldcoin/idkit';

<IDKitWidget
  app_id={process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID!}
  action="verify_investor_kyc"
  onSuccess={onSuccess}
  verification_level="orb" // or "device"
>
  {({ open }) => <button onClick={open}>Verify with World ID</button>}
</IDKitWidget>

// 2. After verification, backend registers user in IdentityRegistry
const onSuccess = async (result: ISuccessResult) => {
  // Send proof to your backend
  const response = await fetch('/api/kyc/register', {
    method: 'POST',
    body: JSON.stringify({
      proof: result.proof,
      merkle_root: result.merkle_root,
      nullifier_hash: result.nullifier_hash,
      verification_level: result.verification_level,
      walletAddress: userAddress,
    }),
  });

  // Backend should:
  // 1. Verify World ID proof
  // 2. Register user in ERC-3643 IdentityRegistry
  // 3. Issue required claims (KYC verified)
};

// 3. User can now purchase tokens (KYC is verified on-chain)
await saleManager.buyFractions(tokenAddress, amount);
```

#### Important Notes

- World ID verification happens in the miniapp UI
- Backend verifies the proof and registers user in IdentityRegistry
- Once registered, all token purchases automatically validate KYC
- Each property token has its own IdentityRegistry

### MiniKit Integration (World App)

```typescript
import { MiniKit } from '@worldcoin/minikit-js';

// Check if running in World App
const isWorldApp = MiniKit.isInstalled();

// Handle wallet transactions
const sendTransaction = async () => {
  const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
    transaction: [
      {
        address: saleManagerAddress,
        abi: SaleManagerABI,
        functionName: 'buyFractions',
        args: [tokenAddress, tokenAmount],
      },
    ],
  });

  return finalPayload;
};

// Handle USDC approval + purchase in one flow
const purchaseTokens = async () => {
  const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
    transaction: [
      // First: Approve USDC
      {
        address: usdcAddress,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [saleManagerAddress, totalCost],
      },
      // Then: Buy tokens
      {
        address: saleManagerAddress,
        abi: SaleManagerABI,
        functionName: 'buyFractions',
        args: [tokenAddress, tokenAmount],
      },
    ],
  });

  return finalPayload;
};
```

---

## Data Models & Types

### TypeScript Interfaces

```typescript
// Property from PropertyRegistry
export interface Property {
  token: string;
  issuer: string;
  name: string;
  location: string;
  totalArea: string; // BigNumber as string
  units: string;
  constructionStart: number;
  estimatedCompletion: number;
  actualCompletion: number;
  status: PropertyStatus;
  ipfsHash: string;
  cadastralNumber: string;
  legalOwner: string;
  registeredAt: number;
  isActive: boolean;
  totalTokenSupply: string;
  totalInvestmentTarget: string;
  estimatedSalePrice: string;
}

export enum PropertyStatus {
  Planning = 0,
  InConstruction = 1,
  Completed = 2,
  Sold = 3,
  Cancelled = 4,
}

// Sale from SaleManager
export interface Sale {
  token: string;
  issuer: string;
  pricePerToken: string;
  isActive: boolean;
  totalRaised: string;
  withdrawableBalance: string;
}

// Distribution from RevenueDistributor
export interface Distribution {
  token: string;
  merkleRoot: string;
  totalAmount: string;
  platformFee: string;
  claimedAmount: string;
  remainingAmount: string;
  createdAt: number;
  claimDeadline: number;
  isActive: boolean;
  issuer: string;
}

// Investment projection calculations
export interface InvestmentProjection {
  investmentCost: string;        // Total cost in USDC
  netInvestment: string;         // Cost minus platform fee
  ownershipPercentageBps: number; // Ownership in basis points
  estimatedReturn: string;        // Projected USDC return
  estimatedROIBps: number;        // ROI in basis points
}

// Claim data from backend API
export interface ClaimData {
  eligible: boolean;
  amount: string;
  proof: string[];
  alreadyClaimed: boolean;
}
```

### Helper Functions

```typescript
// Convert basis points to percentage
export const bpsToPercent = (bps: number): number => {
  return bps / 100; // 1000 bps = 10%
};

// Format USDC amount (6 decimals)
export const formatUSDC = (amount: string | BigNumber): string => {
  const value = BigNumber.from(amount);
  return ethers.utils.formatUnits(value, 6);
};

// Parse USDC amount to wei
export const parseUSDC = (amount: string): BigNumber => {
  return ethers.utils.parseUnits(amount, 6);
};

// Format property status
export const formatStatus = (status: PropertyStatus): string => {
  const labels = {
    [PropertyStatus.Planning]: "Planning",
    [PropertyStatus.InConstruction]: "In Construction",
    [PropertyStatus.Completed]: "Completed",
    [PropertyStatus.Sold]: "Sold",
    [PropertyStatus.Cancelled]: "Cancelled",
  };
  return labels[status];
};

// Calculate days until deadline
export const daysUntil = (timestamp: number): number => {
  const now = Math.floor(Date.now() / 1000);
  return Math.floor((timestamp - now) / 86400);
};
```

---

## Error Handling

### Common Contract Errors

```typescript
// PropertyRegistry errors
"PropertyAlreadyExists" - Property token already registered
"PropertyDoesNotExist" - Property not found
"InvalidToken" - Zero address or invalid token
"PropertyNotActive" - Property is deactivated
"InvalidStatusTransition" - Invalid status change (e.g., Planning → Sold)

// SaleManager errors
"SaleAlreadyExists" - Sale already created for this token
"SaleDoesNotExist" - No sale found for token
"SaleNotActive" - Sale is paused or ended
"InvalidAmount" - Zero token amount
"InsufficientBalance" - User lacks USDC
"PropertyNotRegistered" - Property not in registry
"PropertyNotAvailable" - Property sold/cancelled

// RevenueDistributor errors
"DistributionDoesNotExist" - No distribution for token
"DistributionNotActive" - Distribution ended or cancelled
"AlreadyClaimed" - User already claimed
"InvalidProof" - Merkle proof verification failed
"ClaimPeriodEnded" - Deadline passed
"InsufficientBalance" - Not enough USDC in contract

// ERC-3643 Token errors (from mint during purchase)
"Identity not verified" - User lacks valid KYC
"Compliance not approved" - Doesn't meet compliance rules
```

### Error Handling Example

```typescript
try {
  const tx = await saleManager.buyFractions(tokenAddress, amount);
  await tx.wait();
} catch (error: any) {
  // Parse custom error
  if (error.message.includes("InsufficientBalance")) {
    toast.error("You don't have enough USDC");
  } else if (error.message.includes("Identity not verified")) {
    toast.error("Please complete KYC verification with World ID");
  } else if (error.message.includes("SaleNotActive")) {
    toast.error("This sale is not currently active");
  } else {
    toast.error("Transaction failed: " + error.message);
  }
}
```

---

## Gas Optimization Tips

### Batching Read Calls

Use the combined view functions to reduce RPC calls:

```typescript
// ❌ Bad: Multiple calls
const property = await propertyRegistry.getProperty(tokenAddress);
const sale = await saleManager.getSale(tokenAddress);
const isActive = await saleManager.isSaleActive(tokenAddress);

// ✅ Good: Single call
const { property, sale, saleIsActive } =
  await saleManager.getPropertyAndSaleInfo(tokenAddress);
```

### Multicall Pattern

For fetching multiple properties:

```typescript
import { Contract } from 'ethers';
import { Interface } from 'ethers/lib/utils';

// Create multicall instance (deploy Multicall3 or use existing)
const multicall = new Contract(multicallAddress, MulticallABI, provider);

// Batch multiple property reads
const calls = propertyAddresses.map(address => ({
  target: saleManagerAddress,
  callData: saleManagerInterface.encodeFunctionData(
    'getPropertyAndSaleInfo',
    [address]
  ),
}));

const results = await multicall.callStatic.aggregate3(calls);
```

### Approval Management

```typescript
// Check current allowance before approving
const currentAllowance = await usdc.allowance(userAddress, saleManagerAddress);

if (currentAllowance.lt(totalCost)) {
  // Only approve if needed
  const approveTx = await usdc.approve(saleManagerAddress, totalCost);
  await approveTx.wait();
}
```

---

## Quick Reference: Key Functions Summary

### For Investors (Main User Flow)

```typescript
// 1. Browse properties
getPropertyAndSaleInfo(tokenAddress)

// 2. Calculate investment
getInvestmentProjection(tokenAddress, tokenAmount)

// 3. Purchase tokens
usdc.approve(saleManagerAddress, totalCost)
saleManager.buyFractions(tokenAddress, tokenAmount)

// 4. Claim revenue
revenueDistributor.claim(tokenAddress, amount, proof)
```

### For Property Issuers

```typescript
// 1. Register property
propertyRegistry.registerProperty(params)

// 2. Create sale
saleManager.createSale(tokenAddress, pricePerToken)

// 3. Activate sale
saleManager.setSaleActive(tokenAddress, true)

// 4. Withdraw funds
saleManager.withdrawFunds(tokenAddress)

// 5. Setup distribution (after property sold)
revenueDistributor.setupDistribution(tokenAddress, merkleRoot, totalAmount)
```

---

## Additional Resources

### Testing

Use a testnet (Sepolia, Optimism Sepolia, World Chain testnet) before mainnet deployment.

### IPFS Integration

Property metadata (photos, documents) should be stored on IPFS:

```typescript
// Upload to IPFS (use Pinata, NFT.Storage, etc.)
const metadata = {
  name: "Palermo Tower",
  description: "Luxury apartments in Palermo",
  images: ["ipfs://...", "ipfs://..."],
  documents: ["ipfs://..."],
  floorPlans: ["ipfs://..."],
};

const ipfsHash = await uploadToIPFS(metadata);
// Use this hash in propertyParams.ipfsHash
```

### Event Listening

Listen to contract events for real-time updates:

```typescript
// Listen for token purchases
saleManager.on("TokensPurchased", (buyer, token, amount, totalCost, platformFee) => {
  console.log(`${buyer} purchased ${amount} tokens for ${totalCost} USDC`);
  // Update UI
});

// Listen for claims
revenueDistributor.on("Claimed", (token, holder, amount) => {
  console.log(`${holder} claimed ${amount} USDC from ${token}`);
  // Update UI
});
```

---

## Contact & Support

For questions about contract integration:
- Review contract source code in `contracts/contracts/`
- Check contract natspec comments for function documentation
- Test on testnet before mainnet deployment

---

**Last Updated**: November 2024
**Version**: 1.0
