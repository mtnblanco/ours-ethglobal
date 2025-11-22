# 🎯 Guía Completa: Integración de Onfido

## 📋 Resumen

Esta guía te explica cómo integrar **Onfido** en tu plataforma OURS para completar el flujo de KYC. Actualmente tienes:
- ✅ **World ID**: Verificación de humanidad (on-chain)
- ✅ **Smart Contract**: `ChainlinkKYCIssuer.sol` listo para recibir resultados
- ❌ **Onfido**: Falta integrar (verificación de documentos)
- ❌ **Chainlink CRE**: Falta configurar (conexión Onfido → Smart Contract)

---

## 🏗️ Arquitectura Actual vs Objetivo

### Estado Actual
```
Usuario → World ID (on-chain) → ChainlinkKYCIssuer
                                    ↓
                              [Esperando Onfido]
```

### Objetivo Final
```
Usuario → World ID (on-chain) → ChainlinkKYCIssuer
                                    ↓
                              Emite evento KYCRequested
                                    ↓
                              Chainlink CRE escucha
                                    ↓
                              Onfido verifica documentos
                                    ↓
                              Chainlink CRE → fulfillKYC()
                                    ↓
                              Usuario puede invertir ✅
```

---

## 🚀 Opción 1: Integración Completa con Chainlink CRE (Recomendada para Producción)

Esta es la arquitectura descentralizada diseñada en tu sistema.

### Paso 1: Crear Cuenta en Onfido

1. **Registrarse en Onfido**
   - Ve a [https://onfido.com](https://onfido.com)
   - Crea una cuenta (puedes usar plan de prueba/sandbox)
   - Accede al Dashboard

2. **Obtener API Token**
   - En el Dashboard, ve a **Settings → API Tokens**
   - Crea un nuevo token (guárdalo de forma segura)
   - **IMPORTANTE**: Hay tokens para **Sandbox** (testing) y **Live** (producción)
   - Para desarrollo, usa **Sandbox token**

3. **Configurar Región**
   - Onfido tiene 3 regiones: `EU`, `US`, `CA`
   - Elige según donde estés (recomendado: `EU` para Colombia)

### Paso 2: Instalar SDK de Onfido en Frontend

El frontend necesita capturar documentos y selfies del usuario.

```bash
cd ours-platform
npm install @onfido/react-sdk
```

**Configurar en el frontend:**

```typescript
// ours-platform/hooks/useOnfido.ts
'use client';

import { useState } from 'react';
import { Onfido, OnfidoCaptureType } from '@onfido/react-sdk';

export function useOnfido() {
  const [sdkToken, setSdkToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<string | null>(null);

  // Paso 1: Crear applicant en backend
  const createApplicant = async (userAddress: string) => {
    const response = await fetch('/api/v1/onfido/create-applicant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress })
    });
    
    const data = await response.json();
    setApplicantId(data.applicant_id);
    setSdkToken(data.sdk_token);
    return data;
  };

  // Paso 2: Iniciar verificación
  const startVerification = async () => {
    if (!applicantId) throw new Error('Applicant not created');
    
    const response = await fetch('/api/v1/onfido/create-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicant_id: applicantId })
    });
    
    return await response.json();
  };

  return {
    sdkToken,
    applicantId,
    createApplicant,
    startVerification
  };
}
```

**Componente React para captura:**

```typescript
// ours-platform/components/OnfidoCapture.tsx
'use client';

import { Onfido } from '@onfido/react-sdk';
import { useOnfido } from '../hooks/useOnfido';

export function OnfidoCapture({ userAddress }: { userAddress: string }) {
  const { sdkToken, createApplicant } = useOnfido();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    createApplicant(userAddress).then(() => setIsReady(true));
  }, [userAddress]);

  if (!isReady || !sdkToken) {
    return <div>Cargando...</div>;
  }

  return (
    <Onfido
      sdkToken={sdkToken}
      steps={[
        { type: OnfidoCaptureType.DOCUMENT },
        { type: OnfidoCaptureType.FACE }
      ]}
      onComplete={(data) => {
        console.log('Onfido completado:', data);
        // El backend recibirá webhook de Onfido
      }}
      onError={(error) => {
        console.error('Error Onfido:', error);
      }}
    />
  );
}
```

### Paso 3: Crear Servicio de Onfido en Backend

```bash
cd backend
npm install @onfido/api
```

**Crear servicio:**

```typescript
// backend/src/services/onfido.ts
import { DefaultApi, Configuration, Region } from '@onfido/api';

export class OnfidoService {
  private api: DefaultApi;
  private apiToken: string;
  private region: Region;

  constructor() {
    this.apiToken = process.env.ONFIDO_API_TOKEN || '';
    this.region = (process.env.ONFIDO_REGION as Region) || Region.EU;
    
    if (!this.apiToken) {
      throw new Error('ONFIDO_API_TOKEN no configurado');
    }

    this.api = new DefaultApi(
      new Configuration({
        apiToken: this.apiToken,
        region: this.region,
      })
    );
  }

  /**
   * Crea un applicant en Onfido
   */
  async createApplicant(userAddress: string, userData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    try {
      const applicant = await this.api.createApplicant({
        first_name: userData?.firstName || 'Usuario',
        last_name: userData?.lastName || 'Anónimo',
        email: userData?.email,
        location: {
          ip_address: '127.0.0.1', // En producción, obtener IP real
          country_of_residence: 'COL', // Colombia
        },
      });

      return {
        success: true,
        applicant_id: applicant.id,
        sdk_token: await this.generateSDKToken(applicant.id),
      };
    } catch (error) {
      console.error('Error creando applicant en Onfido:', error);
      throw error;
    }
  }

  /**
   * Genera token para SDK del frontend
   */
  async generateSDKToken(applicantId: string) {
    try {
      const sdkToken = await this.api.generateSdkToken({
        applicant_id: applicantId,
        referrer: process.env.ONFIDO_REFERRER || '*',
      });
      return sdkToken.token;
    } catch (error) {
      console.error('Error generando SDK token:', error);
      throw error;
    }
  }

  /**
   * Crea un check (inicia verificación)
   */
  async createCheck(applicantId: string) {
    try {
      const check = await this.api.createCheck({
        applicant_id: applicantId,
        report_names: [
          'identity_enhanced',  // Verificación de documento
          'facial_similarity_photo', // Comparación selfie con documento
        ],
      });

      return {
        success: true,
        check_id: check.id,
        status: check.status,
      };
    } catch (error) {
      console.error('Error creando check en Onfido:', error);
      throw error;
    }
  }

  /**
   * Obtiene resultado de un check
   */
  async getCheckResult(checkId: string) {
    try {
      const check = await this.api.retrieveCheck(checkId);
      return {
        success: true,
        status: check.status,
        result: check.result, // 'clear', 'consider', 'unidentified'
        reports: check.reports,
      };
    } catch (error) {
      console.error('Error obteniendo resultado de check:', error);
      throw error;
    }
  }
}
```

**Crear rutas en backend:**

```typescript
// backend/src/routes/onfido.ts
import { Router, Request, Response } from 'express';
import { OnfidoService } from '../services/onfido';

const router = Router();
const onfidoService = new OnfidoService();

// POST /api/v1/onfido/create-applicant
router.post('/create-applicant', async (req: Request, res: Response) => {
  try {
    const { user_address } = req.body;
    const result = await onfidoService.createApplicant(user_address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

// POST /api/v1/onfido/create-check
router.post('/create-check', async (req: Request, res: Response) => {
  try {
    const { applicant_id } = req.body;
    const result = await onfidoService.createCheck(applicant_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

// POST /api/v1/onfido/webhook
// Onfido enviará webhooks aquí cuando termine la verificación
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { payload } = req.body;
    
    // Verificar firma del webhook (importante para seguridad)
    // const isValid = verifyWebhookSignature(req.headers, payload);
    // if (!isValid) return res.status(401).send('Invalid signature');
    
    if (payload.action === 'check.completed') {
      const checkId = payload.object.id;
      const result = await onfidoService.getCheckResult(checkId);
      
      // Aquí deberías llamar a Chainlink CRE o directamente a fulfillKYC
      // Por ahora, solo logueamos
      console.log('Check completado:', result);
      
      // TODO: Integrar con Chainlink CRE aquí
      // await chainlinkService.fulfillKYC(userAddress, result.status === 'clear');
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando webhook de Onfido:', error);
    res.status(500).send('Error');
  }
});

export { router as onfidoRoutes };
```

**Agregar rutas al servidor principal:**

```typescript
// backend/src/index.ts
import { onfidoRoutes } from './routes/onfido';

// ... código existente ...

app.use('/api/v1/onfido', onfidoRoutes);
```

### Paso 4: Configurar Variables de Entorno

```bash
# backend/.env
ONFIDO_API_TOKEN=api_sandbox_xxxxxxxxxxxxx  # Token de sandbox
ONFIDO_REGION=EU  # o US, CA
ONFIDO_REFERRER=*  # o tu dominio en producción
```

### Paso 5: Configurar Chainlink CRE (Avanzado)

**Esta es la parte más compleja.** Chainlink CRE (Cross-Chain Relayer) conecta Onfido con tu smart contract de forma descentralizada.

**Opciones:**

1. **Usar Chainlink Functions** (más simple)
   - Chainlink Functions puede hacer HTTP requests
   - Puede llamar a Onfido API
   - Puede ejecutar `fulfillKYC()` en tu contrato

2. **Usar Chainlink Automation + External Adapter**
   - Crear un External Adapter que consulte Onfido
   - Chainlink Automation escucha eventos
   - Ejecuta el adapter y llama a `fulfillKYC()`

3. **Usar Chainlink DON directamente** (más complejo)
   - Requiere configurar nodos DON
   - Más descentralizado pero más setup

**Para empezar rápido, puedes usar la Opción 2 (temporal) hasta configurar Chainlink.**

---

## 🚀 Opción 2: Integración Temporal sin Chainlink (Más Rápida)

Si necesitas que funcione YA sin configurar Chainlink CRE, puedes hacer que el backend llame directamente a `fulfillKYC()`.

### Modificar Backend para Llamar Directamente al Contrato

```typescript
// backend/src/services/blockchain.ts
// Agregar esta función:

async fulfillKYCFromOnfido(
  userAddress: string,
  approved: boolean,
  kycDataHash: string
): Promise<SmartContractResponse> {
  try {
    const contract = new ethers.Contract(
      this.contractAddress,
      [
        // ... ABI existente ...
        "function fulfillKYC(address user, bool approved, bytes32 kycDataHash) external",
        "function grantRole(bytes32 role, address account) external",
      ],
      this.signer
    );

    // IMPORTANTE: El backend debe tener el rol CHAINLINK_DON_ROLE
    // Esto se hace una vez al deployar:
    // await contract.grantRole(CHAINLINK_DON_ROLE, backendWalletAddress);

    const tx = await contract.fulfillKYC(
      userAddress,
      approved,
      ethers.hexlify(ethers.toUtf8Bytes(kycDataHash))
    );

    const receipt = await tx.wait();
    
    return {
      success: true,
      transaction_hash: receipt.hash,
    };
  } catch (error) {
    console.error('Error ejecutando fulfillKYC:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
```

**Actualizar webhook handler:**

```typescript
// backend/src/routes/onfido.ts
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { payload } = req.body;
    
    if (payload.action === 'check.completed') {
      const checkId = payload.object.id;
      const result = await onfidoService.getCheckResult(checkId);
      
      // Obtener userAddress desde tu base de datos (asociado con applicantId)
      const userAddress = await getUserAddressFromApplicantId(payload.object.applicant_id);
      
      // Calcular hash de datos KYC
      const kycDataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(result.reports))
      );
      
      // Llamar directamente al contrato
      const blockchainService = new BlockchainService();
      await blockchainService.fulfillKYCFromOnfido(
        userAddress,
        result.result === 'clear', // approved si es 'clear'
        kycDataHash
      );
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).send('Error');
  }
});
```

**⚠️ IMPORTANTE:**
- El wallet del backend debe tener el rol `CHAINLINK_DON_ROLE` en el contrato
- Esto se hace UNA VEZ al deployar:
  ```solidity
  await kycIssuer.grantRole(CHAINLINK_DON_ROLE, backendWalletAddress);
  ```
- En producción, usa Chainlink CRE para descentralización

---

## 📝 Checklist de Implementación

### Fase 1: Setup Básico
- [ ] Crear cuenta en Onfido
- [ ] Obtener API token (sandbox)
- [ ] Instalar `@onfido/api` en backend
- [ ] Instalar `@onfido/react-sdk` en frontend
- [ ] Configurar variables de entorno

### Fase 2: Backend
- [ ] Crear `OnfidoService`
- [ ] Crear rutas `/create-applicant` y `/create-check`
- [ ] Crear endpoint `/webhook` para recibir resultados
- [ ] Probar creación de applicant (Postman/curl)

### Fase 3: Frontend
- [ ] Crear hook `useOnfido`
- [ ] Crear componente `OnfidoCapture`
- [ ] Integrar en flujo de registro después de World ID
- [ ] Probar captura de documento y selfie

### Fase 4: Integración con Smart Contract
- [ ] Opción A: Configurar Chainlink CRE (producción)
- [ ] Opción B: Backend llama directamente a `fulfillKYC()` (temporal)
- [ ] Otorgar rol `CHAINLINK_DON_ROLE` al backend wallet
- [ ] Probar flujo completo: World ID → Onfido → Smart Contract

### Fase 5: Testing
- [ ] Probar con documento válido
- [ ] Probar con documento inválido
- [ ] Verificar que `fulfillKYC()` se ejecuta correctamente
- [ ] Verificar que usuario puede invertir después de KYC

---

## 🔒 Consideraciones de Seguridad

1. **API Tokens**: Nunca expongas tokens de Onfido en el frontend
2. **Webhook Signatures**: Verifica firmas de webhooks de Onfido
3. **Rate Limiting**: Implementa rate limiting en endpoints de Onfido
4. **Error Handling**: Maneja errores de Onfido gracefully
5. **Data Privacy**: No almacenes datos sensibles innecesariamente

---

## 📚 Recursos

- **Onfido Docs**: https://documentation.onfido.com/
- **Onfido React SDK**: https://github.com/onfido/onfido-sdk-ui
- **Chainlink Functions**: https://docs.chain.link/chainlink-functions
- **Chainlink Automation**: https://docs.chain.link/chainlink-automation

---

## 🆘 Troubleshooting

### Error: "Invalid API token"
- Verifica que el token sea correcto
- Asegúrate de usar token de sandbox en desarrollo

### Error: "Applicant not found"
- Verifica que hayas creado el applicant antes de crear el check
- Guarda el `applicant_id` en tu base de datos

### Error: "Webhook not received"
- Verifica que la URL del webhook sea accesible públicamente
- Usa ngrok para desarrollo local: `ngrok http 8000`
- Configura webhook en Onfido Dashboard → Settings → Webhooks

### Error: "Role not granted" al llamar fulfillKYC()
- Verifica que el wallet del backend tenga `CHAINLINK_DON_ROLE`
- Ejecuta: `await contract.grantRole(CHAINLINK_DON_ROLE, backendAddress)`

---

**¿Necesitas ayuda con algún paso específico?** Puedo ayudarte a implementar cualquier parte de esta guía.

