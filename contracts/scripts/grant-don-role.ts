import { ethers } from "hardhat";

/**
 * Script para otorgar el rol CHAINLINK_DON_ROLE al DON de Chainlink
 * 
 * USO:
 * 1. Obtener la dirección del DON después de hacer `cre workflow deploy`
 * 2. Ejecutar: npx hardhat run scripts/grant-don-role.ts --network worldchain-sepolia
 * 3. Proporcionar la dirección del DON cuando se solicite
 */

async function main() {
  const KYC_ISSUER_ADDRESS = "0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5";
  
  // Obtener la dirección del DON desde argumentos o hardcoded
  const chainlinkDonAddress = process.env.CHAINLINK_DON_ADDRESS || process.argv[2];
  
  if (!chainlinkDonAddress || !ethers.isAddress(chainlinkDonAddress)) {
    console.error("❌ Error: Proporciona una dirección válida del DON de Chainlink");
    console.log("\nUso:");
    console.log("  CHAINLINK_DON_ADDRESS=0x... npx hardhat run scripts/grant-don-role.ts --network worldchain-sepolia");
    console.log("  O:");
    console.log("  npx hardhat run scripts/grant-don-role.ts --network worldchain-sepolia -- 0x...");
    process.exit(1);
  }

  console.log("📋 Configuración:");
  console.log(`   Contrato KYC Issuer: ${KYC_ISSUER_ADDRESS}`);
  console.log(`   Chainlink DON Address: ${chainlinkDonAddress}`);
  console.log(`   Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log("");

  // Obtener el contrato
  const kycIssuer = await ethers.getContractAt("ChainlinkKYCIssuer", KYC_ISSUER_ADDRESS);
  
  // Obtener el rol CHAINLINK_DON_ROLE
  const CHAINLINK_DON_ROLE = await kycIssuer.CHAINLINK_DON_ROLE();
  console.log(`🔑 CHAINLINK_DON_ROLE: ${CHAINLINK_DON_ROLE}`);
  
  // Verificar si ya tiene el rol
  const hasRole = await kycIssuer.hasRole(CHAINLINK_DON_ROLE, chainlinkDonAddress);
  if (hasRole) {
    console.log("✅ El DON ya tiene el rol CHAINLINK_DON_ROLE asignado");
    return;
  }
  
  console.log("📝 Otorgando rol CHAINLINK_DON_ROLE...");
  
  // Obtener el signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`   Signer: ${deployer.address}`);
  
  // Verificar que el signer tenga permisos de admin
  const DEFAULT_ADMIN_ROLE = await kycIssuer.DEFAULT_ADMIN_ROLE();
  const isAdmin = await kycIssuer.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  
  if (!isAdmin) {
    console.error("❌ Error: El signer no tiene rol DEFAULT_ADMIN_ROLE");
    console.log("   Solo el admin puede otorgar roles");
    process.exit(1);
  }
  
  // Otorgar el rol
  const tx = await kycIssuer.grantRole(CHAINLINK_DON_ROLE, chainlinkDonAddress);
  console.log(`   Transaction hash: ${tx.hash}`);
  console.log("   Esperando confirmación...");
  
  const receipt = await tx.wait();
  
  if (receipt) {
    console.log("✅ Rol otorgado exitosamente!");
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    
    // Verificar que se otorgó correctamente
    const hasRoleAfter = await kycIssuer.hasRole(CHAINLINK_DON_ROLE, chainlinkDonAddress);
    if (hasRoleAfter) {
      console.log("✅ Verificación: El DON ahora tiene el rol CHAINLINK_DON_ROLE");
    } else {
      console.error("❌ Error: El rol no se otorgó correctamente");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


