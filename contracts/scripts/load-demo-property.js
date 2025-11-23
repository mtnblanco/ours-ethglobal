const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🏢 Creating demo property for marketplace...");
  console.log("📝 Using account:", deployer.address);

  // Contract addresses from deployment
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const SALE_MANAGER = "0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4";
  const USDC_ADDRESS = "0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388";

  // Get contracts
  const propertyRegistry = await ethers.getContractAt("PropertyRegistry", PROPERTY_REGISTRY);
  const saleManager = await ethers.getContractAt("SaleManager", SALE_MANAGER);
  const mockUSDC = await ethers.getContractAt("MockERC20", USDC_ADDRESS);

  // 1. Deploy a mock property token
  console.log("\n🏗️ Deploying demo property token...");
  const MockERC3643Factory = await ethers.getContractFactory("MockERC3643Token");
  const propertyToken = await MockERC3643Factory.deploy(
    "Skyline Tower Fractions",
    "SKYLINE"
  );
  await propertyToken.waitForDeployment();
  const tokenAddress = await propertyToken.getAddress();
  console.log("✅ Property token deployed:", tokenAddress);

  // 2. Register the property
  console.log("\n📋 Registering property in registry...");
  const now = Math.floor(Date.now() / 1000);
  const propertyParams = {
    token: tokenAddress,
    issuer: deployer.address,
    name: "Skyline Commercial Tower",
    location: "Financial District, New York",
    totalArea: ethers.parseUnits("15000", 0), // 15,000 sq ft
    units: ethers.parseUnits("50", 0), // 50 units
    constructionStart: BigInt(now - 86400 * 30), // 30 days ago
    estimatedCompletion: BigInt(now + 86400 * 365), // 1 year from now
    actualCompletion: BigInt(0),
    status: 1, // InConstruction
    ipfsHash: "QmSkylineTowerMetadataHashExample123456789",
    cadastralNumber: "NYC-FD-2024-001",
    legalOwner: deployer.address,
    totalTokenSupply: ethers.parseUnits("1000000", 0), // 1M tokens
    totalInvestmentTarget: ethers.parseUnits("50000000", 6), // $50M USDC
    estimatedSalePrice: ethers.parseUnits("62000000", 6) // $62M USDC
  };

  const registerTx = await propertyRegistry.registerProperty(propertyParams);
  await registerTx.wait();
  console.log("✅ Property registered successfully");

  // 3. Create a sale for the property
  console.log("\n💰 Creating sale for the property...");
  const pricePerToken = ethers.parseUnits("50", 6); // $50 USDC per token
  
  const createSaleTx = await saleManager.createSale(tokenAddress, pricePerToken);
  await createSaleTx.wait();
  console.log("✅ Sale created successfully");

  // 4. Mint some USDC to the deployer for testing purchases
  console.log("\n💵 Minting USDC for testing...");
  const mintAmount = ethers.parseUnits("100000", 6); // 100k USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("✅ Minted 100,000 USDC to deployer");

  // 5. Verify everything is set up correctly
  console.log("\n🔍 Verifying setup...");
  
  const allProperties = await propertyRegistry.getAllProperties();
  console.log("📋 Total properties in registry:", allProperties.length);
  console.log("🏢 Our property address:", tokenAddress);
  
  const propertyData = await propertyRegistry.properties(tokenAddress);
  console.log("📊 Property name:", propertyData.name);
  console.log("📍 Location:", propertyData.location);
  
  const saleData = await saleManager.sales(tokenAddress);
  console.log("💰 Price per token:", ethers.formatUnits(saleData.pricePerToken, 6), "USDC");
  console.log("🔥 Sale active:", saleData.isActive);

  const deployerBalance = await mockUSDC.balanceOf(deployer.address);
  console.log("💵 Deployer USDC balance:", ethers.formatUnits(deployerBalance, 6), "USDC");

  console.log(`
🎉 Demo property created successfully!

📋 Property Details:
   Token Address: ${tokenAddress}
   Name: ${propertyData.name}
   Location: ${propertyData.location}
   Total Supply: ${ethers.formatUnits(propertyData.totalTokenSupply, 0)} tokens
   Investment Target: $${ethers.formatUnits(propertyData.totalInvestmentTarget, 6)}
   Estimated Sale Price: $${ethers.formatUnits(propertyData.estimatedSalePrice, 6)}

💰 Sale Details:
   Price per Token: $${ethers.formatUnits(saleData.pricePerToken, 6)} USDC
   Sale Active: ${saleData.isActive}

🔗 Next Steps:
   1. Start the frontend: cd ours-platform && npm run dev
   2. Connect your wallet with World Chain Sepolia
   3. The property should appear in the marketplace
   4. You can purchase tokens using the USDC you have

🌐 View on Explorer:
   Property Token: https://worldchain-sepolia.explorer.alchemy.com/address/${tokenAddress}
   Property Registry: https://worldchain-sepolia.explorer.alchemy.com/address/${PROPERTY_REGISTRY}
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo setup failed:", error);
    process.exit(1);
  });

