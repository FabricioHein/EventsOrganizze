import React from 'react';
import { AlertTriangle, Crown, TrendingUp, Zap } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  currentCount: number;
  limit: number;
  requiredPlan: 'Profissional' | 'Premium';
}

const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  isOpen,
  onClose,
  featureName,
  currentCount,
  limit,
  requiredPlan
}) => {
  const handleUpgrade = () => {
    window.location.href = '/subscription';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Limite Atingido" size="lg">
      <div className="space-y-6">
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertTriangle size={32} className="text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-orange-900 mb-2">
            Limite do Plano Gratuito Atingido
          </h2>
          <p className="text-orange-700">
            Você atingiu o limite de <strong>{limit} {featureName}</strong> do plano gratuito.
          </p>
          <div className="mt-4 bg-white/50 p-3 rounded-lg">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-800">{currentCount}</div>
                <div className="text-xs text-orange-600">Atual</div>
              </div>
              <div className="text-orange-400">/</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-800">{limit}</div>
                <div className="text-xs text-orange-600">Limite</div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
          <h3 className="font-bold text-purple-900 mb-4 flex items-center">
            <Crown size={20} className="mr-2" />
            Com o Plano {requiredPlan}:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-purple-700">
              <TrendingUp size={16} className="text-purple-600 mr-2" />
              <span className="text-sm">
                {featureName} ilimitado{requiredPlan === 'Premium' ? 's' : 's'}
              </span>
            </div>
            <div className="flex items-center text-purple-700">
              <Zap size={16} className="text-purple-600 mr-2" />
              <span className="text-sm">Recursos avançados</span>
            </div>
            <div className="flex items-center text-purple-700">
              <Crown size={16} className="text-purple-600 mr-2" />
              <span className="text-sm">Suporte prioritário</span>
            </div>
            <div className="flex items-center text-purple-700">
              <TrendingUp size={16} className="text-purple-600 mr-2" />
              <span className="text-sm">Relatórios avançados</span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              R$ {requiredPlan === 'Premium' ? '149' : '99'}
              <span className="text-lg text-gray-600">/mês</span>
            </div>
            <p className="text-sm text-gray-600">
              ou R$ {requiredPlan === 'Premium' ? '1.490' : '990'}/ano (2 meses grátis)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Continuar no Gratuito
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold px-8 py-3"
          >
            <Crown size={20} className="mr-2" />
            Fazer Upgrade Agora 🚀
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LimitReachedModal;