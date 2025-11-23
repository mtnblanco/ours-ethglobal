#!/bin/bash

echo "🔄 Disparando evento KYCRequested para testing..."
echo ""

# Configuración
KYC_CONTRACT="0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE"
TEST_USER="0xAbdFF83ac5E8E729C6ce44E938f244fB12F6Ce32"
PRIVATE_KEY="2354cb39ddac1304a8f63053ebae9ee558d95507bf6fc774087719855cb4f5b5"
RPC_URL="https://worldchain-sepolia.g.alchemy.com/v2/Kj5XiLkA6QKMKGlBk6dOxQw4n1aP"

echo "📝 Usuario de prueba: $TEST_USER"
echo "📝 Contrato KYC: $KYC_CONTRACT"
echo ""

# Llamar a mockRequestKYCForTesting usando ethers
node --input-type=module << 'EOF'
import { ethers } from 'ethers';

const RPC_URL = "https://worldchain-sepolia.g.alchemy.com/v2/Kj5XiLkA6QKMKGlBk6dOxQw4n1aP";
const PRIVATE_KEY = "2354cb39ddac1304a8f63053ebae9ee558d95507bf6fc774087719855cb4f5b5";
const KYC_CONTRACT = "0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE";
const TEST_USER = "0xAbdFF83ac5E8E729C6ce44E938f244fB12F6Ce32";

const KYC_ABI = [
  "function mockRequestKYCForTesting(address user) external",
  "event KYCRequested(address indexed user, bytes32 indexed nullifierHash, uint256 timestamp)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const kycIssuer = new ethers.Contract(KYC_CONTRACT, KYC_ABI, wallet);

  console.log("📤 Enviando transacción...");
  const tx = await kycIssuer.mockRequestKYCForTesting(TEST_USER, {
    gasLimit: 500000
  });

  console.log(`   Tx Hash: ${tx.hash}`);
  console.log("⏳ Esperando confirmación...\n");

  const receipt = await tx.wait();

  console.log("✅ Transacción confirmada!");
  console.log(`   Block: ${receipt.blockNumber}`);
  console.log(`   Gas usado: ${receipt.gasUsed.toString()}\n`);

  // Buscar el evento KYCRequested
  const event = receipt.logs.find(log => {
    try {
      const parsed = kycIssuer.interface.parseLog({
        topics: log.topics,
        data: log.data
      });
      return parsed && parsed.name === 'KYCRequested';
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsed = kycIssuer.interface.parseLog({
      topics: event.topics,
      data: event.data
    });
    console.log("📋 Evento KYCRequested emitido:");
    console.log(`   User: ${parsed.args.user}`);
    console.log(`   NullifierHash: ${parsed.args.nullifierHash}`);
    console.log(`   Timestamp: ${parsed.args.timestamp}\n`);
  }

  console.log("🎯 AHORA SIMULA EL WORKFLOW CON:");
  console.log(`   cd /Users/mtn/Desktop/ours-eth/ours`);
  console.log(`   /Users/mtn/Desktop/ours-eth/contracts/chainlink-cre/cre workflow simulate staging-settings --evm-tx-hash ${tx.hash} --broadcast\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
EOF

