'use client';

import React, { useState, useEffect } from 'react';
import { KYCStatus } from '@/hooks/useKYC';
import { useWorldID } from '@/hooks/useWorldID';
import OnfidoCapture from './OnfidoCapture';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestKYC: () => Promise<boolean>;
  kycStatus: KYCStatus;
  isLoading: boolean;
  error: string | null;
  statusText: string;
}

/**
 * Modal que guía al usuario a través del proceso de KYC
 * Implementa la UI para el flujo documentado en KYC-ARCHITECTURE.md
 */
export default function KYCModal({
  isOpen,
  onClose,
  onRequestKYC,
  kycStatus,
  isLoading,
  error,
  statusText
}: KYCModalProps) {
  const worldID = useWorldID();
  const [currentStep, setCurrentStep] = useState(1);
  const [showOnfidoCapture, setShowOnfidoCapture] = useState(false);
  const [onfidoData, setOnfidoData] = useState<any>(null);

  useEffect(() => {
    // Update step based on KYC status
    switch (kycStatus) {
      case KYCStatus.NONE:
        setCurrentStep(1);
        break;
      case KYCStatus.WORLD_ID_VERIFIED:
        setCurrentStep(2);
        break;
      case KYCStatus.PENDING_OFFCHAIN:
        setCurrentStep(3);
        break;
      case KYCStatus.FULL_KYC:
        setCurrentStep(4);
        break;
      case KYCStatus.REJECTED:
        setCurrentStep(1);
        break;
    }
  }, [kycStatus]);

  const handleStartKYC = async () => {
    const success = await onRequestKYC();
    if (success) {
      setCurrentStep(2);
      // Start Onfido process after World ID verification
      await startOnfidoProcess();
    }
  };

  const startOnfidoProcess = async () => {
    if (!worldID.user?.address) {
      console.error('No user address available');
      return;
    }

    try {
      console.log('🚀 Starting Onfido verification process...');

      // Call backend to start Onfido process
      const response = await fetch('http://localhost:8001/api/v1/kyc/onfido/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Demo', // In real app, get from user input
          lastName: 'User',
          email: 'demo@example.com',
          userAddress: worldID.user.address,
          dob: '1990-01-01',
          address: {
            flat_number: '1',
            building_number: '123',
            building_name: 'Main Building',
            street: 'Main Street',
            sub_street: '',
            town: 'Demo City',
            postcode: '12345',
            country: 'ARG'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start Onfido process: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOnfidoData(result.data);
        setShowOnfidoCapture(true);
        setCurrentStep(3);
      } else {
        throw new Error(result.error || 'Failed to start Onfido process');
      }

    } catch (error) {
      console.error('❌ Error starting Onfido process:', error);
      // Handle error appropriately
    }
  };

  const handleOnfidoComplete = (data: any) => {
    console.log('✅ Onfido verification completed:', data);
    setShowOnfidoCapture(false);
    setCurrentStep(4);
    // The webhook will handle calling fulfillKYC automatically
  };

  const handleOnfidoError = (error: any) => {
    console.error('❌ Onfido verification error:', error);
    setShowOnfidoCapture(false);
    // Handle error appropriately
  };

  const getStepIcon = (step: number) => {
    if (step < currentStep) return '✅';
    if (step === currentStep) return '🔄';
    return '⚪';
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-brand-surface border border-brand-primary/20 rounded-xl shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-brand-primary/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-light">Complete KYC Verification</h2>
              <button
                onClick={onClose}
                className="text-brand-light/60 hover:text-brand-light transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-brand-light/70 mt-2">
              Secure identity verification powered by World ID + Chainlink
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Progress Steps */}
            <div className="space-y-4 mb-6">
              {/* Step 1: World ID Verification */}
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                getStepStatus(1) === 'current' ? 'bg-brand-primary/10 border border-brand-primary/30' :
                getStepStatus(1) === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                'bg-brand-dark/20'
              }`}>
                <span className="text-lg mt-0.5">{getStepIcon(1)}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-light">World ID Verification</h3>
                  <p className="text-sm text-brand-light/70">
                    Prove you're a unique human with zero-knowledge proof
                  </p>
                  {getStepStatus(1) === 'completed' && (
                    <p className="text-xs text-green-400 mt-1">✓ Identity verified on-chain</p>
                  )}
                </div>
              </div>

              {/* Step 2: Onfido Document Check */}
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                getStepStatus(2) === 'current' ? 'bg-brand-primary/10 border border-brand-primary/30' :
                getStepStatus(2) === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                'bg-brand-dark/20'
              }`}>
                <span className="text-lg mt-0.5">{getStepIcon(2)}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-light">Document Verification</h3>
                  <p className="text-sm text-brand-light/70">
                    Chainlink DON processes your ID with Onfido
                  </p>
                  {getStepStatus(2) === 'current' && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-brand-primary">Processing...</span>
                    </div>
                  )}
                  {getStepStatus(2) === 'completed' && (
                    <p className="text-xs text-green-400 mt-1">✓ Documents verified by consensus</p>
                  )}
                </div>
              </div>

              {/* Step 3: OnchainID Creation */}
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                getStepStatus(3) === 'current' ? 'bg-brand-primary/10 border border-brand-primary/30' :
                getStepStatus(3) === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                'bg-brand-dark/20'
              }`}>
                <span className="text-lg mt-0.5">{getStepIcon(3)}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-light">OnchainID Registration</h3>
                  <p className="text-sm text-brand-light/70">
                    Create your compliant identity for ERC-3643 tokens
                  </p>
                  {getStepStatus(3) === 'completed' && (
                    <p className="text-xs text-green-400 mt-1">✓ Ready to invest in tokenized assets</p>
                  )}
                </div>
              </div>

              {/* Step 4: Complete */}
              {kycStatus === KYCStatus.FULL_KYC && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-lg mt-0.5">🎉</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-green-400">KYC Complete!</h3>
                    <p className="text-sm text-brand-light/70">
                      You can now invest in real estate tokens
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <div>
                    <h4 className="text-sm font-medium text-red-400">Verification Error</h4>
                    <p className="text-xs text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Status */}
            <div className="mb-6 p-3 bg-brand-dark/30 rounded-lg">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className={`w-3 h-3 rounded-full ${
                    kycStatus === KYCStatus.FULL_KYC ? 'bg-green-400' :
                    kycStatus === KYCStatus.REJECTED ? 'bg-red-400' :
                    kycStatus === KYCStatus.WORLD_ID_VERIFIED || kycStatus === KYCStatus.PENDING_OFFCHAIN ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`}></div>
                )}
                <span className="text-sm text-brand-light">{statusText}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {kycStatus === KYCStatus.NONE && (
                <button
                  onClick={handleStartKYC}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-brand-primary hover:bg-brand-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Starting Verification...
                    </>
                  ) : (
                    <>
                      🆔 Start KYC with World ID
                    </>
                  )}
                </button>
              )}

              {kycStatus === KYCStatus.FULL_KYC && (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
                >
                  🎉 Continue to Marketplace
                </button>
              )}

              {(kycStatus === KYCStatus.WORLD_ID_VERIFIED || kycStatus === KYCStatus.PENDING_OFFCHAIN) && (
                <div className="text-center">
                  <p className="text-sm text-brand-light/70">
                    Verification in progress... This may take a few moments.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 text-sm text-brand-primary hover:text-brand-primary/80 transition-colors"
                  >
                    Continue browsing
                  </button>
                </div>
              )}

              {kycStatus === KYCStatus.REJECTED && (
                <button
                  onClick={handleStartKYC}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  {isLoading ? 'Retrying...' : 'Retry KYC Verification'}
                </button>
              )}
            </div>

            {/* Onfido Document Capture */}
            {showOnfidoCapture && onfidoData && (
              <div className="mt-6 p-4 bg-brand-dark/30 rounded-lg">
                <h3 className="text-lg font-medium text-brand-light mb-3">
                  📄 Upload Your Documents
                </h3>
                <p className="text-sm text-brand-light/70 mb-4">
                  Please provide a clear photo of your government-issued ID and a selfie for verification.
                </p>
                <OnfidoCapture
                  token={onfidoData.sdkToken}
                  applicantId={onfidoData.applicantId}
                  onComplete={handleOnfidoComplete}
                  onError={handleOnfidoError}
                />
              </div>
            )}

            {/* Info Footer */}
            <div className="mt-6 pt-4 border-t border-brand-primary/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-brand-light/60">
                  <span>🔒</span>
                  <span>Your data is encrypted and processed securely</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-light/60">
                  <span>⚡</span>
                  <span>Powered by Chainlink decentralized oracle network</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-light/60">
                  <span>🌍</span>
                  <span>World ID ensures one person = one verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}