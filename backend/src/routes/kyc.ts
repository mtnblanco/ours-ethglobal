import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { WorldIdService } from '../services/worldId';
import { BlockchainService } from '../services/blockchain';
import { WorldIdProofRequest, KYCResponse } from '../types';

const router = Router();

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

// Services
let worldIdService: WorldIdService | null = null;
let blockchainService: BlockchainService | null = null;

// Initialize services only if configuration is available
try {
  worldIdService = new WorldIdService();
  console.log('✅ WorldID service initialized');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.warn('⚠️ WorldID service not available:', errorMessage);
}

try {
  blockchainService = new BlockchainService();
  console.log('✅ Blockchain service initialized');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.warn('⚠️ Blockchain service not available:', errorMessage);
}

/**
 * POST /api/v1/kyc/worldid
 * Verify World ID proof and submit to smart contract
 */
router.post('/worldid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if services are available
    if (!worldIdService || !blockchainService) {
      res.status(500).json({
        success: false,
        error: 'Backend services not properly configured'
      } as KYCResponse);
      return;
    }

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
    const verificationResponse = await worldIdService.verifyProof({
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
    const contractResponse = await blockchainService.submitKYCToContract({
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
    if (!blockchainService) {
      res.status(500).json({
        success: false,
        error: 'Blockchain service not available'
      });
      return;
    }

    const { address } = req.params;
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
      return;
    }

    const status = await blockchainService.getKYCStatus(address);
    
    res.json({
      success: true,
      address,
      kyc_pending: status.pending,
      kyc_id: status.kycId
    });

  } catch (error) {
    console.error('Get KYC status error:', error);
    next(error);
  }
});

export { router as kycRoutes };