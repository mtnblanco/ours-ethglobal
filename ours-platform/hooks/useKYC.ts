'use client';

import { useState, useEffect } from 'react';
import { useWorldID } from './useWorldID';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

// KYC Status enum from the contract
export enum KYCStatus {
  NONE = 0,
  WORLD_ID_VERIFIED = 1,
  PENDING_OFFCHAIN = 2,
  FULL_KYC = 3,
  REJECTED = 4
}

export interface KYCData {
  status: KYCStatus;
  nullifierHash: string;
  requestedAt: number;
  approvedAt: number;
  kycDataHash: string;
  onchainIDAddress: string;
}

export interface KYCHookReturn {
  kycData: KYCData | null;
  isLoading: boolean;
  error: string | null;
  canInvest: boolean;
  needsKYC: boolean;
  requestKYC: () => Promise<boolean>;
  checkKYCStatus: () => Promise<void>;
  getKYCStatusText: () => string;
}

/**
 * Hook para manejar el flujo completo de KYC según la arquitectura documentada
 * 
 * FLUJO:
 * 1. Usuario hace "Start Trading" → requestKYC()
 * 2. Se verifica World ID proof → estado WORLD_ID_VERIFIED
 * 3. Chainlink DON escucha evento → consulta Onfido
 * 4. DON ejecuta fulfillKYC() → estado FULL_KYC (puede invertir)
 */
export function useKYC(): KYCHookReturn {
  const worldID = useWorldID();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract address for KYC Issuer
  const KYC_ISSUER_ADDRESS = CONTRACT_ADDRESSES.KYC_ISSUER;

  /**
   * Verifica el estado actual de KYC del usuario
   */
  const checkKYCStatus = async () => {
    if (!worldID.user?.address) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📋 Checking KYC status for user:', worldID.user.address);
      
      // Call backend API to get KYC status from contract
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      console.log('🔗 Using backend URL:', backendUrl);
      console.log('🔗 Full URL:', `${backendUrl}/api/v1/kyc/status/${worldID.user.address}`);
      
      const response = await fetch(`${backendUrl}/api/v1/kyc/status/${worldID.user.address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`Failed to fetch KYC status: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📊 Response data:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch KYC status');
      }

      // Map backend response to KYCData format
      const statusMapping = {
        'NONE': KYCStatus.NONE,
        'WORLD_ID_VERIFIED': KYCStatus.WORLD_ID_VERIFIED,
        'PENDING_OFFCHAIN': KYCStatus.PENDING_OFFCHAIN,
        'FULL_KYC': KYCStatus.FULL_KYC,
        'REJECTED': KYCStatus.REJECTED
      };

      const backendStatus = result.status || 'NONE';
      const mappedStatus = statusMapping[backendStatus as keyof typeof statusMapping] || KYCStatus.NONE;

      const kycStatusData: KYCData = {
        status: mappedStatus,
        nullifierHash: result.nullifier_hash || '',
        requestedAt: result.requested_at || 0,
        approvedAt: result.approved_at || 0,
        kycDataHash: result.kyc_data_hash || '',
        onchainIDAddress: result.onchain_id_address || ''
      };

      setKycData(kycStatusData);
      setIsLoading(false);
      
    } catch (err) {
      console.error('❌ KYC Status Check Failed:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error name:', err instanceof Error ? err.name : 'Unknown');
      console.error('❌ Error message:', err instanceof Error ? err.message : String(err));
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      let errorMessage = 'Failed to check KYC status';
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to connect to backend';
        } else if (err.message.includes('CORS')) {
          errorMessage = 'CORS error: Cross-origin request blocked';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  /**
   * Inicia el proceso de KYC con World ID
   * PASO 1: Solicitar KYC verificando World ID proof
   */
  const requestKYC = async (): Promise<boolean> => {
    if (!worldID.user?.address) {
      setError('Please connect with World ID first');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🆔 Starting KYC process with World ID...');

      // Si World ID ya está verificado, saltar verificación backend
      if (worldID.isVerified) {
        console.log('✅ World ID already verified, skipping backend verification...');
        
        // Update KYC data with WORLD_ID_VERIFIED status directly
        const newKYCData: KYCData = {
          status: KYCStatus.WORLD_ID_VERIFIED,
          nullifierHash: worldID.user.nullifierHash || "demo_nullifier",
          requestedAt: Date.now() / 1000,
          approvedAt: 0,
          kycDataHash: '',
          onchainIDAddress: ''
        };
        
        setKycData(newKYCData);
        setIsLoading(false);
        return true;
      }

      // Si no está verificado, verificar primero
      console.log('📲 World ID not verified, requesting verification...');
      const verified = await worldID.verifyWorldID();
      if (!verified) {
        throw new Error('World ID verification failed');
      }

      // Call the actual World ID verification endpoint
      console.log('🔐 Sending World ID proof to backend...');

      // For now, we'll use mock proof data for demo purposes
      // In a real app, this would come from MiniKit
      const mockProof = {
        proof: "mock_proof_for_demo",
        merkle_root: "mock_merkle_root",
        nullifier_hash: worldID.user.nullifierHash || "mock_nullifier_hash",
        verification_level: "device",
        status: "success"
      };

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      console.log('🔗 Using backend URL for World ID:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/v1/kyc/worldid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: mockProof,
          action: "kyc-verification",
          signal: typeof window !== "undefined" ? window.location.href : "kyc-verification",
          user_address: worldID.user.address
        }),
      });

      console.log('📡 World ID Response status:', response.status);

      if (!response.ok) {
        throw new Error(`KYC request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'KYC initiation failed');
      }

      console.log('✅ World ID verified and KYC initiated on-chain');
      console.log('📋 Transaction hash:', result.transaction_hash);
      
      // Update KYC data with WORLD_ID_VERIFIED status
      const newKYCData: KYCData = {
        status: KYCStatus.WORLD_ID_VERIFIED,
        nullifierHash: worldID.user.nullifierHash || mockProof.nullifier_hash,
        requestedAt: Date.now() / 1000,
        approvedAt: 0,
        kycDataHash: '',
        onchainIDAddress: ''
      };
      
      setKycData(newKYCData);
      
      // For MVP, simulate that Chainlink processes in background
      // In production, Chainlink DON would listen to the KYCRequested event
      setTimeout(() => {
        console.log('⚡ Chainlink DON processing Onfido verification...');
        simulateChainlinkCallback();
      }, 3000);

      setIsLoading(false);
      return true;

    } catch (err) {
      console.error('KYC request failed:', err);
      setError(err instanceof Error ? err.message : 'KYC request failed');
      setIsLoading(false);
      return false;
    }
  };  /**
   * Simula el callback de Chainlink DON después de verificar Onfido
   * PASO 2: Chainlink ejecuta fulfillKYC()
   */
  const simulateChainlinkCallback = () => {
    console.log('🔗 Chainlink DON: Onfido verification complete');
    
    // En producción, esto sería ejecutado por Chainlink DON:
    // kycIssuer.fulfillKYC(user, approved=true, kycDataHash)
    
    // Simular aprobación exitosa
    const approvedKYCData: KYCData = {
      status: KYCStatus.FULL_KYC,
      nullifierHash: kycData?.nullifierHash || 'demo_nullifier',
      requestedAt: kycData?.requestedAt || Date.now() / 1000,
      approvedAt: Date.now() / 1000,
      kycDataHash: 'onfido_verified_hash_' + Math.random().toString(36).substr(2, 9),
      onchainIDAddress: '0x' + Math.random().toString(16).substr(2, 40)
    };

    setKycData(approvedKYCData);
    console.log('✅ KYC Complete! User can now invest.');
  };

  /**
   * Obtiene el texto descriptivo del estado actual
   */
  const getKYCStatusText = (): string => {
    if (!kycData) return 'KYC not started';
    
    switch (kycData.status) {
      case KYCStatus.NONE:
        return 'KYC required to start trading';
      case KYCStatus.WORLD_ID_VERIFIED:
        return 'World ID verified - Processing identity verification...';
      case KYCStatus.PENDING_OFFCHAIN:
        return 'Verifying identity with Onfido...';
      case KYCStatus.FULL_KYC:
        return 'KYC complete - Ready to invest!';
      case KYCStatus.REJECTED:
        return 'KYC rejected - Please try again later';
      default:
        return 'Unknown status';
    }
  };

  // Check KYC status when World ID connects
  useEffect(() => {
    if (worldID.user?.address && !isLoading) {
      checkKYCStatus();
    }
  }, [worldID.user?.address]);

  return {
    kycData,
    isLoading,
    error,
    canInvest: kycData?.status === KYCStatus.FULL_KYC,
    needsKYC: !kycData || kycData.status === KYCStatus.NONE,
    requestKYC,
    checkKYCStatus,
    getKYCStatusText,
  };
}