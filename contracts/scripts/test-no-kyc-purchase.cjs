const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🏢 Creando propiedad en el nuevo SaleManager (SIN KYC)...\n");

  // Configuration - NUEVO SALEMANAGER CON KYC BYPASSED
  const PROPERTY_REGISTRY = "0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6";
  const NEW_SALE_MANAGER = "0xF7AdA21247C75778E661059586b5527E0aA3b25f"; // NUEVO!
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
  const saleManager = new ethers.Contract(NEW_SALE_MANAGER, saleManagerABI, wallet); // NUEVO CONTRATO
  const mockUSDC = new ethers.Contract(USDC_ADDRESS, mockUSDCABI, wallet);

  console.log("\n🔧 Usando NUEVO SaleManager con KYC bypasseado:", NEW_SALE_MANAGER);

  // 1. Deploy mock property token para test sin KYC
  console.log("\n🏗️ Desplegando token de propiedad para testing sin KYC...");
  const MockERC3643Factory = new ethers.ContractFactory(
    mockERC3643ABI,
    JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/MockERC3643Token.sol/MockERC3643Token.json"))).bytecode,
    wallet
  );
  
  const propertyToken = await MockERC3643Factory.deploy(
    "Test Property No-KYC",
    "TESTPROP"
  );
  await propertyToken.waitForDeployment();
  const tokenAddress = await propertyToken.getAddress();
  console.log("✅ Token de propiedad desplegado:", tokenAddress);

  // 2. Register test property
  console.log("\n📋 Registrando propiedad de testing...");
  const now = Math.floor(Date.now() / 1000);
  const propertyParams = {
    token: tokenAddress,
    issuer: wallet.address,
    name: "Test Property (No KYC Required)",
    location: "Virtual Test Location",
    totalArea: ethers.parseUnits("100", 0),
    units: ethers.parseUnits("1", 0),
    constructionStart: BigInt(now - 86400 * 30),
    estimatedCompletion: BigInt(now + 86400 * 90),
    actualCompletion: BigInt(0),
    status: 1, // InConstruction
    ipfsHash: "QmTestPropertyNoKYCHash123456789",
    cadastralNumber: `TEST-NOKYC-${Date.now()}`,
    legalOwner: wallet.address,
    totalTokenSupply: ethers.parseUnits("1000", 0), // 1,000 tokens
    totalInvestmentTarget: ethers.parseUnits("10", 6), // $10 USDC target total
    estimatedSalePrice: ethers.parseUnits("15", 6) // $15 USDC estimated sale price
  };

  const registerTx = await propertyRegistry.registerProperty(propertyParams);
  console.log("⏳ Esperando confirmación...");
  await registerTx.wait();
  console.log("✅ ¡Propiedad registrada!");

  // 3. Create sale con precio súper barato
  console.log("\n💰 Creando venta (SIN verificación KYC)...");
  const pricePerToken = ethers.parseUnits("0.01", 6); // $0.01 USDC por token
  
  const createSaleTx = await saleManager.createSale(tokenAddress, pricePerToken, {
    gasLimit: 500000
  });
  console.log("⏳ Esperando confirmación...");
  await createSaleTx.wait();
  console.log("✅ ¡Venta creada exitosamente!");

  // 4. Mint USDC for testing
  console.log("\n💵 Minteando USDC para testing...");
  const mintAmount = ethers.parseUnits("100", 6); // 100 USDC
  const mintTx = await mockUSDC.mint(wallet.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Minteados 100 USDC");

  // 5. Test purchase WITHOUT KYC (esto debe funcionar ahora)
  console.log("\n🛒 PROBANDO COMPRA SIN KYC...");
  
  // Aprobar USDC al SaleManager
  const approveTx = await mockUSDC.approve(NEW_SALE_MANAGER, ethers.parseUnits("1", 6));
  await approveTx.wait();
  console.log("✅ USDC aprobado");
  
  try {
    // Intentar comprar 1 token (esto debería funcionar sin KYC)
    const buyTx = await saleManager.buyFractions(tokenAddress, 1, {
      gasLimit: 500000
    });
    await buyTx.wait();
    console.log("🎉 ¡COMPRA EXITOSA SIN KYC! El bypass funciona correctamente");
  } catch (error) {
    console.error("❌ Error en compra:", error.message);
    if (error.message.includes("KYCNotVerified")) {
      console.error("🔴 ERROR: El KYC bypass NO está funcionando");
    }
  }

  // 6. Verificar resultados
  console.log("\n🔍 Verificando resultados...");
  
  const saleData = await saleManager.sales(tokenAddress);
  const balance = await mockUSDC.balanceOf(wallet.address);
  const tokenBalance = await propertyToken.balanceOf(wallet.address);

  console.log(`
🎉 ¡TESTING COMPLETADO!

📋 Propiedad de Testing:
   Token Address: ${tokenAddress}
   Name: ${propertyParams.name}
   Location: ${propertyParams.location}
   Tokens: 1,000 tokens
   Precio: $0.01 USDC por token

💰 Venta (SIN KYC):
   SaleManager: ${NEW_SALE_MANAGER}
   Precio por Token: $${ethers.formatUnits(saleData.pricePerToken, 6)} USDC
   Total Recaudado: $${ethers.formatUnits(saleData.totalRaised, 6)} USDC
   Activa: ${saleData.isActive}

👤 Tu Balance:
   USDC: $${ethers.formatUnits(balance, 6)}
   Property Tokens: ${ethers.formatUnits(tokenBalance, 0)}

✅ KYC BYPASS STATUS: ${tokenBalance > 0 ? "FUNCIONANDO ✅" : "NO FUNCIONANDO ❌"}

🔗 Contratos:
   Property Token: https://worldchain-sepolia.explorer.alchemy.com/address/${tokenAddress}
   SaleManager (No-KYC): https://worldchain-sepolia.explorer.alchemy.com/address/${NEW_SALE_MANAGER}
   Property Registry: https://worldchain-sepolia.explorer.alchemy.com/address/${PROPERTY_REGISTRY}

🚀 Ahora puedes usar el frontend con esta configuración:
   - SaleManager: ${NEW_SALE_MANAGER}
   - Cualquier usuario puede comprar sin KYC
   - Perfecto para demos y testing
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  });