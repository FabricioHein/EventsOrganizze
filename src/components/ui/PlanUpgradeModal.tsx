import React from 'react';
import { Crown, X, Check, Zap } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { useAuth } from '../../contexts/AuthContext';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan?: string;
}

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  requiredPlan = 'Profissional'
}) => {
  const { subscription } = useAuth();

  const plans = [
    {
      id: 'professional',
      name: 'Plano Profissional',
      price: 'R$ 99',
      period: '/mês',
      description: 'Ideal para pequenas empresas',
      features: [
        'Tudo do plano gratuito',
        'Controle financeiro completo',
        'Propostas personalizadas',
        'Gestão de fornecedores',
        'Relatórios avançados',
        'Suporte prioritário'
      ],
      highlight: true,
      color: 'purple'
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 'R$ 149',
      period: '/mês',
      description: 'Para empresas em crescimento',
      features: [
        'Tudo do plano anterior',
        'Recursos avançados',
        'Automações inteligentes',
        'Integrações externas',
        'API personalizada',
        'Suporte 24/7'
      ],
      highlight: false,
      color: 'blue'
    }
  ];

  const handleUpgrade = (planId: string) => {
    // Navigate to subscription page for plan selection
    window.location.href = '/subscription';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade de Plano" size="xl">
      <div className="space-y-6">
        {/* Current Plan Info */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <h3 className="font-medium text-orange-900">
                Este recurso está disponível apenas para o Plano {requiredPlan} ou Premium
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Seu plano atual: {subscription?.plan === 'free' ? 'Grátis' : subscription?.plan}
              </p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-300 ${
                plan.highlight 
                  ? 'border-purple-500 ring-2 ring-purple-100' 
                  : 'border-gray-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Recomendado
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                    plan.highlight ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <Crown className={`w-6 h-6 ${
                      plan.highlight ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Escolher {plan.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>💳 Pagamento seguro via Asaas • 🔒 Cancele quando quiser</p>
        </div>
      </div>
    </Modal>
  );
};

export default PlanUpgradeModal;