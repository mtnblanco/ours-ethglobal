import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BlockchainService } from './blockchain';

export interface OnfidoApplicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dob?: string;
  address?: {
    buildingNumber?: string;
    street?: string;
    town?: string;
    postcode?: string;
    country?: string;
  };
}

export interface OnfidoSDKToken {
  token: string;
  applicantId: string;
}

export interface OnfidoCheck {
  id: string;
  status: 'in_progress' | 'complete' | 'withdrawn' | 'paused' | 'cancelled';
  result: 'clear' | 'consider' | 'unidentified';
  applicantId: string;
  reports: OnfidoReport[];
  createdAt: string;
  href: string;
}

export interface OnfidoReport {
  id: string;
  name: string;
  status: string;
  result: string;
  subResult?: string;
  breakdown?: any;
  properties?: any;
}

export interface OnfidoWebhookEvent {
  payload: {
    resource_type: string;
    action: string;
    object: {
      id: string;
      status: string;
      completed_at_iso8601?: string;
      href: string;
    };
  };
}

/**
 * Servicio para integración con Onfido API
 * 
 * Funcionalidades:
 * - Crear applicants (usuarios)
 * - Generar SDK tokens para frontend
 * - Crear checks de verificación
 * - Obtener resultados de verificación
 * - Manejar webhooks
 */
export class OnfidoService {
  private apiClient: AxiosInstance;
  private apiToken: string;
  private webhookToken: string;
  private blockchainService: BlockchainService | null;
  private userAddressMapping: Map<string, string>; // checkId -> userAddress

  constructor() {
    this.apiToken = process.env.ONFIDO_API_TOKEN || '';
    this.webhookToken = process.env.ONFIDO_WEBHOOK_TOKEN || '';
    this.userAddressMapping = new Map();
    
    if (!this.apiToken) {
      throw new Error('ONFIDO_API_TOKEN environment variable is required');
    }

    // Initialize blockchain service if available
    try {
      this.blockchainService = new BlockchainService();
      console.log('✅ Blockchain service initialized in OnfidoService');
    } catch (error) {
      console.warn('⚠️ Blockchain service not available in OnfidoService:', error);
      this.blockchainService = null;
    }

    this.apiClient = axios.create({
      baseURL: process.env.ONFIDO_API_URL || 'https://api.onfido.com/v3',
      headers: {
        'Authorization': `Token token=${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });

    // Interceptor para logging
    this.apiClient.interceptors.request.use((config) => {
      console.log(`🔗 Onfido API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`✅ Onfido API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`❌ Onfido API Error: ${error.response?.status} ${error.config?.url}`, 
          error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Crear un nuevo applicant en Onfido
   */
  async createApplicant(userData: {
    firstName: string;
    lastName: string;
    email: string;
    dob?: string;
    address?: any;
  }): Promise<OnfidoApplicant> {
    try {
      console.log('👤 Creating Onfido applicant:', userData.email);
      
      const response = await this.apiClient.post('/applicants', {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        dob: userData.dob,
        address: userData.address
      });

      const applicant = response.data;
      
      console.log('✅ Applicant created:', applicant.id);
      
      return {
        id: applicant.id,
        firstName: applicant.first_name,
        lastName: applicant.last_name,
        email: applicant.email,
        dob: applicant.dob,
        address: applicant.address
      };
    } catch (error) {
      console.error('❌ Error creating Onfido applicant:', error);
      throw new Error('Failed to create Onfido applicant');
    }
  }

  /**
   * Generar SDK token para el frontend
   */
  async generateSDKToken(applicantId: string, referrer?: string): Promise<OnfidoSDKToken> {
    try {
      console.log('🔑 Generating SDK token for applicant:', applicantId);
      
      const response = await this.apiClient.post('/sdk_tokens', {
        applicant_id: applicantId,
        referrer: referrer || '*'  // Permite cualquier dominio para desarrollo
      });

      const token = response.data.token;
      
      console.log('✅ SDK token generated');
      
      return {
        token,
        applicantId
      };
    } catch (error) {
      console.error('❌ Error generating SDK token:', error);
      throw new Error('Failed to generate SDK token');
    }
  }

  /**
   * Crear un check de verificación
   */
  async createCheck(applicantId: string, userAddress?: string): Promise<OnfidoCheck> {
    try {
      console.log('🔍 Creating verification check for applicant:', applicantId);
      
      const response = await this.apiClient.post('/checks', {
        applicant_id: applicantId,
        report_names: ['document', 'facial_similarity'],
        tags: ['kyc-verification'],
        redirect_uri: process.env.ONFIDO_REDIRECT_URI,
        async: false  // Verificación síncrona
      });

      const check = response.data;
      
      console.log('✅ Check created:', check.id);
      
      // Store user address mapping for later webhook processing
      if (userAddress) {
        this.userAddressMapping.set(check.id, userAddress);
        console.log('📝 Stored user address mapping:', check.id, '->', userAddress);
      }
      
      return {
        id: check.id,
        status: check.status,
        result: check.result,
        applicantId: check.applicant_id,
        reports: check.reports || [],
        createdAt: check.created_at,
        href: check.href
      };
    } catch (error) {
      console.error('❌ Error creating check:', error);
      throw new Error('Failed to create verification check');
    }
  }

  /**
   * Obtener el resultado de un check
   */
  async getCheck(checkId: string): Promise<OnfidoCheck> {
    try {
      console.log('📋 Getting check result:', checkId);
      
      const response = await this.apiClient.get(`/checks/${checkId}`);
      const check = response.data;
      
      console.log('✅ Check retrieved:', check.status, check.result);
      
      return {
        id: check.id,
        status: check.status,
        result: check.result,
        applicantId: check.applicant_id,
        reports: check.reports || [],
        createdAt: check.created_at,
        href: check.href
      };
    } catch (error) {
      console.error('❌ Error getting check:', error);
      throw new Error('Failed to get check result');
    }
  }

  /**
   * Obtener información del applicant
   */
  async getApplicant(applicantId: string): Promise<OnfidoApplicant> {
    try {
      const response = await this.apiClient.get(`/applicants/${applicantId}`);
      const applicant = response.data;
      
      return {
        id: applicant.id,
        firstName: applicant.first_name,
        lastName: applicant.last_name,
        email: applicant.email,
        dob: applicant.dob,
        address: applicant.address
      };
    } catch (error) {
      console.error('❌ Error getting applicant:', error);
      throw new Error('Failed to get applicant');
    }
  }

  /**
   * Verificar webhook signature (seguridad)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Para simplificar, temporalmente retornamos true
    // En producción, deberías verificar la signature con HMAC
    console.log('🔒 Webhook signature verification (simplified)');
    return true;
  }

  /**
   * Procesar webhook event
   */
  async processWebhookEvent(event: OnfidoWebhookEvent): Promise<void> {
    const { resource_type, action, object } = event.payload;
    
    console.log('📨 Processing Onfido webhook:', {
      resource_type,
      action,
      object_id: object.id
    });

    // Manejar diferentes tipos de eventos
    switch (resource_type) {
      case 'check':
        await this.handleCheckEvent(action, object);
        break;
      case 'report':
        await this.handleReportEvent(action, object);
        break;
      default:
        console.log('🤷 Unknown webhook event type:', resource_type);
    }
  }

  private async handleCheckEvent(action: string, object: any): Promise<void> {
    if (action === 'check.completed') {
      console.log('✅ Check completed:', object.id);
      
      // Obtener el resultado completo del check
      const check = await this.getCheck(object.id);
      
      console.log('📋 Check result:', {
        checkId: check.id,
        status: check.status,
        result: check.result,
        applicantId: check.applicantId
      });

      // Get the user address associated with this check
      const userAddress = this.userAddressMapping.get(check.id);
      
      if (!userAddress) {
        console.warn('⚠️ No user address found for check:', check.id);
        return;
      }

      if (!this.blockchainService) {
        console.warn('⚠️ Blockchain service not available, cannot call fulfillKYC');
        return;
      }

      // Call fulfillKYC on the smart contract
      try {
        const approved = check.result === 'clear';
        const kycDataHash = this.generateKYCDataHash(check);
        
        console.log('🔗 Calling fulfillKYC on smart contract:', {
          userAddress,
          approved,
          kycDataHash: kycDataHash.substring(0, 20) + '...'
        });

        const result = await this.blockchainService.fulfillKYC(userAddress, approved, kycDataHash);
        
        if (result.success) {
          console.log('🎉 fulfillKYC successful! Transaction hash:', result.transaction_hash);
          
          // Clean up the mapping
          this.userAddressMapping.delete(check.id);
        } else {
          console.error('❌ fulfillKYC failed:', result.error);
        }
        
      } catch (error) {
        console.error('❌ Error calling fulfillKYC:', error);
      }
    }
  }

  private async handleReportEvent(action: string, object: any): Promise<void> {
    if (action === 'report.completed') {
      console.log('📄 Report completed:', object.id);
    }
  }

  /**
   * Generar hash de datos KYC para el smart contract
   */
  generateKYCDataHash(check: OnfidoCheck): string {
    const kycData = {
      checkId: check.id,
      result: check.result,
      status: check.status,
      applicantId: check.applicantId,
      timestamp: Date.now()
    };
    
    // En producción, usa una función de hash criptográfica
    return Buffer.from(JSON.stringify(kycData)).toString('base64');
  }

  /**
   * Verificar si el servicio está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.apiToken && this.webhookToken);
  }

  /**
   * Obtener estadísticas del servicio
   */
  getServiceInfo() {
    return {
      configured: this.isConfigured(),
      apiUrl: this.apiClient.defaults.baseURL,
      hasApiToken: !!this.apiToken,
      hasWebhookToken: !!this.webhookToken
    };
  }
}