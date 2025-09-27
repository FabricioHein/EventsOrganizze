import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { Product } from '../types';
import { Plus, Search, CreditCard as Edit2, Trash2, Package, DollarSign, Pencil } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { useForm } from 'react-hook-form';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/firebaseService';

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showValidation, validationErrors, triggerValidation, clearValidation, getFieldClassName } = useFormValidation();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Product, 'id' | 'createdAt' | 'userId'>>();

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const productsData = await getProducts(user.uid);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    // Check for validation errors and highlight fields
    if (Object.keys(errors).length > 0) {
      triggerValidation(errors);
      return;
    }
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct({ ...data, userId: user.uid });
      }
      
      await fetchProducts();
      handleCloseModal();
      
      showToast({
        type: 'success',
        title: editingProduct ? 'Produto/Serviço atualizado com sucesso' : 'Produto/Serviço criado com sucesso',
        message: editingProduct ? 'As informações foram atualizadas.' : 'O produto/serviço foi adicionado ao catálogo.'
      });
    } catch (error) {
      console.error('Error saving product:', error);
      showToast({
        type: 'error',
        title: 'Erro ao salvar produto/serviço',
        message: 'Não foi possível salvar. Verifique os dados e tente novamente.'
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue('name', product.name);
    setValue('price', product.price);
    setValue('description', product.description || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      await fetchProducts();
      
      showToast({
        type: 'success',
        title: 'Produto/Serviço excluído com sucesso',
        message: 'O item foi removido do catálogo.'
      });
      
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast({
        type: 'error',
        title: 'Erro ao excluir produto/serviço',
        message: 'Não foi possível excluir o item. Tente novamente.'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    clearValidation();
    reset();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-3xl font-bold text-gray-900">Produtos/Serviços</h1>
          <p className="text-gray-600 mt-1">Gerencie seu catálogo de produtos e serviços</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Adicionar Produto/Serviço
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Pesquisar produtos/serviços..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Package size={20} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50"
                  title="Editar produto/serviço"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDeleteClick(product)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center text-green-600 mb-2">
                <DollarSign size={16} className="mr-1" />
                <span className="text-xl font-bold">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            {product.description && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{product.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum produto/serviço encontrado</p>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Editar Produto/Serviço' : 'Adicionar Novo Produto/Serviço'}
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
              className={getFieldClassName('name', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
              placeholder="Ex: Decoração Completa, Buffet Premium..."
            />
            {(showValidation && validationErrors.name) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              id="price"
              {...register('price', { 
                required: 'Preço é obrigatório',
                min: { value: 0, message: 'Preço deve ser positivo' }
              })}
              className={getFieldClassName('price', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
              placeholder="0.00"
            />
            {(showValidation && validationErrors.price) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descreva o produto ou serviço..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingProduct ? 'Atualizar' : 'Criar'} Produto/Serviço
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Produto/Serviço"
        message="Tem certeza que deseja excluir este produto/serviço?"
        itemName={productToDelete?.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ProductsPage;