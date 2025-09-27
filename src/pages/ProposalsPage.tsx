import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { usePremiumFeatureToast } from '../components/ui/PremiumFeatureToast';
import { getProposals, addProposal, updateProposal, deleteProposal, getClients } from '../services/firebaseService';
import { Proposal, ProposalItem, Client } from '../types';
import { Plus, Search, CreditCard as Edit2, Trash2, Send, Eye, CheckCircle, XCircle, Clock, FileText, MessageCircle, Lock, Crown, Pencil } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import ProposalPDFGenerator from '../components/ui/ProposalPDFGenerator';
import LimitReachedModal from '../components/ui/LimitReachedModal';
import PremiumPreviewModal from '../components/ui/PremiumPreviewModal';
import { useForm, useFieldArray } from 'react-hook-form';
import { format, addDays } from 'date-fns';

const ProposalsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const planLimits = usePlanLimits();
  const { showPremiumToast, showLimitReachedToast } = usePremiumFeatureToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showValidation, validationErrors, triggerValidation, clearValidation, getFieldClassName } = useFormValidation();

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<{
    clientId: string;
    title: string;
    description: string;
    items: ProposalItem[];
    validUntil: string;
  }>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  useEffect(() => {
    if (planLimits.hasProposals) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [proposalsData, clientsData] = await Promise.all([
        getProposals(user.uid),
        getClients(user.uid),
      ]);
      setProposals(proposalsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;

    // Check plan limits for free users
    if (!planLimits.hasProposals) {
      if (proposals.length >= planLimits.maxProposals) {
        setShowLimitModal(true);
        return;
      }
    }

    // Check for validation errors and highlight fields
    if (Object.keys(errors).length > 0) {
      triggerValidation(errors);
      return;
    }
    try {
      const selectedClient = clients.find(c => c.id === data.clientId);
      if (!selectedClient) return;

      const totalAmount = data.items.reduce((sum: number, item: ProposalItem) => 
        sum + (item.quantity * item.unitPrice), 0
      );

      const proposalData = {
        ...data,
        clientName: selectedClient.name,
        totalAmount,
        validUntil: new Date(data.validUntil),
        status: 'draft' as const,
        viewCount: 0,
        userId: user.uid,
      };

      if (editingProposal) {
        await updateProposal(editingProposal.id, proposalData);
      } else {
        await addProposal(proposalData);
      }
      
      await fetchData();
      handleCloseModal();
      
      showToast({
        type: 'success',
        title: editingProposal ? 'Proposta atualizada com sucesso' : 'Proposta criada com sucesso',
        message: editingProposal ? 'As informações da proposta foram atualizadas.' : 'A proposta foi criada e está pronta para envio.'
      });
    } catch (error) {
      console.error('Error saving proposal:', error);
      showToast({
        type: 'error',
        title: 'Erro ao salvar proposta',
        message: 'Não foi possível salvar a proposta. Verifique os dados e tente novamente.'
      });
    }
  };

  const handleAddProposal = () => {
    if (!planLimits.hasProposals && proposals.length >= planLimits.maxProposals) {
      setShowLimitModal(true);
      return;
    }
    
    if (!planLimits.hasProposals) {
      setShowPreviewModal(true);
      return;
    }
    
    setIsModalOpen(true);
  };

  const handleEdit = (proposal: Proposal) => {
    if (!planLimits.hasProposals) {
      showPremiumToast('Edição de Propostas', 'Profissional');
      return;
    }
    
    setEditingProposal(proposal);
    setValue('clientId', proposal.clientId);
    setValue('title', proposal.title);
    setValue('description', proposal.description);
    setValue('items', proposal.items);
    setValue('validUntil', format(proposal.validUntil, 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const handleDeleteClick = (proposal: Proposal) => {
    setProposalToDelete(proposal);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!proposalToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteProposal(proposalToDelete.id);
      await fetchData();
      
      showToast({
        type: 'success',
        title: 'Proposta excluída com sucesso',
        message: 'A proposta foi removida do sistema.'
      });
      
      setDeleteModalOpen(false);
      setProposalToDelete(null);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      showToast({
        type: 'error',
        title: 'Erro ao excluir proposta',
        message: 'Não foi possível excluir a proposta. Tente novamente.'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendProposal = async (proposal: Proposal) => {
    if (!planLimits.hasProposals) {
      showPremiumToast('Envio de Propostas', 'Profissional');
      return;
    }
    
    try {
      await updateProposal(proposal.id, {
        status: 'sent',
        sentAt: new Date()
      });
      await fetchData();
      
      showToast({
        type: 'success',
        title: 'Proposta enviada com sucesso',
        message: 'A proposta foi marcada como enviada.'
      });
      
      // Generate PDF and send via WhatsApp
      setGeneratingPDF(proposal.id);
    } catch (error) {
      console.error('Error sending proposal:', error);
      showToast({
        type: 'error',
        title: 'Erro ao enviar proposta',
        message: 'Não foi possível marcar a proposta como enviada.'
      });
    }
  };

  const handlePDFGenerated = (proposal: Proposal, pdfBlob: Blob) => {
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Proposta-${proposal.title.replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Generate WhatsApp message
    const message = `Olá ${proposal.clientName}! 

Segue em anexo nossa proposta para ${proposal.title}.

Valor total: R$ ${proposal.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Válida até: ${format(proposal.validUntil, 'dd/MM/yyyy')}

Estamos à disposição para esclarecer qualquer dúvida!

Atenciosamente,
Equipe EventFinance`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    showToast({
      type: 'success',
      title: 'PDF gerado com sucesso',
      message: 'O PDF foi gerado e o WhatsApp foi aberto para envio.'
    });
    
    setGeneratingPDF(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProposal(null);
    clearValidation();
    reset();
  };

  const addItem = () => {
    append({
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    });
  };

  const calculateTotal = () => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send size={16} />;
      case 'viewed':
        return <Eye size={16} />;
      case 'accepted':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const filteredProposals = proposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user has access to proposals
  if (!planLimits.hasProposals && proposals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Propostas</h1>
            <p className="text-gray-600 mt-1">Gerencie suas propostas comerciais</p>
          </div>
          <Button onClick={handleAddProposal}>
            <Plus size={20} className="mr-2" />
            Nova Proposta
          </Button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <Lock size={48} className="text-purple-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-purple-900 mb-4">
            Propostas Profissionais
          </h2>
          <p className="text-purple-700 mb-6 max-w-2xl mx-auto">
            Crie propostas personalizadas, envie por WhatsApp/Email e acompanhe visualizações. 
            Disponível no Plano Profissional!
          </p>
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="flex items-center text-purple-600">
              <CheckCircle size={16} className="mr-2" />
              <span className="text-sm">Propostas ilimitadas</span>
            </div>
            <div className="flex items-center text-purple-600">
              <CheckCircle size={16} className="mr-2" />
              <span className="text-sm">Envio automático</span>
            </div>
            <div className="flex items-center text-purple-600">
              <CheckCircle size={16} className="mr-2" />
              <span className="text-sm">Rastreamento de visualizações</span>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = '/subscription'}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
          >
            <Crown size={20} className="mr-2" />
            Fazer Upgrade 🚀
          </Button>
        </div>

        {/* Preview Modal */}
        <PremiumPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          featureName="Propostas Profissionais"
          requiredPlan="Profissional"
          benefits={[
            'Propostas ilimitadas',
            'Templates personalizados',
            'Envio por WhatsApp/Email',
            'Rastreamento de visualizações',
            'Assinatura digital',
            'Relatórios de conversão'
          ]}
          previewContent={
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Proposta: Casamento Maria & João</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Decoração completa</span>
                  <span>R$ 5.000,00</span>
                </div>
                <div className="flex justify-between">
                  <span>Buffet premium</span>
                  <span>R$ 8.000,00</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ 13.000,00</span>
                </div>
              </div>
            </div>
          }
        />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Propostas</h1>
          <p className="text-gray-600 mt-1">Gerencie suas propostas comerciais</p>
          {!planLimits.hasProposals && (
            <div className="mt-2 flex items-center text-orange-600">
              <Lock size={16} className="mr-1" />
              <span className="text-sm font-medium">
                Limite: {proposals.length}/{planLimits.maxProposals} propostas
              </span>
            </div>
          )}
        </div>
        <Button onClick={handleAddProposal}>
          <Plus size={20} className="mr-2" />
          Nova Proposta
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Pesquisar propostas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <div key={proposal.id} className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
            !planLimits.hasProposals ? 'opacity-75' : ''
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">
                    {proposal.title}
                  </h3>
                  {!planLimits.hasProposals && (
                    <Lock size={16} className="text-orange-500 mr-2" />
                  )}
                  <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(proposal.status)}`}>
                    {getStatusIcon(proposal.status)}
                    <span className="ml-1 capitalize">{proposal.status}</span>
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Cliente:</strong> {proposal.clientName}</p>
                  <p><strong>Válida até:</strong> {format(proposal.validUntil, 'dd/MM/yyyy')}</p>
                  <p><strong>Criada em:</strong> {format(proposal.createdAt, 'dd/MM/yyyy')}</p>
                  {proposal.viewCount > 0 && (
                    <p><strong>Visualizações:</strong> {proposal.viewCount}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className="text-2xl font-bold text-gray-900">
                  R$ {proposal.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                
                <div className="flex space-x-2">
                  {proposal.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendProposal(proposal)}
                      className={`${
                        planLimits.hasProposals 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      disabled={generatingPDF === proposal.id}
                    >
                      <MessageCircle size={16} className="mr-1" />
                      {generatingPDF === proposal.id ? 'Gerando...' : 'WhatsApp'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (!planLimits.hasProposals) {
                        showPremiumToast('Geração de PDF', 'Profissional');
                        return;
                      }
                      setGeneratingPDF(proposal.id);
                    }}
                    disabled={generatingPDF === proposal.id}
                  >
                    <FileText size={16} className="mr-1" />
                    PDF
                  </Button>
                  <button
                    onClick={() => handleEdit(proposal)}
                    className={`transition-colors p-2 rounded-lg ${
                      planLimits.hasProposals
                        ? 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="Editar proposta"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(proposal)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma proposta encontrada</p>
        </div>
      )}

      {/* Add/Edit Proposal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProposal ? 'Editar Proposta' : 'Nova Proposta'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                id="clientId"
                {...register('clientId', { required: 'Cliente é obrigatório' })}
                className={getFieldClassName('clientId', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {(showValidation && validationErrors.clientId) && (
                <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.clientId}</p>
              )}
            </div>

            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">
                Válida até *
              </label>
              <input
                type="date"
                id="validUntil"
                {...register('validUntil', { required: 'Data de validade é obrigatória' })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className={getFieldClassName('validUntil', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
              />
              {(showValidation && validationErrors.validUntil) && (
                <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.validUntil}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título da Proposta *
            </label>
            <input
              type="text"
              id="title"
              {...register('title', { required: 'Título é obrigatório' })}
              className={getFieldClassName('title', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
              placeholder="Ex: Decoração Casamento Maria e João"
            />
            {(showValidation && validationErrors.title) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.title}</p>
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
              placeholder="Descrição geral da proposta..."
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Itens da Proposta</h3>
              <Button type="button" onClick={addItem} size="sm">
                <Plus size={16} className="mr-1" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        {...register(`items.${index}.description` as const, { required: 'Descrição é obrigatória' })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Descrição do item/serviço"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity` as const, { required: true, min: 1 })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor Unitário
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice` as const, { required: true, min: 0 })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-medium text-gray-700">
                      Total: R$ {((watchedItems?.[index]?.quantity || 0) * (watchedItems?.[index]?.unitPrice || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Geral:</span>
                <span className="text-2xl font-bold text-purple-600">
                  R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingProposal ? 'Atualizar' : 'Criar'} Proposta
            </Button>
          </div>
        </form>
      </Modal>

      {/* PDF Generator */}
      {generatingPDF && (
        <ProposalPDFGenerator
          proposal={proposals.find(p => p.id === generatingPDF)!}
          onGenerate={(pdfBlob) => {
            const proposal = proposals.find(p => p.id === generatingPDF)!;
            handlePDFGenerated(proposal, pdfBlob);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProposalToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Proposta"
        message="Tem certeza que deseja excluir esta proposta?"
        itemName={proposalToDelete?.title}
        loading={deleteLoading}
      />

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName="propostas"
        currentCount={proposals.length}
        limit={planLimits.maxProposals}
        requiredPlan="Profissional"
      />

      {/* Premium Preview Modal */}
      <PremiumPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        featureName="Propostas Profissionais"
        requiredPlan="Profissional"
        benefits={[
          'Propostas ilimitadas',
          'Templates personalizados',
          'Envio por WhatsApp/Email',
          'Rastreamento de visualizações',
          'Assinatura digital',
          'Relatórios de conversão'
        ]}
        previewContent={
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Proposta: Casamento Maria & João</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Decoração completa</span>
                <span>R$ 5.000,00</span>
              </div>
              <div className="flex justify-between">
                <span>Buffet premium</span>
                <span>R$ 8.000,00</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>R$ 13.000,00</span>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default ProposalsPage;