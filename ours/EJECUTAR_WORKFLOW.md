# 🚀 EJECUTAR WORKFLOW CON ESCRITURA EN BLOCKCHAIN

## ⚡ Pasos Rápidos (3 pasos)

### 1️⃣ Configurar Private Key (una sola vez)

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
echo "CRE_ETH_PRIVATE_KEY=tu_private_key_sin_0x" > .env
```

**⚠️ IMPORTANTE:** 
- La cuenta debe tener fondos en World Chain Sepolia
- Obtén ETH de: https://faucets.chain.link/worldchain-testnet

---

### 2️⃣ Emitir Evento KYCRequested (necesitas un evento real)

```bash
cd /Users/mtn/Desktop/ours-eth/contracts
npx hardhat run scripts/test-kyc-event.ts --network worldchainSepolia
```

**Copia el TX_HASH que te devuelva** (ejemplo: `0xabc123...`)

---

### 3️⃣ Ejecutar Workflow CON ESCRITURA (--broadcast)

```bash
cd /Users/mtn/Desktop/ours-eth/ours && \
export PATH="$HOME/.bun/bin:$PATH" && \
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH" && \
cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash <TU_TX_HASH> --broadcast
```

**Reemplaza `<TU_TX_HASH>` con el hash del paso 2.**

---

## 📋 O usar el script automático:

```bash
cd /Users/mtn/Desktop/ours-eth/ours
./EJECUTAR_CON_BROADCAST.sh <TU_TX_HASH>
```

---

## ✅ Lo que hace:

1. Detecta el evento KYCRequested de tu transacción
2. Mockea Onfido (aprobado)
3. Calcula hash
4. **ESCRIBE en blockchain** llamando a `fulfillKYC()` ✍️

---

## 🔍 Verificar Resultado:

Explorer: https://worldchain-sepolia.explorer.alchemy.com
Contrato: `0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5`


