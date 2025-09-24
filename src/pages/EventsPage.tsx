import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { addEvent, updateEvent, deleteEvent, addClient, addProduct, addEventProduct, getEventProducts, deleteEventProduct, deletePayment } from '../services/firebaseService';
import { Event, Client, Product, Payment } from '../types';
import { Plus, Search, Edit2, Trash2, Calendar, MapPin, User, CheckCircle, Clock, Truck } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { uploadContract, deleteContract, addPaymentInstallments } from '../services/firebaseService';
import { useForm, useFieldArray } from 'react-hook-form';
import { format } from 'date-fns';
import EventDetailsModal from '../components/ui/EventDetailsModal';

const EventsPage: React.FC = () => {
  const { events, payments, clients, products, refreshEvents, refreshPayments, refreshData } = useData();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploadingContract, setUploadingContract] = useState<string | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isNewProduct, setIsNewProduct] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors }, control } = useForm<Omit<Event, 'id' | 'createdAt' | 'userId' | 'clientName'>>();
  const { register: registerClient, formState: { errors: clientErrors }, getValues: getClientValues, reset: resetClient } = useForm<Omit<Client, 'id' | 'createdAt' | 'userId'>>();
  const { register: registerProduct, formState: { errors: productErrors }, getValues: getProductValues, reset: resetProduct } = useForm<Omit<Product, 'id' | 'createdAt' | 'userId'>>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'installments'
  });

  const watchedClientId = watch('clientId');
  const watchedType = watch('type');

  useEffect(() => {
    setLoading(false);
  }, [events, payments, clients, products]);

  useEffect(() => {
    // Auto-generate event name when client or type changes
    if (watchedClientId && watchedType) {
      const selectedClient = clients.find(c => c.id === watchedClientId);
      if (selectedClient) {
        const eventTypeMap = {
          wedding: t('events.types.wedding'),
          debutante: t('events.types.debutante'),
          birthday: t('events.types.birthday'),
          graduation: t('events.types.graduation'),
          other: t('events.types.other')
        };
        const eventName = `${eventTypeMap[watchedType]} ${selectedClient.name}`;
        setValue('name', eventName);
      }
    }
  }, [watchedClientId, watchedType, clients, setValue, t]);

  const onSubmit = async (data: Omit<Event, 'id' | 'createdAt' | 'userId' | 'clientName'>) => {
    if (!user) return;

    try {
      let selectedClient: Client;
      
      if (isNewClient) {
        // Create new client first
        const clientData = getClientValues();
        if (!clientData.name || !clientData.phone || !clientData.email) {
          alert('Por favor, preencha todos os campos obrigatórios do cliente.');
          return;
        }
        
        const clientId = await addClient({ ...clientData, userId: user.uid });
        selectedClient = {
          id: clientId,
          ...clientData,
          userId: user.uid,
          createdAt: new Date()
        };
      } else {
        selectedClient = clients.find(c => c.id === data.clientId);
        if (!selectedClient) return;
      }

      // Handle new product creation
      let newProductId: string | null = null;
      if (isNewProduct) {
        const productData = getProductValues();
        if (!productData.name || !productData.price) {
          alert('Por favor, preencha todos os campos obrigatórios do produto.');
          return;
        }
        
        newProductId = await addProduct({ ...productData, userId: user.uid });
      }

      const eventData = {
        ...data,
        date: new Date(data.date),
        contractTotal: Number(data.contractTotal),
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        userId: user.uid,
      };

      let eventId: string;
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        eventId = editingEvent.id;
        
        // Remove existing event products
        const existingEventProducts = await getEventProducts(editingEvent.id);
        for (const eventProduct of existingEventProducts) {
          await deleteEventProduct(eventProduct.id);
        }
      } else {
        eventId = await addEvent(eventData);
      }
      
      // Link selected products to event
      const productsToLink = [...selectedProducts];
      if (newProductId) {
        productsToLink.push(newProductId);
      }
      
      for (const productId of productsToLink) {
        const product = products.find(p => p.id === productId) || 
                       (newProductId === productId ? { 
                         id: newProductId, 
                         name: getProductValues().name, 
                         price: getProductValues().price 
                       } : null);
        
        if (product) {
          await addEventProduct({
            eventId,
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
            total: product.price
          });
        }
      }
      
      await refreshData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erro ao salvar evento. Tente novamente.');
    }
  };

  const handleEdit = async (event: Event) => {
    setEditingEvent(event);
    setValue('name', event.name);
    setValue('type', event.type);
    setValue('date', format(event.date, 'yyyy-MM-dd') as any);
    setValue('location', event.location);
    setValue('clientId', event.clientId);
    setValue('status', event.status);
    setValue('contractTotal', event.contractTotal as any);
    setValue('details', event.details || '');
    
    // Load linked products
    try {
      const eventProducts = await getEventProducts(event.id);
      const linkedProductIds = eventProducts.map(ep => ep.productId);
      setSelectedProducts(linkedProductIds);
    } catch (error) {
      console.error('Error loading event products:', error);
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('events.deleteConfirm'))) {
      try {
        await deleteEvent(id);
        await refreshData();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleContractUpload = async (eventId: string, file: File) => {
    setUploadingContract(eventId);
    try {
      const { url, fileName } = await uploadContract(eventId, file);
      await updateEvent(eventId, { contractUrl: url, contractFileName: fileName });
      await refreshData();
    } catch (error) {
      console.error('Error uploading contract:', error);
    } finally {
      setUploadingContract(null);
    }
  };

  const handleContractDownload = (contractUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = contractUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewEventDetails = (event: Event) => {
    setSelectedEventForDetails(event);
    setShowEventDetails(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setIsNewClient(false);
    setIsNewProduct(false);
    setSelectedProducts([]);
    reset();
    resetClient();
    resetProduct();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Get payments for each event
  const getEventPayments = (eventId: string): Payment[] => {
    return payments.filter(payment => payment.eventId === eventId);
  };

  // Calculate payment summary for event
  const getPaymentSummary = (eventId: string) => {
    const eventPayments = getEventPayments(eventId);
    const totalReceived = eventPayments.filter(p => p.received).reduce((sum, p) => sum + p.amount, 0);
    const totalPending = eventPayments.filter(p => !p.received).reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = eventPayments.length;
    
    return { totalReceived, totalPending, totalPayments, eventPayments };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">{t('events.title')}</h1>
          <p className="text-gray-600 mt-1">{t('events.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          {t('events.addEvent')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('events.searchEvents')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">{t('events.allStatus')}</option>
          <option value="planning">{t('events.status.planning')}</option>
          <option value="confirmed">{t('events.status.confirmed')}</option>
          <option value="completed">{t('events.status.completed')}</option>
          <option value="canceled">{t('events.status.canceled')}</option>
        </select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event) => {
          const paymentSummary = getPaymentSummary(event.id);
          
          return (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 
                    className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-purple-600 transition-colors"
                    onClick={() => handleViewEventDetails(event)}
                  >
                    {event.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                    {t(`events.status.${event.status}`)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleViewEventDetails(event)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title={t('events.checklist')}
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => handleViewEventDetails(event)}
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                    title={t('events.timeline')}
                  >
                    <Clock size={16} />
                  </button>
                  <button
                    onClick={() => handleViewEventDetails(event)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                    title={t('events.suppliers')}
                  >
                    <Truck size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{format(event.date, 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{event.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <User size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{event.clientName}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500 capitalize">{t(`events.types.${event.type}`)}</span>
                <span className="text-lg font-bold text-gray-900">
                  {t('currency')} {event.contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              {/* Payment Summary */}
              {paymentSummary.totalPayments > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Pagamentos ({paymentSummary.totalPayments})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Recebido:</span>
                      <span className="font-medium text-green-600">
                        {t('currency')} {paymentSummary.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Pendente:</span>
                      <span className="font-medium text-orange-600">
                        {t('currency')} {paymentSummary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Recent payments preview */}
                  {paymentSummary.eventPayments.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {paymentSummary.eventPayments.slice(0, 2).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center text-xs text-gray-500">
                          <span className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${payment.received ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            {format(payment.paymentDate, 'dd/MM/yyyy')}
                            {payment.installmentNumber && ` (${payment.installmentNumber}/${payment.totalInstallments})`}
                          </span>
                          <span>{t('currency')} {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      {paymentSummary.eventPayments.length > 2 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{paymentSummary.eventPayments.length - 2} mais pagamentos
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {event.details && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">{event.details}</p>
                </div>
              )}
              
              {/* Contract Section */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {event.contractUrl ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contrato anexado</span>
                    <button
                      onClick={() => handleContractDownload(event.contractUrl!, event.contractFileName!)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Baixar Contrato
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Nenhum contrato anexado</span>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleContractUpload(event.id, file);
                          }
                        }}
                        disabled={uploadingContract === event.id}
                      />
                      <span className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        {uploadingContract === event.id ? 'Enviando...' : 'Anexar Contrato'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('events.noEventsFound')}</p>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEvent ? t('events.editEvent') : t('events.addNewEvent')}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                {t('events.fields.client')} *
              </label>
              
              {!isNewClient ? (
                <>
                  <select
                    id="clientId"
                    {...register('clientId', { required: !isNewClient ? t('events.validation.clientRequired') : false })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">{t('events.fields.selectClient')}</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>
                  )}
                </>
              ) : null}
              
              <div className="mt-3 flex items-center">
                <input
                  type="checkbox"
                  id="newClient"
                  checked={isNewClient}
                  onChange={(e) => setIsNewClient(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="newClient" className="ml-2 block text-sm text-gray-900">
                  {t('events.newClient')}
                </label>
              </div>
              
              {isNewClient && (
                <div className="mt-3 bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">{t('events.newClientData')}</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('clients.fields.name')} *
                    </label>
                    <input
                      type="text"
                      {...registerClient('name', { required: t('clients.validation.nameRequired') })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {clientErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{clientErrors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('clients.fields.phone')}
                      </label>
                      <input
                        type="tel"
                        {...registerClient('phone')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('clients.fields.email')}
                      </label>
                      <input
                        type="email"
                        {...registerClient('email', {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: t('clients.validation.emailInvalid')
                          }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {clientErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{clientErrors.email.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('clients.fields.notes')}
                    </label>
                    <textarea
                      rows={2}
                      {...registerClient('notes')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                {t('events.fields.eventType')} *
              </label>
              <select
                id="type"
                {...register('type', { required: t('events.validation.typeRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('events.fields.selectEventType')}</option>
                <option value="wedding">{t('events.types.wedding')}</option>
                <option value="debutante">{t('events.types.debutante')}</option>
                <option value="birthday">{t('events.types.birthday')}</option>
                <option value="graduation">{t('events.types.graduation')}</option>
                <option value="other">{t('events.types.other')}</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('events.fields.eventName')} *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: t('events.validation.nameRequired') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                {t('events.fields.eventDate')} *
              </label>
              <input
                type="date"
                id="date"
                {...register('date', { required: t('events.validation.dateRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.status')} *
              </label>
              <select
                id="status"
                {...register('status', { required: t('events.validation.statusRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="planning">{t('events.status.planning')}</option>
                <option value="confirmed">{t('events.status.confirmed')}</option>
                <option value="completed">{t('events.status.completed')}</option>
                <option value="canceled">{t('events.status.canceled')}</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                {t('events.fields.location')} *
              </label>
              <input
                type="text"
                id="location"
                {...register('location', { required: t('events.validation.locationRequired') })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="contractTotal" className="block text-sm font-medium text-gray-700 mb-1">
                {t('events.fields.contractTotal')} ({t('currency')}) *
              </label>
              <input
                type="number"
                id="contractTotal"
                step="0.01"
                min="0"
                {...register('contractTotal', { 
                  required: t('events.validation.contractRequired'),
                  min: { value: 0, message: t('events.validation.amountPositive') }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.contractTotal && (
                <p className="text-red-500 text-sm mt-1">{errors.contractTotal.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
              {t('events.fields.additionalDetails')}
            </label>
            <textarea
              id="details"
              rows={3}
              {...register('details')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Products Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produtos/Serviços
            </label>
            
            <div className="space-y-3">
              {/* Product Selection */}
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                {products.length > 0 ? (
                  products.map(product => (
                    <label key={product.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(prev => [...prev, product.id]);
                          } else {
                            setSelectedProducts(prev => prev.filter(id => id !== product.id));
                          }
                        }}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {product.name} - R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum produto cadastrado</p>
                )}
              </div>
              
              {/* New Product Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="newProduct"
                  checked={isNewProduct}
                  onChange={(e) => setIsNewProduct(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="newProduct" className="ml-2 block text-sm text-gray-900">
                  Novo Produto/Serviço
                </label>
              </div>
              
              {/* New Product Form */}
              {isNewProduct && (
                <div className="mt-3 bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Dados do Novo Produto/Serviço</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      {...registerProduct('name', { required: 'Nome é obrigatório' })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {productErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{productErrors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...registerProduct('price', { 
                        required: 'Preço é obrigatório',
                        min: { value: 0, message: 'Preço deve ser positivo' }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {productErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{productErrors.price.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      rows={2}
                      {...registerProduct('description')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {editingEvent ? t('common.update') : t('common.create')} {t('navigation.events')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={showEventDetails}
        onClose={() => {
          setShowEventDetails(false);
          setSelectedEventForDetails(null);
        }}
        event={selectedEventForDetails}
      />
    </div>
  );
};

export default EventsPage;