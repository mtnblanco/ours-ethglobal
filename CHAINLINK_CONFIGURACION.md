# ⚙️ Configuración de Chainlink: Qué Falta

## 🎯 Resumen Ejecutivo

**Chainlink NO está configurado.** Necesitas crear un **workflow** que:
1. Escuche el evento `KYCRequested` de tu contrato
2. Consulte la API de Entrust/Onfido
3. Ejecute `fulfillKYC()` en tu contrato

---

## 🔍 ¿Qué es Chainlink CRE/DON?

### Chainlink DON (Decentralized Oracle Network)
- Red de nodos descentralizados que ejecutan código off-chain
- Múltiples nodos consensuan antes de ejecutar transacciones
- Más seguro que un solo servidor centralizado

### Chainlink CRE (Runtime Environment)
- Entorno donde ejecutas workflows (como un "cron job" descentralizado)
- Escucha eventos on-chain
- Ejecuta lógica off-chain (HTTP requests, procesamiento)
- Llama funciones on-chain con resultados

---

## ❌ Lo que NO Está Configurado

### 1. **Workflow de Chainlink**
- ❌ No existe workflow que escuche `KYCRequested`
- ❌ No hay configuración de Chainlink Functions/Automation
- ❌ No hay código que consulte Entrust/Onfido API

### 2. **Rol en el Contrato**
- ❌ Ninguna dirección tiene el rol `CHAINLINK_DON_ROLE`
- ❌ Sin este rol, nadie puede llamar `fulfillKYC()`

### 3. **Infraestructura**
- ❌ No hay nodos DON registrados
- ❌ No hay subscription de Chainlink Functions
- ❌ No hay external adapter para Entrust/Onfido

---

## 🚀 Opciones para Configurar Chainlink

### **Opción 1: Chainlink Functions** (Recomendada - Más Simple)

Chainlink Functions permite ejecutar código JavaScript/TypeScript off-chain.

#### Paso 1: Crear Subscription en Chainlink Functions

1. Ve a [Chainlink Functions](https://functions.chain.link/)
2. Conecta tu wallet
3. Crea una nueva subscription
4. Fondea con LINK tokens (para pagar ejecuciones)

#### Paso 2: Crear Source Code (JavaScript)

```javascript
// chainlink-kyc-source.js
// Este código se ejecuta en Chainlink DON

// 1. Obtener datos del evento KYCRequested
const userAddress = args[0]; // Dirección del usuario
const nullifierHash = args[1]; // Nullifier de World ID

// 2. Consultar Entrust/Onfido API
const onfidoApiKey = secrets.onfidoApiKey;
const applicantId = await getApplicantIdFromUserAddress(userAddress);

const checkResponse = await Functions.makeHttpRequest({
  url: `https://api.onfido.com/v3/checks/${applicantId}`,
  method: 'GET',
  headers: {
    'Authorization': `Token token=${onfidoApiKey}`,
    'Content-Type': 'application/json'
  }
});

// 3. Procesar resultado
const checkResult = checkResponse.data;
const approved = checkResult.result === 'clear'; // 'clear' = aprobado
const kycDataHash = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(JSON.stringify(checkResult.reports))
);

// 4. Retornar datos para fulfillKYC()
return Functions.encodeString(
  JSON.stringify({
    user: userAddress,
    approved: approved,
    kycDataHash: kycDataHash
  })
);
```

#### Paso 3: Configurar Consumer Contract

Necesitas un contrato "Consumer" que:
- Escuche eventos `KYCRequested`
- Llame a Chainlink Functions
- Ejecute `fulfillKYC()` con el resultado

```solidity
// ChainlinkKYCConsumer.sol
import "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsConsumer.sol";
import "./ChainlinkKYCIssuer.sol";

contract ChainlinkKYCConsumer is FunctionsConsumer {
    ChainlinkKYCIssuer public kycIssuer;
    uint64 public subscriptionId;
    
    // Mapeo: requestId → userAddress
    mapping(bytes32 => address) public pendingKYCs;
    
    constructor(
        address _router,
        address _kycIssuer,
        uint64 _subscriptionId
    ) FunctionsConsumer(_router) {
        kycIssuer = ChainlinkKYCIssuer(_kycIssuer);
        subscriptionId = _subscriptionId;
    }
    
    // Escucha evento KYCRequested y llama a Chainlink Functions
    function onKYCRequested(
        address user,
        bytes32 nullifierHash
    ) external {
        // Preparar argumentos para Chainlink Functions
        string[] memory args = new string[](2);
        args[0] = Strings.toHexString(uint256(uint160(user)), 20);
        args[1] = Strings.toHexString(uint256(nullifierHash), 32);
        
        // Llamar a Chainlink Functions
        bytes32 requestId = _sendRequest(
            subscriptionId,
            sourceCode, // Tu código JavaScript
            args,
            secrets, // API keys
            subscriptionId,
            gasLimit
        );
        
        pendingKYCs[requestId] = user;
    }
    
    // Callback de Chainlink Functions
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        address user = pendingKYCs[requestId];
        require(user != address(0), "Invalid request");
        
        // Decodificar respuesta
        string memory result = string(response);
        // Parse JSON y extraer approved, kycDataHash
        
        // Llamar a fulfillKYC() en ChainlinkKYCIssuer
        kycIssuer.fulfillKYC(user, approved, kycDataHash);
        
        delete pendingKYCs[requestId];
    }
}
```

#### Paso 4: Otorgar Rol al Consumer

```solidity
// En tu script de deploy o manualmente:
await kycIssuer.grantRole(
    kycIssuer.CHAINLINK_DON_ROLE(),
    chainlinkKYCConsumer.address
);
```

**Costo:** ~$0.10 - $1.00 por ejecución (depende de gas)

---

### **Opción 2: Chainlink Automation** (Más Complejo)

Chainlink Automation ejecuta funciones periódicamente o cuando se cumplen condiciones.

#### Paso 1: Crear Upkeep

1. Ve a [Chainlink Automation](https://automation.chain.link/)
2. Crea un nuevo "Upkeep"
3. Configura para escuchar eventos `KYCRequested`

#### Paso 2: Crear External Adapter

Necesitas crear un "External Adapter" (servidor) que:
- Escuche eventos `KYCRequested`
- Consulte Entrust/Onfido API
- Retorne resultado

```javascript
// external-adapter/server.js
const express = require('express');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

// Escuchar eventos KYCRequested
const provider = new ethers.JsonRpcProvider(WORLD_CHAIN_RPC_URL);
const contract = new ethers.Contract(
    KYC_ISSUER_ADDRESS,
    ['event KYCRequested(address indexed user, bytes32 indexed nullifierHash, uint256 timestamp)'],
    provider
);

contract.on('KYCRequested', async (user, nullifierHash, timestamp) => {
    // Consultar Entrust/Onfido
    const result = await checkOnfidoStatus(user);
    
    // Llamar a fulfillKYC() vía Chainlink Automation
    await callFulfillKYC(user, result.approved, result.kycDataHash);
});

app.listen(3000);
```

#### Paso 3: Registrar External Adapter en Chainlink

- Registrar tu servidor como External Adapter
- Configurar Chainlink Automation para usarlo

**Costo:** Más complejo, requiere servidor propio

---

### **Opción 3: Backend Directo** (Temporal - NO Descentralizado)

Si no quieres configurar Chainlink ahora, puedes hacer que tu backend llame directamente a `fulfillKYC()`.

#### Paso 1: Otorgar Rol al Backend Wallet

```typescript
// En script de deploy o manualmente:
const kycIssuer = await ethers.getContractAt(
    'ChainlinkKYCIssuer',
    KYC_ISSUER_ADDRESS
);

await kycIssuer.grantRole(
    await kycIssuer.CHAINLINK_DON_ROLE(),
    BACKEND_WALLET_ADDRESS // Tu wallet del backend
);
```

#### Paso 2: Agregar Función en Backend

```typescript
// backend/src/services/blockchain.ts
async fulfillKYCFromOnfido(
    userAddress: string,
    approved: boolean,
    kycDataHash: string
): Promise<SmartContractResponse> {
    const contract = new ethers.Contract(
        this.contractAddress,
        [
            'function fulfillKYC(address user, bool approved, bytes32 kycDataHash) external'
        ],
        this.wallet
    );

    const tx = await contract.fulfillKYC(
        userAddress,
        approved,
        ethers.hexlify(ethers.toUtf8Bytes(kycDataHash))
    );

    const receipt = await tx.wait();
    return {
        success: true,
        transaction_hash: receipt.hash
    };
}
```

#### Paso 3: Conectar Webhook de Entrust/Onfido

```typescript
// backend/src/routes/onfido.ts
router.post('/webhook', async (req, res) => {
    const { payload } = req.body;
    
    if (payload.action === 'check.completed') {
        const result = await onfidoService.getCheckResult(payload.object.id);
        const userAddress = await getUserAddressFromApplicantId(payload.object.applicant_id);
        
        // Llamar directamente a fulfillKYC()
        await blockchainService.fulfillKYCFromOnfido(
            userAddress,
            result.result === 'clear',
            calculateKycDataHash(result)
        );
    }
    
    res.status(200).send('OK');
});
```

**⚠️ IMPORTANTE:** Esto es **centralizado** (tu backend controla todo). Para producción, usa Chainlink.

---

## 📋 Checklist de Configuración

### Opción 1: Chainlink Functions
- [ ] Crear cuenta en Chainlink Functions
- [ ] Crear subscription y fondear con LINK
- [ ] Escribir source code (JavaScript) para consultar Entrust/Onfido
- [ ] Deploy contrato Consumer
- [ ] Otorgar rol `CHAINLINK_DON_ROLE` al Consumer
- [ ] Configurar secrets (API keys de Entrust/Onfido)
- [ ] Testear en testnet

### Opción 2: Chainlink Automation
- [ ] Crear cuenta en Chainlink Automation
- [ ] Crear External Adapter (servidor)
- [ ] Registrar External Adapter en Chainlink
- [ ] Crear Upkeep que escuche `KYCRequested`
- [ ] Configurar para llamar `fulfillKYC()`
- [ ] Testear en testnet

### Opción 3: Backend Directo (Temporal)
- [ ] Otorgar rol `CHAINLINK_DON_ROLE` al wallet del backend
- [ ] Agregar función `fulfillKYCFromOnfido()` en backend
- [ ] Conectar webhook de Entrust/Onfido → `fulfillKYC()`
- [ ] Testear flujo completo

---

## 💰 Costos Estimados

### Chainlink Functions
- **Subscription:** Gratis (solo pagas por uso)
- **Por ejecución:** ~$0.10 - $1.00 (depende de gas y complejidad)
- **Gas:** Pagado por tu subscription

### Chainlink Automation
- **Upkeep:** ~$5-10 USD/mes (depende de frecuencia)
- **Gas:** Pagado por tu subscription

### Backend Directo
- **Costo:** Solo gas de transacciones
- **Gas por `fulfillKYC()`:** ~50,000 - 100,000 gas
- **En World Chain Sepolia:** Muy barato (~$0.01 por transacción)

---

## 🎯 Recomendación

**Para empezar rápido:**
1. Usa **Opción 3 (Backend Directo)** temporalmente
2. Implementa Entrust/Onfido en frontend y backend
3. Testea el flujo completo
4. Luego migra a **Chainlink Functions** para producción

**Para producción:**
- Usa **Chainlink Functions** (más simple que Automation)
- Descentralizado y seguro
- Costo razonable

---

## 📚 Recursos

- **Chainlink Functions Docs:** https://docs.chain.link/chainlink-functions
- **Chainlink Automation Docs:** https://docs.chain.link/chainlink-automation
- **Chainlink Functions UI:** https://functions.chain.link/
- **Chainlink Automation UI:** https://automation.chain.link/

---

## ❓ Preguntas Frecuentes

### ¿Necesito LINK tokens?
**Sí**, para pagar ejecuciones de Chainlink Functions/Automation.

### ¿Puedo usar Chainlink sin pagar?
**No**, pero el costo es muy bajo (~$0.10 por ejecución).

### ¿Es obligatorio usar Chainlink?
**No**, puedes usar Opción 3 (backend directo), pero es centralizado.

### ¿Cuánto tiempo toma configurar Chainlink Functions?
**2-4 horas** si es tu primera vez.

---

**¿Quieres que te ayude a configurar alguna de estas opciones?**

