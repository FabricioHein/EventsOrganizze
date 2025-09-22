import React, { useState } from 'react';
import { CreditCard, Smartphone, FileText, DollarSign, Calendar, Calculator } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { asaasService } from '../../services/asaasService';
import { useAuth } from '../../contexts/AuthContext';

interface InstallmentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  eventId: string;
  eventName: string;
  totalAmount: number;
  clientEmail?: string;
}

const InstallmentPaymentModal: React.FC<InstallmentPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  eventName,
  totalAmount,
  clientEmail,
}) => {
  const { user } = useAuth();
  const [billingType, setBillingType] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('PIX');
  const [installmentCount, setInstallmentCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [showInstallmentDetails, setShowInstallmentDetails] = useState(false);

  const installmentValue = totalAmount / installmentCount;

  const handleCreateInstallments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create or get customer
      let customer;
      try {
        customer = await asaasService.createCustomer({
          name: user.displayName || 'Cliente',
          email: clientEmail || user.email || '',
          externalReference: `${user.uid}-${eventId}`,
        });
      } catch (error) {
        console.log('Customer creation failed, might already exist');
      }

      // Create installment payment
      const payment = await asaasService.createInstallments({
        customer: customer?.id || user.uid,
        billingType,
        installmentCount,
        installmentValue,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Pagamento parcelado - ${eventName}`,
        externalReference: `${eventId}-installment`,
      });

      onSuccess(payment.id);
      setShowInstallmentDetails(true);
    } catch (error) {
      console.error('Error creating installments:', error);
      alert('Erro ao criar parcelamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getBillingIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return <CreditCard className="w-5 h-5" />;
      case 'PIX':
        return <Smartphone className="w-5 h-5" />;
      case 'BOLETO':
        return <FileText className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Parcelamento via Asaas" size="lg">
      <div className="space-y-6">
        {/* Event Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">{eventName}</h3>
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Valor Total:</span>
            <span className="text-2xl font-bold text-blue-900">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Installment Configuration */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Configuração do Parcelamento
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Parcelas
              </label>
              <select
                value={installmentCount}
                onChange={(e) => setInstallmentCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {[2, 3, 4, 5, 6, 10, 12].map(count => (
                  <option key={count} value={count}>{count}x</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor por Parcela
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Método de Pagamento</h3>
          <div className="space-y-2">
            {[
              { type: 'CREDIT_CARD', label: 'Cartão de Crédito', description: 'Débito automático mensal' },
              { type: 'BOLETO', label: 'Boleto Bancário', description: 'Boletos mensais' },
              { type: 'PIX', label: 'PIX', description: 'PIX mensal (manual)' },
            ].map((method) => (
              <button
                key={method.type}
                onClick={() => setBillingType(method.type as any)}
                className={`w-full p-3 border-2 rounded-lg transition-colors text-left ${
                  billingType === method.type
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  {getBillingIcon(method.type)}
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{method.label}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Installment Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Resumo do Parcelamento</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Parcelas:</span>
              <span className="font-medium">{installmentCount}x</span>
            </div>
            <div className="flex justify-between">
              <span>Valor por parcela:</span>
              <span className="font-medium">
                R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Primeira parcela:</span>
              <span className="font-medium">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total:</span>
              <span className="font-bold">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showInstallmentDetails && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Parcelamento Criado!</h4>
            <p className="text-sm text-green-800">
              O parcelamento foi criado com sucesso. Os boletos/cobranças serão gerados automaticamente.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            {showInstallmentDetails ? 'Fechar' : 'Cancelar'}
          </Button>
          {!showInstallmentDetails && (
            <Button 
              onClick={handleCreateInstallments} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Criando...' : 'Criar Parcelamento'}
            </Button>
          )}
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center">
          As cobranças serão processadas automaticamente pelo Asaas
        </div>
      </div>
    </Modal>
  );
};

export default InstallmentPaymentModal;