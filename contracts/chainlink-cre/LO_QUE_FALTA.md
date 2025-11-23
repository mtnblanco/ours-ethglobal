# Lo que falta para completar el workflow KYC

## Estado actual
- ✅ Proyecto CRE inicializado (`ours/`)
- ✅ Workflow Hello World funcionando
- ❌ Workflow KYC no implementado en TypeScript

## Lo que falta

### 1. Convertir workflow.json a TypeScript
- El `workflow.json` en `chainlink-cre/` tiene los pasos, pero está en formato JSON antiguo
- Necesitas crear `ours/ours/main.ts` con la lógica de:
  - Obtener applicant ID desde tu backend
  - Consultar Onfido API para verificar el check
  - Calcular hash del resultado
  - Llamar `fulfillKYC()` en el contrato

### 2. Configurar trigger para evento EVM
- Escuchar evento `KYCRequested` del contrato `ChainlinkKYCIssuer`
- Mapear parámetros: `user`, `nullifierHash`, `timestamp`

### 3. Configurar variables
- `onfidoApiToken`: Token de API de Onfido
- `applicantIdLookupUrl`: URL de tu backend para obtener applicant ID
- `lookupApiToken`: Token de autenticación para tu backend
- `kycIssuerAddress`: Dirección del contrato desplegado

### 4. Configurar red blockchain
- Verificar que `worldchain-sepolia` esté en `project.yaml` con RPC correcto

### 5. Desplegar workflow
- Ejecutar `cre workflow deploy` para subirlo a Chainlink DON

