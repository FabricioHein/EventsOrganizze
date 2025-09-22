import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEvents, addEvent, updateEvent, deleteEvent, getClients } from '../services/firebaseService';
import { Event, Client } from '../types';
import { Plus, Search, Edit2, Trash2, Calendar, MapPin, User, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PaymentInstallmentsModal from '../components/ui/PaymentInstallmentsModal';
import { uploadContract, deleteContract, addPaymentInstallments } from '../services/firebaseService';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import EventDetailsModal from '../components/ui/EventDetailsModal';

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [selectedEventForInstallments, setSelectedEventForInstallments] = useState<Event | null>(null);
  const [uploadingContract, setUploadingContract] = useState<string | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Omit<Event, 'id' | 'createdAt' | 'userId' | 'clientName'>>();

  const watchedClientId = watch('clientId');
  const watchedType = watch('type');

  useEffect(() => {
    fetchData();
  }, [user]);

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

  const fetchData = async () => {
    if (!user) return;

    try {
      const [eventsData, clientsData] = await Promise.all([
        getEvents(user.uid),
        getClients(user.uid),
      ]);
      setEvents(eventsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<Event, 'id' | 'createdAt' | 'userId' | 'clientName'>) => {
    if (!user) return;

    try {
      const selectedClient = clients.find(c => c.id === data.clientId);
      if (!selectedClient) return;

      const eventData = {
        ...data,
        date: new Date(data.date),
        contractTotal: Number(data.contractTotal),
        clientName: selectedClient.name,
        userId: user.uid,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await addEvent(eventData);
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setValue('name', event.name);
    setValue('type', event.type);
    setValue('date', format(event.date, 'yyyy-MM-dd') as any);
    setValue('location', event.location);
    setValue('clientId', event.clientId);
    setValue('status', event.status);
    setValue('contractTotal', event.contractTotal as any);
    setValue('details', event.details || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('events.deleteConfirm'))) {
      try {
        await deleteEvent(id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleCreateInstallments = (event: Event) => {
    setSelectedEventForInstallments(event);
    setShowInstallmentsModal(true);
  };

  const handleSaveInstallments = async (installments: any[]) => {
    if (!user || !selectedEventForInstallments) return;

    try {
      // First, delete existing installments for this event
      const existingPayments = payments.filter(p => p.eventId === selectedEventForInstallments.id);
      for (const payment of existingPayments) {
        await deletePayment(payment.id);
      }
      
      // Then add new installments
      await addPaymentInstallments(
        selectedEventForInstallments.id,
        selectedEventForInstallments.name,
        user.uid,
        installments
      );
      
      // Refresh data
      await fetchData();
      setShowInstallmentsModal(false);
      setSelectedEventForInstallments(null);
    } catch (error) {
      console.error('Error saving installments:', error);
      alert('Erro ao salvar parcelamento. Tente novamente.');
    }
  };

  const handleContractUpload = async (eventId: string, file: File) => {
    setUploadingContract(eventId);
    try {
      const { url, fileName } = await uploadContract(eventId, file);
      await updateEvent(eventId, { contractUrl: url, contractFileName: fileName });
      await fetchData();
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
    reset();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
        {filteredEvents.map((event) => (
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
                  onClick={() => handleCreateInstallments(event)}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  title="Criar parcelamento"
                >
                  <DollarSign size={16} />
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
        ))}
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
              <select
                id="clientId"
                {...register('clientId', { required: t('events.validation.clientRequired') })}
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

      {/* Payment Installments Modal */}
      <PaymentInstallmentsModal
        isOpen={showInstallmentsModal}
        onClose={() => {
          setShowInstallmentsModal(false);
          setSelectedEventForInstallments(null);
        }}
        onSave={handleSaveInstallments}
        eventName={selectedEventForInstallments?.name || ''}
        contractTotal={selectedEventForInstallments?.contractTotal || 0}
      />
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