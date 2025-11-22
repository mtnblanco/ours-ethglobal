# OURS Platform Deployment Guide

## 📋 Overview

This guide covers the complete deployment of the OURS platform, including smart contracts and frontend application.

## 🏗️ Architecture

- **Frontend**: Next.js 16.0.3 with React and Tailwind CSS
- **Smart Contracts**: PropertyRegistry, SaleManager, RevenueDistributor
- **Blockchain**: World Chain (Worldcoin's L2)
- **Authentication**: World ID verification
- **Payment**: USDC for token purchases

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cd ours-platform
cp .env.local.example .env.local
```

Update `.env.local` with your values:
```env
# Worldcoin Configuration
NEXT_PUBLIC_WORLDCOIN_APP_ID=your_worldcoin_app_id_here
WORLDCOIN_APP_ID=your_worldcoin_app_id_here
WORLDCOIN_ACTION=signup

# World Chain Configuration
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/public
WORLD_CHAIN_TESTNET_RPC_URL=https://worldchain-sepolia.g.alchemy.com/public

# Smart Contract Addresses (Deploy contracts first)
NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_SALE_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### 2. Frontend Development

```bash
cd ours-platform
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔧 Smart Contract Deployment

### Prerequisites

1. Install Hardhat in contracts folder:
```bash
cd contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. Set up deployment wallet with World Chain testnet ETH

### Deployment Steps

1. **Deploy PropertyRegistry**
```bash
npx hardhat run scripts/deploy-property-registry.js --network worldchain-sepolia
```

2. **Deploy SaleManager**
```bash
npx hardhat run scripts/deploy-sale-manager.js --network worldchain-sepolia
```

3. **Deploy RevenueDistributor**
```bash
npx hardhat run scripts/deploy-revenue-distributor.js --network worldchain-sepolia
```

4. **Update Frontend Configuration**
   - Copy deployed contract addresses to `.env.local`
   - Update `lib/contracts.ts` with correct addresses

## 📱 Frontend Features

### Current Implementation

✅ **World ID Authentication**
- Verified users redirected directly to marketplace
- Skips KYC flow for demo purposes

✅ **Marketplace Interface**
- Property listings with funding progress
- Real-time wallet connection status
- Token purchase interface
- Responsive design

✅ **Smart Contract Integration**
- Web3 hooks for wallet connectivity
- Contract interaction utilities
- Type-safe contract ABIs
- Error handling and user feedback

✅ **Property Management**
- Property details pages
- Investment calculators
- Status tracking (Funding/Active/Completed)
- Progress visualization

### User Flow

1. **Landing Page** → World ID verification
2. **Verification Success** → Redirect to marketplace
3. **Marketplace** → Browse available properties
4. **Property Details** → View investment details
5. **Purchase Tokens** → Connect wallet and buy
6. **Track Investments** → Monitor portfolio

## 🔒 Security Considerations

### Smart Contracts

- **Access Control**: Role-based permissions (PROPERTY_ISSUER_ROLE, VERIFIER_ROLE)
- **KYC Verification**: ERC-3643 compliance for regulated tokens
- **Revenue Distribution**: Merkle tree-based claims for gas efficiency
- **USDC Integration**: Secure payment handling

### Frontend

- **Wallet Security**: MetaMask integration with user consent
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error boundaries
- **Input Validation**: Sanitized user inputs

## 🧪 Testing

### Frontend Testing
```bash
cd ours-platform
npm run build  # Production build test
npm run lint   # Code quality check
```

### Contract Testing
```bash
cd contracts
npx hardhat test
```

## 🌐 Production Deployment

### Frontend (Vercel Recommended)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Smart Contracts (World Chain Mainnet)

1. Switch network configuration to mainnet
2. Fund deployment wallet with ETH
3. Deploy contracts in sequence
4. Verify contracts on explorer

## 📊 Monitoring & Analytics

### Contract Events

Monitor these events for system health:

- `PropertyRegistered`: New property listings
- `TokensPurchased`: Investment activity  
- `RevenueDistributed`: Profit distributions
- `KYCStatusUpdated`: Compliance tracking

### Frontend Metrics

- User engagement (World ID verifications)
- Transaction success rates
- Property funding progress
- Wallet connection issues

## 🔧 Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Ensure MetaMask is installed
   - Check network configuration
   - Verify World Chain is added to wallet

2. **Contract Calls Fail**
   - Check contract addresses in environment
   - Verify wallet has sufficient gas
   - Ensure contracts are deployed

3. **World ID Verification Issues**
   - Verify app configuration
   - Check action name consistency
   - Test with different verification levels

### Debug Commands

```bash
# Check contract deployment
npx hardhat verify --network worldchain-sepolia <CONTRACT_ADDRESS>

# Frontend debug mode
npm run dev -- --debug

# Contract interaction testing
npx hardhat console --network worldchain-sepolia
```

## 📈 Next Steps

### Immediate Priorities

1. **Contract Deployment**: Deploy all contracts to World Chain
2. **Property Registration**: Add real properties via admin interface
3. **KYC Integration**: Implement full compliance flow
4. **Testing**: Complete end-to-end testing

### Future Enhancements

1. **Secondary Market**: Token trading functionality
2. **Governance**: DAO voting for property decisions
3. **Mobile App**: React Native application
4. **Analytics Dashboard**: Investment performance tracking
5. **Multi-chain**: Expand to other L2s

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request with documentation

## 📞 Support

For technical support or deployment assistance:
- Create GitHub issue with detailed description
- Include error logs and environment details
- Tag with appropriate labels (bug/enhancement/question)

---

**OURS Platform** - Democratizing Real Estate Investment Through Blockchain Technology