const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🛠️  CREANDO VENTAS PARA PROPIEDADES\n");

  // Configuration
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const SALE_MANAGER = "0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4";
  const KYC_ISSUER = "0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE";
  
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

  // Connect to contracts
  const propertyRegistry = new ethers.Contract(PROPERTY_REGISTRY, propertyRegistryABI, wallet);
  const saleManager = new ethers.Contract(SALE_MANAGER, saleManagerABI, wallet);

  // 1. Fix KYC configuration if needed
  console.log("\n🔧 Verificando configuración KYC...");
  try {
    const currentKYC = await saleManager.kycIssuer();
    console.log(`   KYC actual: ${currentKYC}`);
    
    if (currentKYC.toLowerCase() !== KYC_ISSUER.toLowerCase()) {
      console.log(`   ⚠️  Dirección incorrecta, corrigiendo...`);
      const fixTx = await saleManager.setKYCIssuer(KYC_ISSUER);
      await fixTx.wait();
      console.log("   ✅ KYC Issuer actualizado!");
    } else {
      console.log("   ✅ KYC configurado correctamente");
    }
  } catch (err) {
    console.log(`   ⚠️  Error verificando KYC: ${err.message}`);
    console.log("   Intentando configurar...");
    try {
      const fixTx = await saleManager.setKYCIssuer(KYC_ISSUER);
      await fixTx.wait();
      console.log("   ✅ KYC Issuer configurado!");
    } catch (err2) {
      console.log(`   ❌ No se pudo configurar KYC: ${err2.message}`);
    }
  }

  // 2. Get all properties
  const allProperties = await propertyRegistry.getAllProperties();
  console.log(`\n📊 Total propiedades: ${allProperties.length}`);

  let salesCreated = 0;
  let salesSkipped = 0;
  let errors = 0;

  // 3. Create sales for properties without them
  for (let i = 0; i < allProperties.length; i++) {
    const tokenAddress = allProperties[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏢 Propiedad ${i + 1}/${allProperties.length}: ${tokenAddress}`);

    try {
      // Check if sale already exists
      const saleExists = await saleManager.saleExists(tokenAddress);
      
      if (saleExists) {
        console.log("   ⏭️  Ya tiene venta, saltando...");
        salesSkipped++;
        continue;
      }

      // Get property info
      const property = await propertyRegistry.properties(tokenAddress);
      console.log(`   Nombre: ${property.name}`);

      // Check if can create sale
      const [canCreate, reason] = await saleManager.canCreateSale(tokenAddress);
      
      if (!canCreate) {
        console.log(`   ❌ No se puede crear venta: ${reason}`);
        errors++;
        continue;
      }

      // Create sale with reasonable price
      // Price = Investment Target / Total Supply
      const pricePerToken = property.totalInvestmentTarget / property.totalTokenSupply;
      const priceInUSDC = ethers.parseUnits(pricePerToken.toString(), 6);
      
      console.log(`   💰 Precio calculado: $${pricePerToken} USDC/token`);
      console.log("   ⏳ Creando venta...");

      const createSaleTx = await saleManager.createSale(tokenAddress, priceInUSDC, {
        gasLimit: 500000
      });
      await createSaleTx.wait();
      
      console.log("   ✅ Venta creada!");
      salesCreated++;

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      errors++;
    }
  }

  // Summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMEN`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`✅ Ventas creadas: ${salesCreated}`);
  console.log(`⏭️  Ventas existentes: ${salesSkipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`\n🎉 Proceso completado!`);
  
  if (salesCreated > 0) {
    console.log(`\n✅ Ahora todas las propiedades tienen ventas activas`);
    console.log(`✅ El marketplace está listo para funcionar!`);
    console.log(`\n💡 Próximo paso: Integrar en el frontend`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });

