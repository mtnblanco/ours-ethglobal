# Estado del Deploy del Workflow

## ⚠️ Acceso Requerido

El deploy del workflow a Chainlink DON requiere **acceso temprano**. 

**Para obtener acceso:**
1. Visita: https://cre.chain.link/request-access
2. Solicita acceso para tu organización
3. Una vez aprobado, podrás desplegar con:

```bash
cd /Users/mtn/Desktop/ours-eth/ours
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"

cre workflow deploy ./ours --target=staging-settings
```

## ✅ Preparación Completa

Mientras tanto, el workflow está **100% listo** para deploy:

### Configuración Verificada

1. ✅ **Chain Selector**: World Chain Sepolia (`5299555114858065850`)
2. ✅ **Contrato**: `ChainlinkKYCIssuer` en `0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5`
3. ✅ **RPC URL**: Configurada en `project.yaml`
4. ✅ **Onfido Mockeado**: Listo para testing
5. ✅ **Dependencias**: Instaladas y funcionando

### Archivos Listos

- ✅ `ours/main.ts` - Workflow TypeScript completo
- ✅ `ours/config.staging.json` - Configuración del contrato
- ✅ `ours/project.yaml` - Configuración de red
- ✅ `ours/ours/abis/ChainlinkKYCIssuer.json` - ABI del contrato

## 🔄 Alternativas Mientras Esperas Acceso

### Opción 1: Compilar el Workflow (para verificar que funciona)

Puedes compilar el workflow para verificar que no hay errores:

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
export PATH="$HOME/.bun/bin:$PATH"

# Compilar
bun build main.ts --outdir dist --target=bun
```

### Opción 2: Preparar Script para Otorgar Permisos

Cuando tengas la dirección del DON, necesitarás otorgarle el rol `CHAINLINK_DON_ROLE`.

Puedes preparar un script en Hardhat:

**`contracts/scripts/grant-don-role.ts`**:
```typescript
import { ethers } from "hardhat";

async function main() {
  const KYC_ISSUER_ADDRESS = "0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5";
  const CHAINLINK_DON_ADDRESS = "0x..."; // Obtener después del deploy
  
  const kycIssuer = await ethers.getContractAt("ChainlinkKYCIssuer", KYC_ISSUER_ADDRESS);
  
  const CHAINLINK_DON_ROLE = await kycIssuer.CHAINLINK_DON_ROLE();
  
  console.log(`Otorgando rol CHAINLINK_DON_ROLE a ${CHAINLINK_DON_ADDRESS}...`);
  
  const tx = await kycIssuer.grantRole(CHAINLINK_DON_ROLE, CHAINLINK_DON_ADDRESS);
  await tx.wait();
  
  console.log(`✅ Rol otorgado exitosamente!`);
  console.log(`Tx hash: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Opción 3: Probar el Flujo Manualmente (Mock)

Puedes probar manualmente el flujo llamando directamente a `fulfillKYC()` en el contrato para verificar que todo funciona:

```typescript
// Script de prueba manual
const kycIssuer = await ethers.getContractAt("ChainlinkKYCIssuer", KYC_ISSUER_ADDRESS);

const user = "0x..."; // Dirección de usuario
const approved = true;
const hash = "0x..."; // Hash mockeado

await kycIssuer.fulfillKYC(user, approved, hash);
```

## 📋 Checklist Post-Deploy

Una vez que tengas acceso y despliegues:

- [ ] Deploy del workflow: `cre workflow deploy ./ours --target=staging-settings`
- [ ] Obtener dirección del DON de Chainlink
- [ ] Otorgar `CHAINLINK_DON_ROLE` al DON en el contrato
- [ ] Verificar que el workflow esté escuchando eventos
- [ ] Probar llamando a `requestKYCWithWorldID()` desde el frontend
- [ ] Verificar logs del workflow en Chainlink dashboard
- [ ] Confirmar que `fulfillKYC()` se ejecuta correctamente

## 🎯 Estado Actual

**Workflow**: ✅ Listo para deploy  
**Acceso CRE**: ⏳ Pendiente de solicitud  
**Contrato**: ✅ Desplegado y configurado  
**Configuración**: ✅ Completa

