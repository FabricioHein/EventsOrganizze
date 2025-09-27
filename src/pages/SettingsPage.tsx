import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { cancelAsaasSubscription } from '../services/firebaseService';
import { 
  User, 
  CreditCard, 
  Shield, 
  Bell, 
  Crown, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SettingsPage: React.FC = () => {
  const { user, subscription, logout, refreshSubscription } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'account' | 'subscription' | 'security'>('account');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'account', label: 'Conta', icon: User },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'Sem plano', color: 'text-gray-500', icon: <XCircle size={16} /> };
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (subscription.plan === 'free') {
      return { 
        status: endDate > now ? 'Teste Gratuito Ativo' : 'Teste Expirado', 
        color: endDate > now ? 'text-blue-600' : 'text-red-600', 
        icon: endDate > now ? <CheckCircle size={16} /> : <XCircle size={16} />
      };
    }
    
    if (endDate > now && subscription.status === 'active') {
      return { status: 'Ativo', color: 'text-green-600', icon: <CheckCircle size={16} /> };
    }
    
    return { status: 'Expirado', color: 'text-red-600', icon: <XCircle size={16} /> };
  };

  const getPlanName = () => {
    if (!subscription) return 'Sem plano';
    
    const plans = {
      free: 'Plano Grátis',
      basic: 'Plano Profissional (R$ 99/mês)',
      professional: 'Plano Profissional (R$ 99/mês)',
      premium: 'Plano Premium (R$ 149/mês)'
    };
    
    return plans[subscription.plan] || subscription.plan;
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) return;
    
    setLoading(true);
    try {
      await cancelAsaasSubscription(subscription.id);
      await refreshSubscription();
      
      showToast({
        type: 'success',
        title: 'Assinatura cancelada com sucesso',
        message: 'Você continuará tendo acesso até o final do período atual.'
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      showToast({
        type: 'error',
        title: 'Erro ao cancelar assinatura',
        message: 'Não foi possível cancelar a assinatura. Tente novamente.'
      });
    } finally {
      setLoading(false);
      setShowCancelModal(false);
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <SettingsIcon size={32} className="text-purple-600 mr-4" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie sua conta e assinatura</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Informações da Conta</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={user?.displayName || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h3 className="font-medium text-gray-900">{user?.displayName}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="secondary" onClick={logout}>
                Sair da Conta
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Gerenciar Assinatura</h2>
            
            {/* Current Plan */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Plano Atual
                  </h3>
                  <p className="text-purple-700 font-medium">
                    {getPlanName()}
                  </p>
                  <div className={`flex items-center mt-2 ${subscriptionStatus.color}`}>
                    {subscriptionStatus.icon}
                    <span className="ml-2 text-sm font-medium">
                      {subscriptionStatus.status}
                    </span>
                  </div>
                </div>
                <Crown size={48} className="text-purple-600" />
              </div>
            </div>

            {/* Subscription Details */}
            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Calendar size={16} className="text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Data de Início</span>
                  </div>
                  <p className="text-gray-900">
                    {format(subscription.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Calendar size={16} className="text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {subscription.plan === 'free' ? 'Teste Expira em' : 'Próxima Cobrança'}
                    </span>
                  </div>
                  <p className="text-gray-900">
                    {format(subscription.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => window.open('/upgrade', '_blank')}>
                <Crown size={16} className="mr-2" />
                Fazer Upgrade
              </Button>
              
              {subscription?.plan !== 'free' && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                >
                  {loading ? 'Cancelando...' : 'Cancelar Assinatura'}
                </Button>
              )}
              
              <Button 
                variant="secondary" 
                onClick={refreshSubscription}
              >
                Atualizar Status
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-900">Login Seguro</h3>
                    <p className="text-sm text-green-700">
                      Sua conta está protegida com autenticação Google
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Dados Criptografados</h3>
                    <p className="text-sm text-blue-700">
                      Todos os seus dados são criptografados e seguros
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-purple-900">Backup Automático</h3>
                    <p className="text-sm text-purple-700">
                      Backup diário automático na nuvem
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar Assinatura"
      >
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="font-medium text-yellow-900">Atenção</h3>
              <p className="text-sm text-yellow-700">
                Sua assinatura será cancelada no próximo ciclo de cobrança. 
                Você continuará tendo acesso até {subscription && format(subscription.endDate, 'dd/MM/yyyy', { locale: ptBR })}.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Manter Assinatura
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;