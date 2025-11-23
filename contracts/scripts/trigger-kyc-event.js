import { ethers } from 'hardhat';

async function main() {
  console.log('🔄 Disparando evento KYCRequested para testing...\n');

  // Dirección del contrato KYC
  const KYC_ISSUER_ADDRESS = '0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE';
  
  // Cargar el contrato
  const ChainlinkKYCIssuer = await ethers.getContractFactory('ChainlinkKYCIssuer');
  const kycIssuer = ChainlinkKYCIssuer.attach(KYC_ISSUER_ADDRESS);
  
  // Obtener el signer
  const [signer] = await ethers.getSigners();
  const testUser = signer.address;
  
  console.log(`📝 Usuario de prueba: ${testUser}`);
  console.log(`📝 Contrato KYC: ${KYC_ISSUER_ADDRESS}\n`);

  // Verificar que no tenga KYC ya
  const kycData = await kycIssuer.kycData(testUser);
  console.log('Estado KYC actual:');
  console.log(`  - Status: ${kycData.status}`);
  console.log(`  - NullifierHash: ${kycData.nullifierHash}\n`);

  if (kycData.status !== 0) {
    console.log('⚠️  El usuario ya tiene KYC. Usando mockRequestKYCForTesting()...');
    
    // Usar la función de testing para resetear
    const tx = await kycIssuer.mockRequestKYCForTesting(testUser, {
      gasLimit: 500000
    });
    
    console.log(`📤 Tx enviada: ${tx.hash}`);
    console.log('⏳ Esperando confirmación...\n');
    
    const receipt = await tx.wait();
    
    console.log('✅ Evento KYCRequested emitido!');
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Tx Hash: ${receipt.hash}\n`);
    
    // Buscar el evento en los logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = kycIssuer.interface.parseLog(log);
        return parsed && parsed.name === 'KYCRequested';
      } catch (e) {
        return false;
      }
    });
    
    if (event) {
      const parsed = kycIssuer.interface.parseLog(event);
      console.log('📋 Datos del evento:');
      console.log(`   User: ${parsed.args.user}`);
      console.log(`   NullifierHash: ${parsed.args.nullifierHash}`);
      console.log(`   Timestamp: ${parsed.args.timestamp}\n`);
    }
    
    console.log('🎯 PARA SIMULAR EL WORKFLOW USA:');
    console.log(`   cd /Users/mtn/Desktop/ours-eth/ours`);
    console.log(`   /Users/mtn/Desktop/ours-eth/contracts/chainlink-cre/cre workflow simulate staging-settings --evm-tx-hash ${receipt.hash} --broadcast\n`);
    
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      user: testUser
    };
  } else {
    console.log('❌ El usuario no tiene KYC previo.');
    console.log('💡 Primero necesitas hacer un requestKYCWithWorldID() desde el frontend.');
    console.log('   O usar mockRequestKYCForTesting() directamente.\n');
    
    // Intentar usar mock
    console.log('Intentando mockRequestKYCForTesting()...');
    const tx = await kycIssuer.mockRequestKYCForTesting(testUser, {
      gasLimit: 500000
    });
    
    console.log(`📤 Tx enviada: ${tx.hash}`);
    console.log('⏳ Esperando confirmación...\n');
    
    const receipt = await tx.wait();
    
    console.log('✅ Evento KYCRequested emitido!');
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Tx Hash: ${receipt.hash}\n`);
    
    console.log('🎯 PARA SIMULAR EL WORKFLOW USA:');
    console.log(`   cd /Users/mtn/Desktop/ours-eth/ours`);
    console.log(`   /Users/mtn/Desktop/ours-eth/contracts/chainlink-cre/cre workflow simulate staging-settings --evm-tx-hash ${receipt.hash} --broadcast\n`);
    
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      user: testUser
    };
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

