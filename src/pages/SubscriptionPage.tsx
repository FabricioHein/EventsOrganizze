import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSubscription } from '../services/firebaseService';
import { UserSubscription, PlanLimits } from '../types';
import { Check, Crown, Star, Zap, Users } from 'lucide-react';
import Button from '../components/ui/Button';

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const subscriptionData = await getUserSubscription(user.uid);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      icon: <Star className="w-8 h-8" />,
      color: 'gray',
      limits: {
        maxActiveEvents: 1,
        hasFinancialReports: false,
        hasTeamFeatures: false,
        hasExportFeatures: false,
        hasProposalTracking: false,
      },
      features: [
        '1 evento ativo',
        'Gestão básica de clientes',
        'Controle de pagamentos',
        'Suporte por email',
      ],
    },
    {
      id: 'basic',
      name: 'Básico',
      price: 49,
      icon: <Zap className="w-8 h-8" />,
      color: 'blue',
      limits: {
        maxActiveEvents: 5,
        hasFinancialReports: false,
        hasTeamFeatures: false,
        hasExportFeatures: false,
        hasProposalTracking: true,
      },
      features: [
        'Até 5 eventos ativos',
        'Gestão completa de clientes',
        'Controle de pagamentos',
        'Cadastro de fornecedores',
        'Propostas personalizadas',
        'Suporte prioritário',
      ],
    },
    {
      id: 'professional',
      name: 'Profissional',
      price: 99,
      icon: <Crown className="w-8 h-8" />,
      color: 'purple',
      popular: true,
      limits: {
        maxActiveEvents: 20,
        hasFinancialReports: true,
        hasTeamFeatures: false,
        hasExportFeatures: true,
        hasProposalTracking: true,
      },
      features: [
        'Até 20 eventos ativos',
        'Relatórios financeiros',
        'Cronograma e checklists',
        'Upload de contratos',
        'Calendário avançado',
        'Exportação de relatórios',
        'Integração WhatsApp/Email',
        'Suporte prioritário',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 199,
      icon: <Users className="w-8 h-8" />,
      color: 'gold',
      limits: {
        maxActiveEvents: -1, // unlimited
        hasFinancialReports: true,
        hasTeamFeatures: true,
        hasExportFeatures: true,
        hasProposalTracking: true,
      },
      features: [
        'Eventos ilimitados',
        'Gestão de equipe',
        'Relatórios avançados',
        'API personalizada',
        'Backup automático',
        'Suporte 24/7',
        'Treinamento personalizado',
        'Gerente de conta dedicado',
      ],
    },
  ];

  const currentPlan = subscription?.plan || 'free';

  const getPlanColor = (color: string, type: 'bg' | 'text' | 'border') => {
    const colors = {
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      gold: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
    };
    return colors[color as keyof typeof colors]?.[type] || colors.gray[type];
  };

  const handleSubscribe = (planId: string) => {
    // Here you would integrate with Asaas payment gateway
    alert(`Redirecionando para pagamento do plano ${planId}... (Integração com Asaas será implementada)`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha seu Plano</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Selecione o plano ideal para o seu negócio e comece a organizar seus eventos de forma profissional
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Plano Atual</h2>
              <p className="text-purple-100">
                Você está no plano <strong className="capitalize">{subscription.plan}</strong>
              </p>
              <p className="text-purple-100 text-sm">
                Válido até: {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
              plan.popular ? 'border-purple-500 scale-105' : 'border-gray-200'
            } ${currentPlan === plan.id ? 'ring-4 ring-purple-200' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </span>
              </div>
            )}

            <div className="p-6">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getPlanColor(plan.color, 'bg')} ${getPlanColor(plan.color, 'text')}`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-center">
                  <span className="text-4xl font-bold text-gray-900">R$ {plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500">/mês</span>}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <div className="text-center">
                {currentPlan === plan.id ? (
                  <Button
                    className="w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                    disabled
                  >
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900'
                        : ''
                    }`}
                    variant={plan.popular ? 'primary' : 'secondary'}
                  >
                    {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Perguntas Frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Posso cancelar a qualquer momento?</h3>
            <p className="text-gray-600 text-sm">
              Sim, você pode cancelar sua assinatura a qualquer momento. Não há multas ou taxas de cancelamento.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Como funciona o período gratuito?</h3>
            <p className="text-gray-600 text-sm">
              O plano gratuito permite gerenciar 1 evento ativo com funcionalidades básicas, sem limite de tempo.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Posso fazer upgrade do meu plano?</h3>
            <p className="text-gray-600 text-sm">
              Sim, você pode fazer upgrade a qualquer momento. O valor será proporcional ao período restante.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Os dados ficam seguros?</h3>
            <p className="text-gray-600 text-sm">
              Sim, utilizamos criptografia de ponta e backup automático para garantir a segurança dos seus dados.
            </p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Precisa de ajuda para escolher?</h2>
        <p className="text-gray-600 mb-4">
          Nossa equipe está pronta para ajudar você a encontrar o plano ideal para seu negócio.
        </p>
        <Button variant="secondary">
          Falar com Especialista
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPage;