export const APP_NAME = 'EventFinance';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  EVENTS: '/events',
  PAYMENTS: '/payments',
  CALENDAR: '/calendar',
  REPORTS: '/reports',
  SUPPLIERS: '/suppliers',
  PROPOSALS: '/proposals',
  SUBSCRIPTION: '/subscription',
} as const;

export const EVENT_TYPES = {
  WEDDING: 'wedding',
  DEBUTANTE: 'debutante',
  BIRTHDAY: 'birthday',
  GRADUATION: 'graduation',
  OTHER: 'other',
} as const;

export const EVENT_STATUS = {
  PLANNING: 'planning',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
} as const;

export const PAYMENT_METHODS = {
  PIX: 'pix',
  CARD: 'card',
  BOLETO: 'boleto',
  CASH: 'cash',
} as const;

export const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  PREMIUM: 'premium',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const TIMELINE_TYPES = {
  TASK: 'task',
  MEETING: 'meeting',
  DEADLINE: 'deadline',
  MILESTONE: 'milestone',
} as const;

export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 10,
  INITIAL_PAGE: 1,
} as const;

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd \'de\' MMMM \'de\' yyyy',
  WITH_TIME: 'dd/MM/yyyy HH:mm',
} as const;

export const CURRENCY = {
  SYMBOL: 'R$',
  CODE: 'BRL',
  LOCALE: 'pt-BR',
} as const;

export const STORAGE_KEYS = {
  THEME: 'eventfinance_theme',
  LANGUAGE: 'eventfinance_language',
  USER_PREFERENCES: 'eventfinance_user_preferences',
} as const;