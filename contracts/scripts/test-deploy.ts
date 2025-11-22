const { ethers } = require("hardhat");

// Script simple para probar despliegue con un contrato básico
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🧪 Testing simple deployment...");
  console.log("📝 Deployer:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  // Primero probemos con MockERC20 que es más simple
  console.log("\n📄 Deploying simple MockERC20...");
  
  try {
    const mockERC20 = await ethers.deployContract("MockERC20", [
      "Test Token", 
      "TEST", 
      18,
      ethers.parseEther("1000")
    ], {
      gasLimit: 1000000,
      gasPrice: 100000000
    });
    
    await mockERC20.waitForDeployment();
    const address = await mockERC20.getAddress();
    console.log("✅ MockERC20 deployed successfully to:", address);
    
    // Si esto funciona, el problema está en PropertyRegistry específicamente
    console.log("\n🏢 Now trying PropertyRegistry...");
    
    const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    
    // Primero estimemos el gas real
    const estimatedGas = await PropertyRegistryFactory.getDeployTransaction().populateTransaction;
    console.log("📊 Deploy transaction data prepared");
    
    const propertyRegistry = await PropertyRegistryFactory.deploy({
      gasLimit: 5000000, // Límite más alto
      gasPrice: 100000000
    });
    
    await propertyRegistry.waitForDeployment();
    const propertyAddress = await propertyRegistry.getAddress();
    console.log("✅ PropertyRegistry deployed successfully to:", propertyAddress);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.receipt) {
      console.log("📄 Transaction receipt available:");
      console.log("   Status:", error.receipt.status);
      console.log("   Gas used:", error.receipt.gasUsed.toString());
      console.log("   Gas price:", error.receipt.gasPrice.toString());
    }
    
    // Vamos a probar con un método diferente
    console.log("\n🔄 Trying alternative deployment method...");
    try {
      const Factory = await ethers.getContractFactory("PropertyRegistry");
      const bytecode = Factory.bytecode;
      console.log("📦 Bytecode length:", bytecode.length);
      
      // Deploy con parámetros mínimos
      const contract = await Factory.deploy({
        gasLimit: 10000000, // Límite muy alto para debugging
        gasPrice: 100000000
      });
      
      console.log("⏳ Waiting for deployment...");
      await contract.waitForDeployment();
      
      console.log("✅ Alternative method worked!");
      console.log("📍 Address:", await contract.getAddress());
      
    } catch (altError) {
      console.error("❌ Alternative method also failed:", altError.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });

module.exports = main;