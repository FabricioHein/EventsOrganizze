import React from 'react';
import { Crown, Lock, Zap } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface PremiumFeatureToastProps {
  featureName: string;
  requiredPlan: 'Profissional' | 'Premium';
  onUpgrade?: () => void;
}

export const usePremiumFeatureToast = () => {
  const { showToast } = useToast();

  const showPremiumToast = (featureName: string, requiredPlan: 'Profissional' | 'Premium' = 'Profissional') => {
    showToast({
      type: 'warning',
      title: `🔒 Recurso ${requiredPlan}`,
      message: `${featureName} faz parte do Plano ${requiredPlan}. Clique aqui para desbloquear 🚀`,
      duration: 8000
    });
  };

  const showLimitReachedToast = (featureName: string, limit: number) => {
    showToast({
      type: 'warning',
      title: `📊 Limite Atingido`,
      message: `Você atingiu o limite de ${limit} ${featureName} do plano gratuito. Faça upgrade para continuar! 🚀`,
      duration: 8000
    });
  };

  return { showPremiumToast, showLimitReachedToast };
};

export default PremiumFeatureToastProps;