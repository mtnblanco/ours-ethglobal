# Blockchain Integration Guide

## Overview

El frontend ahora está completamente integrado con los contratos inteligentes en World Chain Sepolia. Las propiedades se cargan directamente desde la blockchain.

## Arquitectura

### 1. Web3 Provider

El archivo `components/providers/Web3Provider.tsx` envuelve la aplicación con:
- **WagmiProvider**: Gestión de conexión a wallet y estado de blockchain
- **QueryClientProvider**: Caché y sincronización de datos de contratos

### 2. Configuración de Wagmi

El archivo `lib/wagmi.ts` configura:
- **Chain**: World Chain Sepolia (chainId: 4801)
- **Connector**: Injected (MetaMask y otras wallets)
- **Transport**: HTTP RPC usando Alchemy

### 3. Hooks Personalizados

#### `hooks/usePropertyRegistry.ts`

Hooks para interactuar con el contrato PropertyRegistry:

```typescript
// Obtener todas las propiedades
const { propertyAddresses, isLoading, error } = useAllProperties();

// Obtener propiedades con información de venta
const { properties, isLoading, error, refetch } = usePropertiesWithSales(propertyAddresses);

// Obtener una propiedad específica
const { property, isLoading, error } = usePropertyWithSale(tokenAddress);

// Obtener progreso de construcción
const { progress, isLoading, error } = useConstructionProgress(tokenAddress);

// Proyección de inversión
const { projection, isLoading, error } = useInvestmentProjection(tokenAddress, tokenAmount);
```

#### `hooks/useSaleManager.ts`

Hooks para interactuar con el contrato SaleManager:

```typescript
// Verificar si una venta está activa
const { isActive, isLoading, error } = useIsSaleActive(tokenAddress);

// Calcular costo de compra
const { cost, isLoading, error } = useCalculateCost(tokenAddress, amount);

// Comprar fracciones
const { buyFractions, isPending, isConfirming, isConfirmed, error } = useBuyFractions();
await buyFractions(tokenAddress, amount);

// Aprobar USDC
const { approve, isPending, isConfirming, isConfirmed, error } = useApproveUSDC();
await approve(amount);

// Balance y allowance de USDC
const { balance, isLoading, error } = useUSDCBalance(userAddress);
const { allowance, isLoading, error } = useUSDCAllowance(userAddress);
```

### 4. Componentes

#### `components/marketplace/LoadingState.tsx`

Muestra un skeleton loader mientras se cargan las propiedades desde la blockchain.

#### `components/marketplace/ErrorState.tsx`

Muestra un mensaje de error amigable si falla la conexión a la blockchain, con opción de reintentar.

#### `components/marketplace/MarketplaceList.tsx`

Componente actualizado que:
1. Llama a `useAllProperties()` para obtener direcciones de tokens
2. Llama a `usePropertiesWithSales()` para obtener datos completos
3. Transforma los datos de blockchain al formato del UI
4. Aplica filtros de búsqueda y categoría
5. Renderiza las propiedades

## Flujo de Datos

```
Blockchain (World Chain Sepolia)
    ↓
PropertyRegistry.getAllProperties()
    ↓
SaleManager.getPropertyAndSaleInfo(token)
    ↓
usePropertiesWithSales hook
    ↓
transformPropertyData()
    ↓
MarketplaceList component
    ↓
PropertyCard (UI)
```

## Variables de Entorno

Asegúrate de tener configuradas estas variables en `.env`:

```bash
# Smart Contract Addresses
NEXT_PUBLIC_PROPERTY_REGISTRY_ADDRESS=0x2e95D4F69cC99b54D5C7941A0Ac19a657677ebB6
NEXT_PUBLIC_SALE_MANAGER_ADDRESS=0x29D5fF6a3fe9df89869c08E6B416ae8C976449b4
NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS=0xD99C9ad06FeD65FcB3AE660316DBbCC285786712
NEXT_PUBLIC_USDC_ADDRESS=0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=4801
NEXT_PUBLIC_RPC_URL=https://worldchain-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# WalletConnect (opcional - para soporte de más wallets)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE
```

## Cómo Funciona

### 1. Carga Inicial

Cuando un usuario visita `/marketplace`:
1. El componente llama a `PropertyRegistry.getAllProperties()`
2. Obtiene una lista de direcciones de tokens
3. Para cada token, llama a `SaleManager.getPropertyAndSaleInfo()`
4. Obtiene datos completos: Property + Sale + saleIsActive

### 2. Transformación de Datos

La función `transformPropertyData()` convierte datos de blockchain a formato UI:

```typescript
{
  token: "0x...",           // Dirección del contrato del token
  issuer: "0x...",          // Constructora
  name: "Edificio...",      // Nombre de la propiedad
  location: "Buenos Aires", // Ubicación
  totalArea: BigInt,        // Área en m²
  units: BigInt,            // Cantidad de unidades
  // ... más campos
}
```

Se transforma a:

```typescript
{
  id: "0x...",              // Token address
  type: "RESIDENTIAL",      // Derivado de units
  title: "Edificio...",     // De property.name
  location: "Buenos Aires", // De property.location
  apy: 12.4,                // Calculado del ROI
  price: "50.00",           // De sale.pricePerToken
  funded: 78,               // % de totalRaised / totalInvestmentTarget
  image: "ipfs://...",      // De property.ipfsHash
  tokenAddress: "0x...",    // Para navegación
  isActive: true,           // De saleIsActive
  status: "InConstruction"  // De property.status
}
```

### 3. Renderizado

- **Loading**: Muestra `LoadingState` mientras carga
- **Error**: Muestra `ErrorState` si falla
- **Success**: Renderiza lista de propiedades con animaciones

## Próximos Pasos

Para completar la integración:

### 1. Página de Detalle de Propiedad

Actualizar `/marketplace/[id]/page.tsx` para usar:

```typescript
const { property } = usePropertyWithSale(tokenAddress);
const { progress } = useConstructionProgress(tokenAddress);
```

### 2. Funcionalidad de Compra

Implementar el flujo completo:

```typescript
// 1. Aprobar USDC
await approve(totalCost);

// 2. Comprar fracciones
await buyFractions(tokenAddress, amount);
```

### 3. Conectar Wallet

Agregar un botón de "Connect Wallet" usando wagmi:

```typescript
import { useConnect, useAccount } from 'wagmi';

const { connect, connectors } = useConnect();
const { address, isConnected } = useAccount();
```

### 4. Dashboard de Inversiones

Mostrar propiedades del usuario y dividendos pendientes usando `RevenueDistributor`.

## Testing

### 1. Sin Wallet

El marketplace funcionará en modo solo-lectura, mostrando todas las propiedades disponibles.

### 2. Con MetaMask

1. Conecta MetaMask a World Chain Sepolia
2. Agrega la red si no existe:
   - Network Name: World Chain Sepolia
   - RPC URL: https://worldchain-sepolia.g.alchemy.com/v2/...
   - Chain ID: 4801
   - Currency Symbol: WLD

### 3. Comprar Tokens

Necesitarás USDC de testnet en World Chain Sepolia para probar compras.

## Troubleshooting

### Error: "Cannot read blockchain"

- Verifica que las direcciones de contratos en `.env` sean correctas
- Verifica que el RPC_URL esté funcionando
- Revisa la consola del navegador para ver el error específico

### Error: "No properties found"

- Es posible que no haya propiedades registradas en el contrato
- Verifica llamando directamente al contrato usando un block explorer

### Error: "User rejected transaction"

- El usuario canceló la transacción en su wallet
- Es comportamiento normal, no es un error

## Recursos

- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [World Chain Documentation](https://world.org/world-chain)
- [Smart Contract ABIs](./lib/contracts.ts)
