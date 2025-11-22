import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js';
import { WorldIdVerificationResponse } from '../types';

interface WorldIdProofPayload {
  payload: ISuccessResult; // The result from MiniKit.commandsAsync.verify()
  action: string;
  signal?: string;
}

export class WorldIdService {
  private appId: string;

  constructor() {
    this.appId = process.env.WORLDCOIN_APP_ID || '';
    
    if (!this.appId || !this.appId.startsWith('app_')) {
      throw new Error('Missing or invalid Worldcoin APP_ID. Must start with "app_"');
    }
  }

  async verifyProof(proofData: WorldIdProofPayload): Promise<WorldIdVerificationResponse> {
    try {
      const { payload, action, signal } = proofData;
      
      // Use the official MiniKit verification method
      const verifyRes = await verifyCloudProof(
        payload, 
        this.appId as `app_${string}`, 
        action, 
        signal
      ) as IVerifyResponse;

      if (verifyRes.success) {
        return { 
          success: true 
        };
      } else {
        return { 
          success: false, 
          error: verifyRes.detail || 'World ID verification failed' 
        };
      }
    } catch (error) {
      console.error('World ID verification error:', error);
      return { 
        success: false, 
        error: 'Failed to verify World ID proof' 
      };
    }
  }
}