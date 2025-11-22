import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { WorldIdService } from '../services/worldId';
import { BlockchainService } from '../services/blockchain';
import { OnfidoService } from '../services/onfido';
import { WorldIdProofRequest, KYCResponse } from '../types';

const router = Router();

// Lazy initialization of services
let onfidoService: OnfidoService | null = null;
let worldIdService: WorldIdService | null = null;
let blockchainService: BlockchainService | null = null;

const getOnfidoService = (): OnfidoService => {
  if (!onfidoService) {
    try {
      onfidoService = new OnfidoService();
    } catch (error) {
      console.warn('⚠️ Onfido service not available:', error);
      throw error;
    }
  }
  return onfidoService;
};

const getWorldIdService = (): WorldIdService => {
  if (!worldIdService) {
    try {
      worldIdService = new WorldIdService();
      console.log('✅ WorldID service initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ WorldID service not available:', errorMessage);
      throw error;
    }
  }
  return worldIdService;
};

const getBlockchainService = (): BlockchainService => {
  if (!blockchainService) {
    try {
      blockchainService = new BlockchainService();
      console.log('✅ Blockchain service initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Blockchain service not available:', errorMessage);
      throw error;
    }
  }
  return blockchainService;
};

// Validation schema - Updated for MiniKit payload structure
const kycRequestSchema = Joi.object({
  payload: Joi.object({
    proof: Joi.string().required(),
    merkle_root: Joi.string().required(),
    nullifier_hash: Joi.string().required(),
    verification_level: Joi.string().required(),
    status: Joi.string().valid('success').required(),
    version: Joi.number().optional()
  }).required(),
  action: Joi.string().required(),
  signal: Joi.string().optional(),
  user_address: Joi.string().optional()
});

/**
 * POST /api/v1/kyc/worldid
 * Verify World ID proof and submit to smart contract
 */
router.post('/worldid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Initialize services lazily
    const worldId = getWorldIdService();
    const blockchain = getBlockchainService();

    // Validate request body
    const { error, value } = kycRequestSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      } as KYCResponse);
      return;
    }

    const requestData: WorldIdProofRequest = value;

    // Step 1: Verify World ID proof using MiniKit's verifyCloudProof
    const verificationResponse = await worldId.verifyProof({
      payload: requestData.payload,
      action: requestData.action,
      signal: requestData.signal
    });

    if (!verificationResponse.success) {
      res.status(400).json({
        success: false,
        error: verificationResponse.error || 'World ID verification failed'
      } as KYCResponse);
      return;
    }

    // Step 2: Submit to smart contract using the verified payload
    const contractResponse = await blockchain.submitKYCToContract({
      proof: requestData.payload.proof,
      merkle_root: requestData.payload.merkle_root,
      nullifier_hash: requestData.payload.nullifier_hash,
      user_address: requestData.user_address || "0x0000000000000000000000000000000000000000"
    });

    if (!contractResponse.success) {
      res.status(400).json({
        success: false,
        error: contractResponse.error || 'Smart contract submission failed'
      } as KYCResponse);
      return;
    }

    // Success response
    res.json({
      success: true,
      message: 'KYC initiated successfully with World ID verification on-chain',
      transaction_hash: contractResponse.transaction_hash,
      kyc_id: contractResponse.kyc_id
    } as KYCResponse);

  } catch (error) {
    console.error('KYC World ID verification error:', error);
    next(error);
  }
});

/**
 * GET /api/v1/kyc/status/:address
 * Get KYC status for a user address
 */
router.get('/status/:address', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📊 GET /status/:address called for:', req.params.address);
    
    // Initialize blockchain service lazily
    const blockchain = getBlockchainService();
    console.log('✅ Blockchain service initialized successfully');

    const { address } = req.params;
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.log('❌ Invalid address format:', address);
      res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
      return;
    }

    console.log('🔍 Calling blockchain.getKYCStatus for address:', address);
    const status = await blockchain.getKYCStatus(address);
    console.log('📋 KYC Status result:', status);
    
    const response = {
      success: true,
      address,
      status: status.status,
      pending: status.pending,
      kyc_pending: status.pending, // Para compatibilidad
      kyc_id: status.status, // Usar el status como ID
      nullifier_hash: status.nullifier_hash,
      requested_at: status.requested_at,
      approved_at: status.approved_at,
      kyc_data_hash: status.kyc_data_hash,
      onchain_id_address: status.onchain_id_address
    };
    console.log('📤 Sending response:', response);
    
    res.json(response);

  } catch (error) {
    console.error('❌ Get KYC status error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    res.status(500).json({
      success: false,
      error: 'Failed to get KYC status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/v1/kyc/onfido/start
 * Inicia el proceso KYC con Onfido creando applicant y generando SDK token
 */
router.post('/onfido/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, dob, address, userAddress } = req.body;

    // Validación básica
    if (!firstName || !lastName || !email || !userAddress) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email, userAddress'
      });
      return;
    }

    console.log('🚀 Starting Onfido KYC process for:', email);

    // 1. Crear applicant en Onfido
    const onfido = getOnfidoService();
    const applicant = await onfido.createApplicant({
      firstName,
      lastName,
      email,
      dob,
      address
    });

    // 2. Generar SDK token para el frontend
    const sdkToken = await onfido.generateSDKToken(
      applicant.id,
      req.headers.origin
    );

    // 3. Crear check de verificación
    const check = await onfido.createCheck(applicant.id, userAddress);

    // Respuesta exitosa
    res.json({
      success: true,
      data: {
        applicantId: applicant.id,
        sdkToken: sdkToken.token,
        checkId: check.id,
        status: check.status
      }
    });

    console.log('✅ Onfido KYC process started successfully');

  } catch (error) {
    console.error('❌ Error starting Onfido KYC process:', error);
    next(error);
  }
});

/**
 * GET /api/v1/kyc/onfido/status/:checkId
 * Obtiene el estado actual de un check de verificación Onfido
 */
router.get('/onfido/status/:checkId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { checkId } = req.params;

    if (!checkId) {
      res.status(400).json({
        success: false,
        error: 'Check ID is required'
      });
      return;
    }

    console.log('📋 Getting Onfido KYC status for check:', checkId);

    const onfido = getOnfidoService();
    const check = await onfido.getCheck(checkId);

    res.json({
      success: true,
      data: {
        checkId: check.id,
        status: check.status,
        result: check.result,
        applicantId: check.applicantId,
        reports: check.reports?.map(report => ({
          id: report.id,
          name: report.name,
          status: report.status,
          result: report.result
        })),
        createdAt: check.createdAt,
        isComplete: check.status === 'complete',
        isApproved: check.result === 'clear'
      }
    });

  } catch (error) {
    console.error('❌ Error getting Onfido KYC status:', error);
    next(error);
  }
});

/**
 * POST /api/v1/kyc/onfido/webhook
 * Endpoint para recibir webhooks de Onfido
 */
router.post('/onfido/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-onfido-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verificar signature del webhook (seguridad)
    const onfido = getOnfidoService();
    const isValidSignature = onfido.verifyWebhookSignature(rawBody, signature);
    
    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    console.log('📨 Received Onfido webhook:', req.body.payload?.action);

    // Procesar el evento
    await onfido.processWebhookEvent(req.body);

    // Responder a Onfido que recibimos el webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error processing Onfido webhook:', error);
    next(error);
  }
});

/**
 * GET /api/v1/kyc/onfido/config
 * Obtiene información de configuración del servicio Onfido
 */
router.get('/onfido/config', (req: Request, res: Response) => {
  const onfido = getOnfidoService();
  const serviceInfo = onfido.getServiceInfo();
  
  res.json({
    success: true,
    data: {
      service: 'Onfido',
      configured: serviceInfo.configured,
      apiUrl: serviceInfo.apiUrl,
      hasApiToken: serviceInfo.hasApiToken,
      hasWebhookToken: serviceInfo.hasWebhookToken,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

export { router as kycRoutes };