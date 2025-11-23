const hre = require("hardhat");

/**
 * Script para emitir un evento KYCRequested y obtener el hash para simular el workflow
 * 
 * USO:
 * npx hardhat run scripts/test-kyc-event.js --network worldchain-sepolia
 */

async function main() {
  const KYC_ISSUER_ADDRESS = "0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5";
  const TEST_USER = "0xAbdFF83ac5E8E729C6ce44E938f244fB12F6Ce32"; // O usar cualquier address de prueba
  
  console.log("📋 Emitiendo evento KYCRequested para testing...");
  console.log(`   Contrato: ${KYC_ISSUER_ADDRESS}`);
  console.log(`   Usuario de prueba: ${TEST_USER}`);
  console.log("");
  
  const kycIssuer = await ethers.getContractAt("ChainlinkKYCIssuer", KYC_ISSUER_ADDRESS);
  
  // Verificar que tenemos permisos de admin
  const [deployer] = await ethers.getSigners();
  const DEFAULT_ADMIN_ROLE = await kycIssuer.DEFAULT_ADMIN_ROLE();
  const isAdmin = await kycIssuer.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  
  if (!isAdmin) {
    console.error("❌ Error: El signer no tiene rol DEFAULT_ADMIN_ROLE");
    process.exit(1);
  }
  
  // Llamar a la función de testing para emitir el evento
  console.log("📤 Llamando mockRequestKYCForTesting()...");
  const tx = await kycIssuer.mockRequestKYCForTesting(TEST_USER);
  console.log(`   Transaction hash: ${tx.hash}`);
  console.log("   Esperando confirmación...");
  
  const receipt = await tx.wait();
  
  if (receipt) {
    console.log("✅ Evento KYCRequested emitido exitosamente!");
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Tx hash: ${receipt.hash}`);
    console.log("");
    console.log("🎯 Ahora puedes simular el workflow con:");
    console.log(`   cd /Users/mtn/Desktop/ours-eth/ours`);
    console.log(`   export PATH="$HOME/.bun/bin:$PATH"`);
    console.log(`   export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"`);
    console.log(`   cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash ${receipt.hash}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


