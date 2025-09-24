export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  createdAt: Date;
}

export interface PlanLimits {
  maxActiveEvents: number;
  hasFinancialReports: boolean;
  hasTeamFeatures: boolean;
  hasExportFeatures: boolean;
  hasProposalTracking: boolean;
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