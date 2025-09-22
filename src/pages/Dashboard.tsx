import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEvents, getPayments, getClients } from '../services/firebaseService';
import { Event, Payment, Client } from '../types';
import { Calendar, DollarSign, Users, TrendingUp, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays } from 'date-fns';
import Button from '../components/ui/Button';
import MonthlyPaymentsModal from '../components/ui/MonthlyPaymentsModal';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMonthlyPayments, setShowMonthlyPayments] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [eventsData, paymentsData, clientsData] = await Promise.all([
          getEvents(user.uid),
          getPayments(user.uid),
          getClients(user.uid),
        ]);
        
        setEvents(eventsData);
        setPayments(paymentsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Calculate financial metrics
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const totalReceivedMonth = payments
    .filter(payment => 
      payment.received && 
      isWithinInterval(payment.paymentDate, { start: monthStart, end: monthEnd })
    )
    .reduce((total, payment) => total + payment.amount, 0);

  const totalPending = payments
    .filter(payment => !payment.received)
    .reduce((total, payment) => total + payment.amount, 0);

  const upcomingEvents = events
    .filter(event => event.date > new Date() && event.status !== 'canceled')
    .slice(0, 5);

  const futurePayments = payments
    .filter(payment => 
      !payment.received && 
      payment.paymentDate >= new Date()
    )
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('dashboard.welcome', { name: user?.displayName })}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button onClick={() => navigate('/clients')} variant="secondary">
            <Plus size={20} className="mr-2" />
            {t('dashboard.newClient')}
          </Button>
          <Button onClick={() => navigate('/events')}>
            <Plus size={20} className="mr-2" />
            {t('dashboard.newEvent')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.receivedThisMonth')}</p>
              <p 
                className="text-2xl font-bold text-green-600 cursor-pointer hover:text-green-700 transition-colors"
                onClick={() => setShowMonthlyPayments(true)}
                title="Clique para ver detalhes mensais"
              >
                {t('currency')} {totalReceivedMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Clique para ver por mês</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.pendingPayments')}</p>
              <p 
                className="text-2xl font-bold text-orange-600 cursor-pointer hover:text-orange-700 transition-colors"
                onClick={() => setShowMonthlyPayments(true)}
                title="Clique para ver detalhes mensais"
              >
                {t('currency')} {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Clique para ver por mês</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalClients')}</p>
              <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.activeEvents')}</p>
              <p className="text-2xl font-bold text-purple-600">
                {events.filter(e => e.status === 'confirmed' || e.status === 'planning').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.upcomingEvents')}</h2>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-600">
                      {format(event.date, 'dd/MM/yyyy')} • {event.location}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      event.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t(`events.status.${event.status}`)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('currency')} {event.contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('dashboard.noUpcomingEvents')}</p>
          )}
        </div>

        {/* Future Payments */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pagamentos Futuros</h2>
          {futurePayments.length > 0 ? (
            <div className="space-y-3">
              {futurePayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.eventName}</p>
                    <p className="text-sm text-gray-600">
                      Vencimento: {format(payment.paymentDate, 'dd/MM/yyyy')}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full mt-1">
                      {t(`payments.methods.${payment.method}`)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {t('currency')} {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum pagamento futuro</p>
          )}
        </div>
      </div>

      {/* Monthly Payments Modal */}
      <MonthlyPaymentsModal
        isOpen={showMonthlyPayments}
        onClose={() => setShowMonthlyPayments(false)}
      />
    </div>
  );
};

export default Dashboard;