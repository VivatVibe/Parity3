import { Invoice, IssuerProfile } from '../domain/storage';
import { thaiBahtText } from './thaiBaht';

/**
 * Generates a clean, polite Thai text message formatted specifically for LINE chat.
 */
export function formatLineInvoiceMessage(invoice: Invoice, issuer: IssuerProfile, shareUrl?: string): string {
  const itemsText = invoice.items.map(it => `• ${it.description} (x${it.quantity}): ฿${it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`).join('\n');
  const urlPart = shareUrl ? `\n\n📄 ดูใบแจ้งหนี้ฉบับเต็มและสแกน QR ได้ที่:\n${shareUrl}` : '';

  return `เรียน ${invoice.clientName}

ขอส่งสรุปรายการวางบิล ${invoice.invoiceNumber}
(ครบกำหนดชำระ: ${invoice.dueDate})

📋 รายละเอียดงาน:
${itemsText}

💰 ยอดสรุปการชำระเงิน:
• รวมเป็นเงิน: ฿${invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
• หักภาษี ณ ที่จ่าย 3%: -฿${invoice.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
• ยอดชำระสุทธิ: ฿${invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} (${thaiBahtText(invoice.netTotal)})

🏦 ช่องทางการโอนเงิน:
• ธนาคาร: ${issuer.bankName}
• เลขที่บัญชี: ${issuer.bankAccount}
• ชื่อบัญชี: ${issuer.bankAccountName}
• พร้อมเพย์ (PromptPay): ${issuer.promptPayId}${urlPart}

* เมื่อโอนเงินเรียบร้อยแล้ว รบกวนส่งสลิปและใบหัก ณ ที่จ่าย (50 ทวิ 3%) ให้ด้วยนะครับ ขอบคุณครับ`;
}

/**
 * Encodes an invoice into a URL-safe Base64 payload so it can be viewed by anyone without a server.
 */
export function encodeInvoiceToShareUrl(invoice: Invoice, issuer: IssuerProfile, baseUrl = window.location.origin): string {
  // Strip large attachments and lengthy drawn signature images from URL param to keep query string within safe HTTP length
  const { slipImage, tawiImage, ...cleanInvoice } = invoice;
  const cleanIssuer = {
    ...issuer,
    signatureDataUrl: (issuer.signatureDataUrl && issuer.signatureDataUrl.length < 2000) ? issuer.signatureDataUrl : undefined,
    signatureMode: (issuer.signatureDataUrl && issuer.signatureDataUrl.length >= 2000 && issuer.signatureMode === 'drawn') ? 'auto' : (issuer.signatureMode || 'auto')
  };

  const minimalPayload = {
    inv: cleanInvoice,
    iss: cleanIssuer
  };
  const jsonStr = JSON.stringify(minimalPayload);
  // Base64 encode supporting UTF-8 Thai characters
  const encoded = btoa(encodeURIComponent(jsonStr));
  return `${baseUrl}/?view=${encoded}`;
}

/**
 * Decodes a shared invoice payload from the URL search query.
 */
export function decodeInvoiceFromShareParam(param: string): { invoice: Invoice; issuer: IssuerProfile } | null {
  try {
    const decodedJson = decodeURIComponent(atob(param));
    const data = JSON.parse(decodedJson);
    if (data && data.inv && data.iss) {
      return {
        invoice: data.inv,
        issuer: data.iss
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to decode shared invoice:', err);
    return null;
  }
}
