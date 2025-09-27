import React from 'react';
import { Crown, Clock, Zap, AlertTriangle } from 'lucide-react';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

const PlanStatusBanner: React.FC = () => {
  const { subscription } = useAuth();
  const { planName, daysRemaining, isTrialExpiring } = usePlanLimits();

  if (!subscription || subscription.plan !== 'free') return null;

  const handleUpgrade = () => {
    window.location.href = '/subscription';
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border mb-6 ${
      isTrialExpiring 
        ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' 
        : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-full mr-4 ${
            isTrialExpiring ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {isTrialExpiring ? (
              <AlertTriangle size={20} className="text-red-600" />
            ) : (
              <Clock size={20} className="text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center">
              <h3 className={`font-bold ${
                isTrialExpiring ? 'text-red-900' : 'text-blue-900'
              }`}>
                {planName} • {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}
              </h3>
              {isTrialExpiring && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  ⚠️ EXPIRANDO
                </span>
              )}
            </div>
            <p className={`text-sm ${
              isTrialExpiring ? 'text-red-700' : 'text-blue-700'
            }`}>
              {isTrialExpiring 
                ? 'Seu teste está expirando! Faça upgrade para continuar usando todos os recursos.'
                : 'Aproveite todos os recursos durante seu período de teste gratuito.'
              }
            </p>
          </div>
        </div>
        <Button
          onClick={handleUpgrade}
          className={`font-bold px-6 py-2 shadow-lg ${
            isTrialExpiring
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          }`}
        >
          <Crown size={16} className="mr-2" />
          {isTrialExpiring ? 'Upgrade Urgente! 🚨' : 'Fazer Upgrade 🚀'}
        </Button>
      </div>
    </div>
  );
};

export default PlanStatusBanner;