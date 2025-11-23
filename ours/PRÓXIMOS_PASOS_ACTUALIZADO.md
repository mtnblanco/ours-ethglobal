# Próximos Pasos - Workflow KYC

## ✅ Completado

1. ✅ Workflow convertido a TypeScript
2. ✅ Onfido mockeado completamente
3. ✅ Chain selector de World Chain Sepolia configurado (`5299555114858065850`)
4. ✅ Dirección del contrato configurada (`0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5`)
5. ✅ Dependencias instaladas (Bun + CRE SDK)

## 📋 Próximos Pasos

### Paso 1: Verificar compilación (opcional)

Para verificar que el código compile sin errores:

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"

# Compilar el workflow
bun build main.ts --outdir dist
```

### Paso 2: Configurar CHAINLINK_DON_ROLE (crítico)

**⚠️ IMPORTANTE**: Antes de desplegar el workflow, necesitas darle el rol `CHAINLINK_DON_ROLE` al DON de Chainlink.

1. **Obtener la dirección del DON** de Chainlink (te la darán cuando despliegues el workflow)
2. **Otorgar el rol** usando un script o directamente en el contrato:

```typescript
// Script para otorgar el rol
const kycIssuer = await ethers.getContractAt("ChainlinkKYCIssuer", "0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5");
const CHAINLINK_DON_ROLE = await kycIssuer.CHAINLINK_DON_ROLE();
const chainlinkDonAddress = "0x..."; // Dirección del DON de Chainlink

await kycIssuer.grantRole(CHAINLINK_DON_ROLE, chainlinkDonAddress);
```

### Paso 3: Desplegar el workflow a Chainlink DON

Una vez configurado el rol, despliega el workflow:

```bash
cd /Users/mtn/Desktop/ours-eth/ours
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"

cre workflow deploy ./ours --target=staging-settings
```

Este comando:
- Compila el workflow
- Lo sube a Chainlink
- Te dará la dirección del DON
- Configura los triggers para escuchar eventos

### Paso 4: Probar el flujo completo

1. **Desde el frontend/backend**: Llama a `requestKYCWithWorldID()` en el contrato
   - Esto emite el evento `KYCRequested` on-chain
   
2. **Chainlink DON detecta el evento** automáticamente y ejecuta el workflow

3. **El workflow**:
   - Mockea la respuesta de Onfido (aprobado, porque `mockOnfidoApproved: true`)
   - Calcula el hash del resultado
   - Llama a `fulfillKYC()` en el contrato

4. **Verificar en el contrato** que el KYC fue aprobado

## 🔧 Configuración Actual

**config.staging.json:**
```json
{
  "kycIssuerAddress": "0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5",
  "mockOnfidoApproved": true  // true = siempre aprueba, false = siempre rechaza
}
```

**project.yaml:**
- RPC de World Chain Sepolia configurada con chain selector: `5299555114858065850`

## 📝 Notas

1. **Simulación local**: Para simular localmente necesitas un evento real emitido en la blockchain. Es más práctico desplegar directamente y probar con eventos reales.

2. **DON Address**: La dirección del DON la obtienes después de hacer `cre workflow deploy`. Luego necesitas otorgar el rol en el contrato.

3. **Testing**: Para testing, puedes usar `mockOnfidoApproved: false` en el config para verificar el flujo de rechazo también.


