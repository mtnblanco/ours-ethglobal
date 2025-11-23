# Cómo Obtener Tu Wallet Address y USDC Testnet

## Problema Actual
Estás viendo `userAddress: null` y `isMiniKit: false` porque la autenticación de MiniKit todavía no se ha completado.

## Solución 1: Ver tu Wallet Address en la App

### Opción A: En la página de Holdings
1. Abre la app en **World App** (no en navegador regular)
2. Ve a la página "Holdings"
3. Una vez que la autenticación se complete, verás una tarjeta blanca con:
   - Tu wallet address completa
   - Un botón "Copy" para copiarla
   - Instrucciones para obtener USDC testnet

### Opción B: En la página de Marketplace (propiedad individual)
1. Abre cualquier propiedad en el marketplace
2. Si tu balance de USDC es $0.00, verás automáticamente:
   - Tu wallet address
   - Un botón "Copy"
   - Un link directo al faucet de Circle

### Opción C: Desde la Consola del Navegador
Si estás en World App, abre la consola de DevTools y ejecuta:

```javascript
// Obtener la wallet address desde localStorage
const address = localStorage.getItem('minikit_address');
console.log('🔑 Your Wallet Address:', address);

// Copiar al clipboard
if (address) {
  navigator.clipboard.writeText(address);
  console.log('✅ Address copied to clipboard!');
} else {
  console.log('❌ No address found. Authentication may not have completed yet.');
}
```

### Opción D: Esperar a los logs de MiniKit
Cuando abras la app en World App, la consola mostrará automáticamente:

```
🔍 MiniKit initialization check: {
  miniKitAvailable: true,
  hasCommandsAsync: true,
  userAgent: '...'
}

🔐 Authenticating with MiniKit...
✅ Authentication successful, address: 0xYourAddressHere
```

## Solución 2: Obtener USDC Testnet

### Método 1: Circle Testnet Faucet (RECOMENDADO)
1. Ve a: https://faucet.circle.com/
2. Selecciona la red: **"World Chain Sepolia"**
3. Pega tu wallet address (obtenida arriba)
4. Haz clic en "Request Testnet USDC"
5. Espera 1-2 minutos

**Información de la Red:**
- Network: World Chain Sepolia
- Chain ID: 4801
- RPC URL: https://worldchain-sepolia.g.alchemy.com/public
- USDC Contract: `0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388`

### Método 2: Verificar tu Balance
Abre la consola en World App y ejecuta:

```javascript
// Ver tu balance actual de USDC
const checkBalance = async () => {
  const address = localStorage.getItem('minikit_address');
  if (!address) {
    console.log('❌ No wallet address found');
    return;
  }

  console.log('🔍 Checking USDC balance for:', address);
  console.log('📍 USDC Contract:', '0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388');
  console.log('🌐 Network: World Chain Sepolia (Chain ID: 4801)');

  // El balance se mostrará automáticamente en la UI de la app
  console.log('💡 Check the Holdings or Marketplace page to see your balance');
};

checkBalance();
```

## Solución 3: Si `isMiniKit: false`

Si ves `isMiniKit: false` en los logs, significa que estás **NO** estás ejecutando dentro de World App.

### Pasos para Ejecutar en World App:

1. **En tu teléfono, abre World App**
2. Ve a la sección de **Mini Apps** o **Browser**
3. Ingresa la URL de tu app (ejemplo: `https://your-app.vercel.app`)
4. La app detectará automáticamente que está en World App

### Verificar si estás en World App:
Ejecuta en la consola:

```javascript
console.log('User Agent:', navigator.userAgent);
console.log('Is World App?:', navigator.userAgent.includes('WorldApp'));
```

Si el User Agent incluye "WorldApp" o similar, entonces estás en el entorno correcto.

## Debugging Logs

Los logs que deberías ver cuando todo funciona correctamente:

```
🚀 [MiniKitProvider] Attempting to install MiniKit with appId: app_staging_...
🚀 [MiniKitProvider] MiniKit module loaded: { hasMiniKit: true, ... }
✅ [MiniKitProvider] MiniKit installed successfully
✅ [MiniKitProvider] MiniKit.isInstalled(): true

🔍 MiniKit initialization check: { miniKitAvailable: true, ... }

🔐 Authenticating with MiniKit...
✅ Authentication successful, address: 0x...

========== HOLDINGS PAGE DEBUG ==========
📍 Auth State: {
  userAddress: '0x...',
  isConnected: true,
  isMiniKit: true,
  isAuthLoading: false
}
💰 USDC Balance: {
  raw: '1000000',  // 1.00 USDC (6 decimals)
  formatted: '1.00',
  decimals: 6
}
```

## Resumen Rápido

1. **Abrir app en World App** (no en navegador)
2. **Esperar autenticación** (verás logs en consola)
3. **Ver tu address** en la página Holdings o Marketplace
4. **Copiar address** con el botón "Copy"
5. **Ir a Circle Faucet**: https://faucet.circle.com/
6. **Seleccionar "World Chain Sepolia"**
7. **Pegar address y solicitar USDC**
8. **Esperar 1-2 minutos**
9. **Refrescar la página** para ver el balance actualizado

## Troubleshooting

### Si `userAddress` sigue siendo `null`:
- Verifica que estés en World App (no navegador regular)
- Revisa los logs de la consola para errores de autenticación
- Intenta refrescar la página
- Verifica que el `NEXT_PUBLIC_WORLDCOIN_APP_ID` esté correcto en `.env`

### Si no recibes USDC del faucet:
- Verifica que seleccionaste "World Chain Sepolia" correctamente
- Asegúrate de copiar la address completa
- Espera hasta 5 minutos (puede tardar)
- Intenta en otro momento si el faucet está sobrecargado
- Verifica en un block explorer: https://worldchain-sepolia.explorer.alchemy.com/

### Enlaces Útiles:
- Circle Faucet: https://faucet.circle.com/
- World Chain Sepolia Explorer: https://worldchain-sepolia.explorer.alchemy.com/
- Worldcoin Docs: https://docs.worldcoin.org/
- MiniKit Docs: https://docs.worldcoin.org/minikit
