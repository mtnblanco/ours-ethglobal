# Deploy Workflow de KYC con Chainlink CRE

## ✅ Pre-requisitos completados

- [x] API de KYC corriendo en `https://fastapi-kyc.onrender.com/verify`
- [x] Workflow actualizado para usar la API con `consensusIdenticalAggregation`
- [x] Contrato `ChainlinkKYCIssuer` deployado en `0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE`

## 📋 Pasos para deployar

### 1. Configurar secrets (si es necesario)

Si necesitas configurar tu private key u otros secrets:

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours

# Crear archivo secrets.yaml en la raíz del proyecto
cat > ../secrets.yaml << EOF
privateKey: "TU_PRIVATE_KEY_AQUI"
EOF
```

### 2. Compilar el workflow

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours

# Instalar dependencias si no lo hiciste
bun install

# Compilar
bun build main.ts --outfile=dist/main.js --target=bun
```

### 3. Deployar con CRE CLI

```bash
cd /Users/mtn/Desktop/ours-eth/ours

# Para staging (testing)
./cre workflow deploy staging-settings

# Para producción
./cre workflow deploy production-settings
```

### 4. Verificar el deployment

```bash
# Ver el estado del workflow
./cre workflow status staging-settings

# Ver logs en tiempo real
./cre workflow logs staging-settings --follow
```

## 🔧 Configuración actual

### Staging (`config.staging.json`)
- **Contrato KYC:** `0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE`
- **API KYC:** `https://fastapi-kyc.onrender.com/verify`
- **Modo:** Real API (no mock)
- **Aggregation:** `consensusIdenticalAggregation`

### Production (`config.production.json`)
- Misma configuración que staging

## 🧪 Testing local

Si querés probar localmente antes de deployar:

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours

# Modo mock para testing
# Editar config.staging.json temporalmente:
# "useMock": true

# Ejecutar localmente
bun run main.ts
```

## ⚠️ Troubleshooting

### Error: "No DON access"
- Necesitás solicitar acceso a Chainlink CRE
- Contactar al equipo de Chainlink o usar el formulario de acceso

### Error: "Invalid private key"
- Verificar que la private key esté en `secrets.yaml`
- Verificar que tenga fondos en World Chain Sepolia

### Error: "Contract not found"
- Verificar que el contrato esté deployado en la dirección correcta
- Verificar que tenga el rol `CHAINLINK_DON_ROLE`

## 📝 Notas importantes

1. **Consensus:** El workflow usa `consensusIdenticalAggregation` para garantizar que múltiples nodos DON lleguen al mismo resultado antes de ejecutar la transacción on-chain.

2. **Gas:** Asegurate de que la wallet que usás tenga ETH en World Chain Sepolia para pagar el gas de las transacciones `fulfillKYC()`.

3. **Monitoreo:** Una vez deployado, monitoreá los logs para ver las solicitudes de KYC procesándose en tiempo real.

## 🎯 Próximo paso después del deploy

Una vez que el workflow esté corriendo:

1. Probar desde el frontend haciendo un request de KYC
2. Ver en los logs cómo se procesa
3. Verificar que se ejecute `fulfillKYC()` en el contrato
4. Confirmar que el usuario quede con status `KYCApproved`

