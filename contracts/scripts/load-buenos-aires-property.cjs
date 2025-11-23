const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🏢 Cargando propiedad de Buenos Aires al PropertyRegistry...\n");

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
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/MockERC20.sol/MockERC20.json"))
  ).abi;

  const mockERC3643ABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/MockERC3643Token.sol/MockERC3643Token.json"))
  ).abi;

  // Connect to contracts
  const propertyRegistry = new ethers.Contract(PROPERTY_REGISTRY, propertyRegistryABI, wallet);
  const saleManager = new ethers.Contract(SALE_MANAGER, saleManagerABI, wallet);
  const mockUSDC = new ethers.Contract(USDC_ADDRESS, mockUSDCABI, wallet);

  // Fix SaleManager configuration if needed
  console.log("\n🔧 Verificando configuración del SaleManager...");
  const currentRegistry = await saleManager.propertyRegistry();
  if (currentRegistry.toLowerCase() !== PROPERTY_REGISTRY.toLowerCase()) {
    console.log(`   Current registry: ${currentRegistry}`);
    console.log(`   Expected registry: ${PROPERTY_REGISTRY}`);
    console.log("⏳ Arreglando dirección del PropertyRegistry en SaleManager...");
    const fixTx = await saleManager.setPropertyRegistry(PROPERTY_REGISTRY);
    await fixTx.wait();
    console.log("✅ ¡Dirección del PropertyRegistry arreglada!");
  } else {
    console.log("✅ La dirección del PropertyRegistry es correcta");
  }

  // 1. Grant PROPERTY_ISSUER_ROLE to wallet if needed
  console.log("\n🔑 Verificando roles...");
  const PROPERTY_ISSUER_ROLE = ethers.id("PROPERTY_ISSUER_ROLE");
  const hasRole = await propertyRegistry.hasRole(PROPERTY_ISSUER_ROLE, wallet.address);
  
  if (!hasRole) {
    console.log("⏳ Otorgando PROPERTY_ISSUER_ROLE a la wallet...");
    const grantTx = await propertyRegistry.grantRole(PROPERTY_ISSUER_ROLE, wallet.address);
    await grantTx.wait();
    console.log("✅ ¡Rol otorgado!");
  } else {
    console.log("✅ Ya tiene PROPERTY_ISSUER_ROLE");
  }

  // 2. Deploy mock property token para Buenos Aires
  console.log("\n🏗️ Desplegando token de propiedad de Buenos Aires...");
  const MockERC3643Factory = new ethers.ContractFactory(
    mockERC3643ABI,
    JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/MockERC3643Token.sol/MockERC3643Token.json"))).bytecode,
    wallet
  );
  
  const propertyToken = await MockERC3643Factory.deploy(
    "Palermo Loft Tokens",
    "PALERMO"
  );
  await propertyToken.waitForDeployment();
  const tokenAddress = await propertyToken.getAddress();
  console.log("✅ Token de propiedad desplegado:", tokenAddress);

  // 3. Register Buenos Aires property
  console.log("\n📋 Registrando propiedad de Buenos Aires...");
  const now = Math.floor(Date.now() / 1000);
  const propertyParams = {
    token: tokenAddress,
    issuer: wallet.address,
    name: "Modern Palermo Loft",
    location: "Palermo, Buenos Aires, Argentina",
    totalArea: ethers.parseUnits("85", 0), // 85 m²
    units: ethers.parseUnits("1", 0), // 1 unidad (loft completo)
    constructionStart: BigInt(now - 86400 * 180), // 6 meses atrás
    estimatedCompletion: BigInt(now + 86400 * 90), // 3 meses desde ahora
    actualCompletion: BigInt(0),
    status: 1, // InConstruction
    ipfsHash: "QmPalermoLoftMetadataHashExample123456789",
    cadastralNumber: `BSAS-PAL-${Date.now()}`,
    legalOwner: wallet.address,
    totalTokenSupply: ethers.parseUnits("10000", 0), // 10,000 tokens fraccionados
    totalInvestmentTarget: ethers.parseUnits("100", 6), // $100 USDC target total
    estimatedSalePrice: ethers.parseUnits("120", 6) // $120 USDC precio estimado de venta
  };

  const registerTx = await propertyRegistry.registerProperty(propertyParams);
  console.log("⏳ Esperando confirmación...");
  await registerTx.wait();
  console.log("✅ ¡Propiedad registrada!");

  // 4. Grant PROPERTY_ISSUER_ROLE for SaleManager if needed
  console.log("\n🔑 Verificando roles del SaleManager...");
  const hasSaleRole = await saleManager.hasRole(PROPERTY_ISSUER_ROLE, wallet.address);
  
  if (!hasSaleRole) {
    console.log("⏳ Otorgando PROPERTY_ISSUER_ROLE para SaleManager...");
    const grantSaleTx = await saleManager.grantRole(PROPERTY_ISSUER_ROLE, wallet.address);
    await grantSaleTx.wait();
    console.log("✅ ¡Rol otorgado!");
  } else {
    console.log("✅ Ya tiene PROPERTY_ISSUER_ROLE en SaleManager");
  }

  // 5. Verify property is ready for sale
  console.log("\n🔍 Verificando que la propiedad está lista para venta...");
  const [isReady, reason] = await saleManager.canCreateSale(tokenAddress);
  console.log(`   Lista: ${isReady}, Razón: ${reason}`);
  
  if (!isReady) {
    console.log(`❌ No se puede crear venta: ${reason}`);
    process.exit(1);
  }

  // 6. Create sale con precio súper barato de 0.01 USDC
  console.log("\n💰 Creando venta con precio de 0.01 USDC por token...");
  const pricePerToken = ethers.parseUnits("0.01", 6); // $0.01 USDC por token!
  const createSaleTx = await saleManager.createSale(tokenAddress, pricePerToken, {
    gasLimit: 500000
  });
  console.log("⏳ Esperando confirmación...");
  await createSaleTx.wait();
  console.log("✅ ¡Venta creada con éxito!");

  // 7. Mint USDC for testing
  console.log("\n💵 Minteando USDC para testing...");
  const mintAmount = ethers.parseUnits("1000", 6); // 1,000 USDC es suficiente
  const mintTx = await mockUSDC.mint(wallet.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Minteados 1,000 USDC");

  // 8. Verify
  console.log("\n🔍 Verificando...");
  const allProperties = await propertyRegistry.getAllProperties();
  console.log("📋 Total de propiedades:", allProperties.length);
  
  const propertyData = await propertyRegistry.properties(tokenAddress);
  const saleData = await saleManager.sales(tokenAddress);
  const balance = await mockUSDC.balanceOf(wallet.address);

  // Calculate total cost to buy all tokens
  const totalTokens = propertyData.totalTokenSupply;
  const totalCost = (totalTokens * saleData.pricePerToken) / ethers.parseUnits("1", 0);

  console.log(`
🎉 ¡ÉXITO! Propiedad de Buenos Aires cargada en blockchain

🏠 Detalles de la Propiedad:
   Token: ${tokenAddress}
   Nombre: ${propertyData.name}
   Ubicación: ${propertyData.location}
   Área: 85 m² (loft completo)
   Tokens: ${ethers.formatUnits(propertyData.totalTokenSupply, 0)} tokens
   Target: $${ethers.formatUnits(propertyData.totalInvestmentTarget, 6)}
   Precio estimado: $${ethers.formatUnits(propertyData.estimatedSalePrice, 6)}

💰 Detalles de Venta:
   Precio por Token: $${ethers.formatUnits(saleData.pricePerToken, 6)} USDC
   ¡SÚPER BARATO! Solo $0.01 por token
   Costo total para todos los tokens: $${ethers.formatUnits(totalCost, 6)} USDC
   Activa: ${saleData.isActive}

💵 Tu Balance: $${ethers.formatUnits(balance, 6)} USDC

🌟 Características de la Propiedad:
   🏙️ Moderno loft en Palermo (barrio trendy)
   🇦🇷 Buenos Aires, Argentina
   💰 Súper accesible a $0.01 por token
   📈 Gran oportunidad de inversión
   🏠 Loft completo de 85m²

🔗 Ver en Explorer:
   Property Token: https://worldchain-sepolia.explorer.alchemy.com/address/${tokenAddress}
   Property Registry: https://worldchain-sepolia.explorer.alchemy.com/address/${PROPERTY_REGISTRY}

✅ ¡Tu frontend ya puede leer esta propiedad desde el contrato!
🚀 Ahora puedes ir al marketplace y comprar tokens por solo $0.01 cada uno
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  });