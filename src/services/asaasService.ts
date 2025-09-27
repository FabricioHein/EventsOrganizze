// Asaas API Integration Service
const ASAAS_API_URL = 'https://www.asaas.com/api/v3';
const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY;

export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  description: string;
  endDate?: string;
  maxPayments?: number;
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description: string;
  status?: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyAndPaste?: string;
}

class AsaasService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = ASAAS_API_KEY || '';
    this.baseURL = ASAAS_API_URL;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Customer Management
  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    return this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.makeRequest(`/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, customerData: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    return this.makeRequest(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  // Subscription Management
  async createSubscription(subscriptionData: AsaasSubscription): Promise<AsaasSubscription> {
    return this.makeRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.makeRequest(`/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, subscriptionData: Partial<AsaasSubscription>): Promise<AsaasSubscription> {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  // Payment Management
  async createPayment(paymentData: AsaasPayment): Promise<AsaasPayment> {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.makeRequest(`/payments/${paymentId}`);
  }

  async getPaymentsByCustomer(customerId: string): Promise<{ data: AsaasPayment[] }> {
    return this.makeRequest(`/payments?customer=${customerId}`);
  }

  // Webhook validation
  validateWebhook(payload: string, signature: string): boolean {
    // Implement webhook signature validation according to Asaas documentation
    // This is a simplified version - implement proper HMAC validation
    return true;
  }

  // Plan helpers
  getPlanConfig(planId: string) {
    const plans = {
      basic: {
        name: 'Plano Básico',
        value: 99.00,
        description: 'Plano Básico - Recursos essenciais para seu negócio',
        features: [
          'Gestão completa de clientes',
          'Controle de eventos',
          'Propostas personalizadas',
          'Relatórios básicos',
          'Suporte por email'
        ]
      },
      professional: {
        name: 'Plano Profissional',
        value: 149.00,
        description: 'Plano Profissional - Recursos avançados para crescer',
        features: [
          'Tudo do plano básico',
          'Relatórios avançados',
          'Automações inteligentes',
          'Integrações externas',
          'Suporte prioritário',
          'API personalizada'
        ]
      }
    };

    return plans[planId as keyof typeof plans];
  }
}

export const asaasService = new AsaasService();
export default asaasService;