export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'master' | 'normal';
  createdAt?: Date;
  lastLogin?: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'master' | 'normal';
  createdAt: Date;
  lastLogin: Date;
  isActive?: boolean;
  subscription?: UserSubscription;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  trialUsers: number;
  newUsersLast7Days: number;
  totalRevenue: number;
}

export interface Guest {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  phone: string;
  email?: string;
  adults: number;
  children: number;
  totalGuests: number;
  status: 'pending' | 'sent' | 'confirmed' | 'declined';
  sentAt?: Date;
  confirmedAt?: Date;
  notes?: string;
  inviteHistory: GuestInviteHistory[];
  createdAt: Date;
  userId: string;
}

export interface GuestInviteHistory {
  id: string;
  method: 'whatsapp' | 'email';
  message: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface GuestImportData {
  name: string;
  phone: string;
  email?: string;
  adults: number;
  children: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  photoURL?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  notes?: string;
  createdAt: Date;
  userId: string;
}

export interface Event {
  id: string;
  name: string;
  type: 'wedding' | 'debutante' | 'birthday' | 'graduation' | 'other';
  date: Date;
  location: string;
  clientId: string;
  clientName: string;
  status: 'planning' | 'confirmed' | 'completed' | 'canceled';
  contractTotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  finalTotal?: number;
  guestCount?: number;
  details?: string;
  createdAt: Date;
  userId: string;
  contractUrl?: string;
  contractFileName?: string;
}

export interface Payment {
  id: string;
  eventId: string;
  eventName: string;
  productId?: string;
  productName?: string;
  amount: number;
  paymentDate: Date;
  method: 'pix' | 'card' | 'boleto' | 'cash';
  notes?: string;
  received: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroup?: string; // UUID to group related installments
  createdAt: Date;
  userId: string;
}

export interface FinancialSummary {
  totalReceivedMonth: number;
  totalPending: number;
  upcomingEvents: Event[];
  upcomingPayments: Payment[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  service: string;
  notes?: string;
  createdAt: Date;
  userId: string;
}

export interface EventSupplier {
  id: string;
  eventId: string;
  supplierId: string;
  supplierName: string;
  service: string;
  cost?: number;
  notes?: string;
  createdAt: Date;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface EventTimeline {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  date: Date;
  time: string;
  type: 'task' | 'meeting' | 'deadline' | 'milestone';
  completed: boolean;
  createdAt: Date;
}

export interface Proposal {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  items: ProposalItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  validUntil: Date;
  createdAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  viewCount: number;
  userId: string;
}

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: 'free' | 'basic' | 'professional' | 'premium';
  status: 'active' | 'canceled' | 'expired';
  cycle: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  paymentId?: string;
  createdAt: Date;
}

export interface AsaasWebhookEvent {
  event: 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED' | 'PAYMENT_RESTORED' | 'PAYMENT_REFUNDED' | 'PAYMENT_RECEIVED_IN_CASH_UNDONE' | 'PAYMENT_CHARGEBACK_REQUESTED' | 'PAYMENT_CHARGEBACK_DISPUTE' | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL' | 'PAYMENT_DUNNING_RECEIVED' | 'PAYMENT_DUNNING_REQUESTED' | 'PAYMENT_BANK_SLIP_VIEWED' | 'PAYMENT_CHECKOUT_VIEWED';
  payment: {
    object: string;
    id: string;
    dateCreated: string;
    customer: string;
    subscription?: string;
    installment?: string;
    paymentLink?: string;
    value: number;
    netValue: number;
    originalValue?: number;
    interestValue?: number;
    description: string;
    billingType: string;
    status: string;
    pixTransaction?: string;
    confirmedDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    installmentNumber?: number;
    invoiceUrl: string;
    invoiceNumber: string;
    externalReference?: string;
    dueDate: string;
    originalDueDate: string;
    paymentUrl?: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    deleted: boolean;
    anticipated: boolean;
    anticipable: boolean;
  };
}

export interface PlanLimits {
  hasFinancialControl: boolean;
  hasProposals: boolean;
  hasSuppliers: boolean;
  hasReports: boolean;
  hasAdvancedSettings: boolean;
  hasAdvancedFeatures: boolean;
  hasGuestManagement: boolean
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  createdAt: Date;
  userId: string;
}

export interface EventProduct {
  id: string;
  eventId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  createdAt: Date;
}