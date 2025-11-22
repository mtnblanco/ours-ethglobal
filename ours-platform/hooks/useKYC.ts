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
      // TODO: En producción, hacer call al contrato ChainlinkKYCIssuer.getKYCData()
      // Por ahora, simulamos con mock data para demo
      
      const mockKYCData: KYCData = {
        status: KYCStatus.NONE,
        nullifierHash: '',
        requestedAt: 0,
        approvedAt: 0,
        kycDataHash: '',
        onchainIDAddress: ''
      };

      console.log('📋 Checking KYC status for user:', worldID.user.address);
      
      // Simulate contract call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setKycData(mockKYCData);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Failed to check KYC status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check KYC status');
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

      // Verificar que World ID esté conectado y verificado
      if (!worldID.isVerified) {
        console.log('📲 World ID not verified, requesting verification...');
        const verified = await worldID.verifyWorldID();
        if (!verified) {
          throw new Error('World ID verification failed');
        }
      }

      // En producción, esto sería una llamada al contrato:
      // await kycIssuer.requestKYCWithWorldID(signal, root, nullifierHash, proof)
      
      // Para demo, simulamos el proceso
      console.log('🔐 Generating World ID proof...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ World ID verified successfully');
      
      // Simular estado WORLD_ID_VERIFIED
      const newKYCData: KYCData = {
        status: KYCStatus.WORLD_ID_VERIFIED,
        nullifierHash: worldID.user.nullifierHash || 'demo_nullifier',
        requestedAt: Date.now() / 1000,
        approvedAt: 0,
        kycDataHash: '',
        onchainIDAddress: ''
      };

      setKycData(newKYCData);
      
      // Simular que Chainlink procesa en background
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
  };

  /**
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