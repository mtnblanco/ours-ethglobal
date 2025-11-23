# 🚀 Comandos Completos para Ejecutar y Escribir en Blockchain

## ⚠️ IMPORTANTE: Para escribir en blockchain necesitas:

1. **Private Key con fondos** en World Chain Sepolia
2. **Evento KYCRequested** emitido en la blockchain
3. **Flag `--broadcast`** para que escriba realmente

---

## Paso 1: Configurar Private Key (si no lo tienes)

Crea un archivo `.env` en `/Users/mtn/Desktop/ours-eth/ours/ours/`:

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
echo "CRE_ETH_PRIVATE_KEY=tu_private_key_aqui_sin_0x" > .env
```

**⚠️ IMPORTANTE:** Usa una cuenta con fondos en World Chain Sepolia testnet.

---

## Paso 2: Emitir Evento KYCRequested (para que el workflow tenga algo que procesar)

Primero necesitas emitir un evento real. Tienes dos opciones:

### Opción A: Usar Hardhat (si tienes la configuración)

```bash
cd /Users/mtn/Desktop/ours-eth/contracts
# Asegúrate de tener PRIVATE_KEY en .env para Hardhat
npx hardhat run scripts/test-kyc-event.ts --network worldchainSepolia
```

### Opción B: Usar cualquier herramienta para llamar al contrato

Llama a `mockRequestKYCForTesting(address)` en el contrato:
- **Contrato:** `0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5`
- **Función:** `mockRequestKYCForTesting(address)`
- **Ejemplo de address:** `0xAbdFF83ac5E8E729C6ce44E938f244fB12F6Ce32`

---

## Paso 3: Simular el Workflow CON ESCRITURA EN BLOCKCHAIN

```bash
# 1. Ir al directorio del workflow
cd /Users/mtn/Desktop/ours-eth/ours

# 2. Configurar PATH
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"

# 3. Simular CON broadcast (esto escribe en blockchain)
cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash <TU_TX_HASH> --broadcast
```

**Reemplaza `<TU_TX_HASH>`** con el hash de la transacción que emitió el evento KYCRequested.

---

## 📋 Todo en un solo comando (copia y pega)

```bash
cd /Users/mtn/Desktop/ours-eth/ours && \
export PATH="$HOME/.bun/bin:$PATH" && \
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH" && \
cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash <TU_TX_HASH> --broadcast
```

---

## 🎯 Flujo Completo para la Hackathon

### 1. Emitir evento KYCRequested
```bash
cd /Users/mtn/Desktop/ours-eth/contracts
npx hardhat run scripts/test-kyc-event.ts --network worldchainSepolia
# Copia el TX_HASH que te devuelva
```

### 2. Simular workflow y escribir en blockchain
```bash
cd /Users/mtn/Desktop/ours-eth/ours
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"
cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash <TX_HASH_DEL_PASO_1> --broadcast
```

---

## ✅ Lo que hace el workflow con --broadcast:

1. Detecta el evento KYCRequested
2. Mockea Onfido (aprobado)
3. Calcula hash
4. **ESCRIBE en blockchain** llamando a `fulfillKYC()` en el contrato

---

## 📝 Notas Importantes:

- **Private Key:** Debe tener fondos en World Chain Sepolia testnet
- **Permisos:** El workflow necesita permisos para llamar `fulfillKYC()` (esto se configura dando el rol al DON después del deploy)
- **Evento:** Necesitas un evento real emitido antes de simular


