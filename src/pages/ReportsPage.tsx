import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, DollarSign, TrendingUp, Filter, Download, Users, CheckCircle, XCircle, Pencil } from 'lucide-react';
import Button from '../components/ui/Button';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as Papa from 'papaparse';

const ReportsPage: React.FC = () => {
  const { events, payments, clients, products, loading } = useData();
  const { t } = useTranslation();
  
  // State for filters
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [showExportModal, setShowExportModal] = useState(false);

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

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 30;
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(139, 92, 246);
      doc.text('RELATÓRIO FINANCEIRO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Period
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const periodText = startDate && endDate 
        ? `Período: ${format(parseISO(startDate), 'dd/MM/yyyy')} a ${format(parseISO(endDate), 'dd/MM/yyyy')}`
        : `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
      doc.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Summary
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246);
      doc.text('RESUMO FINANCEIRO', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Recebido: R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total Pendente: R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total de Eventos: ${totalEvents}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total de Clientes: ${totalClients}`, 20, yPosition);
      yPosition += 20;
      
      // Payments table
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246);
      doc.text('DETALHAMENTO DE PAGAMENTOS', 20, yPosition);
      yPosition += 10;
      
      const paymentsTableData = filteredPayments.map(payment => [
        payment.eventName || 'N/A',
        format(payment.paymentDate, 'dd/MM/yyyy'),
        payment.method.toUpperCase(),
        `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        payment.received ? 'Recebido' : 'Pendente',
        payment.notes || '-'
      ]);
      
      (doc as any).autoTable({
        head: [['Evento', 'Data', 'Método', 'Valor', 'Status', 'Observações']],
        body: paymentsTableData,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
        alternateRowStyles: { fillColor: [248, 249, 250] },
      });
      
      // Events table
      let finalY = (doc as any).lastAutoTable.finalY + 20;
      
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246);
      doc.text('DETALHAMENTO DE EVENTOS', 20, finalY);
      finalY += 10;
      
      const eventsTableData = filteredEvents.map(event => [
        event.name,
        event.type,
        format(event.date, 'dd/MM/yyyy'),
        event.clientName || 'N/A',
        `R$ ${event.contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
      
      (doc as any).autoTable({
        head: [['Nome', 'Tipo', 'Data', 'Cliente', 'Valor']],
        body: eventsTableData,
        startY: finalY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
        alternateRowStyles: { fillColor: [248, 249, 250] },
      });
      
      doc.save(`relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setShowExportModal(false);
      alert('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const exportToExcel = () => {
    try {
      // Resumo
      const summaryData = [{
        'Tipo': 'RESUMO FINANCEIRO',
        'Total Recebido': `R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        'Total Pendente': `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        'Total de Eventos': totalEvents,
        'Total de Clientes': totalClients,
        'Período': startDate && endDate 
          ? `${format(parseISO(startDate), 'dd/MM/yyyy')} a ${format(parseISO(endDate), 'dd/MM/yyyy')}`
          : `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
      }];
      
      // Dados de pagamentos
      const paymentsData = filteredPayments.map(payment => ({
        'Evento': payment.eventName || 'N/A',
        'Data do Pagamento': format(payment.paymentDate, 'dd/MM/yyyy'),
        'Método': payment.method.toUpperCase(),
        'Valor': payment.amount,
        'Valor Formatado': `R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        'Status': payment.received ? 'Recebido' : 'Pendente',
        'Observações': payment.notes || '',
        'Criado em': format(payment.createdAt || new Date(), 'dd/MM/yyyy HH:mm')
      }));
      
      // Dados de eventos
      const eventsData = filteredEvents.map(event => ({
        'Nome do Evento': event.name,
        'Tipo': event.type,
        'Data': format(event.date, 'dd/MM/yyyy'),
        'Cliente': event.clientName || 'N/A',
        'Local': event.location || 'N/A',
        'Status': event.status || 'N/A',
        'Valor do Contrato': event.contractTotal,
        'Valor Formatado': `R$ ${event.contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        'Convidados': event.guestCount || 0
      }));
      
      // Criar planilhas separadas
      const workbook = {
        'Resumo': summaryData,
        'Pagamentos': paymentsData,
        'Eventos': eventsData
      };
      
      // Exportar como CSV com UTF-8 BOM
      Object.entries(workbook).forEach(([sheetName, data]) => {
        const csv = Papa.unparse(data);
        // Adicionar BOM para UTF-8
        const csvWithBOM = '\ufeff' + csv;
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio-${sheetName.toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      
      setShowExportModal(false);
      alert('Relatórios Excel (CSV) gerados com sucesso! 3 arquivos foram baixados.');
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      alert('Erro ao gerar Excel. Tente novamente.');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">{t('reports.title') || 'Relatórios'}</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do seu negócio</p>
        </div>
        <Button onClick={() => setShowExportModal(true)}>
          <Download size={20} className="mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar Relatório Financeiro</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Dados do Relatório:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>Total Recebido: <strong>R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <div>Total Pendente: <strong>R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <div>Eventos: <strong>{totalEvents}</strong></div>
                <div>Pagamentos: <strong>{filteredPayments.length}</strong></div>
              </div>
              {startDate && endDate && (
                <div className="mt-2 text-sm text-blue-700">
                  <strong>Período:</strong> {format(parseISO(startDate), 'dd/MM/yyyy')} a {format(parseISO(endDate), 'dd/MM/yyyy')}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-2">O relatório incluirá:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Resumo financeiro completo</li>
                <li>• Detalhamento de todos os pagamentos</li>
                <li>• Informações dos eventos</li>
                <li>• Status de recebimento</li>
                <li>• Métodos de pagamento</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowExportModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={exportToExcel}
                variant="secondary"
              >
                <Download size={16} className="mr-1" />
                Exportar Excel
              </Button>
              <Button 
                onClick={exportToPDF}
              >
                <Download size={16} className="mr-1" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <option value="wedding">{t('events.types.wedding') || 'Casamento'}</option>
              <option value="debutante">{t('events.types.debutante') || 'Debutante'}</option>
              <option value="birthday">{t('events.types.birthday') || 'Aniversário'}</option>
              <option value="graduation">{t('events.types.graduation') || 'Formatura'}</option>
              <option value="other">{t('events.types.other') || 'Outro'}</option>
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
        
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedEventType('all');
              setSelectedEvent('all');
              setStartDate('');
              setEndDate('');
              setPaymentStatus('all');
            }}
          >
            Limpar Todos os Filtros
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recebido</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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
              .map(event => (
                <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-600">{format(event.date, 'dd/MM/yyyy')}</p>
                  </div>
                  <p className="font-semibold text-purple-600">
                    R$ {event.contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Top Clients by Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clientes com Maior Receita</h3>
          <div className="space-y-3">
            {Object.entries(
              filteredPayments
                .filter(p => p.received)
                .reduce((acc, payment) => {
                  const client = clients.find(c => c.id === payment.clientId);
                  if (client) {
                    acc[client.name] = (acc[client.name] || 0) + payment.amount;
                  }
                  return acc;
                }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([clientName, amount]) => (
                <div key={clientName} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{clientName}</p>
                  <p className="font-semibold text-green-600">
                    R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;