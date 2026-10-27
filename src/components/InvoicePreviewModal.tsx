import React, { useEffect, useState } from 'react';
import { Invoice, IssuerProfile } from '../domain/storage';
import { TAX_CATEGORIES } from '../domain/tax';
import { generatePromptPayQrDataUrl } from '../domain/promptpay';
import { thaiBahtText } from '../utils/thaiBaht';
import { X, Printer, Paperclip, Eye } from 'lucide-react';

interface Props {
  invoice: Invoice;
  issuer: IssuerProfile;
  onClose: () => void;
}

export const InvoicePreviewModal: React.FC<Props> = ({ invoice, issuer, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [viewAttachment, setViewAttachment] = useState<string | null>(null);
  const categoryMeta = TAX_CATEGORIES[invoice.category];

  useEffect(() => {
    if (issuer.promptPayId) {
      generatePromptPayQrDataUrl(issuer.promptPayId, invoice.netTotal)
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [issuer.promptPayId, invoice.netTotal]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl my-6 border border-slate-200 print:border-none print:shadow-none print:m-0 print:p-0">
        
        {/* Floating Toolbar (hidden in print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-800 text-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">ตัวอย่างก่อนพิมพ์ (Invoice Preview & Print)</span>
            {invoice.slipImage && (
              <button
                onClick={() => setViewAttachment(invoice.slipImage!)}
                className="px-2 py-0.5 bg-emerald-600/80 hover:bg-emerald-500 rounded text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" /> ดูสลิปโอนเงิน
              </button>
            )}
            {invoice.tawiImage && (
              <button
                onClick={() => setViewAttachment(invoice.tawiImage!)}
                className="px-2 py-0.5 bg-amber-600/80 hover:bg-amber-500 rounded text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" /> ดูใบ 50 ทวิ
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> พิมพ์หรือบันทึกเป็น PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Page */}
        <div className="p-8 sm:p-12 text-slate-800 font-['Sarabun'] bg-white">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
            <div>
              <h1 className="text-2xl font-bold font-heading text-slate-950">ใบแจ้งหนี้ / ใบวางบิล</h1>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">INVOICE / BILLING NOTE</div>
              <div className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 inline-block px-2 py-0.5 rounded font-medium">
                {categoryMeta?.nameThai}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">{invoice.invoiceNumber}</div>
              <div className="text-xs text-slate-600 mt-1">วันที่ (Date): {invoice.issueDate}</div>
              <div className="text-xs text-slate-600">ครบกำหนด (Due Date): {invoice.dueDate}</div>
            </div>
          </div>

          {/* Issuer & Client Info */}
          <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs leading-relaxed">
            <div>
              <div className="font-bold text-slate-900 text-sm mb-1 font-heading">ผู้ออกเอกสาร (ผู้รับเงิน):</div>
              <div className="font-semibold text-slate-800">{issuer.name}</div>
              <div className="text-slate-600">{issuer.address}</div>
              <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {issuer.taxId}</div>
              <div className="text-slate-600">โทรศัพท์: {issuer.phone}</div>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm mb-1 font-heading">ผู้รับเอกสาร (ลูกค้า/ผู้ว่าจ้าง):</div>
              <div className="font-semibold text-slate-800">{invoice.clientName}</div>
              <div className="text-slate-600">{invoice.clientAddress || '-'}</div>
              <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {invoice.clientTaxId || '-'}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-slate-900 bg-slate-50 text-slate-900 font-bold">
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3">รายละเอียด (Description)</th>
                  <th className="py-2.5 px-3 w-20 text-center">จำนวน</th>
                  <th className="py-2.5 px-3 w-28 text-right">ราคาต่อหน่วย</th>
                  <th className="py-2.5 px-3 w-28 text-right">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{it.description}</td>
                    <td className="py-3 px-3 text-center">{it.quantity}</td>
                    <td className="py-3 px-3 text-right">฿{it.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-right font-medium">฿{it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="border-t border-slate-900 pt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col justify-between">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="text-slate-500 text-[11px]">จำนวนเงินตัวอักษร:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  ({thaiBahtText(invoice.netTotal)})
                </div>
              </div>

              {invoice.notes && (
                <div className="text-slate-500 text-[11px] mt-2">
                  <span className="font-semibold text-slate-700">หมายเหตุ:</span> {invoice.notes}
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-right">
              <div className="flex justify-between py-1 text-slate-600">
                <span>รวมเป็นเงิน (Subtotal):</span>
                <span className="font-semibold text-slate-900">฿{invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 text-amber-800">
                <span>หักภาษี ณ ที่จ่าย 3% (Withholding Tax 3%):</span>
                <span className="font-semibold">-฿{invoice.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-400 my-1"></div>
              <div className="flex justify-between py-1 text-sm font-bold text-slate-950">
                <span>ยอดชำระสุทธิ (Net Payable):</span>
                <span className="text-base text-blue-700">฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment & PromptPay Section */}
          <div className="mt-8 p-4 rounded-xl border border-slate-300 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 text-sm font-heading">ช่องทางการชำระเงิน (Payment Methods)</div>
              <div className="text-slate-700 font-medium">โอนเงินเข้าบัญชีธนาคาร:</div>
              <div className="text-slate-900 font-bold">{issuer.bankName} เลขที่บัญชี: {issuer.bankAccount}</div>
              <div className="text-slate-600">ชื่อบัญชี: {issuer.bankAccountName}</div>
              <div className="text-slate-700 mt-2">พร้อมเพย์ (PromptPay): <span className="font-mono font-bold text-slate-900">{issuer.promptPayId}</span></div>
              <div className="text-[11px] text-slate-500 italic mt-1">* กรุณาจัดส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ 3%) มายังที่อยู่ผู้รับเงิน</div>
            </div>

            {qrUrl && (
              <div className="flex flex-col items-center bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <img src={qrUrl} alt="PromptPay QR Code" className="w-32 h-32 object-contain" />
                <div className="text-[10px] font-bold text-blue-900 mt-1 tracking-wider uppercase">Thai QR Payment</div>
                <div className="text-[11px] font-bold text-slate-800">฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>

          {/* Signature Line */}
          <div className="mt-12 pt-6 grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto pb-8"></div>
              <div className="mt-2 font-medium text-slate-700">(...........................................................)</div>
              <div className="text-slate-500">ผู้รับวางบิล / วันที่</div>
            </div>
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto pb-8"></div>
              <div className="mt-2 font-medium text-slate-700">({issuer.name})</div>
              <div className="text-slate-500">ผู้วางบิล / ผู้รับเงิน</div>
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
