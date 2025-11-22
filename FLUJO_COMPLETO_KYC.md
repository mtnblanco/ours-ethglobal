# 🔄 Flujo Completo KYC: World ID + Entrust (Onfido) + Chainlink

## ✅ Confirmación: Los Contratos Están FINALIZADOS

**Sí, los contratos están completos y listos.** No necesitas modificar `ChainlinkKYCIssuer.sol`. Está diseñado para funcionar con:
- ✅ **World ID** (ya implementado)
- ✅ **Entrust/Onfido** (falta integrar)
- ✅ **Chainlink CRE** (falta configurar)

---

## 🏗️ Arquitectura Completa del Flujo

### Flujo Paso a Paso

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO DE KYC                       │
└─────────────────────────────────────────────────────────────────┘

1. FRONTEND: Usuario verifica con World ID
   │
   ├─> MiniKit genera ZK proof
   │
   ├─> Frontend llama: POST /api/v1/kyc/worldid
   │
   └─> Backend verifica proof ✅

2. BACKEND: Llama al Smart Contract
   │
   ├─> Backend ejecuta: requestKYCWithWorldID() en contrato
   │
   ├─> Contrato verifica World ID proof on-chain ✅
   │
   ├─> Estado del usuario → WORLD_ID_VERIFIED
   │
   └─> Contrato emite evento: KYCRequested(user, nullifierHash) ✅

3. FRONTEND: Captura de Documentos (Entrust/Onfido)
   │
   ├─> Usuario ve pantalla: "Sube tu documento y selfie"
   │
   ├─> Frontend usa SDK de Entrust/Onfido
   │   • Captura foto de DNI/pasaporte
   │   • Captura selfie
   │   • Sube a Entrust/Onfido API
   │
   └─> Entrust/Onfido procesa con IA ✅

4. CHAINLINK CRE: Orquestación Descentralizada
   │
   ├─> Chainlink DON escucha evento KYCRequested ✅
   │
   ├─> Workflow CRE se activa automáticamente
   │
   ├─> DON consulta Entrust/Onfido API (off-chain)
   │   • Obtiene resultado de verificación
   │   • Consenso entre múltiples nodos
   │
   └─> DON ejecuta: fulfillKYC(user, approved, kycDataHash) ✅

5. SMART CONTRACT: Finaliza KYC
   │
   ├─> fulfillKYC() actualiza estado → FULL_KYC ✅
   │
   ├─> Crea OnchainID y registra en IdentityRegistry ✅
   │
   └─> Usuario puede invertir ✅
```

---

## 📍 ¿Dónde se Implementa Cada Parte?

### 1. **Frontend** (ours-platform/)
**Responsabilidad:** Captura de documentos y selfie

**Tecnología:**
- SDK de Entrust/Onfido (`@onfido/react-sdk` o equivalente)
- Componente React para captura
- Manejo de estados (cargando, error, éxito)

**Qué hace:**
- Muestra UI para subir documento
- Captura selfie con cámara
- Sube archivos a Entrust/Onfido vía API
- Muestra progreso al usuario

**Estado:** ❌ **NO IMPLEMENTADO**

---

### 2. **Backend** (backend/)
**Responsabilidad:** Intermediario entre Frontend y Entrust/Onfido

**Tecnología:**
- `@onfido/api` o API de Entrust
- Endpoints REST para crear applicant y check
- Webhook handler para recibir resultados

**Qué hace:**
- Crea "applicant" en Entrust/Onfido
- Genera SDK token para frontend
- Inicia verificación (check)
- Recibe webhook con resultado
- (Opcional) Llama a `fulfillKYC()` si no usas Chainlink

**Estado:** ❌ **NO IMPLEMENTADO**

---

### 3. **Chainlink CRE** (Infraestructura Externa)
**Responsabilidad:** Conectar Entrust/Onfido con Smart Contract de forma descentralizada

**Tecnología:**
- Chainlink Functions o Automation
- Workflow que escucha eventos on-chain
- External Adapter para Entrust/Onfido API

**Qué hace:**
- Escucha evento `KYCRequested` del contrato
- Consulta Entrust/Onfido API para obtener resultado
- Consenso entre múltiples nodos DON
- Ejecuta `fulfillKYC()` en el contrato

**Estado:** ❌ **NO CONFIGURADO**

---

### 4. **Smart Contract** (contracts/)
**Responsabilidad:** Lógica on-chain y almacenamiento

**Tecnología:**
- Solidity
- OpenZeppelin (AccessControl, Pausable, ReentrancyGuard)
- ERC-3643 (IdentityRegistry)

**Qué hace:**
- Verifica World ID proof
- Emite evento `KYCRequested`
- Recibe resultado de Chainlink vía `fulfillKYC()`
- Actualiza estado del usuario
- Registra en IdentityRegistry

**Estado:** ✅ **COMPLETO Y FINALIZADO** (no necesita cambios)

---

## 🎯 Respuestas a tus Preguntas

### 1. ¿Onfido/Entrust es desde el frontend?

**Sí y No.** Tiene DOS partes:

**Frontend:**
- ✅ Captura de documentos (foto de DNI, selfie)
- ✅ UI para el usuario
- ✅ SDK de Entrust/Onfido instalado en frontend

**Backend:**
- ✅ API calls a Entrust/Onfido (crear applicant, iniciar check)
- ✅ Recibir webhooks con resultados
- ✅ Procesar respuestas

**Resumen:** El frontend captura, el backend procesa.

---

### 2. ¿Los contratos están finalizados?

**SÍ, 100% finalizados.** No necesitas modificar nada en los contratos.

El contrato `ChainlinkKYCIssuer.sol` está diseñado para:
- ✅ Recibir World ID proof → `requestKYCWithWorldID()`
- ✅ Emitir evento `KYCRequested` cuando World ID es verificado
- ✅ Recibir resultado de Entrust/Onfido vía Chainlink → `fulfillKYC()`
- ✅ Actualizar estado del usuario a `FULL_KYC`
- ✅ Registrar en IdentityRegistry (ERC-3643)

**No necesitas cambiar el contrato.** Solo necesitas:
1. Integrar Entrust/Onfido en frontend y backend
2. Configurar Chainlink CRE para conectar Entrust/Onfido → Contrato

---

### 3. ¿Va a funcionar con Chainlink, Entrust y World ID?

**SÍ, exactamente así está diseñado.**

El flujo completo es:
```
World ID (on-chain) 
    ↓
ChainlinkKYCIssuer.requestKYCWithWorldID()
    ↓
Evento KYCRequested
    ↓
Chainlink CRE escucha
    ↓
Entrust/Onfido verifica documentos (off-chain)
    ↓
Chainlink CRE → fulfillKYC()
    ↓
Usuario puede invertir ✅
```

**Los contratos ya están listos para este flujo.**

---

## 📋 Lo que Falta Implementar

### Opción A: Con Chainlink CRE (Producción - Descentralizado)

**Falta:**
1. ❌ Frontend: SDK de Entrust/Onfido + componente de captura
2. ❌ Backend: Servicio de Entrust/Onfido + webhook handler
3. ❌ Chainlink CRE: Workflow que escucha `KYCRequested` y llama a Entrust/Onfido

**Contratos:** ✅ No necesitan cambios

---

### Opción B: Sin Chainlink CRE (Temporal - Centralizado)

**Falta:**
1. ❌ Frontend: SDK de Entrust/Onfido + componente de captura
2. ❌ Backend: Servicio de Entrust/Onfido + webhook handler
3. ❌ Backend: Función para llamar `fulfillKYC()` directamente
4. ❌ Backend: Otorgar rol `CHAINLINK_DON_ROLE` al wallet del backend

**Contratos:** ✅ No necesitan cambios (solo otorgar rol al backend)

---

## 🔧 Nota sobre Entrust vs Onfido

**Entrust compró Onfido**, pero:
- La API es compatible (mismo formato)
- El SDK de React sigue siendo `@onfido/react-sdk`
- El paquete npm puede ser `@onfido/api` o equivalente de Entrust
- La documentación puede estar en entrust.com o onfido.com

**Para implementar, usa:**
- Frontend: `@onfido/react-sdk` (o equivalente de Entrust)
- Backend: `@onfido/api` (o equivalente de Entrust)
- Misma lógica, solo cambia el proveedor

---

## ✅ Conclusión

**Los contratos están 100% listos.** Solo falta:

1. **Frontend:** Integrar SDK de Entrust/Onfido para captura
2. **Backend:** Servicio de Entrust/Onfido + webhook
3. **Chainlink CRE:** Configurar workflow (o usar backend directo temporalmente)

**No necesitas tocar los contratos.** Están diseñados correctamente para este flujo.

¿Quieres que implemente el frontend y backend de Entrust/Onfido ahora?

