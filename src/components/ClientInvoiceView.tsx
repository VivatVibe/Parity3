import React, { useEffect, useState } from 'react';
import { Invoice, IssuerProfile } from '../domain/storage';
import { TAX_CATEGORIES } from '../domain/tax';
import { generatePromptPayQrDataUrl } from '../domain/promptpay';
import { thaiBahtText } from '../utils/thaiBaht';
import { SignatureBlock } from './SignatureBlock';
import { Printer, Copy, Check, ShieldCheck, ArrowLeft, Share2 } from 'lucide-react';

interface Props {
  invoice: Invoice;
  issuer: IssuerProfile;
  onBackToApp?: () => void;
}

export const ClientInvoiceView: React.FC<Props> = ({ invoice, issuer, onBackToApp }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  useEffect(() => {
    if (issuer.promptPayId) {
      generatePromptPayQrDataUrl(issuer.promptPayId, invoice.netTotal)
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [issuer.promptPayId, invoice.netTotal]);

  const copyToClipboard = (text: string, type: 'bank' | 'pp') => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedPromptPay(true);
      setTimeout(() => setCopiedPromptPay(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/90 py-6 sm:py-10 px-4 font-['Sarabun',sans-serif]">
      {/* Top Banner Actions (Hidden in Print) */}
      <div className="no-print max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <span className="text-xs text-slate-500">ใบแจ้งหนี้ออนไลน์จาก</span>
          <div className="font-bold text-slate-900 text-sm font-heading">{issuer.name}</div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าระบบ
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> พิมพ์หรือบันทึก PDF
          </button>
        </div>
      </div>

      {/* Main Invoice Card Paper */}
      <div id="printable-invoice" className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 text-slate-800 text-xs">
        <div className="invoice-body-top">
          {/* Header */}
          <div className="flex justify-between items-start pb-3.5 border-b-2 border-slate-900">
            <div>
              <h1 className="text-xl font-bold font-heading text-slate-950">ใบแจ้งหนี้ / ใบวางบิล</h1>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">INVOICE / BILLING NOTE</div>
              <div className="mt-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 inline-block px-2 py-0.5 rounded-md font-semibold">
                {TAX_CATEGORIES[invoice.category]?.nameThai}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-slate-900 font-mono-numbers">{invoice.invoiceNumber}</div>
              <div className="text-slate-600 text-[11px] mt-0.5">วันที่: {invoice.issueDate}</div>
              <div className="text-slate-600 text-[11px] font-semibold">ครบกำหนด: {invoice.dueDate}</div>
            </div>
          </div>

          {/* Issuer & Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-3.5 border-b border-slate-200 text-[11px] leading-snug">
            <div>
              <div className="font-bold text-slate-900 font-heading text-xs mb-0.5">ผู้ออกเอกสาร (ผู้รับเงิน):</div>
              <div className="font-semibold text-slate-800">{issuer.name}</div>
              <div className="text-slate-600">{issuer.address}</div>
              <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {issuer.taxId}</div>
              <div className="text-slate-600">โทรศัพท์: {issuer.phone}</div>
            </div>
            <div>
              <div className="font-bold text-slate-900 font-heading text-xs mb-0.5">ผู้รับเอกสาร (ลูกค้า/ผู้ว่าจ้าง):</div>
              <div className="font-semibold text-slate-800">{invoice.clientName}</div>
              <div className="text-slate-600">{invoice.clientAddress || '-'}</div>
              <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {invoice.clientTaxId || '-'}</div>
            </div>
          </div>

          {/* Line Items */}
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
                  <tr key={it.id}>
                    <td className="py-2 px-2.5 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-2.5 font-medium text-slate-900">{it.description}</td>
                    <td className="py-2 px-2.5 text-center font-mono-numbers">{it.quantity}</td>
                    <td className="py-2 px-2.5 text-right font-mono-numbers">฿{it.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2.5 text-right font-bold font-mono-numbers">฿{it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation */}
          <div className="border-t border-slate-900 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center">
              <span className="text-slate-500 text-[10px]">จำนวนเงินตัวอักษร:</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5">
                ({thaiBahtText(invoice.netTotal)})
              </span>
            </div>

            <div className="space-y-1 text-right">
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>รวมเป็นเงิน (Subtotal):</span>
                <span className="font-semibold text-slate-900 font-mono-numbers">฿{invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-0.5 text-amber-800">
                <span>หักภาษี ณ ที่จ่าย 3% (Withholding Tax):</span>
                <span className="font-semibold font-mono-numbers">-฿{invoice.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-300 my-1"></div>
              <div className="flex justify-between py-0.5 text-xs font-bold text-slate-950">
                <span>ยอดชำระสุทธิ (Net Payable):</span>
                <span className="text-sm text-indigo-700 font-mono-numbers">฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="invoice-body-bottom">
          {/* Payment Methods & Thai QR */}
          <div className="mt-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="space-y-1.5 flex-1">
              <div className="font-bold text-slate-950 text-xs font-heading">ช่องทางการชำระเงิน (Payment Methods)</div>
              
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-0.5">
                <div className="text-slate-600 font-medium">โอนเงินเข้าบัญชีธนาคาร:</div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-950 font-bold text-xs font-mono-numbers">{issuer.bankName} {issuer.bankAccount}</span>
                  <button
                    onClick={() => copyToClipboard(issuer.bankAccount, 'bank')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedBank ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedBank ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}
                  </button>
                </div>
                <div className="text-slate-500 text-[10px]">ชื่อบัญชี: {issuer.bankAccountName}</div>
              </div>

              <div className="flex items-center gap-2 pt-0.5 text-slate-700">
                <span>พร้อมเพย์: <strong className="font-mono text-indigo-700 font-bold">{issuer.promptPayId}</strong></span>
                <button
                  onClick={() => copyToClipboard(issuer.promptPayId, 'pp')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedPromptPay ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedPromptPay ? 'คัดลอกแล้ว' : 'คัดลอกเบอร์พร้อมเพย์'}
                </button>
              </div>

              <div className="text-[10px] text-slate-500 italic pt-0.5">
                * กรุณาจัดส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ 3%) มายังที่อยู่ผู้รับเงิน
              </div>
            </div>

            {qrUrl && (
              <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <img src={qrUrl} alt="PromptPay QR Code" className="w-24 h-24 object-contain" />
                <span className="text-[9px] font-bold text-slate-700 mt-0.5 uppercase tracking-wider">Thai QR Payment</span>
                <span className="text-[10px] font-bold font-mono-numbers text-indigo-700 mt-0.5">
                  ฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Signature Line */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-6 text-center text-xs avoid-break items-end">
            <SignatureBlock isRecipient={true} issuer={issuer} />
            <SignatureBlock
              issuer={issuer}
              issueDate={invoice.issueDate}
              roleTitle="ผู้วางบิล / ผู้รับเงิน"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
