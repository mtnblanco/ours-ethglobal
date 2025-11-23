require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔍 Verificando CHAINLINK_DON_ROLE en Sepolia...\n");

  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Leer deployment info
  const deploymentFile = path.join(__dirname, '../deployments/ethereum-sepolia.json');
  if (!fs.existsSync(deploymentFile)) {
    throw new Error('Deployment file not found. Deploy contracts first.');
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const kycIssuerAddress = deployment.contracts.ChainlinkKYCIssuer;
  
  // Leer artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/ChainlinkKYCIssuer.sol/ChainlinkKYCIssuer.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  const kycIssuer = new ethers.Contract(kycIssuerAddress, artifact.abi, provider);
  
  const workflowOwnerAddress = "0xbd73D31277d69d2b80556068dbfcf9c3b5B2fd0b";
  const chainlinkDonRole = await kycIssuer.CHAINLINK_DON_ROLE();
  
  console.log("📋 Información:");
  console.log("   ChainlinkKYCIssuer:", kycIssuerAddress);
  console.log("   Workflow Owner:", workflowOwnerAddress);
  console.log("   CHAINLINK_DON_ROLE:", chainlinkDonRole);
  console.log("");
  
  const hasRole = await kycIssuer.hasRole(chainlinkDonRole, workflowOwnerAddress);
  
  console.log("🔑 Verificación de Rol:");
  console.log("   ¿Tiene CHAINLINK_DON_ROLE?", hasRole ? "✅ SÍ" : "❌ NO");
  console.log("");
  
  if (!hasRole) {
    console.log("⚠️  El workflow owner NO tiene el rol!");
    console.log("   Ejecutá este script para otorgarlo:");
    console.log("");
    console.log(`   node scripts/grant-don-role-sepolia.cjs`);
    console.log("");
  } else {
    console.log("✅ Todo está correcto! El workflow owner tiene el rol.");
    console.log("");
    console.log("💡 Si el workflow sigue fallando, el problema puede ser:");
    console.log("   1. Chainlink CRE no está usando la private key del .env");
    console.log("   2. El método callContract no es el correcto para escribir");
    console.log("   3. Necesitas usar un método diferente para transacciones que escriben");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

