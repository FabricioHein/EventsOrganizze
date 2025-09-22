import React, { useState } from 'react';
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { format, addMonths, addDays } from 'date-fns';

interface PaymentInstallment {
  amount: number;
  paymentDate: Date;
  method: 'pix' | 'card' | 'boleto' | 'cash';
  notes?: string;
  received: boolean;
}

interface PaymentInstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (installments: PaymentInstallment[]) => Promise<void>;
  eventName: string;
  contractTotal: number;
}

const PaymentInstallmentsModal: React.FC<PaymentInstallmentsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventName,
  contractTotal,
}) => {
  const [installments, setInstallments] = useState<PaymentInstallment[]>([
    {
      amount: 0,
      paymentDate: new Date(),
      method: 'pix',
      notes: 'Entrada',
      received: false,
    },
  ]);
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const addInstallment = () => {
    const lastDate = installments[installments.length - 1]?.paymentDate || new Date();
    setInstallments([
      ...installments,
      {
        amount: 0,
        paymentDate: addMonths(lastDate, 1),
        method: 'pix',
        notes: '',
        received: false,
      },
    ]);
  };

  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((_, i) => i !== index));
    }
  };

  const updateInstallment = (index: number, field: keyof PaymentInstallment, value: any) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    setInstallments(updated);
  };

  const generateEqualInstallments = (count: number) => {
    const installmentAmount = Math.round((contractTotal / count) * 100) / 100;
    const remainder = contractTotal - (installmentAmount * count);
    
    const newInstallments: PaymentInstallment[] = [];
    for (let i = 0; i < count; i++) {
      newInstallments.push({
        amount: i === 0 ? installmentAmount + remainder : installmentAmount,
        paymentDate: i === 0 ? new Date() : addMonths(new Date(), i),
        method: 'pix',
        notes: i === 0 ? 'Entrada' : `Parcela ${i + 1}`,
        received: false,
      });
    }
    setInstallments(newInstallments);
  };

  const generateInstallmentsByNumber = (count: number) => {
    if (count < 1) return;
    
    const installmentAmount = Math.floor((contractTotal / count) * 100) / 100;
    const remainder = contractTotal - (installmentAmount * count);
    
    const newInstallments: PaymentInstallment[] = [];
    for (let i = 0; i < count; i++) {
      newInstallments.push({
        amount: i === count - 1 ? installmentAmount + remainder : installmentAmount,
        paymentDate: i === 0 ? new Date() : addMonths(new Date(), i),
        method: 'pix',
        notes: i === 0 ? 'Entrada' : `Parcela ${i + 1}`,
        received: false,
      });
    }
    setInstallments(newInstallments);
  };

  const totalAmount = installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
  const difference = contractTotal - totalAmount;

  const handleSave = async () => {
    if (Math.abs(difference) > 0.01) {
      alert('O valor total das parcelas deve ser igual ao valor do contrato!');
      return;
    }
    
    setLoading(true);
    try {
      await onSave(installments);
      onClose();
    } catch (error) {
      console.error('Error saving installments:', error);
      alert('Erro ao salvar parcelamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Parcelamento - ${eventName}`} size="xl">
      <div className="space-y-6">
        {/* Quick Setup */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Configuração Rápida</h3>
          
          {/* Number Input */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Número de Parcelas
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="24"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(Number(e.target.value))}
                className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => generateInstallmentsByNumber(numberOfInstallments)}
              >
                Gerar
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[2, 3, 4, 6, 12].map(count => (
              <Button
                key={count}
                variant="secondary"
                size="sm"
                onClick={() => generateEqualInstallments(count)}
              >
                {count}x
              </Button>
            ))}
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Valor do Contrato:</span>
            <span className="font-bold text-blue-900">
              R$ {contractTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-blue-700">Total das Parcelas:</span>
            <span className={`font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {difference !== 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-red-700">Diferença:</span>
              <span className="font-bold text-red-600">
                R$ {Math.abs(difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {difference > 0 ? ' (faltando)' : ' (excesso)'}
              </span>
            </div>
          )}
        </div>

        {/* Installments */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Parcelas ({installments.length})</h3>
            <Button onClick={addInstallment} size="sm">
              <Plus size={16} className="mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {installments.map((installment, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Parcela {index + 1}
                  </span>
                  {installments.length > 1 && (
                    <button
                      onClick={() => removeInstallment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={installment.amount || ''}
                      onChange={(e) => updateInstallment(index, 'amount', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      value={format(installment.paymentDate, 'yyyy-MM-dd')}
                      onChange={(e) => updateInstallment(index, 'paymentDate', new Date(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Método
                    </label>
                    <select
                      value={installment.method}
                      onChange={(e) => updateInstallment(index, 'method', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="pix">PIX</option>
                      <option value="card">Cartão</option>
                      <option value="boleto">Boleto</option>
                      <option value="cash">Dinheiro</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`received-${index}`}
                      checked={installment.received}
                      onChange={(e) => updateInstallment(index, 'received', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`received-${index}`} className="ml-2 text-xs text-gray-700">
                      Recebido
                    </label>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={installment.notes || ''}
                    onChange={(e) => updateInstallment(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Entrada, Parcela 1, etc."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={Math.abs(difference) > 0.01}
            className={loading ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {loading ? 'Salvando...' : 'Salvar Parcelamento'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentInstallmentsModal;