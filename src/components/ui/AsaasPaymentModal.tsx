import React, { useState } from 'react';
import { CreditCard, Smartphone, FileText, DollarSign, Calendar } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { asaasService } from '../../services/asaasService';
import { useAuth } from '../../contexts/AuthContext';

interface AsaasPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subscriptionId: string) => void;
  planId: string;
  planName: string;
  planPrice: number;
}

const AsaasPaymentModal: React.FC<AsaasPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  planId,
  planName,
  planPrice,
}) => {
  const { user } = useAuth();
  const [billingType, setBillingType] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('PIX');
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);

  const yearlyDiscount = 0.15; // 15% discount for yearly
  const finalPrice = cycle === 'YEARLY' 
    ? planPrice * 12 * (1 - yearlyDiscount)
    : planPrice;

  const handleCreateSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create or get customer
      let customer;
      try {
        customer = await asaasService.createCustomer({
          name: user.displayName || 'Usuário',
          email: user.email || '',
          phone: '',
          externalReference: user.uid,
        });
      } catch (error) {
        // Customer might already exist, try to get it
        console.log('Customer creation failed, might already exist');
      }

      // Create subscription
      const subscription = await asaasService.createSubscription({
        customer: customer?.id || user.uid,
        billingType,
        value: cycle === 'MONTHLY' ? planPrice : finalPrice / 12,
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: cycle === 'MONTHLY' ? 'MONTHLY' : 'YEARLY',
        description: `Assinatura ${planName} - EventFinance`,
        externalReference: `${user.uid}-${planId}-${cycle}`,
      });

      if (billingType === 'PIX') {
        // Get PIX QR Code for the first payment
        const payments = await asaasService.getPayments(customer?.id || user.uid);
        if (payments.data && payments.data.length > 0) {
          const pixData = await asaasService.getPixQrCode(payments.data[0].id);
          setPixQrCode(pixData.qrCode);
        }
      }

      onSuccess(subscription.id);
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Erro ao criar assinatura. Tente novamente.');
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Assinar Plano ${planName}`} size="lg">
      <div className="space-y-6">
        {/* Plan Summary */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Resumo do Plano</h3>
          <div className="flex justify-between items-center">
            <span className="text-purple-800">{planName}</span>
            <span className="text-2xl font-bold text-purple-900">
              R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              {cycle === 'YEARLY' && (
                <span className="text-sm text-green-600 ml-2">
                  (15% desconto anual)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Billing Cycle */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Ciclo de Cobrança</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCycle('MONTHLY')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                cycle === 'MONTHLY'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">Mensal</div>
              <div className="text-xs text-gray-600">
                R$ {planPrice}/mês
              </div>
            </button>
            <button
              onClick={() => setCycle('YEARLY')}
              className={`p-3 border-2 rounded-lg transition-colors relative ${
                cycle === 'YEARLY'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                -15%
              </div>
              <Calendar className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">Anual</div>
              <div className="text-xs text-gray-600">
                R$ {(finalPrice / 12).toFixed(2)}/mês
              </div>
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Método de Pagamento</h3>
          <div className="space-y-2">
            {[
              { type: 'PIX', label: 'PIX', description: 'Pagamento instantâneo' },
              { type: 'CREDIT_CARD', label: 'Cartão de Crédito', description: 'Débito automático' },
              { type: 'BOLETO', label: 'Boleto Bancário', description: 'Vencimento em 3 dias' },
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

        {/* PIX QR Code */}
        {pixQrCode && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <h3 className="font-medium text-gray-900 mb-3">QR Code PIX</h3>
            <div className="bg-white p-4 rounded-lg inline-block">
              <img src={pixQrCode} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Escaneie o código com seu app do banco
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateSubscription} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Processando...' : 'Confirmar Assinatura'}
          </Button>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center">
          Ao confirmar, você concorda com nossos{' '}
          <a href="#" className="text-purple-600 hover:underline">
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a href="#" className="text-purple-600 hover:underline">
            Política de Privacidade
          </a>
        </div>
      </div>
    </Modal>
  );
};

export default AsaasPaymentModal;