const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script para desplegar ChainlinkKYCIssuer a World Chain Sepolia
 * 
 * Este script:
 * 1. Despliega ChainlinkKYCIssuer con configuración de World ID
 * 2. Configura roles necesarios (admin, operador)
 * 3. Guarda direcciones en archivo de deployment
 * 4. Actualiza .env.local del frontend
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying ChainlinkKYCIssuer to World Chain Sepolia...");
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no ETH. Please fund the account first.");
  }

  // Configuración para World ID (valores para World Chain Sepolia)
  const WORLD_ID_CONFIG = {
    // Router oficial de World ID en World Chain Sepolia
    router: "0x11cA3127182f7583EfC416a8771BD4d11Fae4334", // Placeholder - verificar dirección oficial
    appId: process.env.WORLDCOIN_APP_ID || "app_staging_b826d8b41fbc54b78b13e4f3b1b2f8e2",
    actionId: "kyc-verification"
  };

  // Leer direcciones de contratos existentes
  const deploymentFile = path.join(__dirname, "../deployments/worldchain-sepolia.json");
  let existingDeployment: any = { contracts: {} };
  
  if (fs.existsSync(deploymentFile)) {
    existingDeployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  }

  // Verificar que tenemos IdentityRegistry desplegado o usar mock
  let identityRegistryAddress = existingDeployment.contracts?.IdentityRegistry;
  
  if (!identityRegistryAddress) {
    console.log("⚠️  IdentityRegistry not found, deploying mock...");
    
    // Deploy mock IdentityRegistry for testing
    const MockIdentityRegistryFactory = await ethers.getContractFactory("MockIdentityRegistry");
    const mockIdentityRegistry = await MockIdentityRegistryFactory.deploy({
      gasLimit: 3000000,
      gasPrice: 100000000
    });
    
    await mockIdentityRegistry.waitForDeployment();
    identityRegistryAddress = await mockIdentityRegistry.getAddress();
    
    console.log("✅ MockIdentityRegistry deployed to:", identityRegistryAddress);
  } else {
    console.log("✅ Using existing IdentityRegistry:", identityRegistryAddress);
  }

  console.log("\n🔐 Deploying ChainlinkKYCIssuer...");
  console.log("   World ID Router:", WORLD_ID_CONFIG.router);
  console.log("   App ID:", WORLD_ID_CONFIG.appId);
  console.log("   Action ID:", WORLD_ID_CONFIG.actionId);
  console.log("   Identity Registry:", identityRegistryAddress);

  const ChainlinkKYCIssuerFactory = await ethers.getContractFactory("ChainlinkKYCIssuer");
  const kycIssuer = await ChainlinkKYCIssuerFactory.deploy(
    WORLD_ID_CONFIG.router,
    WORLD_ID_CONFIG.appId,
    WORLD_ID_CONFIG.actionId,
    identityRegistryAddress,
    {
      gasLimit: 5000000,
      gasPrice: 100000000
    }
  );

  console.log("⏳ Waiting for deployment...");
  await kycIssuer.waitForDeployment();
  
  const kycIssuerAddress = await kycIssuer.getAddress();
  console.log("✅ ChainlinkKYCIssuer deployed to:", kycIssuerAddress);

  // Verificar que el contrato se desplegó correctamente
  console.log("\n🔍 Verifying deployment...");
  const worldAppId = await kycIssuer.worldAppId();
  const totalKYCs = await kycIssuer.totalKYCsApproved();
  const defaultAdmin = await kycIssuer.hasRole(await kycIssuer.DEFAULT_ADMIN_ROLE(), deployer.address);
  
  console.log("   World App ID:", worldAppId);
  console.log("   Total KYCs Approved:", totalKYCs.toString());
  console.log("   Deployer is admin:", defaultAdmin);

  // Configurar roles adicionales si es necesario
  console.log("\n⚙️  Configuring roles...");
  
  // Otorgar rol de operador al deployer (para gestión)
  const operatorRole = await kycIssuer.OPERATOR_ROLE();
  const hasOperatorRole = await kycIssuer.hasRole(operatorRole, deployer.address);
  
  if (!hasOperatorRole) {
    console.log("   Granting OPERATOR_ROLE to deployer...");
    await kycIssuer.grantRole(operatorRole, deployer.address);
  }

  // Guardar deployment info
  const deploymentInfo = {
    ...existingDeployment,
    contracts: {
      ...existingDeployment.contracts,
      ChainlinkKYCIssuer: kycIssuerAddress,
      MockIdentityRegistry: identityRegistryAddress
    },
    kycConfig: {
      worldIdRouter: WORLD_ID_CONFIG.router,
      worldAppId: WORLD_ID_CONFIG.appId,
      worldActionId: WORLD_ID_CONFIG.actionId,
      identityRegistry: identityRegistryAddress
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    network: "worldchain-sepolia",
    chainId: 4801
  };

  // Crear directorio deployments si no existe
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Guardar archivo de deployment
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Actualizar .env.local del frontend
  const frontendEnvPath = path.join(__dirname, "../../ours-platform/.env.local");
  
  if (fs.existsSync(frontendEnvPath)) {
    console.log("\n🔄 Updating frontend .env.local...");
    
    let envContent = fs.readFileSync(frontendEnvPath, "utf8");
    
    // Actualizar o agregar KYC_ISSUER_ADDRESS
    const kycAddressLine = `NEXT_PUBLIC_KYC_ISSUER_ADDRESS=${kycIssuerAddress}`;
    
    if (envContent.includes("NEXT_PUBLIC_KYC_ISSUER_ADDRESS")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_KYC_ISSUER_ADDRESS=.*/,
        kycAddressLine
      );
    } else {
      envContent += `\n# ChainlinkKYCIssuer Contract\n${kycAddressLine}\n`;
    }
    
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ Frontend .env.local updated");
  }

  // Resumen final
  console.log("\n🎉 Deployment Complete!");
  console.log("═══════════════════════════════════════");
  console.log("📋 Contract Addresses:");
  console.log("   ChainlinkKYCIssuer:", kycIssuerAddress);
  console.log("   IdentityRegistry:", identityRegistryAddress);
  console.log("   World ID Router:", WORLD_ID_CONFIG.router);
  console.log("");
  console.log("🔑 Roles Configured:");
  console.log("   DEFAULT_ADMIN_ROLE:", deployer.address);
  console.log("   OPERATOR_ROLE:", deployer.address);
  console.log("");
  console.log("🌍 World ID Configuration:");
  console.log("   App ID:", WORLD_ID_CONFIG.appId);
  console.log("   Action ID:", WORLD_ID_CONFIG.actionId);
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Grant CHAINLINK_DON_ROLE to backend wallet");
  console.log("   2. Test KYC flow in frontend");
  console.log("   3. Configure Entrust/Onfido integration");
  console.log("   4. Set up Chainlink Functions (optional)");

  // Comandos útiles para después del deployment
  console.log("");
  console.log("🛠️  Useful Commands:");
  console.log(`   # Grant role to backend:`);
  console.log(`   await kycIssuer.grantRole(await kycIssuer.CHAINLINK_DON_ROLE(), "BACKEND_WALLET_ADDRESS")`);
  console.log("");
  console.log(`   # Check user KYC status:`);
  console.log(`   await kycIssuer.isKYCVerified("USER_ADDRESS")`);
  console.log("");
  console.log(`   # Test KYC request (testing only):`);
  console.log(`   await kycIssuer.mockRequestKYCForTesting("USER_ADDRESS")`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });