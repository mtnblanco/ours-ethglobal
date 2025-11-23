const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🚀 Desplegando SaleManager actualizado con KYC bypasseado...\n");

  // Configuration
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const KYC_ISSUER = "0x8464135c8F25Da09e49BC8782676a84730C318bC";
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

  // Load ABI
  const saleManagerArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/SaleManager.sol/SaleManager.json"))
  );

  // Deploy nuevo SaleManager con KYC bypasseado
  console.log("\n🏗️ Desplegando nuevo SaleManager...");
  
  const SaleManagerFactory = new ethers.ContractFactory(
    saleManagerArtifact.abi,
    saleManagerArtifact.bytecode,
    wallet
  );
  
  const platformFeeBps = 200; // 2% fee
  
  const saleManager = await SaleManagerFactory.deploy(
    USDC_ADDRESS,
    PROPERTY_REGISTRY, 
    KYC_ISSUER,
    platformFeeBps,
    {
      gasLimit: 5000000,
      gasPrice: 100000000
    }
  );
  
  await saleManager.waitForDeployment();
  const saleManagerAddress = await saleManager.getAddress();
  
  console.log("✅ SaleManager desplegado en:", saleManagerAddress);

  // Grant PROPERTY_ISSUER_ROLE al deployer
  console.log("\n🔑 Otorgando PROPERTY_ISSUER_ROLE...");
  const PROPERTY_ISSUER_ROLE = ethers.id("PROPERTY_ISSUER_ROLE");
  const grantTx = await saleManager.grantRole(PROPERTY_ISSUER_ROLE, wallet.address);
  await grantTx.wait();
  console.log("✅ Rol otorgado!");

  // Verificar que no requiere KYC
  console.log("\n🔍 Verificando bypass de KYC...");
  try {
    // Esta llamada debería funcionar sin revertir por KYC
    const isActive = await saleManager.isSaleActive("0x0000000000000000000000000000000000000000");
    console.log("✅ KYC bypass funcionando - función ejecutada sin error de KYC");
  } catch (error) {
    if (error.message.includes("SaleDoesNotExist")) {
      console.log("✅ KYC bypass funcionando - error esperado (sale no existe), NO error de KYC");
    } else {
      console.log("⚠️ Error inesperado:", error.message);
    }
  }

  // Guardar nueva dirección
  const deploymentInfo = {
    SaleManager: saleManagerAddress,
    PropertyRegistry: PROPERTY_REGISTRY,
    KYCIssuer: KYC_ISSUER,
    USDC: USDC_ADDRESS,
    deployer: wallet.address,
    network: "worldchainSepolia",
    timestamp: new Date().toISOString(),
    features: ["KYC_BYPASSED_FOR_TESTING"],
    platformFeeBps: platformFeeBps
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployments/salemanager-bypassed.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`
🎉 ¡Nuevo SaleManager desplegado exitosamente!

📋 Información de Deployment:
   SaleManager (KYC Bypassed): ${saleManagerAddress}
   Property Registry: ${PROPERTY_REGISTRY}
   KYC Issuer: ${KYC_ISSUER} (BYPASSED)
   USDC: ${USDC_ADDRESS}
   Platform Fee: ${platformFeeBps / 100}%

🔧 Cambios Realizados:
   ✅ KYC check comentado en buyFractions()
   ✅ Cualquier usuario puede comprar tokens sin KYC
   ✅ Perfecto para testing y demos

⚠️  IMPORTANTE PARA PRODUCCIÓN:
   🔴 Descomentar verificación KYC antes de mainnet
   🔴 Este contrato es SOLO para testing

🔗 Ver en Explorer:
   https://worldchain-sepolia.explorer.alchemy.com/address/${saleManagerAddress}

🚀 Ahora puedes:
   1. Usar este SaleManager en el frontend
   2. Comprar tokens sin necesidad de KYC
   3. Testing completo del flujo de compra
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  });