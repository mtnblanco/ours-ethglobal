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

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
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
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [showOnfidoCapture, setShowOnfidoCapture] = useState(false);
  const [onfidoData, setOnfidoData] = useState<any>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    // Update step based on KYC status
    switch (kycStatus) {
      case KYCStatus.NONE:
        setCurrentStep(1);
        setShowPersonalInfoForm(false);
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
        setShowPersonalInfoForm(false);
        break;
    }
  }, [kycStatus]);

  const handleStartKYC = async () => {
    const success = await onRequestKYC();
    if (success) {
      setCurrentStep(2);
      // Show personal info form first
      setShowPersonalInfoForm(true);
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.email || 
        !personalInfo.dateOfBirth || !personalInfo.country) {
      alert('Please fill in all required fields');
      return;
    }

    setShowPersonalInfoForm(false);
    await startOnfidoProcess();
  };

  const startOnfidoProcess = async () => {
    if (!worldID.user?.address) {
      console.error('No user address available');
      return;
    }

    try {
      console.log('🚀 Starting Onfido verification process with real user data...');

      // Call backend to start Onfido process with real user data
      const response = await fetch('/api/v1/kyc/onfido/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          email: personalInfo.email,
          userAddress: worldID.user.address,
          dob: personalInfo.dateOfBirth,
          address: {
            flat_number: '1',
            building_number: '123',
            building_name: 'Building',
            street: personalInfo.address,
            sub_street: '',
            town: personalInfo.city,
            postcode: personalInfo.postalCode,
            country: personalInfo.country
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
      const message = error instanceof Error ? error.message : String(error);
      // Store local error so UI can show backend details immediately
      setLocalError(message);
      // Also keep any existing parent error handling intact
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Optimized for mobile/miniapp */}
      <div className="relative w-full max-w-sm mx-auto mt-2 mb-4">
        <div className="bg-brand-surface border border-brand-primary/20 rounded-xl shadow-xl max-h-screen overflow-y-auto">
          {/* Header - Compact */}
          <div className="px-4 py-3 border-b border-brand-primary/20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-light">KYC Verification</h2>
              <button
                onClick={onClose}
                className="text-brand-light/60 hover:text-brand-light transition-colors p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-brand-light/70 mt-1">
              Secure identity verification
            </p>
          </div>

          {/* Content - Scrollable */}
          <div className="px-4 py-4 space-y-4">
            {/* Progress Steps - Compact */}
            <div className="space-y-2">
              {/* Step 1: World ID Verification */}
              <div className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                getStepStatus(1) === 'current' ? 'bg-brand-primary/10 border border-brand-primary/30' :
                getStepStatus(1) === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                'bg-brand-dark/20'
              }`}>
                <span className="text-sm mt-0.5">{getStepIcon(1)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-brand-light">World ID</h3>
                  <p className="text-xs text-brand-light/70 leading-tight">
                    Prove you're a unique human
                  </p>
                  {getStepStatus(1) === 'completed' && (
                    <p className="text-xs text-green-400 mt-0.5">✓ Verified on-chain</p>
                  )}
                </div>
              </div>

              {/* Step 2: Onfido Document Check */}
              <div className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                getStepStatus(2) === 'current' ? 'bg-brand-primary/10 border border-brand-primary/30' :
                getStepStatus(2) === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                'bg-brand-dark/20'
              }`}>
                <span className="text-sm mt-0.5">{getStepIcon(2)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-brand-light">Document Check</h3>
                  <p className="text-xs text-brand-light/70 leading-tight">
                    ID verification with AI
                  </p>
                  {getStepStatus(2) === 'current' && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-brand-primary">Processing...</span>
                    </div>
                  )}
                  {getStepStatus(2) === 'completed' && (
                    <p className="text-xs text-green-400 mt-0.5">✓ Documents verified</p>
                  )}
                </div>
              </div>

              {/* Step 3: OnchainID Creation */}
              <div className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                getStepStatus(3) === 'current' ? 'bg-brand-primary/10 border border-brand-primary/30' :
                getStepStatus(3) === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                'bg-brand-dark/20'
              }`}>
                <span className="text-sm mt-0.5">{getStepIcon(3)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-brand-light">OnchainID</h3>
                  <p className="text-xs text-brand-light/70 leading-tight">
                    Create compliant identity
                  </p>
                  {getStepStatus(3) === 'completed' && (
                    <p className="text-xs text-green-400 mt-0.5">✓ Ready to invest</p>
                  )}
                </div>
              </div>

              {/* Step 4: Complete */}
              {kycStatus === KYCStatus.FULL_KYC && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-sm mt-0.5">🎉</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-green-400">KYC Complete!</h3>
                    <p className="text-xs text-brand-light/70 leading-tight">
                      You can now invest
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error State - Compact */}
            {(error || localError) && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 text-sm">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-red-400">Error</h4>
                    <p className="text-xs text-red-300 mt-0.5 leading-tight">{localError || error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Status - Compact */}
            <div className="p-2 bg-brand-dark/30 rounded-lg">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${
                    kycStatus === KYCStatus.FULL_KYC ? 'bg-green-400' :
                    kycStatus === KYCStatus.REJECTED ? 'bg-red-400' :
                    kycStatus === KYCStatus.WORLD_ID_VERIFIED || kycStatus === KYCStatus.PENDING_OFFCHAIN ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`}></div>
                )}
                <span className="text-xs text-brand-light leading-tight">{statusText}</span>
              </div>
            </div>

            {/* Action Buttons - Compact */}
            <div className="space-y-2">
              {kycStatus === KYCStatus.NONE && (
                <button
                  onClick={handleStartKYC}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-brand-primary hover:bg-brand-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      🆔 Start KYC
                    </>
                  )}
                </button>
              )}

              {kycStatus === KYCStatus.FULL_KYC && (
                <button
                  onClick={onClose}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  🎉 Continue to Marketplace
                </button>
              )}

              {(kycStatus === KYCStatus.WORLD_ID_VERIFIED || kycStatus === KYCStatus.PENDING_OFFCHAIN) && (
                <div className="text-center">
                  <p className="text-xs text-brand-light/70 leading-tight">
                    Verification in progress...
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-1 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
                  >
                    Continue browsing
                  </button>
                </div>
              )}

              {kycStatus === KYCStatus.REJECTED && (
                <button
                  onClick={handleStartKYC}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
                >
                  {isLoading ? 'Retrying...' : 'Retry KYC'}
                </button>
              )}
            </div>

            {/* Personal Information Form - Compact */}
            {showPersonalInfoForm && (
              <div className="p-3 bg-brand-dark/30 rounded-lg">
                <h3 className="text-sm font-medium text-brand-light mb-2">
                  👤 Personal Information
                </h3>
                <p className="text-xs text-brand-light/70 mb-3 leading-tight">
                  Please provide your details for verification.
                </p>
                <form onSubmit={handlePersonalInfoSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-brand-light mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full border border-brand-primary/30 bg-brand-dark/50 rounded px-2 py-1.5 text-sm text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-light mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full border border-brand-primary/30 bg-brand-dark/50 rounded px-2 py-1.5 text-sm text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-brand-light mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-brand-primary/30 bg-brand-dark/50 rounded px-2 py-1.5 text-sm text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-brand-light mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={personalInfo.dateOfBirth}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full border border-brand-primary/30 bg-brand-dark/50 rounded px-2 py-1.5 text-sm text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-light mb-1">
                        Country *
                      </label>
                      <select
                        required
                        value={personalInfo.country}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full border border-brand-primary/30 bg-brand-dark/50 rounded px-2 py-1.5 text-sm text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="">Select</option>
                        <option value="AR">Argentina</option>
                        <option value="BR">Brazil</option>
                        <option value="CL">Chile</option>
                        <option value="CO">Colombia</option>
                        <option value="MX">Mexico</option>
                        <option value="PE">Peru</option>
                        <option value="UY">Uruguay</option>
                        <option value="US">United States</option>
                        <option value="ES">Spain</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-light mb-1">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={personalInfo.address}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full border border-brand-primary/30 bg-brand-dark/50 rounded px-2 py-1.5 text-sm text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowPersonalInfoForm(false)}
                      className="flex-1 bg-gray-600 text-white py-1.5 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-brand-primary text-white py-1.5 px-3 rounded text-sm hover:bg-brand-primary/80 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Onfido Document Capture - Compact */}
            {showOnfidoCapture && onfidoData && (
              <div className="p-3 bg-brand-dark/30 rounded-lg">
                <h3 className="text-sm font-medium text-brand-light mb-2">
                  📄 Upload Documents
                </h3>
                <p className="text-xs text-brand-light/70 mb-3 leading-tight">
                  Please provide a clear photo of your ID and a selfie.
                </p>
                <OnfidoCapture
                  token={onfidoData.sdkToken}
                  applicantId={onfidoData.applicantId}
                  onComplete={handleOnfidoComplete}
                  onError={handleOnfidoError}
                />
              </div>
            )}

            {/* Info Footer - Compact */}
            <div className="pt-3 border-t border-brand-primary/20">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-brand-light/60">
                  <span>🔒</span>
                  <span>Secure & encrypted</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-brand-light/60">
                  <span>⚡</span>
                  <span>Powered by Chainlink</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-brand-light/60">
                  <span>🌍</span>
                  <span>World ID verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}