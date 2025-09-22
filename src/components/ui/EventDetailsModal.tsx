import React, { useState, useEffect } from 'react';
import { Event, EventTimeline, ChecklistItem, EventSupplier, Supplier } from '../../types';
import Modal from './Modal';
import Button from './Button';
import { Calendar, Clock, MapPin, User, Plus, Check, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  getEventTimeline, 
  addTimelineItem, 
  updateTimelineItem, 
  deleteTimelineItem,
  getEventSuppliers,
  addEventSupplier,
  deleteEventSupplier,
  getSuppliers
} from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'timeline' | 'checklist' | 'suppliers'>('timeline');
  const [timeline, setTimeline] = useState<EventTimeline[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [eventSuppliers, setEventSuppliers] = useState<EventSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // New item states
  const [newTimelineItem, setNewTimelineItem] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'task' as const
  });

  const [newChecklistItem, setNewChecklistItem] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as const,
    category: 'Geral'
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierCost, setSupplierCost] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  useEffect(() => {
    if (isOpen && event && user) {
      fetchEventData();
    }
  }, [isOpen, event, user]);

  const fetchEventData = async () => {
    if (!event || !user) return;

    setLoading(true);
    try {
      const [timelineData, eventSuppliersData, suppliersData] = await Promise.all([
        getEventTimeline(event.id),
        getEventSuppliers(event.id),
        getSuppliers(user.uid)
      ]);

      setTimeline(timelineData);
      setEventSuppliers(eventSuppliersData);
      setSuppliers(suppliersData);

      // Mock checklist data (you can implement this in Firebase if needed)
      setChecklist([
        {
          id: '1',
          title: 'Confirmar local',
          description: 'Verificar disponibilidade e confirmar reserva',
          completed: false,
          dueDate: new Date(event.date.getTime() - 7 * 24 * 60 * 60 * 1000),
          priority: 'high',
          category: 'Local'
        },
        {
          id: '2',
          title: 'Contratar decoração',
          description: 'Definir tema e contratar fornecedor',
          completed: true,
          priority: 'high',
          category: 'Decoração'
        }
      ]);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimelineItem = async () => {
    if (!event || !user || !newTimelineItem.title || !newTimelineItem.date) return;

    try {
      await addTimelineItem({
        eventId: event.id,
        title: newTimelineItem.title,
        description: newTimelineItem.description,
        date: new Date(newTimelineItem.date),
        time: newTimelineItem.time,
        type: newTimelineItem.type,
        completed: false
      });

      setNewTimelineItem({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'task'
      });

      await fetchEventData();
    } catch (error) {
      console.error('Error adding timeline item:', error);
    }
  };

  const handleToggleTimelineItem = async (item: EventTimeline) => {
    try {
      await updateTimelineItem(item.id, { completed: !item.completed });
      await fetchEventData();
    } catch (error) {
      console.error('Error updating timeline item:', error);
    }
  };

  const handleDeleteTimelineItem = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteTimelineItem(id);
        await fetchEventData();
      } catch (error) {
        console.error('Error deleting timeline item:', error);
      }
    }
  };

  const handleAddSupplier = async () => {
    if (!event || !selectedSupplierId) return;

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    try {
      await addEventSupplier({
        eventId: event.id,
        supplierId: supplier.id,
        supplierName: supplier.name,
        service: supplier.service,
        cost: supplierCost ? Number(supplierCost) : undefined,
        notes: supplierNotes
      });

      setSelectedSupplierId('');
      setSupplierCost('');
      setSupplierNotes('');
      await fetchEventData();
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  const handleRemoveSupplier = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este fornecedor?')) {
      try {
        await deleteEventSupplier(id);
        await fetchEventData();
      } catch (error) {
        console.error('Error removing supplier:', error);
      }
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.title) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      title: newChecklistItem.title,
      description: newChecklistItem.description,
      completed: false,
      dueDate: newChecklistItem.dueDate ? new Date(newChecklistItem.dueDate) : undefined,
      priority: newChecklistItem.priority,
      category: newChecklistItem.category
    };

    setChecklist(prev => [...prev, newItem]);
    setNewChecklistItem({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      category: 'Geral'
    });
  };

  const handleUpdateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteChecklistItem = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      setChecklist(prev => prev.filter(item => item.id !== id));
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'milestone': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.name} size="xl">
      <div className="space-y-6">
        {/* Event Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-gray-600">
              <Calendar size={16} className="mr-2" />
              <span>{format(event.date, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin size={16} className="mr-2" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <User size={16} className="mr-2" />
              <span>{event.clientName}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="text-lg font-bold text-purple-600">
                R$ {event.contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'timeline', label: 'Cronograma' },
              { id: 'checklist', label: 'Checklist' },
              { id: 'suppliers', label: 'Fornecedores' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Add Timeline Item */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Adicionar Item ao Cronograma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Título"
                    value={newTimelineItem.title}
                    onChange={(e) => setNewTimelineItem(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={newTimelineItem.type}
                    onChange={(e) => setNewTimelineItem(prev => ({ ...prev, type: e.target.value as any }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="task">Tarefa</option>
                    <option value="meeting">Reunião</option>
                    <option value="deadline">Prazo</option>
                    <option value="milestone">Marco</option>
                  </select>
                  <input
                    type="date"
                    value={newTimelineItem.date}
                    onChange={(e) => setNewTimelineItem(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="time"
                    value={newTimelineItem.time}
                    onChange={(e) => setNewTimelineItem(prev => ({ ...prev, time: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <textarea
                  placeholder="Descrição (opcional)"
                  value={newTimelineItem.description}
                  onChange={(e) => setNewTimelineItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
                <Button onClick={handleAddTimelineItem} size="sm" className="mt-3">
                  <Plus size={16} className="mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Timeline Items */}
              <div className="space-y-3">
                {timeline.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg border-2 ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <button
                            onClick={() => handleToggleTimelineItem(item)}
                            className={`mr-3 p-1 rounded-full ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                          >
                            <Check size={16} />
                          </button>
                          <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.title}
                          </h4>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {format(item.date, 'dd/MM/yyyy')}
                          {item.time && (
                            <>
                              <Clock size={14} className="ml-3 mr-1" />
                              {item.time}
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTimelineItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              {/* Add Checklist Item */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Adicionar Item ao Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Título"
                    value={newChecklistItem.title}
                    onChange={(e) => setNewChecklistItem(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={newChecklistItem.priority}
                    onChange={(e) => setNewChecklistItem(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Categoria"
                    value={newChecklistItem.category}
                    onChange={(e) => setNewChecklistItem(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="date"
                    value={newChecklistItem.dueDate}
                    onChange={(e) => setNewChecklistItem(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <textarea
                  placeholder="Descrição (opcional)"
                  value={newChecklistItem.description}
                  onChange={(e) => setNewChecklistItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
                <Button onClick={handleAddChecklistItem} size="sm" className="mt-3">
                  <Plus size={16} className="mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg border-2 ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`mr-3 p-1 rounded-full ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                      >
                        <Check size={16} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.title}
                          </h4>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        {item.dueDate && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar size={14} className="mr-1" />
                            Prazo: {format(item.dueDate, 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {checklist.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item no checklist
                </div>
              )}
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              {/* Add Supplier */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Adicionar Fornecedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.service}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Custo (opcional)"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <textarea
                  placeholder="Observações (opcional)"
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
                <Button onClick={handleAddSupplier} size="sm" className="mt-3">
                  <Plus size={16} className="mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Event Suppliers */}
              <div className="space-y-3">
                {eventSuppliers.map((eventSupplier) => (
                  <div key={eventSupplier.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{eventSupplier.supplierName}</h4>
                        <p className="text-sm text-gray-600">{eventSupplier.service}</p>
                        {eventSupplier.cost && (
                          <p className="text-sm font-medium text-green-600">
                            R$ {eventSupplier.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        {eventSupplier.notes && (
                          <p className="text-sm text-gray-500 mt-1">{eventSupplier.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveSupplier(eventSupplier.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {eventSuppliers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum fornecedor adicionado a este evento
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EventDetailsModal;