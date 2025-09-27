import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from './Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  warningMessage?: string;
  loading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  warningMessage,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{message}</p>
          
          {itemName && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Item a ser excluído:</p>
              <p className="font-medium text-gray-900">{itemName}</p>
            </div>
          )}

          {warningMessage && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
              <div className="flex items-start">
                <AlertTriangle size={16} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{warningMessage}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </div>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Excluir
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;