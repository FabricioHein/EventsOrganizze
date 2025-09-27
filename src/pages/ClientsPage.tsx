import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { useTranslation } from 'react-i18next';
import { getClients, addClient, updateClient, deleteClient, uploadClientPhoto } from '../services/firebaseService';
import { Client } from '../types';
import { Plus, Search, Pencil, Trash2, Phone, Mail, User, Upload } from 'lucide-react';
import Modal from '../components/ui/Modal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { useForm } from 'react-hook-form';
import Button from '../components/ui/Button';


const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showValidation, validationErrors, triggerValidation, clearValidation, getFieldClassName } = useFormValidation();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Client, 'id' | 'createdAt' | 'userId'>>();

  useEffect(() => {
    fetchClients();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      const clientsData = await getClients(user.uid);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<Client, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    // Check for validation errors and highlight fields
    if (Object.keys(errors).length > 0) {
      triggerValidation(errors);
      return;
    }

    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
      } else {
        await addClient({ ...data, userId: user.uid });
      }
      
      await fetchClients();
      handleCloseModal();
      
      showToast({
        type: 'success',
        title: editingClient ? 'Cliente atualizado com sucesso' : 'Cliente criado com sucesso',
        message: editingClient ? 'As informações do cliente foram atualizadas.' : 'O cliente foi adicionado à sua base.'
      });
    } catch (error) {
      console.error('Error saving client:', error);
      showToast({
        type: 'error',
        title: 'Erro ao salvar cliente',
        message: 'Não foi possível salvar o cliente. Verifique os dados e tente novamente.'
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setValue('name', client.name);
    setValue('phone', client.phone);
    setValue('email', client.email);
    setValue('instagram', client.instagram || '');
    setValue('facebook', client.facebook || '');
    setValue('whatsapp', client.whatsapp || '');
    setValue('photoURL', client.photoURL || '');
    setValue('notes', client.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteClient(clientToDelete.id);
      await fetchClients();
      
      showToast({
        type: 'success',
        title: 'Cliente excluído com sucesso',
        message: 'O cliente foi removido da sua base.'
      });
      
      setDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      showToast({
        type: 'error',
        title: 'Erro ao excluir cliente',
        message: 'Não foi possível excluir o cliente. Tente novamente.'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePhotoUpload = async (clientId: string, file: File) => {
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB.');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    
    setUploadingPhoto(clientId);
    try {
      const photoURL = await uploadClientPhoto(clientId, file);
      await updateClient(clientId, { photoURL });
      await fetchClients();
      
      showToast({
        type: 'success',
        title: 'Foto atualizada com sucesso',
        message: 'A foto do cliente foi atualizada.'
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast({
        type: 'error',
        title: 'Erro ao fazer upload da foto',
        message: 'Não foi possível atualizar a foto. Tente novamente.'
      });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    clearValidation();
    reset();
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

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
          <h1 className="text-3xl font-bold text-gray-900">{t('clients.title')}</h1>
          <p className="text-gray-600 mt-1">{t('clients.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          {t('clients.addClient')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('clients.searchClients')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="relative mr-4">
                {client.photoURL ? (
                  <img
                    src={client.photoURL}
                    alt={client.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={24} className="text-gray-400" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-1 cursor-pointer hover:bg-purple-700 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoUpload(client.id, file);
                      }
                    }}
                    disabled={uploadingPhoto === client.id}
                  />
                  {uploadingPhoto === client.id ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                </label>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
              </div>
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                {/* Social Media Links */}
                <div className="flex space-x-2 mb-2">
                  {client.instagram && (
                    <a
                      href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600"
                      title="Instagram"
                    >
                      📷
                    </a>
                  )}
                  {client.facebook && (
                    <a
                      href={client.facebook.startsWith('http') ? client.facebook : `https://facebook.com/${client.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                      title="Facebook"
                    >
                      📘
                    </a>
                  )}
                  {client.whatsapp && (
                    <a
                      href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-600"
                      title="WhatsApp"
                    >
                      💬
                    </a>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(client)}
                  className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50"
                  title="Editar cliente"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDeleteClick(client)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Phone size={16} className="mr-2" />
                <span className="text-sm">{client.phone}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail size={16} className="mr-2" />
                <span className="text-sm">{client.email}</span>
              </div>
            </div>
            
            {client.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{client.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('clients.noClientsFound')}</p>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? t('clients.editClient') : t('clients.addNewClient')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clients.fields.name')} *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              className={getFieldClassName('name', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
            />
            {(showValidation && validationErrors.name) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clients.fields.phone')}
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className={getFieldClassName('phone', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clients.fields.email')}
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'E-mail inválido'
                }
              })}
              className={getFieldClassName('email', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
            />
            {(showValidation && validationErrors.email) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.email}</p>
            )}
          </div>

          {/* Social Media Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="text"
                id="instagram"
                {...register('instagram')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="@usuario"
              />
            </div>

            <div>
              <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="text"
                id="facebook"
                {...register('facebook')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="facebook.com/usuario"
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              id="whatsapp"
              {...register('whatsapp')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700 mb-1">
              Foto do Cliente
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {editingClient?.photoURL ? (
                  <img
                    src={editingClient.photoURL}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && editingClient) {
                      handlePhotoUpload(editingClient.id, file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clients.fields.notes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {editingClient ? t('common.update') : t('common.create')} {t('navigation.clients')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente?"
        itemName={clientToDelete?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ClientsPage;