# Próximos Pasos - Workflow KYC con Chainlink CRE

## ✅ Lo que ya está hecho

1. ✅ Workflow convertido a TypeScript (`ours/ours/main.ts`)
2. ✅ Onfido mockeado completamente
3. ✅ Configuración lista (`config.staging.json`)
4. ✅ ABI del contrato copiado (`ours/ours/abis/`)
5. ✅ Red worldchain-sepolia agregada a `project.yaml`

## 📋 Pasos para dejar todo funcionando

### Paso 1: Instalar dependencias
```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
bun install
```

### Paso 2: Desplegar el contrato ChainlinkKYCIssuer

El contrato aún no está desplegado. Necesitas:

1. **Crear script de deployment** (si no existe)
   - Ubicación: `contracts/scripts/deploy-kyc-issuer.ts`

2. **Desplegar el contrato** a worldchain-sepolia:
   ```bash
   cd /Users/mtn/Desktop/ours-eth/contracts
   npx hardhat run scripts/deploy-kyc-issuer.ts --network worldchain-sepolia
   ```

3. **Actualizar la dirección en config**:
   - Editar `ours/ours/config.staging.json`
   - Poner la dirección real del contrato desplegado en `kycIssuerAddress`

### Paso 3: Configurar permisos en el contrato

Después de desplegar, necesitas dar el rol `CHAINLINK_DON_ROLE` al DON de Chainlink:

```typescript
// Ejecutar este script después del deployment
const kycIssuer = await ethers.getContractAt("ChainlinkKYCIssuer", DEPLOYED_ADDRESS);
const CHAINLINK_DON_ROLE = await kycIssuer.CHAINLINK_DON_ROLE();
const chainlinkDonAddress = "..." // Obtener de Chainlink

await kycIssuer.grantRole(CHAINLINK_DON_ROLE, chainlinkDonAddress);
```

### Paso 4: Asegurar que cre CLI esté disponible

```bash
# Extraer el binario cre si no existe
cd /Users/mtn/Desktop/ours-eth/contracts/chainlink-cre
unzip -o cre_darwin_arm64.zip
mv cre_v1.0.2_darwin_arm64 cre
chmod +x cre
xattr -c cre  # Remover extended attributes en macOS
```

### Paso 5: Probar el workflow localmente

```bash
cd /Users/mtn/Desktop/ours-eth/ours
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"
cre workflow simulate ./ours --target=staging-settings
```

### Paso 6: Desplegar el workflow a Chainlink DON

```bash
cd /Users/mtn/Desktop/ours-eth/ours
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"
cre workflow deploy ./ours --target=staging-settings
```

### Paso 7: Probar el flujo completo

1. **Usuario solicita KYC** (desde el frontend)
   - Llama a `requestKYCWithWorldID()` en el contrato
   - Esto emite el evento `KYCRequested`

2. **Chainlink DON detecta el evento** y ejecuta el workflow

3. **El workflow**:
   - Mockea la respuesta de Onfido (aprobado)
   - Calcula el hash
   - Llama a `fulfillKYC()` en el contrato

4. **Verificar en el contrato** que el KYC fue aprobado

## 🔧 Configuración actual

**config.staging.json:**
```json
{
  "kycIssuerAddress": "0x0000000000000000000000000000000000000000", // ⚠️ ACTUALIZAR
  "mockOnfidoApproved": true  // true = siempre aprueba, false = siempre rechaza
}
```

## ⚠️ Notas importantes

1. **Chainlink DON Role**: El DON de Chainlink necesita tener el rol `CHAINLINK_DON_ROLE` para poder llamar `fulfillKYC()`

2. **RPC URL**: Verificar que la RPC de worldchain-sepolia funcione en `project.yaml`

3. **Testing**: Puedes usar `mockRequestKYCForTesting(address)` si el contrato tiene esa función para testing

## 🐛 Debugging

Si algo falla:

1. **Ver logs del workflow**:
   - Los logs aparecen cuando ejecutas `cre workflow simulate`
   - Cada `runtime.log()` muestra un mensaje

2. **Verificar evento emitido**:
   - Usa un explorer de worldchain-sepolia
   - Busca el evento `KYCRequested` en el contrato

3. **Verificar permisos**:
   - El DON necesita tener `CHAINLINK_DON_ROLE`
   - Verificar que el contrato no esté pausado

