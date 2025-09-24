import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { addPayment, updatePayment, deletePayment, addPaymentInstallments, getProducts } from '../services/firebaseService';
import { Payment } from '../types';
import { Plus, Search, Edit2, Trash2, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PaymentInstallmentsModal from '../components/ui/PaymentInstallmentsModal';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

const PaymentsPage: React.FC = () => {
  const { events, payments, products, refreshPayments, refreshEvents, refreshData } = useData();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCreatingInstallments, setIsCreatingInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [installmentInterval, setInstallmentInterval] = useState<'monthly' | 'weekly' | 'custom'>('monthly');
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState<string>('');
  const [downPaymentReceived, setDownPaymentReceived] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Payment, 'id' | 'createdAt' | 'userId' | 'eventName'>>();

  useEffect(() => {
    setLoading(false);
  }, [events, payments, products]);

  const onSubmit = async (data: Omit<Payment, 'id' | 'createdAt' | 'userId' | 'eventName'>) => {
    try {
      const selectedEvent = events.find(e => e.id === data.eventId);
      if (!selectedEvent) return;

      if (isCreatingInstallments && installmentCount > 1) {
        // Create installments
        const totalAmount = Number(data.amount);
        let remainingAmount = totalAmount;
        const installments = [];
        
        // Add down payment if configured
        if (hasDownPayment && downPaymentAmount) {
          const downAmount = Number(downPaymentAmount);
          remainingAmount -= downAmount;
          
          installments.push({
            amount: downAmount,
            paymentDate: new Date(data.paymentDate),
            method: data.method,
            notes: data.notes ? `${data.notes} - Entrada` : 'Entrada',
            received: downPaymentReceived,
          });
        }
        
        // Calculate installment amount for remaining value
        const installmentAmount = Math.floor((remainingAmount / installmentCount) * 100) / 100;
        const remainder = remainingAmount - (installmentAmount * installmentCount);
        
        // Add installments
        for (let i = 0; i < installmentCount; i++) {
          const installmentDate = new Date(data.paymentDate);
          
          if (installmentInterval === 'monthly') {
            installmentDate.setMonth(installmentDate.getMonth() + (hasDownPayment ? i + 1 : i));
          } else if (installmentInterval === 'weekly') {
            installmentDate.setDate(installmentDate.getDate() + ((hasDownPayment ? i + 1 : i) * 7));
          }
          
          installments.push({
            amount: i === installmentCount - 1 ? installmentAmount + remainder : installmentAmount,
            paymentDate: installmentDate,
            method: data.method,
            notes: data.notes ? `${data.notes} - Parcela ${i + 1}/${installmentCount}` : `Parcela ${i + 1}/${installmentCount}`,
            received: false, // Installments start as not received
          });
        }
        
        await addPaymentInstallments(
          selectedEvent.id,
          selectedEvent.name,
          events[0]?.userId || '',
          installments
        );
      } else {
        // Create single payment
        const paymentData = {
          ...data,
          paymentDate: new Date(data.paymentDate),
          amount: Number(data.amount),
          eventName: selectedEvent.name,
          userId: user?.uid || '',
        };

        if (editingPayment) {
          await updatePayment(editingPayment.id, paymentData);
        } else {
          await addPayment(paymentData);
        }
      }
      
      // Refresh all data to ensure synchronization between Events and Payments
      await refreshData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setValue('eventId', payment.eventId);
    setValue('amount', payment.amount as any);
    setValue('paymentDate', format(payment.paymentDate, 'yyyy-MM-dd') as any);
    setValue('method', payment.method);
    setValue('received', payment.received);
    setValue('notes', payment.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('payments.deleteConfirm'))) {
      try {
        await deletePayment(id);
        // Refresh all data to ensure synchronization between Events and Payments
        await refreshData();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const toggleReceived = async (payment: Payment) => {
    try {
      await updatePayment(payment.id, { received: !payment.received });
      // Refresh all data to ensure synchronization between Events and Payments
      await refreshData();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleCreateInstallments = (event: Event) => {
    setSelectedEventForInstallments(event);
    setShowInstallmentsModal(true);
  };

  const handleSaveInstallments = async (installments: any[]) => {
    if (!selectedEventForInstallments) return;

    try {
      // First, delete existing payments for this event
      const existingPayments = payments.filter(p => p.eventId === selectedEventForInstallments.id);
      for (const payment of existingPayments) {
        await deletePayment(payment.id);
      }
      
      // Then add new installments
      await addPaymentInstallments(
        selectedEventForInstallments.id,
        selectedEventForInstallments.name,
        user?.uid || '',
        installments
      );
      
      // Refresh all data to ensure synchronization between Events and Payments
      await refreshData();
      setShowInstallmentsModal(false);
      setSelectedEventForInstallments(null);
    } catch (error) {
      console.error('Error saving installments:', error);
      alert('Erro ao salvar parcelamento. Tente novamente.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
    setIsCreatingInstallments(false);
    setInstallmentCount(1);
    setInstallmentInterval('monthly');
    setHasDownPayment(false);
    setDownPaymentAmount('');
    setDownPaymentReceived(false);
    reset();
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.notes && payment.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'received' && payment.received) ||
                         (filterStatus === 'pending' && !payment.received);
    
    const matchesEvent = filterEvent === 'all' || payment.eventId === filterEvent;
    
    const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
    
    const matchesAmount = (!minAmount || payment.amount >= Number(minAmount)) &&
                         (!maxAmount || payment.amount <= Number(maxAmount));
    
    const matchesDateRange = (!startDate || payment.paymentDate >= new Date(startDate)) &&
                            (!endDate || payment.paymentDate <= new Date(endDate));
    
    return matchesSearch && matchesStatus && matchesEvent && matchesMethod && matchesAmount && matchesDateRange;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'pix':
        return 'bg-green-100 text-green-800';
      case 'card':
        return 'bg-blue-100 text-blue-800';
      case 'boleto':
        return 'bg-orange-100 text-orange-800';
      case 'cash':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate totals
  const totalReceived = filteredPayments.filter(p => p.received).reduce((sum, p) => sum + p.amount, 0);
  const totalPending = filteredPayments.filter(p => !p.received).reduce((sum, p) => sum + p.amount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">{t('payments.title')}</h1>
          <p className="text-gray-600 mt-1">{t('payments.subtitle')}</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            {t('payments.addPayment')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('payments.totalReceived')}</p>
              <p className="text-2xl font-bold text-green-600">
                {t('currency')} {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('payments.pendingPayments')}</p>
              <p className="text-2xl font-bold text-orange-600">
                {t('currency')} {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <XCircle className="h-12 w-12 text-orange-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('payments.totalPayments')}</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredPayments.length}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-purple-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('payments.filters.title')}</h2>
        
        {/* First row - Search and Status */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('payments.searchPayments')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        {/* Second row - Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.status')}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">{t('payments.allPayments')}</option>
              <option value="received">{t('payments.received')}</option>
              <option value="pending">{t('payments.pending')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.event')}
            </label>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">{t('payments.filters.allEvents')}</option>
              {events.filter(event => 
                payments.some(payment => payment.eventId === event.id)
              ).map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.method')}
            </label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">{t('payments.filters.allMethods')}</option>
              <option value="pix">{t('payments.methods.pix')}</option>
              <option value="card">{t('payments.methods.card')}</option>
              <option value="boleto">{t('payments.methods.boleto')}</option>
              <option value="cash">{t('payments.methods.cash')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.clearFilters')}
            </label>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterEvent('all');
                setFilterMethod('all');
                setMinAmount('');
                setMaxAmount('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full"
            >
              {t('payments.filters.clear')}
            </Button>
          </div>
        </div>
        
        {/* Third row - Amount and Date filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.minAmount')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.maxAmount')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.filters.endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('payments.paymentList')}</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900 mr-3">
                      {payment.eventName}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getMethodColor(payment.method)}`}>
                      {t(`payments.methods.${payment.method}`)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center text-sm text-gray-600 space-y-1 md:space-y-0 md:space-x-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {format(payment.paymentDate, 'dd/MM/yyyy')}
                    </div>
                    <div className="flex items-center">
                      <DollarSign size={16} className="mr-1" />
                      {t('currency')} {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  
                  {payment.notes && (
                    <p className="text-sm text-gray-500 mt-2">{payment.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleReceived(payment)}
                    className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      payment.received
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {payment.received ? (
                      <>
                        <CheckCircle size={16} className="mr-1" />
                        {t('payments.received')}
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="mr-1" />
                        {t('payments.pending')}
                      </>
                    )}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(payment)}
                      className="text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(payment.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('payments.noPaymentsFound')}</p>
        </div>
      )}

      {/* Add/Edit Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPayment ? t('payments.editPayment') : (isCreatingInstallments ? 'Criar Parcelamento' : t('payments.addNewPayment'))}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.fields.event')} *
            </label>
            <select
              id="eventId"
              {...register('eventId', { required: t('payments.validation.eventRequired') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">{t('payments.fields.selectEvent')}</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
            {errors.eventId && (
              <p className="text-red-500 text-sm mt-1">{errors.eventId.message}</p>
            )}
          </div>

          {/* Payment Type Selection */}
          {!editingPayment && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tipo de Pagamento</h3>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isCreatingInstallments}
                    onChange={() => setIsCreatingInstallments(false)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pagamento Único</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isCreatingInstallments}
                    onChange={() => setIsCreatingInstallments(true)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Parcelamento</span>
                </label>
              </div>
            </div>
          )}

          {/* Installment Configuration */}
          {isCreatingInstallments && !editingPayment && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h3 className="text-sm font-medium text-blue-800">Configuração do Parcelamento</h3>
              
              {/* Down Payment Option */}
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="hasDownPayment"
                    checked={hasDownPayment}
                    onChange={(e) => setHasDownPayment(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasDownPayment" className="ml-2 text-sm font-medium text-gray-700">
                    Incluir Entrada
                  </label>
                </div>
                
                {hasDownPayment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor da Entrada (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={downPaymentAmount}
                        onChange={(e) => setDownPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="downPaymentReceived"
                        checked={downPaymentReceived}
                        onChange={(e) => setDownPaymentReceived(e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="downPaymentReceived" className="ml-2 text-xs text-gray-700">
                        Entrada já recebida
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Número de Parcelas (além da entrada)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Intervalo
                  </label>
                  <select
                    value={installmentInterval}
                    onChange={(e) => setInstallmentInterval(e.target.value as 'monthly' | 'weekly' | 'custom')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>
              
              <div className="text-xs text-blue-700 space-y-1">
                {hasDownPayment ? (
                  <>
                    <div>💡 <strong>Entrada:</strong> Valor fixo pago no início</div>
                    <div>📅 <strong>Parcelas:</strong> {installmentCount === 1 ? 'Valor restante em 1 parcela' : `Valor restante dividido em ${installmentCount} parcelas iguais`}</div>
                    <div>⏰ <strong>Datas:</strong> Entrada na data informada, parcelas começam no próximo período</div>
                  </>
                ) : (
                  <div>💡 {installmentCount === 1 ? 'Pagamento único na data informada.' : `O valor será dividido igualmente entre ${installmentCount} parcelas.`}</div>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                {isCreatingInstallments ? 'Valor Total' : t('common.amount')} ({t('currency')}) *
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                {...register('amount', { 
                  required: t('payments.validation.amountRequired'),
                  min: { value: 0, message: t('payments.validation.amountPositive') }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                {isCreatingInstallments ? 'Data da 1ª Parcela' : t('payments.fields.paymentDate')} *
              </label>
              <input
                type="date"
                id="paymentDate"
                {...register('paymentDate', { required: t('payments.validation.dateRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.paymentDate && (
                <p className="text-red-500 text-sm mt-1">{errors.paymentDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
              {t('payments.fields.paymentMethod')} *
            </label>
            <select
              id="method"
              {...register('method', { required: t('payments.validation.methodRequired') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">{t('payments.fields.selectPaymentMethod')}</option>
              <option value="pix">{t('payments.methods.pix')}</option>
              <option value="card">{t('payments.methods.card')}</option>
              <option value="boleto">{t('payments.methods.boleto')}</option>
              <option value="cash">{t('payments.methods.cash')}</option>
            </select>
            {errors.method && (
              <p className="text-red-500 text-sm mt-1">{errors.method.message}</p>
            )}
          </div>

          {!isCreatingInstallments && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="received"
                {...register('received')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="received" className="ml-2 block text-sm text-gray-900">
                {t('payments.paymentReceived')}
              </label>
            </div>
          )}
          
          {isCreatingInstallments && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="received"
                {...register('received')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="received" className="ml-2 block text-sm text-gray-900">
                Primeira parcela já foi recebida
              </label>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.notes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={isCreatingInstallments ? "Observações gerais para todas as parcelas" : "Observações do pagamento"}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {editingPayment 
                ? t('common.update') 
                : isCreatingInstallments 
                  ? hasDownPayment 
                    ? installmentCount === 1 
                      ? 'Criar Entrada + 1 Parcela'
                      : `Criar Entrada + ${installmentCount} Parcelas`
                    : installmentCount === 1
                      ? 'Criar Pagamento'
                      : `Criar ${installmentCount} Parcelas`
                  : t('common.create')
              } {!editingPayment && !isCreatingInstallments ? t('navigation.payments') : ''}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentsPage;