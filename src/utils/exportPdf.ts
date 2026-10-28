import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  filename?: string;
  scale?: number;
  quality?: number;
}

/**
 * Captures an HTML element by ID and downloads it as a high-resolution A4 PDF.
 */
export async function exportElementToPdf(
  elementId: string,
  options: ExportPdfOptions = {}
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`exportElementToPdf: Element with id "${elementId}" not found.`);
    return false;
  }

  const {
    filename = 'invoice.pdf',
    scale = 2,
    quality = 0.98
  } = options;

  try {
    // Capture element rendering to canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);
    
    // Create A4 PDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale canvas to fit page width
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Render single-page or multi-page if content overflows
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
