/**
 * Debug Script para obtener Wallet Address en World App
 *
 * Cómo usar:
 * 1. Abre la app en World App
 * 2. Abre DevTools (si es posible)
 * 3. Copia y pega este script completo en la consola
 * 4. Ejecuta: debugWallet()
 */

window.debugWallet = function() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 WALLET DEBUG SCRIPT');
  console.log('═══════════════════════════════════════════════════');

  // 1. Check User Agent
  console.log('\n1️⃣ USER AGENT CHECK:');
  console.log('User Agent:', navigator.userAgent);
  const isWorldApp = navigator.userAgent.toLowerCase().includes('world') ||
                     navigator.userAgent.toLowerCase().includes('minikit');
  console.log('Is World App?:', isWorldApp ? '✅ YES' : '❌ NO - Open in World App!');

  // 2. Check MiniKit Installation
  console.log('\n2️⃣ MINIKIT CHECK:');
  try {
    const MiniKit = window.MiniKit;
    if (MiniKit) {
      console.log('MiniKit Object:', '✅ Found');
      console.log('MiniKit.isInstalled():', MiniKit.isInstalled ? MiniKit.isInstalled() : '❌ Method not available');
      console.log('MiniKit.commandsAsync:', MiniKit.commandsAsync ? '✅ Available' : '❌ Not available');
    } else {
      console.log('MiniKit Object:', '❌ Not found');
    }
  } catch (e) {
    console.log('MiniKit Error:', e.message);
  }

  // 3. Check LocalStorage
  console.log('\n3️⃣ LOCALSTORAGE CHECK:');
  const storedAddress = localStorage.getItem('minikit_address');
  if (storedAddress) {
    console.log('Stored Address:', storedAddress);
    console.log('');
    console.log('📋 COPY THIS ADDRESS:');
    console.log('═══════════════════════════════════════════════════');
    console.log(storedAddress);
    console.log('═══════════════════════════════════════════════════');

    // Try to copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(storedAddress)
        .then(() => {
          console.log('✅ Address copied to clipboard!');
        })
        .catch((e) => {
          console.log('⚠️ Could not copy to clipboard:', e.message);
        });
    }
  } else {
    console.log('Stored Address:', '❌ Not found - Authentication may not have completed');
  }

  // 4. Environment Variables
  console.log('\n4️⃣ ENVIRONMENT:');
  console.log('Chain ID:', process?.env?.NEXT_PUBLIC_CHAIN_ID || '4801 (expected)');
  console.log('USDC Address:', process?.env?.NEXT_PUBLIC_USDC_ADDRESS || '0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388');
  console.log('Network:', 'World Chain Sepolia');

  // 5. Instructions
  console.log('\n5️⃣ NEXT STEPS:');
  console.log('');
  if (!storedAddress) {
    console.log('⚠️  WALLET NOT CONNECTED YET');
    console.log('');
    console.log('Wait for authentication to complete, or:');
    console.log('1. Refresh the page');
    console.log('2. Make sure you are in World App (not regular browser)');
    console.log('3. Check the app UI for your wallet address');
    console.log('4. Run this script again in 10 seconds');
  } else {
    console.log('✅ WALLET CONNECTED!');
    console.log('');
    console.log('To get testnet USDC:');
    console.log('1. Your address is copied to clipboard (or copy manually above)');
    console.log('2. Visit: https://faucet.circle.com/');
    console.log('3. Select "World Chain Sepolia" network');
    console.log('4. Paste your address: ' + storedAddress);
    console.log('5. Request testnet USDC');
    console.log('6. Wait 1-2 minutes');
    console.log('');
    console.log('To check your balance:');
    console.log('- Visit the Holdings page in the app');
    console.log('- Or check World Chain Sepolia Explorer:');
    console.log('  https://worldchain-sepolia.explorer.alchemy.com/address/' + storedAddress);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('To run this script again, type: debugWallet()');
  console.log('═══════════════════════════════════════════════════');
};

// Auto-run on load
console.log('');
console.log('💡 Debug script loaded!');
console.log('💡 Type: debugWallet() to run wallet diagnostics');
console.log('');

// Auto-execute
debugWallet();
