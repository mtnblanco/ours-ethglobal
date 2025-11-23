# ✅ Comandos Finales - Workflow Listo para Escribir en Blockchain

## 🎯 Tu workflow YA está configurado correctamente

- ✅ Usa `callContract` para escribir en blockchain (método correcto)
- ✅ El contrato `ChainlinkKYCIssuer` ES tu "consumer contract"
- ✅ La función `fulfillKYC()` recibe los datos del workflow
- ✅ Solo falta ejecutarlo con `--broadcast`

---

## 📋 Pasos para Ejecutar CON ESCRITURA EN BLOCKCHAIN

### Paso 1: Configurar Private Key (CON FONDOS)

Crea el archivo `.env` en `/Users/mtn/Desktop/ours-eth/ours/ours/`:

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
echo "CRE_ETH_PRIVATE_KEY=tu_private_key_sin_0x" > .env
```

**⚠️ IMPORTANTE:** 
- La cuenta debe tener fondos en **World Chain Sepolia** testnet
- Obtén ETH testnet de: https://faucets.chain.link/worldchain-testnet
- Sin fondos, la transacción fallará

---

### Paso 2: Emitir Evento KYCRequested (para que el workflow tenga algo que procesar)

Antes de ejecutar el workflow, necesitas un evento real en la blockchain.

**Opción A: Usar Hardhat (recomendado):**
```bash
cd /Users/mtn/Desktop/ours-eth/contracts
npx hardhat run scripts/test-kyc-event.ts --network worldchainSepolia
```

**Copia el TX_HASH que te devuelva** (ejemplo: `0x1234567890abcdef...`)

**Opción B: Llamar directamente al contrato** desde Remix, ethers.js, etc.

---

### Paso 3: Ejecutar Workflow CON ESCRITURA (--broadcast)

**Comandos paso a paso:**

```bash
# 1. Ir al directorio del workflow
cd /Users/mtn/Desktop/ours-eth/ours

# 2. Configurar PATH
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"

# 3. Ejecutar CON broadcast (esto escribe realmente)
cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash <TU_TX_HASH> --broadcast
```

**Reemplaza `<TU_TX_HASH>`** con el hash del paso 2.

---

## 🚀 Todo en un solo comando (copia y pega)

```bash
cd /Users/mtn/Desktop/ours-eth/ours && \
export PATH="$HOME/.bun/bin:$PATH" && \
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH" && \
cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash <TU_TX_HASH> --broadcast
```

---

## 📝 O usar el script que creé:

```bash
cd /Users/mtn/Desktop/ours-eth/ours
./EJECUTAR_CON_BROADCAST.sh <TU_TX_HASH>
```

---

## ✅ Lo que hace el workflow con --broadcast:

1. **Detecta el evento** KYCRequested de la transacción que pasaste
2. **Mockea Onfido** (aprobado porque `mockOnfidoApproved: true`)
3. **Calcula hash** del resultado de Onfido
4. **ESCRIBE en blockchain** llamando a `fulfillKYC(user, approved, hash)` en el contrato
5. **Devuelve** el hash de la transacción

---

## 🔍 Verificar Resultado Onchain

Después de ejecutar, puedes verificar en el explorer:

1. Ve a: https://worldchain-sepolia.explorer.alchemy.com
2. Busca el contrato: `0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5`
3. Verifica que se ejecutó `fulfillKYC()`
4. Consulta `getKYCData(user)` para ver el estado actualizado

---

## ⚠️ Notas Importantes:

1. **Private Key**: Debe tener fondos suficientes para gas
2. **Evento Real**: Necesitas un evento real antes de simular
3. **Permisos**: Si el contrato requiere permisos especiales, asegúrate de que la cuenta los tenga
4. **Gas**: World Chain Sepolia es muy barato (~0.1 gwei), así que no necesitas mucho ETH

---

## 🎯 Para la Hackathon:

1. ✅ Workflow listo y configurado
2. ✅ Usa `--broadcast` para escribir realmente
3. ✅ Solo necesitas private key con fondos + evento emitido
4. ✅ ¡Ya puedes participar escribiendo en blockchain!

