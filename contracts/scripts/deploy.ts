const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

interface DeploymentAddresses {
  PropertyRegistry: string;
  SaleManager: string;
  RevenueDistributor: string;
  USDC?: string; // Mock USDC for testnet
}

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Starting deployment to World Chain Sepolia...");
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no ETH. Please fund the account first.");
  }

  const addresses: DeploymentAddresses = {} as DeploymentAddresses;

  // 1. Deploy PropertyRegistry first (no dependencies)
  console.log("\n🏢 Deploying PropertyRegistry...");
  const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistryFactory.deploy({
    gasLimit: 10000000, // Límite más alto basado en la prueba exitosa
    gasPrice: 100000000 // 0.1 gwei
  });
  await propertyRegistry.waitForDeployment();
  addresses.PropertyRegistry = await propertyRegistry.getAddress();
  console.log("✅ PropertyRegistry deployed to:", addresses.PropertyRegistry);

  // 2. Deploy Mock USDC - usar MockERC20 del directorio test
  console.log("\n📄 Deploying Mock USDC...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20", {
    // Especificar la ruta del contrato
  });
  const mockUSDC = await MockERC20Factory.deploy(
    "USD Coin", 
    "USDC", 
    6, // 6 decimals for USDC
    ethers.parseUnits("1000000", 6), // 1M USDC initial supply
    {
      gasLimit: 2000000, // Gas limit para ERC20
      gasPrice: 100000000
    }
  );
  await mockUSDC.waitForDeployment();
  addresses.USDC = await mockUSDC.getAddress();
  console.log("✅ Mock USDC deployed to:", addresses.USDC);

  // 3. Deploy SaleManager
  console.log("\n💰 Deploying SaleManager...");
  const SaleManagerFactory = await ethers.getContractFactory("SaleManager");
  const saleManager = await SaleManagerFactory.deploy(
    addresses.PropertyRegistry, // PropertyRegistry address
    addresses.USDC,            // USDC token address
    250,                       // 2.5% platform fee (250 basis points)
    {
      gasLimit: 8000000, // Límite más alto para SaleManager
      gasPrice: 100000000
    }
  );
  await saleManager.waitForDeployment();
  addresses.SaleManager = await saleManager.getAddress();
  console.log("✅ SaleManager deployed to:", addresses.SaleManager);

  // 4. Deploy RevenueDistributor
  console.log("\n📊 Deploying RevenueDistributor...");
  const RevenueDistributorFactory = await ethers.getContractFactory("RevenueDistributor");
  const revenueDistributor = await RevenueDistributorFactory.deploy(
    addresses.USDC, // USDC token address for distributions
    {
      gasLimit: 5000000, // Límite más alto
      gasPrice: 100000000
    }
  );
  await revenueDistributor.waitForDeployment();
  addresses.RevenueDistributor = await revenueDistributor.getAddress();
  console.log("✅ RevenueDistributor deployed to:", addresses.RevenueDistributor);

  // 5. Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");
  
  // Grant PROPERTY_ISSUER_ROLE to deployer (for demo purposes)
  const PROPERTY_ISSUER_ROLE = await propertyRegistry.PROPERTY_ISSUER_ROLE();
  await propertyRegistry.grantRole(PROPERTY_ISSUER_ROLE, deployer.address);
  console.log("✅ Granted PROPERTY_ISSUER_ROLE to deployer");

  // Grant VERIFIER_ROLE to SaleManager
  const VERIFIER_ROLE = await propertyRegistry.VERIFIER_ROLE();
  await propertyRegistry.grantRole(VERIFIER_ROLE, addresses.SaleManager);
  console.log("✅ Granted VERIFIER_ROLE to SaleManager");

  // 6. Transfer some USDC to deployer for testing
  const transferAmount = ethers.parseUnits("10000", 6); // 10k USDC
  await mockUSDC.transfer(deployer.address, transferAmount);
  console.log("✅ Transferred 10,000 USDC to deployer for testing");

  // 6. Save deployment addresses
  const deploymentInfo = {
    network: "worldchain-sepolia",
    chainId: 4801,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: addresses,
    gasUsed: {
      // These will be estimated values - actual gas used would need to be tracked during deployment
      PropertyRegistry: "~2,500,000",
      SaleManager: "~3,000,000", 
      RevenueDistributor: "~2,000,000",
      MockUSDC: "~1,500,000"
    }
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "worldchain-sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Generate .env.local content
  const envContent = `# World Chain Sepolia Deployment - ${new Date().toISOString()}

# Worldcoin Configuration  
NEXT_PUBLIC_WORLDCOIN_APP_ID=your_worldcoin_app_id_here
WORLDCOIN_APP_ID=your_worldcoin_app_id_here
WORLDCOIN_ACTION=signup

# World Chain Configuration
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/your_api_key
WORLD_CHAIN_SEPOLIA_RPC_URL=https://worldchain-sepolia.g.alchemy.com/v2/your_api_key
PRIVATE_KEY=your_private_key_here

# Smart Contract Addresses (World Chain Sepolia)
NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS=${addresses.PropertyRegistry}
NEXT_PUBLIC_SALE_MANAGER_ADDRESS=${addresses.SaleManager}
NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS=${addresses.RevenueDistributor}
NEXT_PUBLIC_USDC_ADDRESS=${addresses.USDC}

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=4801
NEXT_PUBLIC_RPC_URL=https://worldchain-sepolia.g.alchemy.com/v2/your_api_key
`;

  const envFile = path.join(__dirname, "../../ours-platform/.env.local.template");
  fs.writeFileSync(envFile, envContent);
  console.log("📝 Environment template created at:", envFile);

  console.log(`
🎉 Deployment completed successfully!

📋 Contract Addresses:
   PropertyRegistry: ${addresses.PropertyRegistry}
   SaleManager:      ${addresses.SaleManager}
   RevenueDistributor: ${addresses.RevenueDistributor}
   Mock USDC:        ${addresses.USDC}

🔗 Network: World Chain Sepolia (ChainID: 4801)
👤 Deployer: ${deployer.address}

📁 Next Steps:
   1. Copy the contract addresses to your .env.local file
   2. Update lib/contracts.ts with the new addresses
   3. Test the integration with the frontend
   4. Register your first property using the PropertyRegistry
   
🔍 View contracts on explorer:
   https://worldchain-sepolia.explorer.alchemy.com/address/${addresses.PropertyRegistry}
   https://worldchain-sepolia.explorer.alchemy.com/address/${addresses.SaleManager}
   https://worldchain-sepolia.explorer.alchemy.com/address/${addresses.RevenueDistributor}
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

module.exports = main;