import React from 'react';
import { Crown, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  currentPlan: string;
}

const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  isOpen,
  onClose,
  message,
  currentPlan,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/subscription');
    onClose();
  };

  const plans = [
    { id: 'basic', name: 'Básico', price: 49, events: 5 },
    { id: 'professional', name: 'Profissional', price: 99, events: 20 },
    { id: 'premium', name: 'Premium', price: 199, events: 'Ilimitados' },
  ];

  const suggestedPlans = plans.filter(plan => plan.id !== currentPlan);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Limite de Eventos Atingido">
      <div className="space-y-6">
        {/* Warning Message */}
        <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-orange-800">Limite Atingido</h3>
            <p className="text-sm text-orange-700 mt-1">{message}</p>
          </div>
        </div>

        {/* Upgrade Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Crown className="w-5 h-5 text-yellow-500 mr-2" />
            Faça Upgrade e Desbloqueie Mais Recursos
          </h3>
          
          <div className="space-y-3">
            {suggestedPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{plan.name}</h4>
                  <p className="text-sm text-gray-600">
                    Até {plan.events} eventos ativos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    R$ {plan.price}/mês
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Benefícios do Upgrade:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Mais eventos ativos</li>
            <li>• Relatórios financeiros avançados</li>
            <li>• Gestão de fornecedores</li>
            <li>• Propostas personalizadas</li>
            <li>• Suporte prioritário</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Continuar no Plano Atual
          </Button>
          <Button onClick={handleUpgrade} className="flex-1">
            Ver Planos
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PlanLimitModal;