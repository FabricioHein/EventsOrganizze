import React, { useState } from 'react';
import { Plus, Trash2, Calendar, DollarSign, Info } from 'lucide-react';
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
      notes: '',
      received: false,
    },
  ]);
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(2);
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState<string>('');
  const [downPaymentReceived, setDownPaymentReceived] = useState(false);
  const [installmentInterval, setInstallmentInterval] = useState<'monthly' | 'weekly'>('monthly');
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

  const generateInstallmentsByNumber = (count: number) => {
    if (count < 1) return;
    
    let totalAmount = contractTotal;
    let remainingAmount = contractTotal;
    const newInstallments: PaymentInstallment[] = [];
    
    // Add down payment if configured
    if (hasDownPayment && downPaymentAmount) {
      const downAmount = Number(downPaymentAmount);
      remainingAmount -= downAmount;
      
      newInstallments.push({
        amount: downAmount,
        paymentDate: new Date(),
        method: 'pix',
        notes: 'Entrada',
        received: downPaymentReceived,
      });
    }
    
    // Calculate installment amount for remaining value
    const installmentAmount = Math.floor((remainingAmount / count) * 100) / 100;
    const remainder = remainingAmount - (installmentAmount * count);
    
    // Add installments
    for (let i = 0; i < count; i++) {
      const installmentDate = new Date();
      
      if (installmentInterval === 'monthly') {
        installmentDate.setMonth(installmentDate.getMonth() + (hasDownPayment ? i + 1 : i));
      } else if (installmentInterval === 'weekly') {
        installmentDate.setDate(installmentDate.getDate() + ((hasDownPayment ? i + 1 : i) * 7));
      }
      
      newInstallments.push({
        amount: i === count - 1 ? installmentAmount + remainder : installmentAmount,
        paymentDate: installmentDate,
        method: 'pix',
        notes: `Parcela ${i + 1}/${count}`,
        received: false, // Installments start as not received
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
          <h3 className="text-sm font-medium text-gray-700 mb-3">Configuração do Parcelamento</h3>
          
          {/* Down Payment Option */}
          <div className="bg-white p-3 rounded border border-gray-200 mb-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="hasDownPayment"
                checked={hasDownPayment}
                onChange={(e) => setHasDownPayment(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="hasDownPayment" className="ml-2 text-sm font-medium text-gray-700">
                Incluir Entrada
              </label>
            </div>
            
            {hasDownPayment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Valor da Entrada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={downPaymentAmount}
                    onChange={(e) => setDownPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="downPaymentReceived"
                    checked={downPaymentReceived}
                    onChange={(e) => setDownPaymentReceived(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="downPaymentReceived" className="ml-2 text-xs text-gray-700">
                    Entrada já recebida
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Installment Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Número de Parcelas {hasDownPayment ? '(além da entrada)' : ''}
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Intervalo
              </label>
              <select
                value={installmentInterval}
                onChange={(e) => setInstallmentInterval(e.target.value as 'monthly' | 'weekly')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="monthly">Mensal</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
          </div>
          
          {/* Quick Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[2, 3, 4, 6, 12].map(count => (
              <Button
                key={count}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNumberOfInstallments(count);
                  generateInstallmentsByNumber(count);
                }}
              >
                {count}x
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => generateInstallmentsByNumber(numberOfInstallments)}
            >
              Gerar {numberOfInstallments}x
            </Button>
          </div>
          
          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start">
              <Info size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 space-y-1">
                {hasDownPayment ? (
                  <>
                    <div>💡 <strong>Entrada:</strong> Valor fixo pago no início</div>
                    <div>📅 <strong>Parcelas:</strong> {numberOfInstallments === 1 ? 'Valor restante em 1 parcela' : `Valor restante dividido em ${numberOfInstallments} parcelas iguais`}</div>
                    <div>⏰ <strong>Datas:</strong> Entrada na data atual, parcelas começam no próximo período</div>
                  </>
                ) : (
                  <div>💡 {numberOfInstallments === 1 ? 'Pagamento único na data atual.' : `O valor será dividido igualmente entre ${numberOfInstallments} parcelas.`}</div>
                )}
              </div>
            </div>
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