const { ethers } = require("hardhat");

// Script para registrar una propiedad de prueba después del despliegue
async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Lee las direcciones desde el archivo de despliegue
  const fs = require("fs");
  const path = require("path");
  
  const deploymentFile = path.join(__dirname, "../deployments/worldchain-sepolia.json");
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    console.log("Run: npm run deploy:sepolia");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contracts = deployment.contracts;
  
  console.log("📋 Using deployed contracts:");
  console.log("   PropertyRegistry:", contracts.PropertyRegistry);
  console.log("   SaleManager:", contracts.SaleManager);
  console.log("   USDC:", contracts.USDC);
  
  // Conectar a los contratos
  const propertyRegistry = await ethers.getContractAt("PropertyRegistry", contracts.PropertyRegistry);
  const saleManager = await ethers.getContractAt("SaleManager", contracts.SaleManager);
  const usdc = await ethers.getContractAt("MockERC20", contracts.USDC);
  
  // 1. Crear un token ERC3643 mock (simplificado para demo)
  console.log("\n🏗️ Deploying mock property token...");
  const mockPropertyToken = await ethers.deployContract("MockERC3643Token", [
    "Skyline Tower Tokens", // name
    "SKYLINE",              // symbol
    18,                     // decimals
    ethers.parseEther("1000000") // 1M tokens total supply
  ]);
  await mockPropertyToken.waitForDeployment();
  const tokenAddress = await mockPropertyToken.getAddress();
  console.log("✅ Mock property token deployed to:", tokenAddress);
  
  // 2. Registrar la propiedad en PropertyRegistry
  console.log("\n🏢 Registering property...");
  const registerTx = await propertyRegistry.registerProperty(
    tokenAddress,                                      // token
    "Skyline Commercial Tower",                        // name
    "Financial District, New York, NY",               // location
    15000,                                             // totalArea (sq ft)
    50,                                                // units
    Math.floor(Date.now() / 1000) - 86400 * 30,      // constructionStart (30 days ago)
    Math.floor(Date.now() / 1000) + 86400 * 365,     // estimatedCompletion (1 year from now)
    "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",    // ipfsHash
    "NYC-2024-001"                                    // cadastralNumber
  );
  await registerTx.wait();
  console.log("✅ Property registered successfully!");
  
  // 3. Lanzar venta de tokens
  console.log("\n💰 Launching token sale...");
  const launchSaleTx = await saleManager.launchSale(
    tokenAddress,
    ethers.parseUnits("50", 6), // $50 USDC per token (6 decimals)
    true // isActive
  );
  await launchSaleTx.wait();
  console.log("✅ Token sale launched successfully!");
  
  // 4. Configurar allowances y fondos para testing
  console.log("\n🔧 Setting up test environment...");
  
  // Transfer some USDC to deployer for testing purchases
  const usdcAmount = ethers.parseUnits("50000", 6); // 50k USDC
  await usdc.transfer(deployer.address, usdcAmount);
  
  // Approve SaleManager to spend USDC for testing
  await usdc.approve(contracts.SaleManager, ethers.parseUnits("100000", 6));
  
  console.log("✅ Test environment configured!");
  
  // 5. Verificar que todo funciona
  console.log("\n🔍 Verifying setup...");
  const allProperties = await propertyRegistry.getAllProperties();
  console.log("📊 Total properties registered:", allProperties.length);
  
  if (allProperties.length > 0) {
    const propertyData = await propertyRegistry.properties(allProperties[0]);
    const saleData = await saleManager.sales(allProperties[0]);
    
    console.log("\n📋 Property Details:");
    console.log("   Name:", propertyData.name);
    console.log("   Location:", propertyData.location);
    console.log("   Token Address:", allProperties[0]);
    console.log("   Sale Active:", saleData.isActive);
    console.log("   Price per Token:", ethers.formatUnits(saleData.pricePerToken, 6), "USDC");
  }
  
  console.log(`
🎉 Setup Complete!

📝 Summary:
   ✅ Property registered: Skyline Commercial Tower
   ✅ Token sale active: $50 USDC per token  
   ✅ Test USDC available: 50,000 USDC
   ✅ Ready for frontend testing

🔗 Contract Addresses:
   PropertyRegistry: ${contracts.PropertyRegistry}
   SaleManager:      ${contracts.SaleManager}
   USDC:            ${contracts.USDC}
   Property Token:   ${tokenAddress}

📱 Next Steps:
   1. Update your frontend .env.local with these addresses
   2. Start the frontend: npm run dev
   3. Test the complete flow: World ID → Marketplace → Purchase Tokens
   
🌐 View on Explorer:
   https://worldchain-sepolia.explorer.alchemy.com/address/${contracts.PropertyRegistry}
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });

module.exports = main;