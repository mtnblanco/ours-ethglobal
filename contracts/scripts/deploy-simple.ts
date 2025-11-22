import { ethers } from 'ethers';
import fs from 'fs';

async function main() {
  // Connection setup
  const RPC_URL = "https://worldchain-sepolia.g.alchemy.com/v2/9LoW6D330D8KHv0K-u-yB";
  const PRIVATE_KEY = "0x2354cb39ddac1304a8f63053ebae9ee558d95507bf6fc774087719855cb4f5b5";
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("🚀 Deploying ChainlinkKYCIssuer to World Chain Sepolia...");
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no ETH. Please fund the account first.");
  }

  // Read the compiled contract
  const contractPath = './artifacts/contracts/ChainlinkKYCIssuer.sol/ChainlinkKYCIssuer.json';
  if (!fs.existsSync(contractPath)) {
    throw new Error(`❌ Contract not compiled. Run 'npm run compile' first.`);
  }

  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const contractAbi = contractArtifact.abi;
  const contractBytecode = contractArtifact.bytecode;

  // Configuration for World ID
  const WORLD_ID_CONFIG = {
    router: "0x11cA3127182f7583EfC416a8771BD4d11Fae4334", // World ID router on World Chain Sepolia
    appId: process.env.WORLDCOIN_APP_ID || "app_staging_b826d8b41fbc54b78b13e4f3b1b2f8e2",
    actionId: "kyc-verification"
  };

  // Mock IdentityRegistry address for now (we'll deploy it separately if needed)
  const IDENTITY_REGISTRY_ADDRESS = "0x0000000000000000000000000000000000000001"; // Placeholder

  console.log("📋 Constructor parameters:");
  console.log("  World ID Router:", WORLD_ID_CONFIG.router);
  console.log("  App ID:", WORLD_ID_CONFIG.appId);
  console.log("  Action ID:", WORLD_ID_CONFIG.actionId);
  console.log("  Identity Registry:", IDENTITY_REGISTRY_ADDRESS);

  try {
    // Create contract factory
    const factory = new ethers.ContractFactory(contractAbi, contractBytecode, deployer);

    console.log("⏳ Deploying contract...");

    // Deploy the contract
    const contract = await factory.deploy(
      WORLD_ID_CONFIG.router,
      WORLD_ID_CONFIG.appId,
      WORLD_ID_CONFIG.actionId,
      IDENTITY_REGISTRY_ADDRESS
    );

    console.log("📄 Transaction sent:", contract.deploymentTransaction()?.hash);

    // Wait for deployment to be mined
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("✅ ChainlinkKYCIssuer deployed to:", contractAddress);

    // Update deployment file
    const deploymentData = {
      timestamp: new Date().toISOString(),
      network: "worldchain-sepolia",
      deployer: deployer.address,
      contracts: {
        ChainlinkKYCIssuer: contractAddress,
      },
      config: WORLD_ID_CONFIG
    };

    const deploymentDir = './deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = `${deploymentDir}/worldchain-sepolia.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

    console.log("📁 Deployment data saved to:", deploymentFile);

    // Update frontend .env.local
    const envPath = '../ours-platform/.env.local';
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update KYC contract address
      if (envContent.includes('NEXT_PUBLIC_CHAINLINK_KYC_ISSUER_ADDRESS=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_CHAINLINK_KYC_ISSUER_ADDRESS=.*/,
          `NEXT_PUBLIC_CHAINLINK_KYC_ISSUER_ADDRESS=${contractAddress}`
        );
      } else {
        envContent += `\nNEXT_PUBLIC_CHAINLINK_KYC_ISSUER_ADDRESS=${contractAddress}\n`;
      }

      if (envContent.includes('NEXT_PUBLIC_KYC_ISSUER_ADDRESS=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_KYC_ISSUER_ADDRESS=.*/,
          `NEXT_PUBLIC_KYC_ISSUER_ADDRESS=${contractAddress}`
        );
      } else {
        envContent += `NEXT_PUBLIC_KYC_ISSUER_ADDRESS=${contractAddress}\n`;
      }

      fs.writeFileSync(envPath, envContent);
      console.log("📝 Updated frontend .env.local with new contract address");
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Contract Address:", contractAddress);
    console.log("🔗 Explorer:", `https://worldchain-sepolia.explorer.alchemy.com/address/${contractAddress}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });