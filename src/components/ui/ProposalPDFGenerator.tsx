import React from 'react';
import { Proposal } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProposalPDFGeneratorProps {
  proposal: Proposal;
  onGenerate: (pdfBlob: Blob) => void;
}

const ProposalPDFGenerator: React.FC<ProposalPDFGeneratorProps> = ({ proposal, onGenerate }) => {
  const generatePDF = async () => {
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Header with logo space
      doc.setFontSize(20);
      doc.setTextColor(139, 92, 246); // Purple color
      doc.text('PROPOSTA COMERCIAL', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Client info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Cliente: ${proposal.clientName}`, margin, yPosition);
      yPosition += 10;
      
      doc.text(`Proposta: ${proposal.title}`, margin, yPosition);
      yPosition += 10;
      
      doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, margin, yPosition);
      yPosition += 10;
      
      doc.text(`Válida até: ${format(proposal.validUntil, 'dd/MM/yyyy', { locale: ptBR })}`, margin, yPosition);
      yPosition += 20;

      // Description
      if (proposal.description) {
        doc.setFontSize(10);
        doc.text('Descrição:', margin, yPosition);
        yPosition += 8;
        
        const splitDescription = doc.splitTextToSize(proposal.description, pageWidth - 2 * margin);
        doc.text(splitDescription, margin, yPosition);
        yPosition += splitDescription.length * 5 + 10;
      }

      // Items table header
      doc.setFontSize(12);
      doc.setFillColor(139, 92, 246);
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      
      doc.text('Item', margin + 5, yPosition + 7);
      doc.text('Qtd', pageWidth - 80, yPosition + 7);
      doc.text('Valor Unit.', pageWidth - 60, yPosition + 7);
      doc.text('Total', pageWidth - 30, yPosition + 7);
      
      yPosition += 15;

      // Items
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      proposal.items.forEach((item, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        const itemTotal = item.quantity * item.unitPrice;
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, 'F');
        }
        
        const splitItem = doc.splitTextToSize(item.description, 100);
        doc.text(splitItem, margin + 5, yPosition + 3);
        doc.text(item.quantity.toString(), pageWidth - 80, yPosition + 3);
        doc.text(`R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 60, yPosition + 3);
        doc.text(`R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 30, yPosition + 3);
        
        yPosition += Math.max(8, splitItem.length * 4);
      });

      // Total
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFillColor(139, 92, 246);
      doc.setTextColor(255, 255, 255);
      doc.rect(pageWidth - 80, yPosition, 60, 12, 'F');
      doc.text(`R$ ${proposal.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 50, yPosition + 8, { align: 'center' });

      // Footer
      yPosition += 30;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Esta proposta é válida até a data especificada acima.', pageWidth / 2, yPosition, { align: 'center' });
      doc.text('Agradecemos pela oportunidade de apresentar nossos serviços.', pageWidth / 2, yPosition + 8, { align: 'center' });

      // Generate blob
      const pdfBlob = doc.output('blob');
      onGenerate(pdfBlob);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  React.useEffect(() => {
    generatePDF();
  }, [proposal]);

  return null;
};

export default ProposalPDFGenerator;