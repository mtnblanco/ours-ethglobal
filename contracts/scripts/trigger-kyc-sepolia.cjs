require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
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
  
  const kycIssuer = new ethers.Contract(kycIssuerAddress, artifact.abi, wallet);
  
  // Usar la dirección del deployer como usuario de prueba
  const testUser = wallet.address;
  
  console.log("🚀 Triggering KYC event...");
  console.log("📝 KYC Issuer:", kycIssuerAddress);
  console.log("👤 Test User:", testUser);
  console.log("");
  
  // Llamar a mockRequestKYCForTesting
  const tx = await kycIssuer.mockRequestKYCForTesting(testUser);
  console.log("⏳ Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("");
  console.log("📋 Transaction Details:");
  console.log("   Hash:", receipt.hash);
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas Used:", receipt.gasUsed.toString());
  console.log("");
  
  // Buscar el evento KYCRequested
  const event = receipt.logs.find(log => {
    try {
      const parsed = kycIssuer.interface.parseLog(log);
      return parsed && parsed.name === 'KYCRequested';
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsed = kycIssuer.interface.parseLog(event);
    console.log("🎉 KYCRequested event emitted!");
    console.log("   User:", parsed.args.user);
    console.log("   Nullifier Hash:", parsed.args.nullifierHash);
    console.log("   Timestamp:", parsed.args.timestamp.toString());
    console.log("");
    console.log("📝 Use these values for cre workflow simulate:");
    console.log(`   --evm-tx-hash ${receipt.hash}`);
    console.log(`   --evm-event-index ${receipt.logs.indexOf(event)}`);
    console.log("");
  } else {
    console.log("⚠️  KYCRequested event not found in logs");
    console.log("   Transaction hash:", receipt.hash);
    console.log("   Check the transaction on Etherscan for event details");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

