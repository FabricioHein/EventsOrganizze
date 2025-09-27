import React from 'react';
import { Clock, Crown, Zap } from 'lucide-react';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import Button from './Button';

const TrialExpiringBanner: React.FC = () => {
  const { isTrialExpiring, daysRemaining, planName } = usePlanLimits();

  if (!isTrialExpiring) return null;

  const handleUpgrade = () => {
    window.location.href = '/subscription';
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white/20 p-2 rounded-full mr-4">
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              ⏰ Seu teste grátis expira em {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}!
            </h3>
            <p className="text-white/90 text-sm">
              Faça upgrade agora para continuar usando todos os recursos sem interrupção.
            </p>
          </div>
        </div>
        <Button
          onClick={handleUpgrade}
          className="bg-white text-orange-600 hover:bg-gray-100 font-bold px-6 py-3 shadow-lg"
        >
          <Crown size={20} className="mr-2" />
          Fazer Upgrade 🚀
        </Button>
      </div>
    </div>
  );
};

export default TrialExpiringBanner;