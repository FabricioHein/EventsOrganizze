import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSubscription } from '../services/firebaseService';
import { UserSubscription, PlanLimits } from '../types';

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxActiveEvents: 1,
    hasFinancialReports: false,
    hasTeamFeatures: false,
    hasExportFeatures: false,
    hasProposalTracking: false,
  },
  basic: {
    maxActiveEvents: 5,
    hasFinancialReports: false,
    hasTeamFeatures: false,
    hasExportFeatures: false,
    hasProposalTracking: true,
  },
  professional: {
    maxActiveEvents: 20,
    hasFinancialReports: true,
    hasTeamFeatures: false,
    hasExportFeatures: true,
    hasProposalTracking: true,
  },
  premium: {
    maxActiveEvents: -1, // unlimited
    hasFinancialReports: true,
    hasTeamFeatures: true,
    hasExportFeatures: true,
    hasProposalTracking: true,
  },
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const subscriptionData = await getUserSubscription(user.uid);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = subscription?.plan || 'free';
  const planLimits = PLAN_LIMITS[currentPlan];
  const isActive = subscription?.status === 'active';

  const canCreateEvent = (currentActiveEvents: number): boolean => {
    if (!isActive && currentPlan !== 'free') {
      return false;
    }
    
    if (planLimits.maxActiveEvents === -1) {
      return true; // unlimited
    }
    
    return currentActiveEvents < planLimits.maxActiveEvents;
  };

  const getEventLimitMessage = (currentActiveEvents: number): string => {
    if (!isActive && currentPlan !== 'free') {
      return 'Sua assinatura está inativa. Renove para continuar criando eventos.';
    }

    if (planLimits.maxActiveEvents === -1) {
      return '';
    }

    const remaining = planLimits.maxActiveEvents - currentActiveEvents;
    
    if (remaining <= 0) {
      return `Você atingiu o limite de ${planLimits.maxActiveEvents} eventos ativos do plano ${currentPlan.toUpperCase()}. Faça upgrade para criar mais eventos.`;
    }

    if (remaining <= 2) {
      return `Você pode criar apenas mais ${remaining} evento(s) no plano ${currentPlan.toUpperCase()}.`;
    }

    return '';
  };

  return {
    subscription,
    currentPlan,
    planLimits,
    isActive,
    loading,
    canCreateEvent,
    getEventLimitMessage,
    refetch: fetchSubscription,
  };
};