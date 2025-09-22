import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEvents, getPayments, getClients } from '../services/firebaseService';
import { Event, Payment, Client } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, DollarSign, TrendingUp, Filter, Download, Users, CheckCircle, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [user]);

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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected filters
  const filteredEvents = events.filter(event => {
    const typeMatch = selectedEventType === 'all' || event.type === selectedEventType;
    const eventMatch = selectedEvent === 'all' || event.id === selectedEvent;
    
    let dateMatch = true;
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      dateMatch = isWithinInterval(event.date, { start, end });
    }
    
    return typeMatch && eventMatch && dateMatch;
  });

  const filteredPayments = payments.filter(payment => {
    const statusMatch = paymentStatus === 'all' || 
                       (paymentStatus === 'received' && payment.received) ||
                       (paymentStatus === 'pending' && !payment.received);
    
    const eventMatch = selectedEvent === 'all' || payment.eventId === selectedEvent;
    
    let dateMatch = true;
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      dateMatch = isWithinInterval(payment.paymentDate, { start, end });
    }
    
    return statusMatch && eventMatch && dateMatch;
  });

  // Calculate metrics
  const totalReceived = filteredPayments.filter(p => p.received).reduce((sum, p) => sum + p.amount, 0);
  const totalPending = filteredPayments.filter(p => !p.received).reduce((sum, p) => sum + p.amount, 0);
  const totalEvents = filteredEvents.length;
  const totalClients = clients.length;

  // Event type distribution
  const eventTypeData = Object.entries(
    filteredEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    name: t(`events.types.${type}`),
    value: count,
    color: getEventTypeColor(type)
  }));

  // Monthly revenue data
  const monthlyData = filteredPayments
    .filter(p => p.received)
    .reduce((acc, payment) => {
      const month = format(payment.paymentDate, 'yyyy-MM');
      acc[month] = (acc[month] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

  const monthlyRevenueData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: format(parseISO(month + '-01'), 'MMM yyyy', { locale: ptBR }),
      amount
    }));

  // Payment method distribution
  const paymentMethodData = Object.entries(
    filteredPayments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([method, amount]) => ({
    name: t(`payments.methods.${method}`),
    value: amount,
    color: getPaymentMethodColor(method)
  }));

  function getEventTypeColor(type: string) {
    const colors = {
      wedding: '#8B5CF6',
      debutante: '#EC4899',
      birthday: '#F59E0B',
      graduation: '#10B981',
      other: '#6B7280'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  }

  function getPaymentMethodColor(method: string) {
    const colors = {
      pix: '#10B981',
      card: '#3B82F6',
      boleto: '#F59E0B',
      cash: '#6B7280'
    };
    return colors[method as keyof typeof colors] || '#6B7280';
  }

  const exportData = () => {
    const data = {
      summary: {
        totalReceived,
        totalPending,
        totalEvents,
        totalClients
      },
      events: filteredEvents,
      payments: filteredPayments,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do seu negócio</p>
        </div>
        <Button onClick={exportData}>
          <Download size={20} className="mr-2" />
          Exportar Dados
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <Filter size={20} className="mr-2 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria de Evento
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="wedding">{t('events.types.wedding')}</option>
              <option value="debutante">{t('events.types.debutante')}</option>
              <option value="birthday">{t('events.types.birthday')}</option>
              <option value="graduation">{t('events.types.graduation')}</option>
              <option value="other">{t('events.types.other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evento Específico
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos os Eventos</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status do Pagamento
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos</option>
              <option value="received">Recebidos</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recebido</p>
              <p className="text-2xl font-bold text-green-600">
                {t('currency')} {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pendente</p>
              <p className="text-2xl font-bold text-orange-600">
                {t('currency')} {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
              <p className="text-2xl font-bold text-purple-600">{totalEvents}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-blue-600">{totalClients}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    `${t('currency')} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    'Receita'
                  ]}
                />
                <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Tipo de Evento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eventTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita por Método de Pagamento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    `${t('currency')} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    'Valor'
                  ]}
                />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status dos Pagamentos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Recebido', value: totalReceived, color: '#10B981' },
                    { name: 'Pendente', value: totalPending, color: '#F59E0B' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    `${t('currency')} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    'Valor'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events by Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos com Maior Receita</h3>
          <div className="space-y-3">
            {filteredEvents
              .sort((a, b) => b.contractTotal - a.contractTotal)
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-600">{event.clientName}</p>
                  </div>
                  <p className="font-bold text-gray-900">
                    {t('currency')} {event.contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagamentos Recentes</h3>
          <div className="space-y-3">
            {filteredPayments
              .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
              .slice(0, 5)
              .map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.eventName}</p>
                    <p className="text-sm text-gray-600">
                      {format(payment.paymentDate, 'dd/MM/yyyy')} • {t(`payments.methods.${payment.method}`)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {t('currency')} {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      payment.received ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {payment.received ? 'Recebido' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;