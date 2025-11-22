'use client';

import React, { useEffect, useRef } from 'react';

// Importación correcta del SDK de Onfido
declare global {
  interface Window {
    OnfidoSDK: any;
  }
}

interface OnfidoCaptureProps {
  token: string;
  onComplete: (data: any) => void;
  onError: (error: any) => void;
  applicantId: string;
}

/**
 * Componente para captura de documentos usando Onfido SDK
 * 
 * Funcionalidades:
 * - Captura de documento de identidad (frente y dorso)
 * - Captura de selfie con verificación de liveness
 * - Integración completa con Onfido API
 * - UI nativa de Onfido con detección automática
 */
export default function OnfidoCapture({ 
  token, 
  onComplete, 
  onError, 
  applicantId 
}: OnfidoCaptureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkHandleRef = useRef<any>(null);
  const [isSDKLoaded, setIsSDKLoaded] = React.useState(false);

  // Cargar SDK de Onfido desde CDN
  useEffect(() => {
    if (window.OnfidoSDK) {
      setIsSDKLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.onfido.com/dist/onfido_sdk.min.js';
    script.async = true;
    script.onload = () => {
      setIsSDKLoaded(true);
    };
    script.onerror = () => {
      onError(new Error('Failed to load Onfido SDK'));
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError]);

  useEffect(() => {
    if (!isSDKLoaded || !token || !containerRef.current) return;

    // Configuración del SDK de Onfido
    const onfidoConfig = {
      token: token,
      containerId: 'onfido-mount',
      
      // Configuración de pasos del flujo KYC
      steps: [
        {
          type: 'document',
          options: {
            documentTypes: {
              driving_licence: true,
              national_identity_card: true,
              passport: true
            },
            hideCountrySelection: false,
            uploadFallback: true, // Permite subir archivos si la cámara falla
          }
        },
        {
          type: 'face',
          options: {
            requestedVariant: 'standard', // Selfie estándar
            uploadFallback: true,
          }
        }
      ],

      // Callbacks del SDK
      onComplete: (data: any) => {
        console.log('✅ Onfido verification complete:', data);
        onComplete(data);
      },

      onError: (error: any) => {
        console.error('❌ Onfido error:', error);
        onError(error);
      },

      onUserExit: (userExitCode: string) => {
        console.log('👋 User exited Onfido flow:', userExitCode);
        // Manejar cuando el usuario sale del flujo
      },

      onModalRequestClose: () => {
        console.log('🔒 User requested to close modal');
        // El usuario quiere cerrar el modal
      },

      // Configuración de UI
      language: {
        locale: 'es_ES', // Español
        phrases: {
          'welcome.title': 'Verificación de Identidad',
          'welcome.description': 'Vamos a verificar tu identidad de forma segura',
          'document_selector.identity.title': 'Documento de Identidad',
          'document_selector.identity.hint': 'Sube tu DNI, pasaporte o licencia de conducir'
        }
      },

      // Configuración de tema
      customUI: {
        fontFamilyTitle: '"Inter", sans-serif',
        fontFamilySubtitle: '"Inter", sans-serif',
        fontSizeTitle: '24px',
        colorContentTitle: '#1f2937',
        colorContentSubtitle: '#6b7280',
        colorBackgroundPrimary: '#ffffff',
        colorBackgroundSecondary: '#f9fafb',
        colorBorderPrimary: '#e5e7eb',
        colorBorderSecondary: '#d1d5db',
        colorInputOutline: '#3b82f6',
        colorBackgroundButtonPrimary: '#3b82f6',
        colorBackgroundButtonPrimaryHover: '#2563eb',
        colorContentButtonPrimaryText: '#ffffff',
        borderRadiusPrimary: '8px',
        borderRadiusSecondary: '6px'
      }
    };

    // Inicializar SDK de Onfido
    try {
      const sdkHandle = window.OnfidoSDK.init(onfidoConfig);
      sdkHandleRef.current = sdkHandle;
      
      console.log('🔧 Onfido SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Onfido SDK:', error);
      onError(error);
    }

    // Cleanup al desmontar
    return () => {
      if (sdkHandleRef.current) {
        try {
          sdkHandleRef.current.tearDown();
        } catch (error) {
          console.error('Error tearing down Onfido SDK:', error);
        }
      }
    };
  }, [isSDKLoaded, token, onComplete, onError]);

  if (!token) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-light/70">Configurando verificación...</p>
        </div>
      </div>
    );
  }

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-light/70">Cargando SDK de verificación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onfido-container">
      {/* Contenedor donde Onfido monta su UI */}
      <div 
        id="onfido-mount" 
        ref={containerRef}
        className="w-full min-h-[500px]"
      />
      
      {/* Información adicional */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 mt-0.5">ℹ️</span>
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-1">Verificación Segura</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Tu documento será verificado con IA avanzada</li>
              <li>• Los datos se procesan de forma segura y encriptada</li>
              <li>• La verificación toma entre 30 segundos y 2 minutos</li>
              <li>• Puedes usar DNI, pasaporte o licencia de conducir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}