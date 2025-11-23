# Chainlink Functions KYC Workflow - Documentación Completa

## 📋 Resumen

Este documento explica cómo funciona el sistema de KYC (Know Your Customer) integrado con Chainlink Functions, que permite verificar usuarios de forma descentralizada y automática antes de que puedan invertir en propiedades tokenizadas.

## 🏗️ Arquitectura

### Componentes Principales

1. **ChainlinkKYCIssuer** (`0xBcB124082A8B25040Db883d7C1A7986099d609F6` en Sepolia)
   - Contrato inteligente que gestiona el proceso KYC
   - Emite eventos `KYCRequested` cuando un usuario solicita verificación
   - Recibe callbacks de Chainlink Functions con el resultado de la verificación

2. **Chainlink Functions Workflow** (`ours/ours/main.ts`)
   - Escucha eventos `KYCRequested` en el contrato
   - Llama a la API externa de KYC (`https://fastapi-kyc.onrender.com/verify`)
   - Usa **Consensus and Aggregation** para validar múltiples respuestas
   - Ejecuta `fulfillKYC()` en el contrato con el resultado

3. **API Externa de KYC**
   - Endpoint: `https://fastapi-kyc.onrender.com/verify`
   - Valida información del usuario y retorna `isverified: true/false`

## 🔄 Flujo Completo

```
1. Usuario → requestKYCWithWorldID() en ChainlinkKYCIssuer
   ↓
2. Contrato emite evento KYCRequested(address user, bytes32 nullifierHash, uint256 timestamp)
   ↓
3. Chainlink Functions detecta el evento (logTrigger)
   ↓
4. Workflow llama a la API externa con ConsensusAggregationByFields
   ↓
5. Workflow genera reporte firmado usando runtime.report()
   ↓
6. Workflow envía reporte a blockchain usando evmClient.writeReport()
   ↓
7. Contrato ejecuta fulfillKYC() y actualiza estado del usuario
   ↓
8. Usuario puede ahora invertir en propiedades (isKYCVerified() == true)
```

## 🚀 Setup y Deployment

### Prerrequisitos

1. **Node.js** y **Bun** instalados
2. **Chainlink CRE CLI** configurado
3. **Wallet con ETH en Sepolia** para deployment y testing
4. **API de KYC** funcionando

### 1. Deployment de Contratos

#### Deploy en Ethereum Sepolia

```bash
cd contracts
npm install

# Configurar .env con:
# SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# PRIVATE_KEY=tu_private_key

# Deploy MockIdentityRegistry y ChainlinkKYCIssuer
node scripts/deploy-all-sepolia.cjs
```

**Contratos desplegados:**
- `MockIdentityRegistry`: `0x7902D34b9185361DC48B1edF556e8ca5d2fAf53c`
- `ChainlinkKYCIssuer`: `0xBcB124082A8B25040Db883d7C1A7986099d609F6`

#### Configurar Roles

El deployer automáticamente recibe:
- `DEFAULT_ADMIN_ROLE`
- `OPERATOR_ROLE`
- `CHAINLINK_DON_ROLE`

**Verificar roles:**
```bash
node scripts/verify-don-role-sepolia.cjs
```

### 2. Configuración del Workflow

#### Archivo `ours/project.yaml`

```yaml
staging-settings:
  account:
    workflow-owner-address: "0xbd73D31277d69d2b80556068dbfcf9C3b5B2fd0b"
  rpcs:
    - chain-name: ethereum-testnet-sepolia
      url: https://ethereum-sepolia-rpc.publicnode.com
```

#### Archivo `ours/.env`

```env
CRE_ETH_PRIVATE_KEY=tu_private_key_aqui
```

**⚠️ IMPORTANTE:** La dirección derivada de `CRE_ETH_PRIVATE_KEY` debe coincidir con `workflow-owner-address` en `project.yaml` y debe tener `CHAINLINK_DON_ROLE` en el contrato.

#### Archivo `ours/ours/config.staging.json`

```json
{
  "kycIssuerAddress": "0xBcB124082A8B25040Db883d7C1A7986099d609F6",
  "kycApiUrl": "https://fastapi-kyc.onrender.com/verify",
  "useMock": false
}
```

### 3. Login en Chainlink CRE

```bash
cd ours
cre login
```

Sigue las instrucciones para autenticarte con Chainlink.

## 🧪 Testing del Workflow

### Opción 1: Simulación Local (Recomendado)

#### Paso 1: Trigger un evento KYCRequested

```bash
cd contracts
node scripts/trigger-kyc-sepolia.cjs
```

Esto:
- Llama `mockRequestKYCForTesting()` en el contrato
- Emite el evento `KYCRequested`
- Te da el `tx-hash` y `event-index` para usar en la simulación

#### Paso 2: Simular el workflow

```bash
cd ours
cre workflow simulate ./ours \
  --project-root . \
  -T staging-settings \
  --broadcast \
  --non-interactive \
  --trigger-index 0 \
  --evm-tx-hash <tx-hash-del-paso-1> \
  --evm-event-index <event-index-del-paso-1>
```

**Parámetros importantes:**
- `--broadcast`: Escribe realmente en la blockchain (usa gas real)
- `--evm-tx-hash`: Hash de la transacción que emitió el evento
- `--evm-event-index`: Índice del evento en la transacción

### Opción 2: Deployment Real (Requiere acceso early)

```bash
cd ours
cre workflow deploy ./ours --target=staging-settings
```

**Nota:** El deployment real requiere acceso early access de Chainlink CRE.

## 📊 Verificación de Transacciones

### Transacción de Ejemplo

**Hash:** `0x05b47c08d8439339045a29d8b9e9e38beadd7e18b4d6310301c3279c3252bc82`

**Etherscan:** https://sepolia.etherscan.io/tx/0x05b47c08d8439339045a29d8b9e9e38beadd7e18b4d6310301c3279c3252bc82

### Análisis de la Transacción

1. **From:** `0xbd73D31277d69d2b80556068dbfcf9C3b5B2fd0b` (Workflow Owner)
2. **To:** `0x15fC6ae953E024d975e77382eEeC56A9101f9F88` (Chainlink Functions Router)
3. **Status:** Success ✅
4. **Evento `ReportProcessed`:**
   - `receiver`: `0xBcB124082A8B25040Db883d7C1A7986099d609F6` (ChainlinkKYCIssuer)
   - `workflowExecutionId`: `C094F178EC897B31F4B7A8AAFFB03F9DEE1437483A927459A2D4197DAFBFEBF6`
   - `reportId`: `0001`
   - `result`: `False` ⚠️

### Interpretación del Resultado

**`result: False`** indica que:
- ✅ El reporte fue procesado correctamente por Chainlink Functions
- ✅ La transacción fue enviada al contrato
- ❌ El contrato rechazó la ejecución (probablemente porque el usuario no tiene `WORLD_ID_VERIFIED` status)

**Posibles causas:**
1. El usuario no completó la verificación de World ID antes de solicitar KYC
2. El estado del usuario en el contrato no es `WORLD_ID_VERIFIED`
3. El contrato está pausado

**Solución:** Asegurarse de que el usuario haya llamado `requestKYCWithWorldID()` primero, pasando la prueba de World ID.

## 🔍 Debugging

### Verificar Estado del Usuario en el Contrato

```javascript
// Usando ethers.js
const kycIssuer = new ethers.Contract(
  "0xBcB124082A8B25040Db883d7C1A7986099d609F6",
  ChainlinkKYCIssuerABI,
  provider
);

const kycData = await kycIssuer.getKYCData(userAddress);
console.log("Status:", kycData.status); // Debe ser WORLD_ID_VERIFIED (1)
console.log("Is Verified:", await kycIssuer.isKYCVerified(userAddress));
```

### Verificar Roles

```bash
cd contracts
node scripts/verify-don-role-sepolia.cjs
```

### Logs del Workflow

Los logs del workflow muestran:
- ✅ Detección del evento `KYCRequested`
- ✅ Llamada a la API de KYC
- ✅ Resultado de la API (approved/rejected)
- ✅ Hash del KYC generado
- ✅ Envío del reporte a la blockchain
- ✅ Hash de la transacción

## 🔐 Seguridad

### Roles y Permisos

- **`CHAINLINK_DON_ROLE`**: Solo Chainlink Functions puede ejecutar `fulfillKYC()`
- **`DEFAULT_ADMIN_ROLE`**: Puede pausar/despausar el contrato
- **`OPERATOR_ROLE`**: Puede actualizar configuraciones

### Validaciones

1. **World ID Verification**: Usuario debe pasar verificación de World ID primero
2. **Pausable**: El contrato puede ser pausado en caso de emergencia
3. **ReentrancyGuard**: Previene ataques de reentrancy
4. **Consensus and Aggregation**: Múltiples nodos validan la respuesta de la API

## 📚 Referencias

- [Chainlink Functions Documentation](https://docs.chainlink.com/functions)
- [Chainlink CRE SDK Reference](https://docs.chainlink.com/cre/reference/sdk/evm-client-ts)
- [Etherscan Sepolia](https://sepolia.etherscan.io)
- [Contrato en Etherscan](https://sepolia.etherscan.io/address/0xBcB124082A8B25040Db883d7C1A7986099d609F6)

## 🎯 Próximos Pasos

1. **Verificar estado del usuario** antes de que el workflow intente cumplir el KYC
2. **Implementar retry logic** para casos donde la API falle
3. **Agregar más validaciones** en el contrato
4. **Deploy a producción** cuando se tenga acceso early access
5. **Monitoreo** de eventos y transacciones

## 📝 Notas Técnicas

### Consensus and Aggregation

El workflow usa `ConsensusAggregationByFields` con `identical` para validar:
- `isverified`: Debe ser idéntico en todas las respuestas
- `email`: Debe coincidir
- `user_address`: Debe coincidir

Esto asegura que múltiples nodos de Chainlink Functions obtengan el mismo resultado de la API.

### Flujo de Escritura en Blockchain

1. **`encodeFunctionData()`**: Codifica los parámetros de la función
2. **`runtime.report(prepareReportRequest(callData))`**: Genera un reporte firmado
3. **`evmClient.writeReport()`**: Envía el reporte a la blockchain

**⚠️ IMPORTANTE:** `evmClient.callContract()` es solo para lectura. Para escribir, siempre usar `writeReport()`.

