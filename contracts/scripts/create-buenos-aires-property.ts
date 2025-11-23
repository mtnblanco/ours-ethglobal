import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🏢 Creating Buenos Aires property for marketplace...");
  console.log("📝 Using account:", deployer.address);

  // Contract addresses - actualiza estos con las direcciones reales
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const SALE_MANAGER = "0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4";
  const USDC_ADDRESS = "0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388";

  // Get contracts
  const propertyRegistry = await hre.ethers.getContractAt("PropertyRegistry", PROPERTY_REGISTRY);
  const saleManager = await hre.ethers.getContractAt("SaleManager", SALE_MANAGER);
  const mockUSDC = await hre.ethers.getContractAt("MockERC20", USDC_ADDRESS);

  // 1. Deploy a mock property token for Buenos Aires property
  console.log("\n🏗️ Deploying Buenos Aires property token...");
  const MockERC3643Factory = await ethers.getContractFactory("MockERC3643Token");
  const propertyToken = await MockERC3643Factory.deploy(
    "Palermo Loft Tokens",
    "PALERMO",
    {
      gasLimit: 5000000,
      gasPrice: 100000000
    }
  );
  await propertyToken.waitForDeployment();
  const tokenAddress = await propertyToken.getAddress();
  console.log("✅ Property token deployed:", tokenAddress);

  // 2. Register the Buenos Aires property
  console.log("\n📋 Registering Buenos Aires property in registry...");
  const propertyParams = {
    token: tokenAddress,
    issuer: deployer.address,
    name: "Modern Palermo Loft",
    location: "Palermo, Buenos Aires, Argentina",
    totalArea: ethers.parseUnits("85", 0), // 85 m²
    units: ethers.parseUnits("1", 0), // 1 unit (loft completo)
    constructionStart: BigInt(Math.floor(Date.now() / 1000) - 86400 * 180), // 6 months ago
    estimatedCompletion: BigInt(Math.floor(Date.now() / 1000) + 86400 * 90), // 3 months from now
    actualCompletion: BigInt(0),
    status: 1, // InConstruction
    ipfsHash: "QmPalermoLoftMetadataHashExample123456789",
    cadastralNumber: "BSAS-PAL-2024-001",
    legalOwner: deployer.address,
    totalTokenSupply: ethers.parseUnits("10000", 0), // 10,000 tokens (fraccionado)
    totalInvestmentTarget: ethers.parseUnits("100", 6), // $100 USDC total target
    estimatedSalePrice: ethers.parseUnits("120", 6) // $120 USDC estimated sale price
  };

  const registerTx = await propertyRegistry.registerProperty(propertyParams, {
    gasLimit: 5000000,
    gasPrice: 100000000
  });
  await registerTx.wait();
  console.log("✅ Property registered successfully");

  // 3. Create a sale for the property with 0.01 USDC price
  console.log("\n💰 Creating sale for the Buenos Aires property...");
  const pricePerToken = ethers.parseUnits("0.01", 6); // $0.01 USDC per token
  
  const createSaleTx = await saleManager.createSale(tokenAddress, pricePerToken, {
    gasLimit: 3000000,
    gasPrice: 100000000
  });
  await createSaleTx.wait();
  console.log("✅ Sale created successfully with price 0.01 USDC per token");

  // 4. Mint some USDC to the deployer for testing purchases
  console.log("\n💵 Minting USDC for testing...");
  const mintAmount = ethers.parseUnits("1000", 6); // 1,000 USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("✅ Minted 1,000 USDC to deployer");

  // 5. Verify everything is set up correctly
  console.log("\n🔍 Verifying setup...");
  
  const allProperties = await propertyRegistry.getAllProperties();
  console.log("📋 Total properties in registry:", allProperties.length);
  console.log("🏢 Buenos Aires property address:", tokenAddress);
  
  const propertyData = await propertyRegistry.properties(tokenAddress);
  console.log("📊 Property name:", propertyData.name);
  console.log("📍 Location:", propertyData.location);
  
  const saleData = await saleManager.sales(tokenAddress);
  console.log("💰 Price per token:", ethers.formatUnits(saleData.pricePerToken, 6), "USDC");
  console.log("🔥 Sale active:", saleData.isActive);

  const deployerBalance = await mockUSDC.balanceOf(deployer.address);
  console.log("💵 Deployer USDC balance:", ethers.formatUnits(deployerBalance, 6), "USDC");

  console.log(`
🎉 Buenos Aires property created successfully!

📋 Property Details:
   Token Address: ${tokenAddress}
   Name: ${propertyData.name}
   Location: ${propertyData.location}
   Total Area: 85 m²
   Units: 1 (complete loft)
   Total Supply: ${ethers.formatUnits(propertyData.totalTokenSupply, 0)} tokens
   Investment Target: $${ethers.formatUnits(propertyData.totalInvestmentTarget, 6)}
   Estimated Sale Price: $${ethers.formatUnits(propertyData.estimatedSalePrice, 6)}

💰 Sale Details:
   Price per Token: $${ethers.formatUnits(saleData.pricePerToken, 6)} USDC
   Sale Active: ${saleData.isActive}
   Total to buy all tokens: $${ethers.formatUnits(propertyData.totalTokenSupply.mul(saleData.pricePerToken).div(ethers.parseUnits("1", 0)), 6)} USDC

🔗 Next Steps:
   1. Start the frontend: cd ours-platform && npm run dev
   2. Connect your wallet with World Chain Sepolia
   3. The Buenos Aires property should appear in the marketplace
   4. You can buy tokens for just $0.01 USDC each!

🏠 Property Features:
   🌟 Modern loft in trendy Palermo neighborhood
   🏙️ Buenos Aires, Argentina
   💰 Super affordable at $0.01 per token
   📈 Great investment opportunity
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error creating Buenos Aires property:");
    console.error(error);
    process.exit(1);
  });