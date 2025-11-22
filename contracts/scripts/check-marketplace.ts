const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking marketplace status...");

  // Contract addresses
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";

  // Get contract
  const propertyRegistry = await ethers.getContractAt("PropertyRegistry", PROPERTY_REGISTRY);

  // Check all properties
  const allProperties = await propertyRegistry.getAllProperties();
  console.log("📋 Total properties in registry:", allProperties.length);

  for (let i = 0; i < allProperties.length; i++) {
    const tokenAddress = allProperties[i];
    console.log(`\n🏢 Property ${i + 1}: ${tokenAddress}`);
    
    try {
      const propertyData = await propertyRegistry.properties(tokenAddress);
      console.log("   Name:", propertyData.name);
      console.log("   Location:", propertyData.location);
      console.log("   Status:", propertyData.status.toString());
      console.log("   Active:", propertyData.isActive);
      console.log("   Total Supply:", ethers.formatUnits(propertyData.totalTokenSupply, 0), "tokens");
      console.log("   Investment Target: $", ethers.formatUnits(propertyData.totalInvestmentTarget, 6));
    } catch (err) {
      console.log("   ❌ Error reading property data:", err.message);
    }
  }

  console.log("\n✅ Marketplace check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });