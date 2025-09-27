import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  getAllUsers, 
  updateUserStatus, 
  updateUserPlan, 
  updateSubscriptionEndDate,
  getAdminStats
} from '../services/firebaseService';
import { UserProfile, AdminStats } from '../types';
import { Users, UserCheck, UserX, Calendar, Crown, CreditCard as Edit3, Loader2, TrendingUp, DollarSign, Clock, Shield } from 'lucide-react';
import Button from '../components/ui/Button';

const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, adminStats] = await Promise.all([
        getAllUsers(),
        getAdminStats()
      ]);
      setUsers(allUsers);
      setStats(adminStats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: 'Não foi possível carregar os dados do painel administrativo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(`status-${userId}`);
      await updateUserStatus(userId, !currentStatus);
      await loadData();
      showToast({
        type: 'success',
        title: 'Status atualizado',
        message: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showToast({
        type: 'error',
        title: 'Erro ao atualizar status',
        message: 'Não foi possível atualizar o status do usuário.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlanChange = async (userId: string, newPlan: 'free' | 'basic' | 'professional' | 'premium') => {
    try {
      setActionLoading(`plan-${userId}`);
      await updateUserPlan(userId, newPlan);
      await loadData();
      showToast({
        type: 'success',
        title: 'Plano atualizado',
        message: `Plano alterado para ${newPlan} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      showToast({
        type: 'error',
        title: 'Erro ao atualizar plano',
        message: 'Não foi possível atualizar o plano do usuário.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateExpirationDate = async () => {
    if (!editingUser || !newExpirationDate) return;

    try {
      setActionLoading(`expiration-${editingUser.uid}`);
      await updateSubscriptionEndDate(editingUser.uid, new Date(newExpirationDate));
      await loadData();
      setEditingUser(null);
      setNewExpirationDate('');
      showToast({
        type: 'success',
        title: 'Data de expiração atualizada',
        message: 'A data de expiração foi atualizada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao atualizar data de expiração:', error);
      showToast({
        type: 'error',
        title: 'Erro ao atualizar data',
        message: 'Não foi possível atualizar a data de expiração.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const addDaysToDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setNewExpirationDate(date.toISOString().split('T')[0]);
  };

  const getSubscriptionStatus = (user: UserProfile) => {
    if (!user.isActive) return { text: 'Desativado', color: 'text-red-600' };
    if (!user.subscription) return { text: 'Sem assinatura', color: 'text-gray-600' };
    
    const now = new Date();
    const endDate = new Date(user.subscription.endDate);
    
    if (endDate < now) return { text: 'Expirado', color: 'text-red-600' };
    if (user.subscription.plan === 'free') return { text: 'Teste', color: 'text-blue-600' };
    
    return { text: 'Ativo', color: 'text-green-600' };
  };

  const getPlanPrice = (plan: 'free' | 'basic' | 'professional' | 'premium') => {
    const prices = {
      free: 'Gratuito',
      basic: 'R$ 99/mês',
      professional: 'R$ 149/mês',
      premium: 'R$ 199/mês'
    };
    return prices[plan] || 'N/A';
  };

  const getPlanName = (plan: 'free' | 'basic' | 'professional' | 'premium') => {
    const names = {
      free: 'Gratuito',
      basic: 'Básico',
      professional: 'Profissional',
      premium: 'Premium'
    };
    return names[plan] || plan;
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-1">Gerencie usuários e assinaturas da plataforma</p>
        </div>
        <div className="flex items-center space-x-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          <span className="text-sm font-medium text-gray-600">Master</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
              </div>
              <Users className="h-12 w-12 text-purple-600 opacity-80" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assinaturas Ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</p>
              </div>
              <Crown className="h-12 w-12 text-green-600 opacity-80" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-80" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Novos (7 dias)</p>
                <p className="text-2xl font-bold text-orange-600">{stats.newUsersLast7Days}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-600 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Usuários</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiração
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ativo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => {
                  const status = getSubscriptionStatus(userData);
                  return (
                    <tr key={userData.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {userData.photoURL && (
                            <img
                              src={userData.photoURL}
                              alt={userData.displayName || ''}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userData.displayName || 'Nome não informado'}
                            </div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                            <div className="text-xs text-gray-400">
                              Cadastro: {userData.createdAt.toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={userData.subscription?.plan || 'free'}
                          onChange={(e) => handlePlanChange(userData.uid, e.target.value as any)}
                          disabled={actionLoading === `plan-${userData.uid}`}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="free">Gratuito</option>
                          <option value="basic">Básico</option>
                          <option value="professional">Profissional</option>
                          <option value="premium">Premium</option>
                        </select>
                        <div className="text-xs text-gray-500 mt-1">
                          {getPlanPrice(userData.subscription?.plan || 'free')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userData.subscription?.endDate
                          ? userData.subscription.endDate.toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(userData.uid, userData.isActive || false)}
                          disabled={actionLoading === `status-${userData.uid}`}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            userData.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {actionLoading === `status-${userData.uid}` ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : userData.isActive ? (
                            <UserCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <UserX className="w-3 h-3 mr-1" />
                          )}
                          {userData.isActive ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingUser(userData);
                            setNewExpirationDate(
                              userData.subscription?.endDate
                                ? userData.subscription.endDate.toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0]
                            );
                          }}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Editar Usuário
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário
                  </label>
                  <div className="flex items-center">
                    {editingUser.photoURL && (
                      <img
                        src={editingUser.photoURL}
                        alt={editingUser.displayName || ''}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    )}
                    <div>
                      <p className="text-sm text-gray-900">{editingUser.displayName}</p>
                      <p className="text-xs text-gray-500">{editingUser.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    value={newExpirationDate}
                    onChange={(e) => setNewExpirationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ações Rápidas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addDaysToDate(7)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      +7 dias
                    </button>
                    <button
                      onClick={() => addDaysToDate(30)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      +1 mês
                    </button>
                    <button
                      onClick={() => addDaysToDate(90)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      +3 meses
                    </button>
                    <button
                      onClick={() => addDaysToDate(365)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      +1 ano
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateExpirationDate}
                    disabled={actionLoading === `expiration-${editingUser.uid}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
                  >
                    {actionLoading === `expiration-${editingUser.uid}` && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;