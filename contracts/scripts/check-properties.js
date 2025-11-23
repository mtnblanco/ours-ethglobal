const { ethers } = require("ethers");

async function main() {
  console.log("🔍 Checking properties in PropertyRegistry...\n");

  // Configuración
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const RPC_URL = process.env.WORLDCHAIN_SEPOLIA_RPC || "https://worldchain-sepolia.g.alchemy.com/public";

  // Conectar al provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // ABI mínimo necesario
  const abi = [
    "function getAllProperties() external view returns (address[] memory)",
    "function propertyCount() external view returns (uint256)",
    "function properties(address token) external view returns (address token, address issuer, string memory name, string memory location, uint256 totalArea, uint256 units, uint256 constructionStart, uint256 estimatedCompletion, uint256 actualCompletion, uint8 status, string memory ipfsHash, string memory cadastralNumber, address legalOwner, uint256 registeredAt, bool isActive, uint256 totalTokenSupply, uint256 totalInvestmentTarget, uint256 estimatedSalePrice)"
  ];

  // Crear instancia del contrato
  const registry = new ethers.Contract(PROPERTY_REGISTRY, abi, provider);

  try {
    // Obtener contador
    const count = await registry.propertyCount();
    console.log(`📊 Total de propiedades: ${count.toString()}`);

    // Obtener lista de propiedades
    const allProperties = await registry.getAllProperties();
    console.log(`📋 Direcciones encontradas: ${allProperties.length}\n`);

    if (allProperties.length === 0) {
      console.log("❌ No hay propiedades registradas todavía.");
      console.log("\n💡 Para cargar propiedades de demo, ejecutá:");
      console.log("   cd contracts");
      console.log("   npm pkg set type=module");
      console.log("   npx hardhat run scripts/create-demo-property.ts --network worldchain-sepolia");
      return;
    }

    // Mostrar detalles de cada propiedad
    for (let i = 0; i < allProperties.length; i++) {
      const tokenAddress = allProperties[i];
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🏢 PROPIEDAD ${i + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Token: ${tokenAddress}`);

      try {
        const property = await registry.properties(tokenAddress);
        
        console.log(`\n📝 Información básica:`);
        console.log(`   Nombre: ${property.name}`);
        console.log(`   Ubicación: ${property.location}`);
        console.log(`   Emisor: ${property.issuer}`);
        console.log(`   Activa: ${property.isActive ? '✅ Sí' : '❌ No'}`);
        
        console.log(`\n💰 Información financiera:`);
        console.log(`   Total Supply: ${ethers.formatUnits(property.totalTokenSupply, 0)} tokens`);
        console.log(`   Inversión Target: $${ethers.formatUnits(property.totalInvestmentTarget, 6)} USDC`);
        console.log(`   Precio Estimado Venta: $${ethers.formatUnits(property.estimatedSalePrice, 6)} USDC`);
        
        console.log(`\n🏗️ Construcción:`);
        const statusMap = ['Planning', 'InConstruction', 'Completed', 'Sold', 'Cancelled'];
        console.log(`   Estado: ${statusMap[property.status]}`);
        console.log(`   Área Total: ${property.totalArea.toString()} m²`);
        console.log(`   Unidades: ${property.units.toString()}`);
        
      } catch (err) {
        console.log(`   ❌ Error leyendo datos: ${err.message}`);
      }
    }

    console.log(`\n\n✅ Verificación completa!`);
    console.log(`\n🔗 Ver en el explorer:`);
    console.log(`   https://worldchain-sepolia.explorer.alchemy.com/address/${PROPERTY_REGISTRY}`);

  } catch (error) {
    console.error("\n❌ Error conectando al contrato:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

