import { ISuccessResult } from '@worldcoin/minikit-js';

export interface WorldIdProofRequest {
  payload: ISuccessResult; // The complete result from MiniKit verification
  action: string;
  signal?: string;
  user_address?: string;
}

export interface WorldIdVerificationResponse {
  success: boolean;
  error?: string;
}

export interface SmartContractResponse {
  success: boolean;
  transaction_hash?: string;
  kyc_id?: string;
  error?: string;
}

export interface KYCResponse {
  success: boolean;
  message?: string;
  transaction_hash?: string;
  kyc_id?: string;
  error?: string;
}