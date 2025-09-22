const ASAAS_API_URL = import.meta.env.VITE_ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY;

interface AsaasCustomer {
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

interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
}

interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
}

interface AsaasInstallment {
  installmentCount: number;
  installmentValue: number;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  dueDate: string;
  description?: string;
  externalReference?: string;
}

class AsaasService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${ASAAS_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
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
  async createCustomer(customer: AsaasCustomer) {
    return this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async getCustomer(customerId: string) {
    return this.makeRequest(`/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, customer: Partial<AsaasCustomer>) {
    return this.makeRequest(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  // Subscription Management
  async createSubscription(subscription: AsaasSubscription) {
    return this.makeRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }

  async getSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`);
  }

  async getSubscriptions(customerId?: string) {
    const params = customerId ? `?customer=${customerId}` : '';
    return this.makeRequest(`/subscriptions${params}`);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  // Payment Management
  async createPayment(payment: AsaasPayment) {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async createInstallments(installment: AsaasInstallment) {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(installment),
    });
  }

  async getPayment(paymentId: string) {
    return this.makeRequest(`/payments/${paymentId}`);
  }

  async getPayments(customerId?: string) {
    const params = customerId ? `?customer=${customerId}` : '';
    return this.makeRequest(`/payments${params}`);
  }

  async cancelPayment(paymentId: string) {
    return this.makeRequest(`/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  // PIX QR Code
  async getPixQrCode(paymentId: string) {
    return this.makeRequest(`/payments/${paymentId}/pixQrCode`);
  }

  // Webhook Management
  async createWebhook(url: string, events: string[]) {
    return this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url,
        events,
        enabled: true,
      }),
    });
  }
}

export const asaasService = new AsaasService();
export type { AsaasCustomer, AsaasSubscription, AsaasPayment, AsaasInstallment };