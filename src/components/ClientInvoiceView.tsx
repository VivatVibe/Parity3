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
      <div id="printable-invoice" className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 text-slate-800 text-xs">
        {/* Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-950">ใบแจ้งหนี้ / ใบวางบิล</h1>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">INVOICE / BILLING NOTE</div>
            <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 inline-block px-2.5 py-0.5 rounded-md font-semibold">
              {TAX_CATEGORIES[invoice.category]?.nameThai}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 font-mono-numbers">{invoice.invoiceNumber}</div>
            <div className="text-slate-600 text-xs mt-1">วันที่: {invoice.issueDate}</div>
            <div className="text-slate-600 text-xs font-semibold">ครบกำหนด: {invoice.dueDate}</div>
          </div>
        </div>

        {/* Issuer & Client Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs leading-relaxed">
          <div>
            <div className="font-bold text-slate-900 font-heading text-sm mb-1">ผู้ออกเอกสาร (ผู้รับเงิน):</div>
            <div className="font-semibold text-slate-800">{issuer.name}</div>
            <div className="text-slate-600">{issuer.address}</div>
            <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {issuer.taxId}</div>
            <div className="text-slate-600">โทรศัพท์: {issuer.phone}</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 font-heading text-sm mb-1">ผู้รับเอกสาร (ลูกค้า/ผู้ว่าจ้าง):</div>
            <div className="font-semibold text-slate-800">{invoice.clientName}</div>
            <div className="text-slate-600">{invoice.clientAddress || '-'}</div>
            <div className="text-slate-600">เลขประจำตัวผู้เสียภาษี: {invoice.clientTaxId || '-'}</div>
          </div>
        </div>

        {/* Line Items */}
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
                  <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{it.description}</td>
                  <td className="py-3 px-3 text-center font-mono-numbers">{it.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono-numbers">฿{it.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-right font-bold font-mono-numbers">฿{it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation */}
        <div className="border-t border-slate-900 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
            <span className="text-slate-500 text-[11px]">จำนวนเงินตัวอักษร:</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5">
              ({thaiBahtText(invoice.netTotal)})
            </span>
          </div>

          <div className="space-y-1.5 text-right">
            <div className="flex justify-between py-1 text-slate-600">
              <span>รวมเป็นเงิน (Subtotal):</span>
              <span className="font-semibold text-slate-900 font-mono-numbers">฿{invoice.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1 text-amber-800">
              <span>หักภาษี ณ ที่จ่าย 3% (Withholding Tax):</span>
              <span className="font-semibold font-mono-numbers">-฿{invoice.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-slate-300 my-1"></div>
            <div className="flex justify-between py-1 text-sm font-bold text-slate-950">
              <span>ยอดชำระสุทธิ (Net Payable):</span>
              <span className="text-base text-indigo-700 font-mono-numbers">฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods & Thai QR */}
        <div className="mt-8 p-6 rounded-2xl border border-slate-300 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-2 flex-1">
            <div className="font-bold text-slate-950 text-sm font-heading">ช่องทางการชำระเงิน (Payment Methods)</div>
            
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-600 font-medium">โอนเงินเข้าบัญชีธนาคาร:</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-950 font-bold text-sm font-mono-numbers">{issuer.bankName} {issuer.bankAccount}</span>
                <button
                  onClick={() => copyToClipboard(issuer.bankAccount, 'bank')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedBank ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedBank ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}
                </button>
              </div>
              <div className="text-slate-500">ชื่อบัญชี: {issuer.bankAccountName}</div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-slate-700">
              <span>พร้อมเพย์: <strong className="font-mono text-indigo-700 font-bold">{issuer.promptPayId}</strong></span>
              <button
                onClick={() => copyToClipboard(issuer.promptPayId, 'pp')}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                {copiedPromptPay ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedPromptPay ? 'คัดลอกแล้ว' : 'คัดลอกเบอร์พร้อมเพย์'}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 italic pt-1">
              * กรุณาจัดส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ 3%) มายังที่อยู่ผู้รับเงิน
            </div>
          </div>

          {qrUrl && (
            <div className="flex flex-col items-center bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
              <img src={qrUrl} alt="PromptPay QR Code" className="w-36 h-36 object-contain" />
              <span className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-wider">Thai QR Payment</span>
              <span className="text-xs font-bold font-mono-numbers text-indigo-700 mt-0.5">
                ฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Signature Line */}
        <div className="mt-8 pt-6 grid grid-cols-2 gap-8 text-center text-xs avoid-break">
          <SignatureBlock isRecipient={true} issuer={issuer} />
          <SignatureBlock
            issuer={issuer}
            issueDate={invoice.issueDate}
            roleTitle="ผู้วางบิล / ผู้รับเงิน"
          />
        </div>
      </div>
    </div>
  );
};
