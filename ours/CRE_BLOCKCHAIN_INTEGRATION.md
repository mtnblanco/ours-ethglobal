# Chainlink CRE - Integración Onchain para RWA Real Estate

## 🎯 ¿Qué escribe el CRE en la Blockchain?

El **Chainlink Runtime Environment (CRE)** ejecuta la función `fulfillKYC()` en el contrato `ChainlinkKYCIssuer`, escribiendo:

```solidity
fulfillKYC(
    address user,        // Usuario que solicitó KYC
    bool approved,       // true si Onfido aprobó, false si rechazó
    bytes32 hash         // Hash del resultado de Onfido (Keccak256)
)
```

**Resultado onchain:**
- ✅ Actualiza el estado KYC del usuario a `FULL_KYC` o `REJECTED`
- ✅ Guarda el hash criptográfico del resultado de Onfido para verificación
- ✅ Habilita al usuario para invertir en propiedades tokenizadas

---

## 🏗️ Nuestro Proyecto: RWA Real Estate en World Chain

**Miniapp** que permite:
- 🏢 Tokenizar propiedades inmobiliarias (RWA)
- 💰 Vender fracciones de propiedades
- 📊 Distribuir rentas automáticamente
- 🌍 Operar en World Chain (L2 optimizado para apps globales)

---

## 🔄 Flujo Completo

```
1. Usuario (Miniapp) → requestKYCWithWorldID()
                     ↓
2. Contrato → Emite evento KYCRequested
                     ↓
3. Chainlink CRE → Detecta evento automáticamente
                 → Consulta Onfido API (offchain)
                 → Calcula hash del resultado
                 → ESCRIBE fulfillKYC() onchain ✍️
                     ↓
4. Contrato → Estado KYC actualizado
                     ↓
5. Usuario → Puede invertir en propiedades tokenizadas ✅
```

---

## ✍️ Qué escribe específicamente

### Estado actualizado:
- `status`: `FULL_KYC` (aprobado) o `REJECTED` (rechazado)
- `approvedAt`: Timestamp de aprobación
- `kycDataHash`: Hash del resultado completo de Onfido

### Evento emitido:
- `KYCCompleted(user, approved, hash, timestamp)`

---

## 🎯 ¿Por qué usamos CRE para RWA?

### 1. **Cumplimiento Regulatorio (ERC-3643)**
   - Los valores tokenizados requieren KYC onchain
   - CRE automatiza el proceso sin intervención manual
   - ✅ Todo queda registrado en blockchain (auditable)

### 2. **Puente Offchain → Onchain**
   - Onfido es un servicio offchain (API externa)
   - Los contratos solo aceptan datos onchain
   - **CRE hace el puente**: escucha eventos → consulta Onfido → escribe resultado

### 3. **Confianza Descentralizada**
   - CRE es ejecutado por el DON de Chainlink (red descentralizada)
   - Resultado firmado criptográficamente (hash)
   - ✅ Inmutable: una vez escrito, no se puede cambiar

### 4. **Escalabilidad en World Chain**
   - World Chain optimizado para miniapps globales
   - CRE permite operaciones complejas offchain
   - ✅ Bajo costo de gas: solo se paga por el resultado final

---

## 🔐 Seguridad

### Hash de Verificación
El hash `keccak256(JSON.stringify(onfidoResult))` permite:
- ✅ Verificar que el resultado no fue manipulado
- ✅ Probar que el resultado viene de Onfido
- ✅ Auditoría posterior si es necesario

---

## 💼 Caso de Uso: Inversión en Propiedades

**Sin CRE:**
```
Usuario → KYC manual → Esperar → Llamar contrato manualmente
❌ Lento, centralizado, requiere confianza
```

**Con CRE:**
```
Usuario → Solicita KYC → CRE automatiza → Resultado onchain automático
✅ Rápido, descentralizado, confiable
```

**Resultado:** Usuario puede invertir inmediatamente después de aprobar KYC, cumpliendo todas las regulaciones necesarias.

---

## 📊 Impacto

- **Para Usuarios:** Proceso más rápido y seguro
- **Para el Proyecto:** Cumplimiento regulatorio automatizado y escalable
- **Para World Chain:** Demuestra capacidades de miniapps complejas onchain

---

## 🎯 Resumen

**CRE escribe:** Resultado del KYC (aprobado/rechazado) + hash de verificación

**Por qué lo usamos:** Para automatizar el cumplimiento regulatorio de valores tokenizados (ERC-3643) de forma descentralizada

**Resultado:** Usuarios pueden invertir en propiedades RWA tokenizadas cumpliendo todas las regulaciones necesarias
