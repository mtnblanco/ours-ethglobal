# Sample Hardhat 3 Beta Project (minimal)

This project has a minimal setup of Hardhat 3 Beta, without any plugins.

## What's included?

The project includes native support for TypeScript, Hardhat scripts, tasks, and support for Solidity compilation and tests.


🏗️ Arquitectura On-Chain para Plataforma de Tokenización Inmobiliaria (ERC-3643)

Este documento describe de manera completa y ordenada todos los contratos necesarios, sus funciones, responsabilidades y relaciones para construir una plataforma sólida de inversión inmobiliaria fraccional basada en ERC-3643 (T-REX).

La idea del proyecto es:

Tokenizar fracciones de propiedades (p. ej. departamentos en pozo), vender los tokens por USDC, y cuando la constructora vende la propiedad final, distribuir las ganancias proporcionalmente a los holders, cumpliendo con requisitos legales/KYC.

🔐 1. Base Legal y Estándar Técnico — ERC-3643

ERC-3643 es un estándar institucional para security tokens, ideal para activos del mundo real (RWA).

Sus características principales:

Basado en ERC-20

Permite transferencias solo si el usuario está KYC-verificado

Incluye compliance modular

Integra identidades on-chain (ONCHAINID)

Soporta freeze, forcedTransfer, recovery

Upgradeable vía ERC-1822

Tu plataforma necesita este estándar porque tokenizar propiedades es una operación regulada: hay promesa de ganancia, activo subyacente y dependencia de un tercero (constructora).

📚 2. Contratos del Estándar ERC-3643

A continuación se listan todos los contratos que provee el estándar T-REX y que forman la base del sistema.

### 2.1 IdentityRegistryStorage

📌 Guarda la información de identidad de cada inversor:

ONCHAINID asociado

país del inversor

wallets autorizadas

identidades vinculadas a diferentes tokens

📌 Funciones clave:

addIdentityToStorage(address, identity, country)

removeIdentityFromStorage(address)

modifyStoredIdentity(address, newIdentity)

modifyStoredInvestorCountry(address, newCountry)

storedIdentity(address)

storedInvestorCountry(address)

Este contrato es la base de datos on-chain utilizada por todos los IdentityRegistry.

### 2.2 ClaimTopicsRegistry

📌 Define qué claims debe tener un usuario para poder recibir tokens.

Ejemplos de claim topics:

1 → KYC verificado

7 → País permitido

15 → Verificación RENAPER

📌 Funciones:

addClaimTopic(uint256)

removeClaimTopic(uint256)

getClaimTopics()

### 2.3 TrustedIssuersRegistry

📌 Define quiénes pueden emitir claims válidos para tu token.

Ejemplos:

SELF

Tu backend KYC issuer

Proveedor RENAPER

📌 Funciones:

addTrustedIssuer(address issuer, uint[] claimTopics)

removeTrustedIssuer(address issuer)

updateIssuerClaimTopics(address issuer, uint[])

isTrustedIssuer(address)

getTrustedIssuers()

### 2.4 IdentityRegistry

📌 Es el corazón del KYC on-chain.
Determina si un inversor está autorizado a recibir/transmitir tokens.

📌 Funciones principales:

registerIdentity(wallet, identity, country)

deleteIdentity(wallet)

updateIdentity(wallet, newIdentity)

updateCountry(wallet, newCountry)

isVerified(wallet) → combina claims + issuer + país

contains(wallet)

identity(wallet)

Cada transferencia del token consulta a este contrato.

### 2.5 Compliance

📌 Define las reglas de regulación/negocio del token.

Para el MVP podés implementar un Compliance simple que acepte todo:

canTransfer(...) = true


Pero más adelante podés agregar:

máximo % por inversor

máximo número de holders

restricciones por país

períodos de bloqueo

límites regulatorios

📌 Funciones clave:

canTransfer(from, to, amount)

transferred(from, to, amount)

created(to, amount)

destroyed(from, amount)

bindToken(token)

addTokenAgent(agent)

### 2.6 PermissionedToken (ERC-3643 Token)

📌 Es tu token representando fracciones de la propiedad.

Ejemplo:

Nombre: PalermoPozo01

Símbolo: PAL01

20 USDC = 1 token

Hereda:

IERC20

IERC3643

Ownable o AccessControl

ERC1822 (upgradeable)

📌 Funciones del estándar:

Transferencia segura:

transfer(to, amount)

transferFrom(from, to, amount)

👉 Pasan por:

identityRegistry.isVerified(to)

compliance.canTransfer(from, to, amount)

Emisión/Borrado:

mint(to, amount)

burn(user, amount)

Controles institucionales:

forcedTransfer(from, to, amount)

pause() / unpause()

setAddressFrozen(wallet, bool)

freezePartialTokens(wallet, amount)

recoveryAddress(lostWallet, newWallet, identity)

Batch operations:

batchTransfer

batchMint

batchBurn

🧱 3. Contratos Personalizados para tu Negocio

Estos contratos NO forman parte del estándar: los necesitás vos para operar la plataforma de tokenización inmobiliaria.

### 3.1 SaleManager

Controla la venta primaria de fracciones del inmueble.

📌 Funciones necesarias:

setPrice(uint256)

setToken(address)

setStable(address) (USDC)

buyFractions(uint256 amount)

cobra USDC

llama token.mint(buyer, amount)

📌 ¿Qué valida automáticamente el token?

que el usuario esté KYC-verificado (via isVerified)

que cumpla compliance (via canTransfer)

Vos no tenés que revalidarlo acá.

### 3.2 RevenueDistributor

Se usa cuando la constructora vende la propiedad real.

📌 Responsabilidades:

recibir el monto final en USDC

distribuirlo proporcionalmente a los holders del token

📌 Funciones:

setToken(address)

setStable(address)

distribute(uint256 totalUSDC)

El contrato:

obtiene todos los holders

calcula %

transfiere USDC en proporción a su balance

🔄 4. Relaciones entre Contratos
                claims issuer (SELF / backend)
                             ↓
                   TrustedIssuersRegistry
                             ↓
ClaimTopicsRegistry ← IdentityRegistry → IdentityRegistryStorage
                             ↓
                       PermissionedToken (ERC-3643)
                             ↓
   SaleManager → compra/mint        RevenueDistributor → reparto final

🚀 5. Orden de Deploy (muy importante)

IdentityRegistryStorage

ClaimTopicsRegistry

TrustedIssuersRegistry

IdentityRegistry (se configuran las 3 anteriores)

Compliance

PermissionedToken (ERC-3643)

SaleManager

RevenueDistributor

📝 6. Qué desarrollás vos y qué ya viene listo
🌐 Ya viene implementado (del repo de T-REX):

IdentityRegistry

IdentityRegistryStorage

ClaimTopicsRegistry

TrustedIssuersRegistry

Compliance

ERC-3643 token

🛠️ Lo desarrollás vos:

SaleManager

RevenueDistributor

El frontend

El backend KYC (o integración con SELF/RENAPER)

🎯 7. Resultado final

Con esta arquitectura, tu sistema puede:

✔ vender fracciones del depto a inversores KYC
✔ cumplir com normativa en cualquier país
✔ evitar transferencias ilegales
✔ permitir liquidez segura
✔ distribuir ganancias automáticamente
✔ manejar pérdida de wallet, congelamiento, recuperación
✔ ser adoptado por una constructora sin quilombo legal