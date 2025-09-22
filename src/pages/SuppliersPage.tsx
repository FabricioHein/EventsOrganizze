import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../services/firebaseService';
import { Supplier } from '../types';
import { Plus, Search, Edit2, Trash2, Phone, Mail, Briefcase } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useForm } from 'react-hook-form';

const SuppliersPage: React.FC = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Supplier, 'id' | 'createdAt' | 'userId'>>();

  useEffect(() => {
    fetchSuppliers();
  }, [user]);

  const fetchSuppliers = async () => {
    if (!user) return;

    try {
      const suppliersData = await getSuppliers(user.uid);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<Supplier, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, data);
      } else {
        await addSupplier({ ...data, userId: user.uid });
      }
      
      await fetchSuppliers();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setValue('name', supplier.name);
    setValue('contact', supplier.contact);
    setValue('phone', supplier.phone || '');
    setValue('email', supplier.email || '');
    setValue('service', supplier.service);
    setValue('notes', supplier.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await deleteSupplier(id);
        await fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    reset();
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600 mt-1">Gerencie sua rede de fornecedores</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Adicionar Fornecedor
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Pesquisar fornecedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="text-gray-400 hover:text-purple-600 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-gray-600">
                <Briefcase size={16} className="mr-2 flex-shrink-0" />
                <span className="text-sm">{supplier.service}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone size={16} className="mr-2 flex-shrink-0" />
                <span className="text-sm">{supplier.contact}</span>
              </div>
              {supplier.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center text-gray-600">
                  <Mail size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{supplier.email}</span>
                </div>
              )}
            </div>
            
            {supplier.notes && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{supplier.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum fornecedor encontrado</p>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSupplier ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
              Serviço Oferecido *
            </label>
            <input
              type="text"
              id="service"
              {...register('service', { required: 'Serviço é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Decoração, Buffet, Fotografia..."
            />
            {errors.service && (
              <p className="text-red-500 text-sm mt-1">{errors.service.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
              Contato Principal *
            </label>
            <input
              type="text"
              id="contact"
              {...register('contact', { required: 'Contato é obrigatório' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Telefone ou WhatsApp principal"
            />
            {errors.contact && (
              <p className="text-red-500 text-sm mt-1">{errors.contact.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone Adicional
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Informações adicionais, preços, qualidade do serviço..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingSupplier ? 'Atualizar' : 'Criar'} Fornecedor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;