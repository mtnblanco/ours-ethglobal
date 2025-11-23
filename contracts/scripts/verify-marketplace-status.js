const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🔍 VERIFICACIÓN COMPLETA DEL MARKETPLACE\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Configuration
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const SALE_MANAGER = "0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4";
  const USDC_ADDRESS = "0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388";
  const KYC_ISSUER = "0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE";
  
  const RPC_URL = process.env.WORLD_CHAIN_SEPOLIA_RPC_URL || "https://worldchain-sepolia.g.alchemy.com/public";
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Load ABIs
  const propertyRegistryABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/PropertyRegistry.sol/PropertyRegistry.json"))
  ).abi;
  
  const saleManagerABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/SaleManager.sol/SaleManager.json"))
  ).abi;

  const kycIssuerABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/ChainlinkKYCIssuer.sol/ChainlinkKYCIssuer.json"))
  ).abi;

  // Connect to contracts
  const propertyRegistry = new ethers.Contract(PROPERTY_REGISTRY, propertyRegistryABI, provider);
  const saleManager = new ethers.Contract(SALE_MANAGER, saleManagerABI, provider);
  const kycIssuer = new ethers.Contract(KYC_ISSUER, kycIssuerABI, provider);

  // Get all properties
  const allProperties = await propertyRegistry.getAllProperties();
  console.log(`📊 TOTAL DE PROPIEDADES: ${allProperties.length}\n`);

  let propertiesWithSales = 0;
  let propertiesWithoutSales = 0;
  let activeSales = 0;
  let inactiveSales = 0;
  const propertiesNeedingSales = [];

  // Check each property
  for (let i = 0; i < allProperties.length; i++) {
    const tokenAddress = allProperties[i];
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏢 PROPIEDAD ${i + 1}: ${tokenAddress}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      // Get property data
      const property = await propertyRegistry.properties(tokenAddress);
      console.log(`📝 Nombre: ${property.name}`);
      console.log(`📍 Ubicación: ${property.location}`);
      console.log(`✅ Activa: ${property.isActive ? 'Sí' : 'No'}`);
      console.log(`💰 Supply: ${ethers.formatUnits(property.totalTokenSupply, 0)} tokens`);
      console.log(`💵 Target: $${ethers.formatUnits(property.totalInvestmentTarget, 6)}`);

      // Check if sale exists
      const saleExists = await saleManager.saleExists(tokenAddress);
      
      if (saleExists) {
        propertiesWithSales++;
        const sale = await saleManager.sales(tokenAddress);
        console.log(`\n💰 VENTA:`);
        console.log(`   Estado: ${sale.isActive ? '✅ ACTIVA' : '❌ INACTIVA'}`);
        console.log(`   Precio: $${ethers.formatUnits(sale.pricePerToken, 6)} USDC/token`);
        console.log(`   Total Recaudado: $${ethers.formatUnits(sale.totalRaised, 6)}`);
        console.log(`   Issuer: ${sale.issuer}`);
        
        if (sale.isActive) {
          activeSales++;
        } else {
          inactiveSales++;
        }
      } else {
        propertiesWithoutSales++;
        console.log(`\n❌ SIN VENTA CREADA`);
        
        // Check if can create sale
        try {
          const [canCreate, reason] = await saleManager.canCreateSale(tokenAddress);
          console.log(`   ¿Puede crear venta?: ${canCreate ? '✅' : '❌'} - ${reason}`);
          
          if (canCreate) {
            propertiesNeedingSales.push({
              token: tokenAddress,
              name: property.name
            });
          }
        } catch (err) {
          console.log(`   Error verificando: ${err.message}`);
        }
      }

      console.log();
    } catch (err) {
      console.log(`❌ Error leyendo propiedad: ${err.message}\n`);
    }
  }

  // Summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMEN`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Total propiedades: ${allProperties.length}`);
  console.log(`Con ventas: ${propertiesWithSales}`);
  console.log(`Sin ventas: ${propertiesWithoutSales}`);
  console.log(`Ventas activas: ${activeSales}`);
  console.log(`Ventas inactivas: ${inactiveSales}`);

  // Check KYC configuration
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔐 CONFIGURACIÓN KYC`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  try {
    const totalKYCs = await kycIssuer.totalKYCsApproved();
    console.log(`✅ KYCs aprobados: ${totalKYCs.toString()}`);
    
    const configuredKYC = await saleManager.kycIssuer();
    console.log(`✅ KYC Issuer configurado en SaleManager: ${configuredKYC}`);
    
    if (configuredKYC.toLowerCase() === KYC_ISSUER.toLowerCase()) {
      console.log(`✅ Dirección correcta`);
    } else {
      console.log(`❌ Dirección incorrecta! Esperado: ${KYC_ISSUER}`);
    }
  } catch (err) {
    console.log(`❌ Error verificando KYC: ${err.message}`);
  }

  // Recommendations
  if (propertiesNeedingSales.length > 0) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`⚠️  PROPIEDADES SIN VENTA (${propertiesNeedingSales.length})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    propertiesNeedingSales.forEach((prop, idx) => {
      console.log(`${idx + 1}. ${prop.name}`);
      console.log(`   Token: ${prop.token}\n`);
    });
    
    console.log(`💡 Para crear ventas, ejecutá:`);
    console.log(`   node scripts/create-sales-for-properties.js`);
  }

  if (activeSales > 0) {
    console.log(`\n✅ El marketplace está listo con ${activeSales} venta(s) activa(s)!`);
    console.log(`\n🔗 Puedes ver las propiedades en:`);
    console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${PROPERTY_REGISTRY}`);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });

