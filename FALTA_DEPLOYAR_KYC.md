# ⚠️ Falta desplegar ChainlinkKYCIssuer

## Estado actual

✅ **Ya desplegados:**
- PropertyRegistry: `0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6`
- SaleManager: `0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4`
- RevenueDistributor: `0xD99C9ad06FeD65FcB3AE660316DBbCC285786712`
- USDC: `0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388`

❌ **Falta desplegar:**
- ChainlinkKYCIssuer (necesario para el workflow KYC)

## Para desplegar ChainlinkKYCIssuer necesitas:

1. **World ID Router address** (worldchain-sepolia)
2. **World App ID**: `app_staging_b826d8b41fbc54b78b13e4f3b1b2f8e2` ✅ (ya lo tienes)
3. **World Action ID**: `ours-marketplace-login` ✅ (ya lo tienes)
4. **IdentityRegistry address** (¿está desplegado?)

## Pasos para desplegar

1. Crear script de deployment en `contracts/scripts/deploy-kyc-issuer.ts`
2. Ejecutar: `npx hardhat run scripts/deploy-kyc-issuer.ts --network worldchainSepolia`
3. Actualizar `ours/ours/config.staging.json` con la dirección
4. Dar rol `CHAINLINK_DON_ROLE` al DON de Chainlink

## Una vez desplegado, actualizar:

1. `ours/ours/config.staging.json` → `kycIssuerAddress`
2. `contracts/deployments/worldchain-sepolia.json` → agregar dirección
3. Variables de entorno (.env.local en frontend y backend)

