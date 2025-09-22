import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProposals, addProposal, updateProposal, deleteProposal, getClients } from '../services/firebaseService';
import { Proposal, ProposalItem, Client } from '../types';
import { Plus, Search, Edit2, Trash2, Send, Eye, CheckCircle, XCircle, Clock, FileText, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProposalPDFGenerator from '../components/ui/ProposalPDFGenerator';
import { useForm, useFieldArray } from 'react-hook-form';
import { format, addDays } from 'date-fns';

const ProposalsPage: React.FC = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

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
    fetchData();
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
    } catch (error) {
      console.error('Error saving proposal:', error);
    }
  };

  const handleEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setValue('clientId', proposal.clientId);
    setValue('title', proposal.title);
    setValue('description', proposal.description);
    setValue('items', proposal.items);
    setValue('validUntil', format(proposal.validUntil, 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta proposta?')) {
      try {
        await deleteProposal(id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting proposal:', error);
      }
    }
  };

  const handleSendProposal = async (proposal: Proposal) => {
    try {
      await updateProposal(proposal.id, {
        status: 'sent',
        sentAt: new Date()
      });
      await fetchData();
      
      // Generate PDF and send via WhatsApp
      setGeneratingPDF(proposal.id);
    } catch (error) {
      console.error('Error sending proposal:', error);
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
    
    setGeneratingPDF(null);
    alert('PDF gerado! Agora você pode anexar o arquivo no WhatsApp que foi aberto.');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProposal(null);
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
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
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
          <div key={proposal.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">
                    {proposal.title}
                  </h3>
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
                      className="bg-green-600 hover:bg-green-700"
                      disabled={generatingPDF === proposal.id}
                    >
                      <MessageCircle size={16} className="mr-1" />
                      {generatingPDF === proposal.id ? 'Gerando...' : 'WhatsApp'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setGeneratingPDF(proposal.id)}
                    disabled={generatingPDF === proposal.id}
                  >
                    <FileText size={16} className="mr-1" />
                    PDF
                  </Button>
                  <button
                    onClick={() => handleEdit(proposal)}
                    className="text-gray-400 hover:text-purple-600 transition-colors p-2"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(proposal.id)}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.validUntil && (
                <p className="text-red-500 text-sm mt-1">{errors.validUntil.message}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Decoração Casamento Maria e João"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
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
    </div>
  );
};

export default ProposalsPage;