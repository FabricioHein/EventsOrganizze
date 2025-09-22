import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPaymentsByMonth } from '../../services/firebaseService';
import { Payment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface MonthlyPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MonthlyPaymentsModal: React.FC<MonthlyPaymentsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchPayments();
    }
  }, [isOpen, currentDate, user]);

  const fetchPayments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const paymentsData = await getPaymentsByMonth(user.uid, year, month);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching monthly payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const totalReceived = payments.filter(p => p.received).reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => !p.received).reduce((sum, p) => sum + p.amount, 0);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'pix':
        return 'bg-green-100 text-green-800';
      case 'card':
        return 'bg-blue-100 text-blue-800';
      case 'boleto':
        return 'bg-orange-100 text-orange-800';
      case 'cash':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pagamentos por Mês" size="xl">
      <div className="space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-bold text-gray-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Recebido</p>
                <p className="text-2xl font-bold text-green-900">
                  R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Pendente</p>
                <p className="text-2xl font-bold text-orange-900">
                  R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  {payments.length} pagamentos
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Lista de Pagamentos</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`p-4 rounded-lg border-2 ${
                    payment.received 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium text-gray-900 mr-3">
                          {payment.eventName}
                        </h4>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getMethodColor(payment.method)}`}>
                          {payment.method.toUpperCase()}
                        </span>
                        {payment.installmentNumber && (
                          <span className="ml-2 inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                            {payment.installmentNumber}/{payment.totalInstallments}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar size={14} className="mr-1" />
                        {format(payment.paymentDate, 'dd/MM/yyyy')}
                      </div>
                      
                      {payment.notes && (
                        <p className="text-sm text-gray-600">{payment.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center mt-1 ${
                        payment.received ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {payment.received ? (
                          <CheckCircle size={16} className="mr-1" />
                        ) : (
                          <XCircle size={16} className="mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {payment.received ? 'Recebido' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pagamento encontrado para este mês</p>
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

export default MonthlyPaymentsModal;