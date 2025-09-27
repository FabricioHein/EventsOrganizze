import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { Guest, Event, GuestImportData } from '../types';
import { Plus, Search, CreditCard as Edit2, Trash2, Phone, Mail, Users, MessageCircle, Upload, Download, CheckCircle, XCircle, Clock, Crown, Lock, Pencil } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import PlanUpgradeModal from '../components/ui/PlanUpgradeModal';
import { useForm } from 'react-hook-form';
import { 
  addGuest, 
  getEventGuests, 
  updateGuest, 
  deleteGuest, 
  addGuestsBatch,
  sendGuestInvite 
} from '../services/firebaseService';
import * as Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const GuestsPage: React.FC = () => {
  const { user } = useAuth();
  const { events, refreshGuests } = useData();
  const { showToast } = useToast();
  const planLimits = usePlanLimits();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<GuestImportData[]>([]);
  const [selectedEventForImport, setSelectedEventForImport] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedEventForExport, setSelectedEventForExport] = useState<string>('');
  const [pasteData, setPasteData] = useState<string>('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showValidation, validationErrors, triggerValidation, clearValidation, getFieldClassName } = useFormValidation();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Guest, 'id' | 'createdAt' | 'userId' | 'eventName' | 'inviteHistory'>>();

  useEffect(() => {
    if (planLimits.hasGuestManagement) {
      fetchGuests();
    } else {
      setLoading(false);
    }
  }, [user, planLimits.hasGuestManagement]);

  const fetchGuests = async () => {
    if (!user) return;

    try {
      // Get guests for all user events
      const allGuests: Guest[] = [];
      for (const event of events) {
        const eventGuests = await getEventGuests(event.id);
        allGuests.push(...eventGuests);
      }
      setGuests(allGuests);
    } catch (error) {
      console.error('Error fetching guests:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar convidados',
        message: 'Não foi possível carregar a lista de convidados.'
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<Guest, 'id' | 'createdAt' | 'userId' | 'eventName' | 'inviteHistory'>) => {
    if (!user) return;

    // Check for validation errors and highlight fields
    if (Object.keys(errors).length > 0) {
      triggerValidation(errors);
      return;
    }
    try {
      const selectedEvent = events.find(e => e.id === data.eventId);
      if (!selectedEvent) return;

      const guestData = {
        ...data,
        eventName: selectedEvent.name,
        totalGuests: data.adults + data.children,
        status: 'pending' as const,
        inviteHistory: [],
        userId: user.uid,
      };

      if (editingGuest) {
        await updateGuest(editingGuest.id, guestData);
        showToast({
          type: 'success',
          title: 'Convidado atualizado com sucesso',
          message: 'As informações do convidado foram atualizadas.'
        });
      } else {
        await addGuest(guestData);
        showToast({
          type: 'success',
          title: 'Convidado adicionado com sucesso',
          message: 'O convidado foi adicionado à lista do evento.'
        });
      }
      
      await fetchGuests();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving guest:', error);
      showToast({
        type: 'error',
        title: 'Erro ao salvar convidado',
        message: 'Não foi possível salvar o convidado. Verifique os dados e tente novamente.'
      });
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setValue('eventId', guest.eventId);
    setValue('name', guest.name);
    setValue('phone', guest.phone);
    setValue('email', guest.email || '');
    setValue('adults', guest.adults);
    setValue('children', guest.children);
    setValue('notes', guest.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (guest: Guest) => {
    setGuestToDelete(guest);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!guestToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteGuest(guestToDelete.id);
      await fetchGuests();
      
      showToast({
        type: 'success',
        title: 'Convidado excluído com sucesso',
        message: 'O convidado foi removido da lista.'
      });
      
      setDeleteModalOpen(false);
      setGuestToDelete(null);
    } catch (error) {
      console.error('Error deleting guest:', error);
      showToast({
        type: 'error',
        title: 'Erro ao excluir convidado',
        message: 'Não foi possível excluir o convidado. Tente novamente.'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGuest(null);
    clearValidation();
    reset();
  };

  const handleSendInvite = async (guest: Guest, method: 'whatsapp' | 'email') => {
    try {
      const result = await sendGuestInvite(guest.id, method);
      
      if (result.type === 'whatsapp') {
        window.open(result.url, '_blank');
      } else {
        window.location.href = result.url;
      }
      
      await fetchGuests();
      
      showToast({
        type: 'success',
        title: 'Convite enviado',
        message: `O ${method === 'whatsapp' ? 'WhatsApp' : 'email'} foi aberto para envio do convite.`
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      showToast({
        type: 'error',
        title: 'Erro ao enviar convite',
        message: 'Não foi possível preparar o convite. Tente novamente.'
      });
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    event.target.value = '';
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers to handle different formats
        const normalized = header.toLowerCase().trim();
        if (normalized.includes('nome') || normalized.includes('name')) return 'name';
        if (normalized.includes('telefone') || normalized.includes('phone') || normalized.includes('celular')) return 'phone';
        if (normalized.includes('email') || normalized.includes('e-mail')) return 'email';
        if (normalized.includes('adulto') || normalized.includes('adult')) return 'adults';
        if (normalized.includes('criança') || normalized.includes('crianca') || normalized.includes('children') || normalized.includes('child')) return 'children';
        return header;
      },
      complete: (results) => {
        try {
          console.log('CSV parsing results:', results);
          const data = results.data as any[];
          
          if (!data || data.length === 0) {
            showToast({
              type: 'error',
              title: 'Arquivo vazio',
              message: 'O arquivo CSV não contém dados válidos.'
            });
            return;
          }

          const processedData: GuestImportData[] = data
            .filter(row => {
              // Check if row has at least name and phone
              const hasName = row.name || row.Nome || row.NAME;
              const hasPhone = row.phone || row.Telefone || row.TELEFONE || row.Phone || row.PHONE;
              return hasName && hasPhone;
            })
            .map(row => ({
              name: (row.name || row.Nome || row.NAME || '').toString().trim(),
              phone: (row.phone || row.Telefone || row.TELEFONE || row.Phone || row.PHONE || '').toString().trim(),
              email: (row.email || row.Email || row.EMAIL || '').toString().trim(),
              adults: Math.max(1, parseInt(row.adults || row.Adultos || row.ADULTOS || row.Adults || row.ADULTS || '1') || 1),
              children: Math.max(0, parseInt(row.children || row.Criancas || row.CRIANCAS || row.Children || row.CHILDREN || '0') || 0),
            }));

          console.log('Processed data:', processedData);

          if (processedData.length === 0) {
            showToast({
              type: 'error',
              title: 'Nenhum dado válido encontrado',
              message: 'Verifique se o arquivo CSV contém as colunas: Nome e Telefone (obrigatórios).'
            });
            return;
          }

          setImportData(processedData);
          setShowImportModal(true);
          
          showToast({
            type: 'success',
            title: 'Arquivo processado com sucesso',
            message: `${processedData.length} convidado(s) encontrado(s) no arquivo.`
          });
        } catch (error) {
          console.error('Error processing CSV:', error);
          showToast({
            type: 'error',
            title: 'Erro ao processar arquivo',
            message: 'Formato de arquivo inválido. Verifique se é um CSV válido com colunas: Nome, Telefone.'
          });
        }
      },
      error: (error) => {
        console.error('Papa parse error:', error);
        showToast({
          type: 'error',
          title: 'Erro ao ler arquivo',
          message: 'Não foi possível ler o arquivo. Verifique o formato e tente novamente.'
        });
      }
    });
  };

  const handlePasteImport = () => {
    if (!pasteData.trim()) return;

    try {
      // Parse pasted data (assuming tab-separated or comma-separated)
      const lines = pasteData.trim().split('\n');
      const processedData: GuestImportData[] = [];
      const errors: string[] = [];

      lines.forEach((line, index) => {
        // Skip header row if it exists
        if (index === 0 && (line.toLowerCase().includes('nome') || line.toLowerCase().includes('name'))) {
          return;
        }

        // Try tab-separated first, then comma-separated
        let columns = line.split('\t');
        if (columns.length === 1) {
          columns = line.split(',');
        }

        if (columns.length >= 2 && columns[0].trim() && columns[1].trim()) {
          const name = columns[0].trim();
          const phone = columns[1].trim();
          const email = columns[2]?.trim() || '';
          const adults = parseInt(columns[3]?.trim() || '1') || 1;
          const children = parseInt(columns[4]?.trim() || '0') || 0;
          
          // Validations
          if (name.length > 300) {
            errors.push(`Linha ${index + 1}: Nome muito longo (máx. 300 caracteres)`);
            return;
          }
          
          if (phone.length < 8 || phone.length > 20) {
            errors.push(`Linha ${index + 1}: Telefone inválido (deve ter entre 8 e 20 caracteres)`);
            return;
          }
          
          if (email && email.length > 0 && !email.includes('@')) {
            errors.push(`Linha ${index + 1}: Email inválido`);
            return;
          }
          
          if (adults < 1 || adults > 50) {
            errors.push(`Linha ${index + 1}: Número de adultos inválido (1-50)`);
            return;
          }
          
          if (children < 0 || children > 50) {
            errors.push(`Linha ${index + 1}: Número de crianças inválido (0-50)`);
            return;
          }
          
          processedData.push({
            name,
            phone,
            email,
            adults,
            children,
          });
        }
      });

      if (errors.length > 0) {
        showToast({
          type: 'error',
          title: 'Erros de validação encontrados',
          message: `${errors.length} erro(s) encontrado(s). Verifique os dados e tente novamente.`
        });
        console.error('Validation errors:', errors);
        return;
      }

      if (processedData.length > 0) {
        setImportData(processedData);
        setShowImportModal(true);
        setShowPasteModal(false);
        setPasteData('');
        
        showToast({
          type: 'success',
          title: 'Dados processados com sucesso',
          message: `${processedData.length} convidado(s) encontrado(s) nos dados colados.`
        });
      } else {
        showToast({
          type: 'error',
          title: 'Nenhum dado válido encontrado',
          message: 'Verifique o formato dos dados. Use: Nome, Telefone, Email, Adultos, Crianças (separados por tab ou vírgula).'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao processar dados',
        message: 'Formato inválido. Cole os dados no formato: Nome, Telefone, Email, Adultos, Crianças.'
      });
    }
  };

  const exportGuestsToPDF = async () => {
    if (!selectedEventForExport) return;

    try {
      const selectedEvent = events.find(e => e.id === selectedEventForExport);
      if (!selectedEvent) return;

      const eventGuests = guests.filter(g => g.eventId === selectedEventForExport);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(16);
      doc.setTextColor(139, 92, 246);
      doc.text('LISTA DE CONVIDADOS', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Evento: ${selectedEvent.name}`, 20, 35);
      doc.text(`Data: ${format(selectedEvent.date, 'dd/MM/yyyy')}`, 20, 45);
      doc.text(`Total de Convidados: ${eventGuests.length}`, 20, 55);
      doc.text(`Total de Pessoas: ${eventGuests.reduce((sum, g) => sum + g.totalGuests, 0)}`, 20, 65);
      
      // Table data
      const tableData = eventGuests.map(guest => [
        guest.name,
        guest.phone,
        guest.email || '-',
        guest.adults.toString(),
        guest.children.toString(),
        guest.totalGuests.toString(),
        guest.status === 'confirmed' ? 'Confirmado' :
        guest.status === 'declined' ? 'Recusado' :
        guest.status === 'sent' ? 'Enviado' : 'Pendente'
      ]);
      
      // Add table
      (doc as any).autoTable({
        head: [['Nome', 'Telefone', 'Email', 'Adultos', 'Crianças', 'Total', 'Status']],
        body: tableData,
        startY: 75,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
        alternateRowStyles: { fillColor: [248, 249, 250] },
      });
      
      doc.save(`convidados-${selectedEvent.name.replace(/\s+/g, '-')}.pdf`);
      
      showToast({
        type: 'success',
        title: 'PDF gerado com sucesso',
        message: 'A lista de convidados foi exportada em PDF.'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast({
        type: 'error',
        title: 'Erro ao gerar PDF',
        message: 'Não foi possível gerar o PDF. Tente novamente.'
      });
    }
  };

  const exportGuestsToCSV = () => {
    if (!selectedEventForExport) return;

    try {
      const selectedEvent = events.find(e => e.id === selectedEventForExport);
      if (!selectedEvent) return;

      const eventGuests = guests.filter(g => g.eventId === selectedEventForExport);
      
      const csvData = eventGuests.map(guest => ({
        Nome: guest.name,
        Telefone: guest.phone,
        Email: guest.email || '',
        Adultos: guest.adults,
        Criancas: guest.children,
        Total: guest.totalGuests,
        Status: guest.status === 'confirmed' ? 'Confirmado' :
                guest.status === 'declined' ? 'Recusado' :
                guest.status === 'sent' ? 'Enviado' : 'Pendente',
        Evento: guest.eventName,
        'Data do Evento': format(selectedEvent.date, 'dd/MM/yyyy')
      }));
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `convidados-${selectedEvent.name.replace(/\s+/g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast({
        type: 'success',
        title: 'CSV gerado com sucesso',
        message: 'A lista de convidados foi exportada em CSV.'
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      showToast({
        type: 'error',
        title: 'Erro ao gerar CSV',
        message: 'Não foi possível gerar o CSV. Tente novamente.'
      });
    }
  };

  const handleImportGuests = async () => {
    if (!selectedEventForImport || importData.length === 0) return;

    try {
      const selectedEvent = events.find(e => e.id === selectedEventForImport);
      if (!selectedEvent) return;

      const guestsToAdd = importData.map(data => ({
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        name: data.name,
        phone: data.phone,
        email: data.email,
        adults: data.adults,
        children: data.children,
        totalGuests: data.adults + data.children,
        status: 'pending' as const,
        inviteHistory: [],
        userId: user?.uid || '',
      }));

      await addGuestsBatch(guestsToAdd);
      await fetchGuests();
      
      setShowImportModal(false);
      setImportData([]);
      setSelectedEventForImport('');
      
      showToast({
        type: 'success',
        title: 'Convidados importados com sucesso',
        message: `${guestsToAdd.length} convidado(s) foram adicionados ao evento.`
      });
    } catch (error) {
      console.error('Error importing guests:', error);
      showToast({
        type: 'error',
        title: 'Erro ao importar convidados',
        message: 'Não foi possível importar os convidados. Tente novamente.'
      });
    }
  };


  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone.includes(searchTerm) ||
                         (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEvent = filterEvent === 'all' || guest.eventId === filterEvent;
    const matchesStatus = filterStatus === 'all' || guest.status === filterStatus;
    
    return matchesSearch && matchesEvent && matchesStatus;
  });

  // Calculate statistics based on filtered guests
  const filteredGuestCount = filteredGuests.length;
  const confirmedGuests = filteredGuests.filter(g => g.status === 'confirmed').length;
  const pendingGuests = filteredGuests.filter(g => g.status === 'pending' || g.status === 'sent').length;
  const totalPeople = filteredGuests.reduce((sum, guest) => sum + Number(guest.totalGuests), 0);
  // Pagination logic
  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGuests = filteredGuests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEvent, filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} />;
      case 'declined':
        return <XCircle size={16} />;
      case 'sent':
        return <MessageCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  // Check if user has access to guest management
  if (!planLimits.hasGuestManagement) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Convidados - RSVP</h1>
            <p className="text-gray-600 mt-1">Gerencie convites e confirmações de presença</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <Lock size={48} className="text-purple-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-purple-900 mb-4">
            Recurso Premium
          </h2>
          <p className="text-purple-700 mb-6 max-w-2xl mx-auto">
            A gestão de convidados com RSVP está disponível apenas nos planos pagos. 
            Upgrade seu plano para acessar este recurso e muito mais!
          </p>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center text-purple-600">
              <CheckCircle size={16} className="mr-2" />
              <span className="text-sm">Convites por WhatsApp e Email</span>
            </div>
            <div className="flex items-center text-purple-600">
              <CheckCircle size={16} className="mr-2" />
              <span className="text-sm">Controle de confirmações</span>
            </div>
            <div className="flex items-center text-purple-600">
              <CheckCircle size={16} className="mr-2" />
              <span className="text-sm">Importação em massa</span>
            </div>
          </div>
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
          >
            <Crown size={20} className="mr-2" />
            Fazer Upgrade
          </Button>
        </div>

        <PlanUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          requiredPlan="Gestão de Convidados - RSVP"
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Convidados - RSVP</h1>
          <p className="text-gray-600 mt-1">Gerencie convites e confirmações de presença</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button 
            variant="secondary"
            onClick={() => setShowPasteModal(true)}
          >
            <Upload size={20} className="mr-2" />
            Importar Dados
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setShowExportModal(true)}
          >
            <Download size={20} className="mr-2" />
            Exportar Lista
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Adicionar Convidado
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Convidados</p>
              <p className="text-2xl font-bold text-purple-600">{filteredGuestCount}</p>
            </div>
            <Users className="h-12 w-12 text-purple-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-green-600">{confirmedGuests}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{pendingGuests}</p>
            </div>
            <Clock className="h-12 w-12 text-orange-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pessoas</p>
              <p className="text-2xl font-bold text-blue-600">{totalPeople}</p>
            </div>
            <Users className="h-12 w-12 text-blue-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar convidados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evento
            </label>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos os Eventos</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="sent">Enviado</option>
              <option value="confirmed">Confirmado</option>
              <option value="declined">Recusado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Convidados</h2>
            <span className="text-sm text-gray-500">
              {filteredGuests.length} convidado(s) encontrado(s)
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {paginatedGuests.map((guest) => (
            <div key={guest.id} className="p-6 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900 mr-3">
                      {guest.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(guest.status)}`}>
                      {getStatusIcon(guest.status)}
                      <span className="ml-1 capitalize">{guest.status}</span>
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Evento:</strong> {guest.eventName}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Phone size={14} className="mr-1" />
                        {guest.phone}
                      </div>
                      {guest.email && (
                        <div className="flex items-center">
                          <Mail size={14} className="mr-1" />
                          {guest.email}
                        </div>
                      )}
                    </div>
                    <p>
                      <strong>Pessoas:</strong> {guest.adults} adulto(s)
                      {guest.children > 0 && `, ${guest.children} criança(s)`}
                      {' '}(Total: {guest.totalGuests})
                    </p>
                    {guest.notes && <p><strong>Observações:</strong> {guest.notes}</p>}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {guest.status !== 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSendInvite(guest, 'whatsapp')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle size={16} className="mr-1" />
                        WhatsApp
                      </Button>
                      {guest.email && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSendInvite(guest, 'email')}
                        >
                          <Mail size={16} className="mr-1" />
                          Email
                        </Button>
                      )}
                    </>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(guest)}
                      className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50"
                      title="Editar convidado"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(guest)}
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredGuests.length)} de {filteredGuests.length} convidados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {paginatedGuests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum convidado encontrado</p>
        </div>
      )}

      {/* Add/Edit Guest Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGuest ? 'Editar Convidado' : 'Adicionar Novo Convidado'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-1">
              Evento *
            </label>
            <select
              id="eventId"
              {...register('eventId', { required: 'Evento é obrigatório' })}
              className={getFieldClassName('eventId', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
            >
              <option value="">Selecione um evento</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
            {(showValidation && validationErrors.eventId) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.eventId}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { 
                required: 'Nome é obrigatório',
                maxLength: { value: 300, message: 'Nome deve ter no máximo 300 caracteres' }
              })}
              className={getFieldClassName('name', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
            />
            {(showValidation && validationErrors.name) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone', { 
                  required: 'Telefone é obrigatório',
                  minLength: { value: 8, message: 'Telefone deve ter pelo menos 8 caracteres' },
                  maxLength: { value: 20, message: 'Telefone deve ter no máximo 20 caracteres' }
                })}
                className={getFieldClassName('phone', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
                placeholder="(11) 99999-9999"
              />
              {(showValidation && validationErrors.phone) && (
                <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {(showValidation && validationErrors.email) && (
                <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-1">
                Adultos *
              </label>
              <input
                type="number"
                id="adults"
                min="1"
                max="50"
                {...register('adults', { 
                  required: 'Número de adultos é obrigatório',
                  min: { value: 1, message: 'Deve ter pelo menos 1 adulto' },
                  max: { value: 50, message: 'Máximo 50 adultos' }
                })}
                className={getFieldClassName('adults', 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent')}
              />
              {(showValidation && validationErrors.adults) && (
                <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.adults}</p>
              )}
            </div>

            <div>
              <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">
                Crianças
              </label>
              <input
                type="number"
                id="children"
                min="0"
                max="50"
                {...register('children', {
                  min: { value: 0, message: 'Número de crianças não pode ser negativo' },
                  max: { value: 50, message: 'Máximo 50 crianças' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {(showValidation && validationErrors.children) && (
                <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.children}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes', {
                maxLength: { value: 500, message: 'Observações devem ter no máximo 500 caracteres' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Observações sobre o convidado..."
            />
            {(showValidation && validationErrors.notes) && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">{validationErrors.notes}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingGuest ? 'Atualizar' : 'Criar'} Convidado
            </Button>
          </div>
        </form>
      </Modal>

      {/* Paste Data Modal */}
      <Modal
        isOpen={showPasteModal}
        onClose={() => {
          setShowPasteModal(false);
          setPasteData('');
        }}
        title="Importar Convidados"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Como usar:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Copie os dados do Google Sheets ou Excel</li>
              <li>2. Cole no campo abaixo</li>
              <li>3. Formato esperado: Nome, Telefone, Email, Adultos, Crianças</li>
              <li>4. Uma linha por convidado</li>
              <li>5. Nome: máximo 300 caracteres</li>
              <li>6. Telefone: entre 8 e 20 caracteres</li>
              <li>7. Adultos: 1 a 50 pessoas</li>
              <li>8. Crianças: 0 a 50 pessoas</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cole os dados aqui:
            </label>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="João Silva	(11) 99999-9999	joao@email.com	2	1
Maria Santos	(11) 88888-8888	maria@email.com	1	0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: Nome (máx. 300 chars), Telefone (8-20 chars), Email, Adultos (1-50), Crianças (0-50)
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowPasteModal(false);
                setPasteData('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePasteImport}
              disabled={!pasteData.trim()}
            >
              Processar Dados
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setSelectedEventForExport('');
        }}
        title="Exportar Lista de Convidados"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecione o Evento *
            </label>
            <select
              value={selectedEventForExport}
              onChange={(e) => setSelectedEventForExport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Selecione um evento</option>
              {events.map(event => {
                const eventGuestCount = guests.filter(g => g.eventId === event.id).length;
                return (
                  <option key={event.id} value={event.id}>
                    {event.name} ({eventGuestCount} convidados)
                  </option>
                );
              })}
            </select>
          </div>

          {selectedEventForExport && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Resumo da Exportação
              </h3>
              {(() => {
                const eventGuests = guests.filter(g => g.eventId === selectedEventForExport);
                const confirmed = eventGuests.filter(g => g.status === 'confirmed').length;
                const pending = eventGuests.filter(g => g.status === 'pending' || g.status === 'sent').length;
                const declined = eventGuests.filter(g => g.status === 'declined').length;
                const totalPeople = eventGuests.reduce((sum, g) => sum + g.totalGuests, 0);
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Total de Convidados: <strong>{eventGuests.length}</strong></div>
                    <div>Total de Pessoas: <strong>{totalPeople}</strong></div>
                    <div>Confirmados: <strong className="text-green-600">{confirmed}</strong></div>
                    <div>Pendentes: <strong className="text-orange-600">{pending}</strong></div>
                    <div>Recusados: <strong className="text-red-600">{declined}</strong></div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowExportModal(false);
                setSelectedEventForExport('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={exportGuestsToCSV}
              disabled={!selectedEventForExport}
              variant="secondary"
            >
              <Download size={16} className="mr-1" />
              Exportar CSV
            </Button>
            <Button 
              onClick={exportGuestsToPDF}
              disabled={!selectedEventForExport}
            >
              <Download size={16} className="mr-1" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportData([]);
          setSelectedEventForImport('');
        }}
        title="Importar Convidados"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecione o Evento *
            </label>
            <select
              value={selectedEventForImport}
              onChange={(e) => setSelectedEventForImport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Selecione um evento</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              Dados encontrados ({importData.length} convidados)
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {importData.slice(0, 5).map((data, index) => (
                <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded">
                  <strong>{data.name}</strong> - {data.phone} - {data.adults} adulto(s), {data.children} criança(s)
                </div>
              ))}
              {importData.length > 5 && (
                <div className="text-sm text-gray-500 text-center">
                  +{importData.length - 5} mais convidados...
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowImportModal(false);
                setImportData([]);
                setSelectedEventForImport('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImportGuests}
              disabled={!selectedEventForImport || importData.length === 0}
            >
              Importar {importData.length} Convidado(s)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGuestToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Convidado"
        message="Tem certeza que deseja excluir este convidado?"
        itemName={guestToDelete ? `${guestToDelete.name} - ${guestToDelete.eventName}` : undefined}
        loading={deleteLoading}
      />
    </div>
  );
};

export default GuestsPage;