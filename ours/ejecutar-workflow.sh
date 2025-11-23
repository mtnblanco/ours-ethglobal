#!/bin/bash

# Script para ejecutar el workflow de Chainlink CRE

echo "🚀 Configurando entorno para Chainlink CRE..."

# Ir al directorio del proyecto
cd /Users/mtn/Desktop/ours-eth/ours

# Configurar PATH
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"

echo "✅ PATH configurado"
echo "📍 Directorio actual: $(pwd)"
echo ""

# Verificar instalaciones
echo "🔍 Verificando instalaciones..."
bun --version || echo "⚠️  Bun no encontrado"
cre --version || echo "⚠️  CRE CLI no encontrado"
echo ""

# Simular el workflow
echo "🎯 Simulando workflow..."
cre workflow simulate ./ours --target=staging-settings

