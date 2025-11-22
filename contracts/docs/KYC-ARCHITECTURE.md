# 🔐 Arquitectura de KYC - Sistema Descentralizado

## 📋 Resumen Ejecutivo

Sistema de KYC (Know Your Customer) descentralizado para cumplimiento regulatorio en tokenización de real estate, integrando:
- **World ID** (proof-of-personhood)
- **Chainlink CRE** (orquestación descentralizada)
- **Onfido** (verificación legal de identidad)

---

## 🏗️ Arquitectura del Sistema

### 1. Flujo Completo del Usuario

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO COMPLETO DE KYC                       │
└─────────────────────────────────────────────────────────────────────┘

1. Usuario abre Mini App de World
   │
   ├─> World App genera ZK proof de humanidad
   │   (prueba que es una persona única sin revelar identidad)
   │
2. requestKYCWithWorldID(signal, root, nullifierHash, proof)
   │
   ├─> ChainlinkKYCIssuer verifica proof on-chain
   │   ✓ Proof matemáticamente válido (ZK-SNARK)
   │   ✓ Nullifier único (previene Sybil attacks)
   │   ✓ Root coincide con estado de World ID
   │
   ├─> Estado → WORLD_ID_VERIFIED
   │
   ├─> Emite evento: KYCRequested(user, nullifierHash, timestamp)
   │
3. Chainlink DON escucha evento
   │
   ├─> Workflow CRE se activa automáticamente
   │
   ├─> DON consulta Onfido API (off-chain)
   │   • Usuario sube documento (DNI, pasaporte)
   │   • Usuario toma selfie
   │   • Onfido verifica con IA + bases legales
   │   • Consenso entre múltiples nodos Chainlink
   │
4. fulfillKYC(user, approved, kycDataHash)
   │
   ├─> Solo CHAINLINK_DON_ROLE puede ejecutar
   │   (previene auto-aprobación)
   │
   ├─> Si approved == true:
   │   │
   │   ├─> Estado → FULL_KYC
   │   ├─> Guarda kycDataHash (hash de datos verificados)
   │   ├─> Incrementa totalKYCsApproved
   │   └─> Usuario puede invertir ✅
   │
   └─> Si approved == false:
       │
       ├─> Estado → REJECTED
       ├─> Cooldown de 7 días para reintentar
       └─> Usuario NO puede invertir ❌
```

---

## 🔐 Decisiones de Seguridad (Patrones Implementados)

### 1. **Check-Effects-Interactions (CEI)**

```solidity
// ✅ CORRECTO: Orden estricto
function requestKYCWithWorldID(...) external {
    // 1. CHECK
    if (kycData[msg.sender].status == KYCStatus.FULL_KYC) revert;
    if (usedNullifiers[nullifierHash]) revert;
    _verifyWorldIDProof(...); // Verificación externa
    
    // 2. EFFECTS
    usedNullifiers[nullifierHash] = true;
    kycData[msg.sender] = KYCData({...});
    
    // 3. INTERACTIONS
    emit KYCRequested(...);
}
```

**POR QUÉ:**
- Previene ataques de reentrancia
- Estado se actualiza ANTES de interacciones externas
- Si verificación falla → revert completo

### 2. **Emergency Stop (Pausable)**

```solidity
function requestKYCWithWorldID(...) 
    external 
    whenNotPaused  // ⬅️ Puede pausarse en emergencia
{
    // ...
}
```

**POR QUÉ:**
- Si se detecta vulnerabilidad → admin pausa inmediatamente
- Solicitudes nuevas se detienen
- Datos existentes permanecen seguros

### 3. **AccessControl Granular**

```solidity
bytes32 public constant CHAINLINK_DON_ROLE = keccak256("CHAINLINK_DON_ROLE");

function fulfillKYC(...) 
    external 
    onlyRole(CHAINLINK_DON_ROLE)  // ⬅️ Solo Chainlink puede aprobar
{
    // ...
}
```

**POR QUÉ:**
- Nadie puede auto-aprobar KYC
- Solo DON descentralizado (múltiples nodos en consenso)
- Admin puede pausar pero NO aprobar directamente

### 4. **ReentrancyGuard**

```solidity
contract ChainlinkKYCIssuer is ReentrancyGuard {
    function requestKYCWithWorldID(...) 
        external 
        nonReentrant  // ⬅️ Previene ataques
    {
        // ...
    }
}
```

**POR QUÉ:**
- Protección adicional contra reentrancia
- Buena práctica incluso sin external calls directos
- Preparado para futuras integraciones

---

## 🎯 Integración con SaleManager

### Validación en `buyFractions()`

```solidity
function buyFractions(address token, uint256 amount) external {
    // ========== CHECK ==========
    
    // 1️⃣ PRIMERO: Verificar KYC (CRÍTICO)
    if (!kycIssuer.isKYCVerified(msg.sender)) {
        revert KYCNotVerified();
    }
    
    // ¿POR QUÉ PRIMERO?
    // - Más importante que amount o balance
    // - Sin KYC → ilegal vender tokens (regulación)
    // - Falla rápido si no tiene KYC (ahorra gas)
    
    // 2️⃣ Verificar amount
    if (amount == 0) revert InvalidAmount();
    
    // 3️⃣ Calcular costos y verificar balance
    // ...
}
```

---

## 🧪 Testing: Simulación de KYC

### Helper en `Base.t.sol`

```solidity
function _approveKYC(address user) internal {
    vm.startPrank(admin);
    
    // PASO 1: Simular requestKYCWithWorldID
    // En producción: usuario genera ZK proof con World App
    // En tests: función especial mockRequestKYCForTesting()
    kycIssuer.mockRequestKYCForTesting(user);
    
    // PASO 2: Simular Chainlink callback
    // En producción: DON ejecuta después de consultar Onfido
    // En tests: admin (con CHAINLINK_DON_ROLE) ejecuta directamente
    kycIssuer.fulfillKYC(
        user,
        true, // approved
        keccak256(abi.encodePacked("mock_kyc_data_", user))
    );
    
    vm.stopPrank();
}
```

### Función Helper en Contrato (Solo Testing)

```solidity
/**
 * @notice SOLO PARA TESTING: Simula solicitud de KYC sin verificar proof
 * @dev Permite tests rápidos sin generar ZK proofs reales
 * 
 * ADVERTENCIA: En producción, esta función NO debe usarse
 * TODO: Considerar compilación condicional para removerla
 */
function mockRequestKYCForTesting(address user) 
    external 
    onlyRole(DEFAULT_ADMIN_ROLE)  // ⬅️ Solo admin en tests
{
    // Simula estado WORLD_ID_VERIFIED
    kycData[user] = KYCData({
        status: KYCStatus.WORLD_ID_VERIFIED,
        nullifierHash: keccak256(abi.encodePacked("test_nullifier_", user)),
        requestedAt: block.timestamp,
        approvedAt: 0,
        kycDataHash: bytes32(0),
        onchainIDAddress: address(0)
    });
    
    emit KYCRequested(user, kycData[user].nullifierHash, block.timestamp);
}
```

---

## 📊 Estados del KYC

```solidity
enum KYCStatus {
    NONE,                    // 0: No ha iniciado KYC
    WORLD_ID_VERIFIED,       // 1: World ID OK, esperando Onfido
    PENDING_OFFCHAIN,        // 2: Chainlink procesando (futuro)
    FULL_KYC,                // 3: ✅ KYC completo, puede invertir
    REJECTED                 // 4: ❌ Rechazado (puede reintentar después)
}
```

### Transiciones Válidas

```
NONE → WORLD_ID_VERIFIED (requestKYCWithWorldID)
     ↓
WORLD_ID_VERIFIED → FULL_KYC (fulfillKYC con approved=true)
                  → REJECTED (fulfillKYC con approved=false)
     ↓
REJECTED → WORLD_ID_VERIFIED (después de cooldown, reintento)
```

---

## 🔒 Prevención de Sybil Attacks

### Nullifier: Identificador Único

```solidity
// World ID genera un nullifier único por persona + app
bytes32 nullifierHash = keccak256(abi.encode(
    user_secret,           // Secreto solo conocido por el usuario
    worldAppId,            // "app_ours_kyc_v1"
    worldActionId          // "kyc-verification"
));

// En el contrato:
if (usedNullifiers[nullifierHash]) revert NullifierAlreadyUsed();
usedNullifiers[nullifierHash] = true;
```

**POR QUÉ:**
- Un nullifier = una persona única
- Matemáticamente imposible generar dos nullifiers iguales
- Si alguien intenta usar el mismo proof → revert
- Previene múltiples cuentas por la misma persona

---

## 🌐 Chainlink CRE: Orquestación Descentralizada

### ¿Qué es Chainlink CRE?

**Chainlink Runtime Environment (CRE)** es una capa de orquestación que conecta:
- **On-chain**: Smart contracts (ChainlinkKYCIssuer)
- **Off-chain**: APIs externas (Onfido, RENAPER, etc.)
- **Consenso**: Múltiples nodos Chainlink ejecutan el workflow

### Workflow CRE (Ejemplo)

```yaml
# chainlink-kyc-workflow.yaml

triggers:
  - event: KYCRequested
    contract: ChainlinkKYCIssuer
    network: worldchain

jobs:
  - id: verify-onfido
    type: http
    url: https://api.onfido.com/v3/checks
    method: POST
    params:
      applicant_id: ${event.user}
      report_names: ["document", "facial_similarity"]
    
  - id: consensus
    type: consensus
    min_confirmations: 3  # Al menos 3 nodos deben coincidir
    
  - id: callback
    type: transaction
    to: ChainlinkKYCIssuer
    function: fulfillKYC
    params:
      user: ${event.user}
      approved: ${jobs.verify-onfido.result.status == "complete"}
      kycDataHash: ${jobs.verify-onfido.result.hash}
```

**VENTAJAS:**
- ✅ Descentralizado (múltiples nodos)
- ✅ Sin single point of failure
- ✅ Resistente a censura
- ✅ Auditabilidad completa

---

## 🎓 Diferencias: World ID vs Onfido vs Chainlink

| Componente | Función | Qué Verifica |
|------------|---------|--------------|
| **World ID** | Proof-of-personhood | Eres humano único (no bot) |
| **Onfido** | KYC legal | Tu identidad real (nombre, DNI) |
| **Chainlink** | Orquestación | Conecta ambos de forma descentralizada |

### ¿Por qué necesitamos los 3?

1. **World ID**:
   - Previene Sybil attacks (una persona = un nullifier)
   - No revela identidad real (privacy)
   - Rápido y on-chain

2. **Onfido**:
   - Cumplimiento legal (AML/KYC)
   - Verifica documento físico
   - Compara selfie con documento (liveness)
   - Conectado con bases de datos gubernamentales

3. **Chainlink**:
   - Trae resultado de Onfido on-chain
   - Descentralizado (no confías en un solo oráculo)
   - Consenso entre múltiples nodos
   - Resistente a manipulación

---

## 📝 Métricas y Monitoreo

### Variables de Estado

```solidity
uint256 public totalKYCsApproved;  // Total aprobados (métrica)
uint256 public rejectionCooldown;  // Tiempo entre reintentos (7 días)
```

### Eventos para Analytics

```solidity
event KYCRequested(address indexed user, bytes32 indexed nullifierHash, uint256 timestamp);
event KYCFulfilled(address indexed user, bool approved, bytes32 kycDataHash);
```

**USO:**
- Dashboard de conversión (solicitudes vs aprobados)
- Tiempo promedio de procesamiento
- Tasa de rechazo por país/región
- Alertas de actividad anormal

---

## 🚀 Próximos Pasos (Producción)

### 1. Integrar World ID Router Real

```solidity
// En _verifyWorldIDProof(), reemplazar:
IWorldIDRouter(worldIdRouter).verifyProof(
    root,
    1, // groupId (1 = phone, 2 = orb)
    abi.encodePacked(signal).hashToField(),
    nullifierHash,
    abi.encodePacked(worldAppId).hashToField(),
    proof
);
```

### 2. Deploy Chainlink CRE Workflow

- Crear workflow en Chainlink CRE
- Configurar API de Onfido con credenciales
- Registrar nodos DON
- Testear en testnet (Sepolia)

### 3. OnchainID Integration (Opcional)

```solidity
// Crear identidad on-chain para cada usuario
IOnchainID identity = new OnchainID(user);
identity.addClaim(
    KYC_CLAIM_TOPIC,     // 1 = KYC verified
    1,                   // scheme: ECDSA
    address(this),       // issuer
    signature,           // firma del claim
    kycDataHash,         // data
    ""                   // uri
);
```

### 4. Testing Exhaustivo

- Tests de gas (optimizar costos)
- Fuzz testing (inputs aleatorios)
- Integration tests con World ID testnet
- Security audit (Certora, Code4rena)

---

## 💰 Estimación de Costos (Gas)

| Función | Gas Estimado | Costo (ETH @ 30 gwei) |
|---------|--------------|------------------------|
| `requestKYCWithWorldID()` | ~180,000 gas | ~0.0054 ETH (~$20) |
| `fulfillKYC()` | ~120,000 gas | ~0.0036 ETH (~$13) |
| **Total por usuario** | ~300,000 gas | **~0.009 ETH (~$33)** |

**OPTIMIZACIONES POSIBLES:**
- Batch processing (aprobar múltiples KYCs en 1 tx)
- Merkle tree para claims (reducir storage)
- L2 deployment (Optimism, Arbitrum) → 10-100x más barato

---

## 📞 Contacto y Soporte

Para preguntas sobre implementación:
- **World ID**: https://docs.world.org/
- **Chainlink CRE**: https://docs.chain.link/cre
- **Onfido**: https://documentation.onfido.com/

---

## 📄 Licencia

MIT License - Ver `LICENSE` para detalles.

