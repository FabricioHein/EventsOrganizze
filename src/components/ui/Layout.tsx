import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
  Truck,
  FileText,
  Crown,
  Package,
  Shield,
  Settings,
  Lock,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import PlanUpgradeModal from './PlanUpgradeModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin, subscription } = useAuth();
  const planLimits = usePlanLimits();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [blockedFeature, setBlockedFeature] = React.useState<string>('');

  // Different navigation for admin vs normal users
  const navigation = isAdmin ? [
    { name: 'Administração', href: '/admin', icon: Shield },
  ] : [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: BarChart3 },
       ...(planLimits.hasReports ? [
      { name: t('navigation.reports'), href: '/reports', icon: BarChart3 }     

    ] : []),
    { name: t('navigation.clients'), href: '/clients', icon: Users },
    { name: t('navigation.events'), href: '/events', icon: Calendar },
    { name: t('navigation.calendar'), href: '/calendar', icon: CalendarIcon },
    // Conditional menu items based on plan
    ...(planLimits.hasGuestManagement ? [
      { name: t('navigation.guests'), href: '/guests', icon: UserPlus },
    ] : []),
    ...(planLimits.hasFinancialControl ? [
      { name: t('navigation.payments'), href: '/payments', icon: DollarSign },
    ] : []),
    ...(planLimits.hasProposals ? [
      { name: t('navigation.proposals'), href: '/proposals', icon: FileText },
    ] : []),
    ...(planLimits.hasSuppliers ? [
      { name: t('navigation.suppliers'), href: '/suppliers', icon: Truck },
      { name: t('navigation.products'), href: '/products', icon: Package },
    ] : []), 
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const handleNavigation = (href: string, name: string) => {
    // Check if user has access to this feature
    if (href === '/payments' && !planLimits.hasFinancialControl) {
      setBlockedFeature('Finanças');
      setShowUpgradeModal(true);
      return;
    }
    if (href === '/proposals' && !planLimits.hasProposals) {
      setBlockedFeature('Propostas');
      setShowUpgradeModal(true);
      return;
    }
    if ((href === '/suppliers' || href === '/products') && !planLimits.hasSuppliers) {
      setBlockedFeature('Fornecedores e Produtos');
      setShowUpgradeModal(true);
      return;
    }
    if (href === '/reports' && !planLimits.hasReports) {
      setBlockedFeature('Relatórios');
      setShowUpgradeModal(true);
      return;
    }
    if (href === '/guests' && !planLimits.hasGuestManagement) {
      setBlockedFeature('Gestão de Convidados - RSVP');
      setShowUpgradeModal(true);
      return;
    }
    
    // Check subscription status
    if (subscription && new Date() > new Date(subscription.endDate) && subscription.plan !== 'free') {
      setBlockedFeature('Assinatura Expirada');
      setShowUpgradeModal(true);
      return;
    }
    
    navigate(href);
    setSidebarOpen(false);
  };
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getPlanDisplayName = () => {
    if (!subscription) return 'Carregando...';
    
    const isExpired = new Date() > new Date(subscription.endDate);
    if (isExpired && subscription.plan !== 'free') {
      return 'Assinatura Expirada';
    }
    
    const plans = {
      free: 'Plano Grátis',
      basic: subscription.cycle === 'yearly' ? 'Básico R$ 990/ano' : 'Básico R$ 99/mês',
      professional: subscription.cycle === 'yearly' ? 'Profissional R$ 1490/ano' : 'Profissional R$ 149/mês',
      premium: subscription.cycle === 'yearly' ? 'Premium R$ 1490/ano' : 'Premium R$ 149/mês'
    };
    
    return plans[subscription.plan] || subscription.plan;
  };
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-purple-600 to-purple-800">
            <h1 className="text-xl font-bold text-white">EventFinance</h1>
          </div>

          {/* Plan Display - Only for normal users */}
          {!isAdmin && (
            <div className={`px-4 py-3 border-b transition-all duration-300 ${
              subscription && new Date() > new Date(subscription.endDate) && subscription.plan !== 'free'
                ? 'bg-red-50 border-red-100'
                : planLimits.isTrialExpiring
                  ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 animate-pulse'
                  : 'bg-purple-50 border-purple-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-1 rounded-full mr-2 ${
                    planLimits.isTrialExpiring ? 'bg-orange-100' : 'bg-purple-100'
                  }`}>
                    <Crown size={14} className={`${
                      subscription && new Date() > new Date(subscription.endDate) && subscription.plan !== 'free'
                        ? 'text-red-600'
                        : planLimits.isTrialExpiring
                          ? 'text-orange-600'
                          : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${
                      subscription && new Date() > new Date(subscription.endDate) && subscription.plan !== 'free'
                        ? 'text-red-900'
                        : planLimits.isTrialExpiring
                          ? 'text-orange-900'
                          : 'text-purple-900'
                    }`}>
                      {planLimits.planName}
                    </span>
                    {planLimits.daysRemaining > 0 && subscription?.plan === 'free' && (
                      <div className={`text-xs ${
                        planLimits.isTrialExpiring ? 'text-orange-700' : 'text-purple-700'
                      }`}>
                        {planLimits.daysRemaining} dia{planLimits.daysRemaining !== 1 ? 's' : ''} restante{planLimits.daysRemaining !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                {(subscription?.plan === 'free' || (subscription && new Date() > new Date(subscription.endDate))) && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className={`text-xs text-white px-3 py-1.5 rounded-full transition-all duration-300 font-bold ${
                      subscription && new Date() > new Date(subscription.endDate) && subscription.plan !== 'free'
                        ? 'bg-red-600 hover:bg-red-700'
                        : planLimits.isTrialExpiring
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 animate-pulse'
                          : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {subscription && new Date() > new Date(subscription.endDate) && subscription.plan !== 'free'
                      ? 'Renovar'
                      : planLimits.isTrialExpiring
                        ? 'Upgrade! 🚨'
                        : 'Upgrade 🚀'
                    }
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Trial Expiring Alert - Only for normal users */}
          {!isAdmin && planLimits.isTrialExpiring && (
            <div className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-center">
              <div className="flex items-center justify-center">
                <AlertTriangle size={14} className="mr-2 animate-bounce" />
                <span className="text-xs font-bold">
                  ⚠️ TESTE EXPIRA EM {planLimits.daysRemaining} DIA{planLimits.daysRemaining !== 1 ? 'S' : ''}!
                </span>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (isAdmin) {
                      navigate(item.href);
                      setSidebarOpen(false);
                    } else {
                      handleNavigation(item.href, item.name);
                    }
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </button>
              );
            })}
            
            {/* Blocked Features - Show with lock icon */}
            {!isAdmin && (
              <>
                {/* Guests - Premium Feature */}
                {!planLimits.hasGuestManagement && (
                  <button
                    onClick={() => {
                      setBlockedFeature('Gestão de Convidados - RSVP');
                      setShowUpgradeModal(true);
                    }}
                    className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-gray-50"
                  >
                    <Lock size={20} className="mr-3" />
                    Gestão de Convidados - RSVP
                    <Crown size={14} className="ml-auto text-purple-400" />
                  </button>
                )}
                
                {/* Other blocked features */}
                {!planLimits.hasFinancialControl && (
                  <button
                    onClick={() => {
                      setBlockedFeature('Finanças');
                      setShowUpgradeModal(true);
                    }}
                    className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-gray-50"
                  >
                    <Lock size={20} className="mr-3" />
                    Pagamentos
                    <Crown size={14} className="ml-auto text-purple-400" />
                  </button>
                )}
                
                {!planLimits.hasProposals && (
                  <button
                    onClick={() => {
                      setBlockedFeature('Propostas');
                      setShowUpgradeModal(true);
                    }}
                    className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-gray-50"
                  >
                    <Lock size={20} className="mr-3" />
                    Propostas
                    <Crown size={14} className="ml-auto text-purple-400" />
                  </button>
                )}
                
                {!planLimits.hasSuppliers && (
                  <>
                    <button
                      onClick={() => {
                        setBlockedFeature('Fornecedores');
                        setShowUpgradeModal(true);
                      }}
                      className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-gray-50"
                    >
                      <Lock size={20} className="mr-3" />
                      Fornecedores
                      <Crown size={14} className="ml-auto text-purple-400" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setBlockedFeature('Produtos/Serviços');
                        setShowUpgradeModal(true);
                      }}
                      className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-gray-50"
                    >
                      <Lock size={20} className="mr-3" />
                      Produtos/Serviços
                      <Crown size={14} className="ml-auto text-purple-400" />
                    </button>
                  </>
                )}
                
                {!planLimits.hasReports && (
                  <button
                    onClick={() => {
                      setBlockedFeature('Relatórios');
                      setShowUpgradeModal(true);
                    }}
                    className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-400 hover:bg-gray-50"
                  >
                    <Lock size={20} className="mr-3" />
                    Relatórios
                    <Crown size={14} className="ml-auto text-purple-400" />
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            <div className="mb-4">
              <LanguageSelector />
            </div>
            <div className="flex items-center mb-4">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-10 h-10 rounded-full mr-3"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} className="mr-3" />
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 px-4 lg:px-8 py-6 mt-16 lg:mt-0">
        {children}
      </div>

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredPlan={blockedFeature}
      />
    </div>
  );
};

export default Layout;