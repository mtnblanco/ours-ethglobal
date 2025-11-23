const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script para otorgar rol CHAINLINK_DON_ROLE al backend
 * 
 * Este script permite al backend llamar fulfillKYC() temporalmente
 * hasta implementar Chainlink Functions completamente
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🔑 Granting CHAINLINK_DON_ROLE...");
  console.log("📝 Using account:", deployer.address);
  
  // Leer la dirección del contrato desplegado
  const deploymentFile = path.join(__dirname, "../deployments/worldchain-sepolia.json");
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("❌ Deployment file not found. Deploy the contract first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deployment.contracts?.ChainlinkKYCIssuer;
  
  if (!contractAddress) {
    throw new Error("❌ ChainlinkKYCIssuer address not found in deployment file");
  }

  console.log("📍 Contract address:", contractAddress);

  // Dirección del backend (temporalmente usaremos la misma del deployer)
  // En producción esto sería una wallet separada para el backend
  const backendAddress = process.env.BACKEND_WALLET_ADDRESS || deployer.address;
  
  console.log("🤖 Backend wallet address:", backendAddress);

  // Conectar al contrato
  const ChainlinkKYCIssuer = await ethers.getContractFactory("ChainlinkKYCIssuer");
  const contract = ChainlinkKYCIssuer.attach(contractAddress);

  // Obtener el rol hash
  const CHAINLINK_DON_ROLE = await contract.CHAINLINK_DON_ROLE();
  console.log("🏷️  CHAINLINK_DON_ROLE hash:", CHAINLINK_DON_ROLE);

  // Verificar si ya tiene el rol
  const hasRole = await contract.hasRole(CHAINLINK_DON_ROLE, backendAddress);
  
  if (hasRole) {
    console.log("✅ Backend wallet already has CHAINLINK_DON_ROLE");
    return;
  }

  // Otorgar el rol
  console.log("🚀 Granting CHAINLINK_DON_ROLE to backend wallet...");
  
  const tx = await contract.grantRole(CHAINLINK_DON_ROLE, backendAddress);
  console.log("⏳ Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  console.log("⛽ Gas used:", receipt.gasUsed.toString());

  // Verificar que el rol fue otorgado
  const hasRoleAfter = await contract.hasRole(CHAINLINK_DON_ROLE, backendAddress);
  
  if (hasRoleAfter) {
    console.log("🎉 Successfully granted CHAINLINK_DON_ROLE to backend wallet!");
    
    // Actualizar deployment file con info del rol
    deployment.roles = deployment.roles || {};
    deployment.roles[backendAddress] = deployment.roles[backendAddress] || [];
    deployment.roles[backendAddress].push("CHAINLINK_DON_ROLE");
    deployment.lastRoleUpdate = new Date().toISOString();
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    console.log("📄 Updated deployment file with role information");
    
  } else {
    throw new Error("❌ Failed to grant role");
  }

  console.log("\n🔧 Next steps:");
  console.log("1. Set PRIVATE_KEY in backend/.env for the wallet:", backendAddress);
  console.log("2. Set CHAINLINK_KYC_ISSUER_CONTRACT_ADDRESS in backend/.env");
  console.log("3. Test the complete KYC flow with Onfido integration");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });