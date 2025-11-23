const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🏢 Loading demo property to PropertyRegistry...\n");

  // Configuration
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const SALE_MANAGER = "0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4";
  const USDC_ADDRESS = "0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388";
  
  const RPC_URL = process.env.WORLD_CHAIN_SEPOLIA_RPC_URL || "https://worldchain-sepolia.g.alchemy.com/public";
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    process.exit(1);
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("📝 Using account:", wallet.address);

  // Load ABIs
  const propertyRegistryABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/PropertyRegistry.sol/PropertyRegistry.json"))
  ).abi;
  
  const saleManagerABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/SaleManager.sol/SaleManager.json"))
  ).abi;
  
  const mockUSDCABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../cache/test-artifacts/test/mocks/MockERC20.sol/MockERC20.json"))
  ).abi;

  const mockERC3643ABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../cache/test-artifacts/test/mocks/MockERC3643Token.sol/MockERC3643Token.json"))
  ).abi;

  // Connect to contracts
  const propertyRegistry = new ethers.Contract(PROPERTY_REGISTRY, propertyRegistryABI, wallet);
  const saleManager = new ethers.Contract(SALE_MANAGER, saleManagerABI, wallet);
  const mockUSDC = new ethers.Contract(USDC_ADDRESS, mockUSDCABI, wallet);

  // Fix SaleManager configuration if needed
  console.log("\n🔧 Verifying SaleManager configuration...");
  const currentRegistry = await saleManager.propertyRegistry();
  if (currentRegistry.toLowerCase() !== PROPERTY_REGISTRY.toLowerCase()) {
    console.log(`   Current registry: ${currentRegistry}`);
    console.log(`   Expected registry: ${PROPERTY_REGISTRY}`);
    console.log("⏳ Fixing PropertyRegistry address in SaleManager...");
    const fixTx = await saleManager.setPropertyRegistry(PROPERTY_REGISTRY);
    await fixTx.wait();
    console.log("✅ PropertyRegistry address fixed!");
  } else {
    console.log("✅ PropertyRegistry address is correct");
  }

  // 1. Grant PROPERTY_ISSUER_ROLE to wallet if needed
  console.log("\n🔑 Checking roles...");
  const PROPERTY_ISSUER_ROLE = ethers.id("PROPERTY_ISSUER_ROLE");
  const hasRole = await propertyRegistry.hasRole(PROPERTY_ISSUER_ROLE, wallet.address);
  
  if (!hasRole) {
    console.log("⏳ Granting PROPERTY_ISSUER_ROLE to wallet...");
    const grantTx = await propertyRegistry.grantRole(PROPERTY_ISSUER_ROLE, wallet.address);
    await grantTx.wait();
    console.log("✅ Role granted!");
  } else {
    console.log("✅ Already has PROPERTY_ISSUER_ROLE");
  }

  // 2. Deploy mock property token
  console.log("\n🏗️ Deploying property token...");
  const MockERC3643Factory = new ethers.ContractFactory(
    mockERC3643ABI,
    JSON.parse(fs.readFileSync(path.join(__dirname, "../cache/test-artifacts/test/mocks/MockERC3643Token.sol/MockERC3643Token.json"))).bytecode,
    wallet
  );
  
  const propertyToken = await MockERC3643Factory.deploy(
    "Tito Baratito",
    "BARATO"
  );
  await propertyToken.waitForDeployment();
  const tokenAddress = await propertyToken.getAddress();
  console.log("✅ Property token deployed:", tokenAddress);

  // 3. Register property
  console.log("\n📋 Registering property...");
  const now = Math.floor(Date.now() / 1000);
  const propertyParams = {
    token: tokenAddress,
    issuer: wallet.address,
    name: "TITO BARATITO",
    location: "Financial District, New York",
    totalArea: ethers.parseUnits("15000", 0),
    units: ethers.parseUnits("50", 0),
    constructionStart: BigInt(now - 86400 * 30),
    estimatedCompletion: BigInt(now + 86400 * 365),
    actualCompletion: BigInt(0),
    status: 1,
    ipfsHash: "QmSkylineTowerMetadataHashExample123456789",
    cadastralNumber: `NYC-FD-${Date.now()}`,
    legalOwner: wallet.address,
    totalTokenSupply: ethers.parseUnits("1000000", 0),
    totalInvestmentTarget: ethers.parseUnits("50000000", 6),
    estimatedSalePrice: ethers.parseUnits("62000000", 6)
  };

  const registerTx = await propertyRegistry.registerProperty(propertyParams);
  console.log("⏳ Waiting for confirmation...");
  await registerTx.wait();
  console.log("✅ Property registered!");

  // 4. Grant PROPERTY_ISSUER_ROLE for SaleManager if needed
  console.log("\n🔑 Checking SaleManager roles...");
  const hasSaleRole = await saleManager.hasRole(PROPERTY_ISSUER_ROLE, wallet.address);
  
  if (!hasSaleRole) {
    console.log("⏳ Granting PROPERTY_ISSUER_ROLE for SaleManager...");
    const grantSaleTx = await saleManager.grantRole(PROPERTY_ISSUER_ROLE, wallet.address);
    await grantSaleTx.wait();
    console.log("✅ Role granted!");
  } else {
    console.log("✅ Already has PROPERTY_ISSUER_ROLE in SaleManager");
  }

  // 5. Verify property is ready for sale
  console.log("\n🔍 Verifying property is ready for sale...");
  const [isReady, reason] = await saleManager.canCreateSale(tokenAddress);
  console.log(`   Ready: ${isReady}, Reason: ${reason}`);
  
  if (!isReady) {
    console.log(`❌ Cannot create sale: ${reason}`);
    process.exit(1);
  }

  // 6. Create sale
  console.log("\n💰 Creating sale...");
  const pricePerToken = ethers.parseUnits("50", 6);
  const createSaleTx = await saleManager.createSale(tokenAddress, pricePerToken, {
    gasLimit: 500000
  });
  console.log("⏳ Waiting for confirmation...");
  await createSaleTx.wait();
  console.log("✅ Sale created!");

  // 7. Mint USDC for testing
  console.log("\n💵 Minting USDC for testing...");
  const mintAmount = ethers.parseUnits("100000", 6);
  const mintTx = await mockUSDC.mint(wallet.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Minted 100,000 USDC");

  // 8. Verify
  console.log("\n🔍 Verifying...");
  const allProperties = await propertyRegistry.getAllProperties();
  console.log("📋 Total properties:", allProperties.length);
  
  const propertyData = await propertyRegistry.properties(tokenAddress);
  const saleData = await saleManager.sales(tokenAddress);
  const balance = await mockUSDC.balanceOf(wallet.address);

  console.log(`
🎉 SUCCESS! Property loaded to blockchain

📋 Property Details:
   Token: ${tokenAddress}
   Name: ${propertyData.name}
   Location: ${propertyData.location}
   Supply: ${ethers.formatUnits(propertyData.totalTokenSupply, 0)} tokens
   Target: $${ethers.formatUnits(propertyData.totalInvestmentTarget, 6)}

💰 Sale Details:
   Price: $${ethers.formatUnits(saleData.pricePerToken, 6)} USDC/token
   Active: ${saleData.isActive}

💵 Your Balance: $${ethers.formatUnits(balance, 6)} USDC

🔗 View on Explorer:
   https://worldchain-sepolia.explorer.alchemy.com/address/${tokenAddress}
   https://worldchain-sepolia.explorer.alchemy.com/address/${PROPERTY_REGISTRY}

✅ Tu frontend ya puede leer esta propiedad del contrato!
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });

