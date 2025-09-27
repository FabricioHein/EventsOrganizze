import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getUserSubscription, createAsaasSubscription } from '../services/firebaseService';
import { UserSubscription } from '../types';
import { Check, Crown, Star, Zap, Users, CreditCard, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ToastContainer from '../components/ui/ToastContainer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SubscriptionPage: React.FC = () => {
  const { user, subscription: authSubscription, refreshSubscription } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'BOLETO'>('CREDIT_CARD');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    // Credit card data
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    // Holder info
    name: '',
    email: user?.email || '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    phone: '',
  });

  useEffect(() => {
    fetchSubscription();
  }, [user, authSubscription]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      // Use subscription from AuthContext if available
      if (authSubscription) {
        setSubscription(authSubscription);
      } else {
        const subscriptionData = await getUserSubscription(user.uid);
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar assinatura',
        message: 'Não foi possível carregar os dados da assinatura'
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Plano Grátis',
      price: 0,
      originalPrice: 0,
      icon: <Star className="w-8 h-8" />,
      color: 'gray',
      description: 'Para começar',
      features: [
        'Gestão básica de clientes',
        'Até 3 eventos ativos',
        'Controle de pagamentos básico',
        'Suporte por email',
      ],
      limitations: [
        'Sem gestão de convidados',
        'Sem relatórios avançados',
        'Sem propostas personalizadas'
      ]
    },
    {
      id: 'professional',
      name: 'Plano Profissional',
      price: 99,
      originalPrice: 99,
      yearlyPrice: 990,
      yearlyOriginalPrice: 1188,
      icon: <Crown className="w-8 h-8" />,
      color: 'purple',
      popular: true,
      description: 'Ideal para profissionais',
      features: [
        'Tudo do plano gratuito',
        'Eventos ilimitados',
        'Gestão completa de convidados - RSVP',
        'Propostas personalizadas',
        'Controle financeiro completo',
        'Relatórios básicos',
        'Calendário avançado',
        'Gestão de fornecedores',
        'Suporte prioritário',
      ],
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 149,
      originalPrice: 149,
      yearlyPrice: 1490,
      yearlyOriginalPrice: 1788,
      icon: <Users className="w-8 h-8" />,
      color: 'blue',
      description: 'Para empresas em crescimento',
      features: [
        'Tudo do plano profissional',
        'Envio em massa de convites',
        'Relatórios avançados e personalizados',
        'Automações inteligentes',
        'API personalizada',
        'Gestão de equipe',
        'Backup automático',
        'Suporte 24/7',
        'Treinamento personalizado',
      ],
    },
  ];

  const currentPlan = subscription?.plan || 'free';

  const getPlanColor = (color: string, type: 'bg' | 'text' | 'border') => {
    const colors = {
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    };
    return colors[color as keyof typeof colors]?.[type] || colors.gray[type];
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'Sem plano', color: 'text-gray-500', icon: <XCircle size={16} /> };
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (subscription.plan === 'free') {
      return { 
        status: 'Plano Grátis Ativo', 
        color: 'text-blue-600', 
        icon: <CheckCircle size={16} />
      };
    }
    
    if (endDate > now && subscription.status === 'active') {
      return { status: 'Ativo', color: 'text-green-600', icon: <CheckCircle size={16} /> };
    }
    
    return { status: 'Expirado', color: 'text-red-600', icon: <XCircle size={16} /> };
  };

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') {
      showToast({
        type: 'info',
        title: 'Plano Grátis',
        message: 'Você já tem acesso ao plano grátis'
      });
      return;
    }
    
    setSelectedPlan(planId);
    setShowPaymentForm(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !user) return;

    setPaymentLoading(true);
    try {
      const subscriptionData = {
        billingType: paymentMethod,
        ...(paymentMethod === 'CREDIT_CARD' && {
          creditCard: {
            holderName: paymentData.holderName,
            number: paymentData.number.replace(/\s/g, ''),
            expiryMonth: paymentData.expiryMonth,
            expiryYear: paymentData.expiryYear,
            ccv: paymentData.ccv,
          },
          creditCardHolderInfo: {
            name: paymentData.name,
            email: paymentData.email,
            cpfCnpj: paymentData.cpfCnpj.replace(/\D/g, ''),
            postalCode: paymentData.postalCode.replace(/\D/g, ''),
            addressNumber: paymentData.addressNumber,
            phone: paymentData.phone.replace(/\D/g, ''),
          }
        })
      };

      await createAsaasSubscription(user.uid, selectedPlan, selectedCycle, subscriptionData);
      
      showToast({
        type: 'success',
        title: 'Assinatura criada',
        message: 'Assinatura criada com sucesso! Aguarde a confirmação do pagamento.'
      });
      
      setShowPaymentForm(false);
      setSelectedPlan(null);
      await refreshSubscription();
      await fetchSubscription();
    } catch (error) {
      console.error('Error creating subscription:', error);
      showToast({
        type: 'error',
        title: 'Erro no pagamento',
        message: 'Não foi possível processar o pagamento. Tente novamente.'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatCreditCard = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const subscriptionStatus = getSubscriptionStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha seu Plano</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Selecione o plano ideal para o seu negócio e comece a organizar seus eventos de forma profissional
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className={`p-6 rounded-lg ${
          subscription.plan === 'free' 
            ? 'bg-gradient-to-r from-blue-600 to-blue-800' 
            : subscriptionStatus.color.includes('green')
              ? 'bg-gradient-to-r from-green-600 to-green-800'
              : 'bg-gradient-to-r from-red-600 to-red-800'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Plano Atual</h2>
              <p className="text-white/90 mb-1">
                <strong className="capitalize">
                  {subscription.plan === 'free' ? 'Plano Grátis' : 
                   subscription.plan === 'professional' ? 'Plano Profissional' :
                   subscription.plan === 'premium' ? 'Plano Premium' : subscription.plan}
                </strong>
              </p>
              <div className="flex items-center">
                {subscriptionStatus.icon}
                <span className="ml-2 text-sm">{subscriptionStatus.status}</span>
              </div>
              {subscription.plan !== 'free' && (
                <p className="text-white/80 text-sm mt-1">
                  {subscription.status === 'active' ? 'Próxima cobrança' : 'Expirou em'}: {format(subscription.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
            </div>
            <div className="text-right">
              <Crown size={48} className="text-white/80" />
            </div>
          </div>
        </div>
      )}

      {/* Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setSelectedCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">
              2 meses grátis
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const displayPrice = selectedCycle === 'yearly' ? plan.yearlyPrice : plan.price;
          const originalPrice = selectedCycle === 'yearly' ? plan.yearlyOriginalPrice : plan.originalPrice;
          const savings = originalPrice && displayPrice ? originalPrice - displayPrice : 0;
          
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-purple-500 scale-105 ring-4 ring-purple-100' 
                  : 'border-gray-200 hover:border-purple-300'
              } ${isCurrentPlan ? 'ring-4 ring-green-200 border-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Mais Popular
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ✅ Plano Atual
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getPlanColor(plan.color, 'bg')} ${getPlanColor(plan.color, 'text')}`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-gray-900">Grátis</span>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center">
                          <span className="text-4xl font-bold text-gray-900">
                            R$ {displayPrice}
                          </span>
                          <span className="text-gray-600 ml-1">
                            /{selectedCycle === 'monthly' ? 'mês' : 'ano'}
                          </span>
                        </div>
                        {selectedCycle === 'yearly' && savings > 0 && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-500 line-through">
                              R$ {originalPrice}
                            </span>
                            <span className="ml-2 text-sm text-green-600 font-medium">
                              Economize R$ {savings}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                  
                  {plan.limitations && (
                    <>
                      <li className="border-t pt-4 mt-4">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Limitações
                        </span>
                      </li>
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-start">
                          <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </>
                  )}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 text-lg font-semibold ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white'
                        : plan.id === 'free'
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isCurrentPlan ? 'Plano Atual' : plan.price === 0 ? 'Plano Atual' : 'Assinar Agora'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentForm}
        onClose={() => {
          setShowPaymentForm(false);
          setSelectedPlan(null);
        }}
        title={`Assinar ${plans.find(p => p.id === selectedPlan)?.name}`}
        size="lg"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-900">
                {plans.find(p => p.id === selectedPlan)?.name} - {selectedCycle === 'monthly' ? 'Mensal' : 'Anual'}
              </span>
              <span className="text-2xl font-bold text-purple-900">
                R$ {selectedCycle === 'yearly' 
                  ? plans.find(p => p.id === selectedPlan)?.yearlyPrice 
                  : plans.find(p => p.id === selectedPlan)?.price}
                /{selectedCycle === 'monthly' ? 'mês' : 'ano'}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'CREDIT_CARD' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="CREDIT_CARD"
                  checked={paymentMethod === 'CREDIT_CARD'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="sr-only"
                />
                <CreditCard className="w-6 h-6 mr-3 text-purple-600" />
                <div>
                  <div className="font-medium">Cartão de Crédito</div>
                  <div className="text-sm text-gray-500">Ativação imediata</div>
                </div>
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.name}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={paymentData.email}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.cpfCnpj}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, cpfCnpj: formatCPF(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={paymentData.phone}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP *
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.postalCode}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, postalCode: formatCEP(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="00000-000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.addressNumber}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, addressNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Credit Card Information */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Cartão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome no Cartão *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.holderName}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, holderName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Cartão *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.number}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, number: formatCreditCard(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês *
                  </label>
                  <select
                    required
                    value={paymentData.expiryMonth}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Mês</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano *
                  </label>
                  <select
                    required
                    value={paymentData.expiryYear}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, expiryYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Ano</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.ccv}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, ccv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="000"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPaymentForm(false);
                setSelectedPlan(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={paymentLoading}
              className={paymentLoading ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {paymentLoading ? 'Processando...' : `Confirmar Pagamento - R$ ${
                selectedCycle === 'yearly' 
                  ? plans.find(p => p.id === selectedPlan)?.yearlyPrice 
                  : plans.find(p => p.id === selectedPlan)?.price
              }`}
            </Button>
          </div>
        </form>
      </Modal>

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
              O plano gratuito permite gerenciar até 3 eventos com funcionalidades básicas, sem limite de tempo.
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