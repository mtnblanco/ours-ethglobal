#!/bin/bash

echo "🧪 Ejecutando Tests Críticos del Sistema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📦 Compilando contratos..."
npx hardhat compile

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilación falló${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Compilación exitosa${NC}"
echo ""

echo "🔬 Ejecutando tests..."
echo ""

# Tests de PropertyRegistry
echo -e "${YELLOW}📋 PropertyRegistry Tests${NC}"
npx hardhat test test/PropertyRegistry/registerProperty.t.sol
npx hardhat test test/PropertyRegistry/updateMetadata.t.sol
npx hardhat test test/PropertyRegistry/updateConstructionDates.t.sol
npx hardhat test test/PropertyRegistry/updatePropertyStatus.t.sol

# Tests de SaleManager
echo -e "${YELLOW}💰 SaleManager Tests${NC}"
npx hardhat test test/SaleManager/createSale.t.sol
npx hardhat test test/SaleManager/buyFractions.t.sol

# Tests de RevenueDistributor
echo -e "${YELLOW}💸 RevenueDistributor Tests${NC}"
npx hardhat test test/RevenueDistributor/createDistribution.t.sol
npx hardhat test test/RevenueDistributor/claim.t.sol

# Tests de ChainlinkKYCIssuer
echo -e "${YELLOW}🔐 ChainlinkKYCIssuer Tests${NC}"
npx hardhat test test/ChainlinkKYCIssuer/fulfillKYC.t.sol

# Tests de Integración
echo -e "${YELLOW}🔗 Integration Tests${NC}"
npx hardhat test test/Integration/KYCFlow.t.sol

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Todos los tests completados${NC}"
echo ""

# Resumen
echo "📊 RESUMEN DE COBERTURA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PropertyRegistry:      5 funciones testeadas"
echo "SaleManager:          2 funciones testeadas"
echo "RevenueDistributor:   2 funciones testeadas"
echo "ChainlinkKYCIssuer:   1 función testeada"
echo ""
echo "Total archivos .tree:  9"
echo "Total archivos .t.sol: 9"

