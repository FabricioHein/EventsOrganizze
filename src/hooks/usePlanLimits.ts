import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlanLimits } from '../types';
import { differenceInDays } from 'date-fns';

export const usePlanLimits = (): PlanLimits & { 
  planName: string; 
  planPrice: string;
  isTrialExpiring: boolean;
  daysRemaining: number;
  maxProposals: number;
  maxSuppliers: number;
  maxReports: number;
} => {
  const { subscription, user } = useAuth();

  return useMemo(() => {
    const plan = subscription?.plan || 'free';
    const isExpired = subscription && new Date() > new Date(subscription.endDate);
    const daysRemaining = subscription ? Math.max(0, differenceInDays(new Date(subscription.endDate), new Date())) : 0;
    const isTrialExpiring = plan === 'free' && daysRemaining <= 3;
    
    // If subscription is expired, treat as free plan
    const effectivePlan = isExpired ? 'free' : plan;
    
    const planConfigs = {
      free: {
        hasFinancialControl: false,
        hasProposals: false,
        hasSuppliers: false,
        hasReports: false,
        hasAdvancedSettings: false,
        hasAdvancedFeatures: false,
        hasGuestManagement: false,
        maxProposals: 2,
        maxSuppliers: 3,
        maxReports: 1,
        planName: 'Plano Grátis',
        planPrice: isExpired ? 'Expirado' : `${daysRemaining} dias restantes`,
        isTrialExpiring,
        daysRemaining
      },
      basic: {
        hasFinancialControl: true,
        hasProposals: true,
        hasSuppliers: true,
        hasReports: true,
        hasAdvancedSettings: true,
        hasAdvancedFeatures: false,
        hasGuestManagement: true,
        maxProposals: 50,
        maxSuppliers: 50,
        maxReports: 10,
        planName: 'Plano Profissional',
        planPrice: subscription?.cycle === 'yearly' ? 'R$ 990/ano' : 'R$ 99/mês',
        isTrialExpiring: false,
        daysRemaining: 0
      },
      professional: {
        hasFinancialControl: true,
        hasProposals: true,
        hasSuppliers: true,
        hasReports: true,
        hasAdvancedSettings: true,
        hasAdvancedFeatures: true,
        hasGuestManagement: true,
        maxProposals: 100,
        maxSuppliers: 100,
        maxReports: 50,
        planName: 'Plano Profissional',
        planPrice: subscription?.cycle === 'yearly' ? 'R$ 1490/ano' : 'R$ 149/mês',
        isTrialExpiring: false,
        daysRemaining: 0
      },
      premium: {
        hasFinancialControl: true,
        hasProposals: true,
        hasSuppliers: true,
        hasReports: true,
        hasAdvancedSettings: true,
        hasAdvancedFeatures: true,
        hasGuestManagement: true,
        maxProposals: -1, // Unlimited
        maxSuppliers: -1, // Unlimited
        maxReports: -1, // Unlimited
        planName: 'Plano Premium',
        planPrice: subscription?.cycle === 'yearly' ? 'R$ 1490/ano' : 'R$ 149/mês',
        isTrialExpiring: false,
        daysRemaining: 0
      }
    };

    return planConfigs[effectivePlan] || planConfigs.free;
  }, [subscription, user]);
};