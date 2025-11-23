#!/bin/bash

# Script para ejecutar el workflow CON ESCRITURA EN BLOCKCHAIN
# Usa --broadcast para que realmente escriba en la blockchain

echo "🚀 Ejecutando workflow con escritura en blockchain..."
echo ""

# 1. Ir al directorio del proyecto
cd /Users/mtn/Desktop/ours-eth/ours

# 2. Configurar PATH
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"

echo "✅ PATH configurado"
echo "📍 Directorio: $(pwd)"
echo ""

# 3. Verificar que tienes private key configurado
if [ ! -f "ours/.env" ] && [ ! -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró archivo .env con CRE_ETH_PRIVATE_KEY"
    echo "   Crea .env en ours/ours/ con: CRE_ETH_PRIVATE_KEY=tu_private_key"
    echo ""
fi

# 4. Verificar que se pasó el tx hash
if [ -z "$1" ]; then
    echo "❌ ERROR: Necesitas proporcionar el hash de la transacción del evento KYCRequested"
    echo ""
    echo "Uso:"
    echo "  ./EJECUTAR_CON_BROADCAST.sh <TX_HASH>"
    echo ""
    echo "Ejemplo:"
    echo "  ./EJECUTAR_CON_BROADCAST.sh 0x1234567890abcdef..."
    echo ""
    exit 1
fi

TX_HASH=$1

echo "📋 Configuración:"
echo "   Target: staging-settings"
echo "   Trigger index: 0"
echo "   Tx hash: $TX_HASH"
echo "   Broadcast: ✅ ACTIVADO (escribirá en blockchain)"
echo ""

# 5. Ejecutar el workflow CON broadcast
echo "🎯 Ejecutando workflow..."
cre workflow simulate ./ours \
  --target=staging-settings \
  --trigger-index=0 \
  --evm-tx-hash "$TX_HASH" \
  --broadcast

echo ""
echo "✅ Workflow ejecutado"
echo "📝 Verifica en el explorer que se ejecutó fulfillKYC() en el contrato"


