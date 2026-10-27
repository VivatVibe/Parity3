import React, { useEffect, useState } from 'react';
import { Invoice, IssuerProfile } from '../domain/storage';
import { TAX_CATEGORIES } from '../domain/tax';
import { generatePromptPayQrDataUrl } from '../domain/promptpay';
import { thaiBahtText } from '../utils/thaiBaht';
import { formatLineInvoiceMessage, encodeInvoiceToShareUrl } from '../utils/shareInvoice';
import { SignatureBlock } from './SignatureBlock';
import { X, Printer, Eye, MessageCircle, Copy, Check, Share2, Info } from 'lucide-react';

interface Props {
  invoice: Invoice;
  issuer: IssuerProfile;
  onClose: () => void;
}

export const InvoicePreviewModal: React.FC<Props> = ({ invoice, issuer, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [viewAttachment, setViewAttachment] = useState<string | null>(null);
  const [copiedLine, setCopiedLine] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const categoryMeta = TAX_CATEGORIES[invoice.category];

  useEffect(() => {
    if (issuer.promptPayId) {
      generatePromptPayQrDataUrl(issuer.promptPayId, invoice.netTotal)
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [issuer.promptPayId, invoice.netTotal]);

  const shareUrl = encodeInvoiceToShareUrl(invoice, issuer);
  const lineMessage = formatLineInvoiceMessage(invoice, issuer, shareUrl);

  const handleCopyLine = () => {
    navigator.clipboard.writeText(lineMessage);
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 2500);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleOpenLineApp = () => {
    const lineIntent = `https://line.me/R/msg/text/?${encodeURIComponent(lineMessage)}`;
    window.open(lineIntent, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-5 overflow-y-auto font-['Sarabun',sans-serif] print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-2 sm:my-4 border border-slate-200 overflow-hidden print:static print:w-full print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none print:overflow-visible">
        
        {/* Sticky Floating Toolbar (hidden in print, always visible at top of modal) */}
        <div className="no-print sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 py-2.5 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">ตัวอย่างเอกสาร ({invoice.invoiceNumber})</span>
            
            {invoice.slipImage && (
              <button
                onClick={() => setViewAttachment(invoice.slipImage!)}
                className="px-2 py-0.5 bg-emerald-600/80 hover:bg-emerald-500 rounded-md text-[10px] font-semibold text-white flex items-center gap-1 cursor-pointer transition"
              >
                <Eye className="w-3 h-3" /> สลิปโอนเงิน
              </button>
            )}
            {invoice.tawiImage && (
              <button
                onClick={() => setViewAttachment(invoice.tawiImage!)}
                className="px-2 py-0.5 bg-amber-600/80 hover:bg-amber-500 rounded-md text-[10px] font-semibold text-white flex items-center gap-1 cursor-pointer transition"
              >
                <Eye className="w-3 h-3" /> ใบ 50 ทวิ
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Copy LINE message button */}
            <button
              onClick={handleCopyLine}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                copiedLine
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700/80 hover:bg-emerald-600 text-white'
              }`}
              title="คัดลอกข้อความสรุปยอดและบัญชีโอนสำหรับส่งใน LINE"
            >
              {copiedLine ? <Check className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />}
              <span>{copiedLine ? 'คัดลอกแล้ว!' : 'คัดลอกส่ง LINE'}</span>
            </button>

            {/* Direct Open LINE button */}
            <button
              onClick={handleOpenLineApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              title="เปิดแอป LINE ทันที"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เปิดแอป LINE</span>
            </button>

            {/* Print / PDF button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition cursor-pointer shadow-xs"
              title="พิมพ์เอกสาร หรือ บันทึกเป็นไฟล์ PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print guidance banner in preview mode (hidden in print) */}
        <div className="no-print bg-indigo-950/90 text-indigo-200 px-4 sm:px-6 py-1.5 text-[11px] flex items-center justify-between border-b border-indigo-900/50">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            💡 ในหน้าต่างสั่งพิมพ์ เลือกปลายทางเป็น <strong className="text-white font-semibold">"บันทึกเป็น PDF (Save as PDF)"</strong> เพื่อเซฟไฟล์ส่งลูกค้า
          </span>
          <span className="text-slate-400 text-[10px] hidden md:inline">จัดสเกลพอดีหน้ากระดาษ A4</span>
        </div>

        {/* Printable Invoice Page */}
        <div id="printable-invoice" className="p-5 sm:p-7 text-slate-800 bg-white">
          <div className="invoice-body-top">
            {/* Header */}
            <div className="flex justify-between items-start pb-3.5 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                {issuer.logoUrl && (
                  <img
                    src={issuer.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold font-heading text-slate-950">ใบแจ้งหนี้ / ใบวางบิล</h1>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">INVOICE / BILLING NOTE</div>
                  <div className="mt-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 inline-block px-2 py-0.5 rounded-md font-semibold">
                    {categoryMeta?.nameThai}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-slate-900 font-mono-numbers">{invoice.invoiceNumber}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">วันที่ (Date): {invoice.issueDate}</div>
                <div className="text-[11px] text-slate-600 font-semibold">ครบกำหนด (Due Date): {invoice.dueDate}</div>
              </div>
            </div>

            {/* Issuer & Client Info */}
            <div className="grid grid-cols-2 gap-6 py-3.5 border-b border-slate-200 text-[11px] leading-snug">
              <div>
                <div className="font-bold text-slate-900 text-xs mb-0.5 font-heading">ผู้ออกเอกสาร (ผู้รับเงิน):</div>
                <div className="font-semibold text-slate-800">{issuer.name}</div>
                <div className="text-slate-600">{issuer.address}</div>
                <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {issuer.taxId}</div>
                <div className="text-slate-600">โทรศัพท์: {issuer.phone}</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs mb-0.5 font-heading">ผู้รับเอกสาร (ลูกค้า/ผู้ว่าจ้าง):</div>
                <div className="font-semibold text-slate-800">{invoice.clientName}</div>
                <div className="text-slate-600">{invoice.clientAddress || '-'}</div>
                <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {invoice.clientTaxId || '-'}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-3">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-y border-slate-900 bg-slate-50 text-slate-900 font-bold">
                    <th className="py-1.5 px-2.5 w-10 text-center">ลำดับ</th>
                    <th className="py-1.5 px-2.5">รายละเอียด (Description)</th>
                    <th className="py-1.5 px-2.5 w-16 text-center">จำนวน</th>
                    <th className="py-1.5 px-2.5 w-24 text-right">ราคาต่อหน่วย</th>
                    <th className="py-1.5 px-2.5 w-24 text-right">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((it, idx) => (
                    <tr key={it.id} className="print:h-10">
                      <td className="py-2 px-2.5 text-center text-slate-400 print:py-2.5">{idx + 1}</td>
                      <td className="py-2 px-2.5 font-medium text-slate-900 print:py-2.5">{it.description}</td>
                      <td className="py-2 px-2.5 text-center font-mono-numbers print:py-2.5">{it.quantity}</td>
                      <td className="py-2 px-2.5 text-right font-mono-numbers print:py-2.5">฿{it.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-2.5 text-right font-bold font-mono-numbers print:py-2.5">฿{it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - invoice.items.length) }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="h-6 print:h-9 text-slate-300">
                      <td className="py-1 px-2.5 text-center text-slate-200">{invoice.items.length + idx + 1}</td>
                      <td className="py-1 px-2.5">&nbsp;</td>
                      <td className="py-1 px-2.5">&nbsp;</td>
                      <td className="py-1 px-2.5">&nbsp;</td>
                      <td className="py-1 px-2.5">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-slate-900 pt-3 grid grid-cols-2 gap-3 text-[11px]">
              <div className="flex flex-col justify-between">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px]">จำนวนเงินตัวอักษร:</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    ({thaiBahtText(invoice.netTotal)})
                  </div>
                </div>

                {invoice.notes && (
                  <div className="text-slate-500 text-[10px] mt-1.5">
                    <span className="font-semibold text-slate-700">หมายเหตุ:</span> {invoice.notes}
                  </div>
                )}
              </div>

              <div className="space-y-1 text-right">
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>รวมเป็นเงิน (Subtotal):</span>
                  <span className="font-semibold text-slate-900 font-mono-numbers">฿{invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-0.5 text-amber-800">
                  <span>หักภาษี ณ ที่จ่าย 3% (WHT 3%):</span>
                  <span className="font-semibold font-mono-numbers">-฿{invoice.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-slate-400 my-1"></div>
                <div className="flex justify-between py-0.5 text-xs font-bold text-slate-950">
                  <span>ยอดชำระสุทธิ (Net Payable):</span>
                  <span className="text-sm text-indigo-700 font-mono-numbers">฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-body-bottom">
            {/* Payment & PromptPay Section */}
            <div className="mt-3.5 print:mt-4 p-3.5 print:p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] print:text-xs">
              <div className="space-y-0.5 print:space-y-1 flex-1">
                <div className="font-bold text-slate-900 text-xs print:text-sm font-heading">ช่องทางการชำระเงิน (Payment Methods)</div>
                <div className="text-slate-700 font-medium">โอนเงินเข้าบัญชีธนาคาร:</div>
                <div className="text-slate-900 font-bold">{issuer.bankName} เลขที่บัญชี: <span className="font-mono-numbers">{issuer.bankAccount}</span></div>
                <div className="text-slate-600">ชื่อบัญชี: {issuer.bankAccountName}</div>
                <div className="text-slate-700 mt-1">พร้อมเพย์ (PromptPay): <span className="font-mono-numbers font-bold text-indigo-700">{issuer.promptPayId}</span></div>
                <div className="text-[10px] print:text-[11px] text-slate-500 italic mt-0.5">* กรุณาจัดส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ 3%) มายังที่อยู่ผู้รับเงิน</div>
              </div>

              {qrUrl && (
                <div className="flex flex-col items-center bg-white p-2 print:p-2.5 rounded-lg border border-slate-200 shadow-2xs shrink-0">
                  <img src={qrUrl} alt="PromptPay QR Code" className="w-24 h-24 print:w-28 print:h-28 object-contain" />
                  <div className="text-[9px] print:text-[10px] font-bold text-slate-700 mt-0.5 tracking-wider uppercase">Thai QR Payment</div>
                  <div className="text-[10px] print:text-xs font-bold text-indigo-700 font-mono-numbers">฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                </div>
              )}
            </div>

            {/* Signature Line */}
            <div className="mt-4 print:mt-6 pt-3 print:pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-6 text-center text-xs avoid-break items-end">
              <SignatureBlock isRecipient={true} issuer={issuer} />
              <SignatureBlock
                issuer={issuer}
                issueDate={invoice.issueDate}
                roleTitle="ผู้วางบิล / ผู้รับเงิน"
              />
            </div>
          </div>
        </div>

        {/* Attachment Lightbox Modal */}
        {viewAttachment && (
          <div
            className="no-print fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setViewAttachment(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setViewAttachment(null)}
                className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={viewAttachment}
                alt="Attachment Document"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
