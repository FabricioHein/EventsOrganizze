import React from 'react';
import { Crown, Lock, Check, X, Zap } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface PremiumPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan: 'Profissional' | 'Premium';
  previewContent: React.ReactNode;
  benefits: string[];
}

const PremiumPreviewModal: React.FC<PremiumPreviewModalProps> = ({
  isOpen,
  onClose,
  featureName,
  requiredPlan,
  previewContent,
  benefits
}) => {
  const handleUpgrade = () => {
    window.location.href = '/subscription';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${featureName}`} size="xl">
      <div className="space-y-6">
        {/* Premium Badge */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown size={24} className="mr-3" />
              <div>
                <h3 className="font-bold text-lg">Recurso {requiredPlan}</h3>
                <p className="text-purple-100 text-sm">
                  Este é um preview limitado. Faça upgrade para acesso completo!
                </p>
              </div>
            </div>
            <Lock size={32} className="text-purple-200" />
          </div>
        </div>

        {/* Preview Content */}
        <div className="relative">
          <div className="opacity-60 pointer-events-none">
            {previewContent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent flex items-end justify-center pb-8">
            <div className="bg-white/95 backdrop-blur-sm border border-purple-200 rounded-lg p-4 text-center shadow-lg">
              <Lock size={32} className="text-purple-600 mx-auto mb-2" />
              <p className="text-purple-900 font-medium">
                Conteúdo completo disponível no Plano {requiredPlan}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
            <Zap size={20} className="mr-2" />
            Com o Plano {requiredPlan} você terá:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center text-purple-700">
                <Check size={16} className="text-purple-600 mr-2 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Fechar Preview
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold px-6 py-3"
          >
            <Crown size={20} className="mr-2" />
            Fazer Upgrade Agora 🚀
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PremiumPreviewModal;