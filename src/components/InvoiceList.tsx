import React, { useState, useEffect } from 'react';
import { Invoice, IssuerProfile } from '../domain/storage';
import { TAX_CATEGORIES, TaxCategory } from '../domain/tax';
import { downloadPnd90Csv } from '../utils/exportCsv';
import { AttachmentModal } from './AttachmentModal';
import { generatePromptPayQrDataUrl } from '../domain/promptpay';
import { thaiBahtText } from '../utils/thaiBaht';
import { formatLineInvoiceMessage, encodeInvoiceToShareUrl } from '../utils/shareInvoice';
import { SignatureBlock } from './SignatureBlock';
import {
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Printer,
  Download,
  Paperclip,
  Search,
  MessageCircle,
  Check,
  Share2,
  Building2,
  Calendar,
  FileCheck2
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  issuer: IssuerProfile;
  selectedInvoice: Invoice | null;
  onSelectInvoice: (invoice: Invoice) => void;
  onOpenPrint?: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onToggle50Tawi: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onCreateNew: () => void;
}

export const InvoiceList: React.FC<Props> = ({
  invoices,
  issuer,
  selectedInvoice,
  onSelectInvoice,
  onOpenPrint,
  onUpdateInvoice,
  onToggle50Tawi,
  onDeleteInvoice,
  onCreateNew
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [attachingInvoice, setAttachingInvoice] = useState<Invoice | null>(null);
  const [liveQrUrl, setLiveQrUrl] = useState<string>('');
  const [copiedLine, setCopiedLine] = useState(false);

  const currentPreview = selectedInvoice || invoices[0] || null;

  const handleCopyLine = () => {
    if (!currentPreview) return;
    const shareUrl = encodeInvoiceToShareUrl(currentPreview, issuer);
    const msg = formatLineInvoiceMessage(currentPreview, issuer, shareUrl);
    navigator.clipboard.writeText(msg);
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 2500);
  };

  const handleOpenLineApp = () => {
    if (!currentPreview) return;
    const shareUrl = encodeInvoiceToShareUrl(currentPreview, issuer);
    const msg = formatLineInvoiceMessage(currentPreview, issuer, shareUrl);
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msg)}`, '_blank');
  };

  useEffect(() => {
    if (currentPreview && issuer.promptPayId) {
      generatePromptPayQrDataUrl(issuer.promptPayId, currentPreview.netTotal)
        .then(setLiveQrUrl)
        .catch(console.error);
    }
  }, [currentPreview, issuer.promptPayId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onCreateNew();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCreateNew]);

  const filtered = invoices.filter(inv => {
    const matchesCat = filterCategory === 'all' || inv.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'tawi_received' ? inv.has50Tawi :
      filterStatus === 'tawi_pending' ? !inv.has50Tawi : true;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesStatus && matchesSearch;
  });

  // Calculate quick summary metrics (Vercel-style high signal)
  const totalBilled = filtered.reduce((acc, inv) => acc + inv.subtotal, 0);
  const totalWht = filtered.reduce((acc, inv) => acc + inv.whtAmount, 0);
  const totalNet = filtered.reduce((acc, inv) => acc + inv.netTotal, 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Search & Precision Control Bar with High-Signal Metrics Strip */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่บิล หรือ ชื่อลูกค้า..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white/70 w-full transition placeholder:text-slate-400 font-medium"
              />
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white/80 font-medium text-slate-700 cursor-pointer"
            >
              <option value="all">ทุกหมวดเงินได้</option>
              <option value="40_2">40(2) จ้างทำของ / นายหน้า</option>
              <option value="40_6">40(6) วิชาชีพอิสระ</option>
              <option value="40_8">40(8) ธุรกิจ / คอนเทนต์</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white/80 font-medium text-slate-700 cursor-pointer"
            >
              <option value="all">สถานะ 50 ทวิทั้งหมด</option>
              <option value="tawi_received">ได้รับใบ 50 ทวิแล้ว</option>
              <option value="tawi_pending">รอทวงใบ 50 ทวิ</option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => downloadPnd90Csv(invoices)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-200/90 shadow-2xs cursor-pointer active:scale-95"
              title="ส่งออกรายการทั้งหมดเป็นไฟล์ Excel / CSV สำหรับยื่น ภ.ง.ด. 90"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onCreateNew}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-[0_4px_14px_rgba(79,70,229,0.35)] transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.8]" />
              <span>ออกบิลใหม่</span>
              <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.5 bg-white/20 text-[10px] text-white rounded">
                ⌘N
              </kbd>
            </button>
          </div>
        </div>

        {/* High-Signal Metrics Strip (Vercel-style clean tabular strip) */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/70 text-[11px]">
          <div className="flex items-baseline gap-1 text-slate-500">
            <span>บิลรวม:</span>
            <span className="font-bold text-slate-900 font-mono-numbers">
              ฿{totalBilled.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-baseline gap-1 text-amber-700">
            <span>หัก 3%:</span>
            <span className="font-bold font-mono-numbers">
              -฿{totalWht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-baseline gap-1 text-emerald-700 text-right justify-end">
            <span>รับสุทธิ:</span>
            <span className="font-bold font-mono-numbers">
              ฿{totalNet.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Layout: Split-View on Desktop (lg), Card Feed on Mobile */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
        
        {/* Left Column: Modern Glassmorphic Invoices Feed (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <FileCheck2 className="w-8 h-8 text-slate-300" />
              <span>ไม่พบรายการวางบิลที่ตรงกับเงื่อนไขการค้นหา</span>
            </div>
          ) : (
            filtered.map(inv => {
              const isSelected = currentPreview?.id === inv.id;
              const catMeta = TAX_CATEGORIES[inv.category as TaxCategory];

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-white/95 border-indigo-600 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.15)] ring-2 ring-indigo-500/20 -translate-y-0.5'
                      : 'bg-white/75 hover:bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Card Header: Invoice # & Tax Category Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-950 text-sm font-heading tracking-tight">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-200/60">
                          {catMeta?.categoryLabel || inv.category}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{inv.clientName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span>ออกเมื่อ: {inv.issueDate}</span>
                      </div>
                    </div>

                    {/* Financial Figures: Net Transfer + Micro 3% WHT Badge */}
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono-numbers text-slate-950 tracking-tight">
                        ฿{inv.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono-numbers font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
                        หัก 3%: -฿{inv.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Interactive 50 Tawi Toggle & Fast Actions */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onToggle50Tawi(inv.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition active:scale-95 ${
                        inv.has50Tawi
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 shadow-2xs'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100 shadow-2xs'
                      }`}
                      title="คลิกเพื่อสลับสถานะเอกสาร 50 ทวิ"
                    >
                      {inv.has50Tawi ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>50 ทวิ ได้รับแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>รอทวง 50 ทวิ</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setAttachingInvoice(inv)}
                        className={`p-1.5 rounded-lg transition cursor-pointer relative ${
                          inv.slipImage || inv.tawiImage
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                        }`}
                        title="แนบรูปสลิป / รูปใบ 50 ทวิ"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {(inv.slipImage || inv.tawiImage) && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="ลบรายการบิล"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Sticky Luxury Printable Invoice Canvas (7 cols on lg) */}
        <div className="hidden lg:block lg:col-span-7 sticky top-20">
          {currentPreview ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_15px_40px_-10px_rgba(15,23,42,0.08)] p-8 text-slate-800 text-xs relative overflow-hidden">
              
              {/* Subtle Ambient Background Watermark */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

              {/* Document Header */}
              <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900 relative">
                <div>
                  <span className="text-2xl font-bold font-heading text-slate-950 tracking-tight">
                    ใบแจ้งหนี้ / ใบวางบิล
                  </span>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    INVOICE / BILLING NOTE
                  </div>
                  <div className="mt-2.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 inline-block px-3 py-0.5 rounded-full font-semibold">
                    {TAX_CATEGORIES[currentPreview.category]?.nameThai}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-950 font-mono-numbers">
                    {currentPreview.invoiceNumber}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">วันที่: {currentPreview.issueDate}</div>
                  <div className="text-slate-500 text-[11px]">ครบกำหนด: {currentPreview.dueDate}</div>
                </div>
              </div>

              {/* Issuer & Client Cards */}
              <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-200 text-[11px] leading-relaxed">
                <div>
                  <div className="font-bold text-slate-900 font-heading mb-1 uppercase tracking-wider text-[10px] text-slate-400">
                    ผู้ออกเอกสาร (ผู้รับเงิน)
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{issuer.name}</div>
                  <div className="text-slate-600 mt-0.5">{issuer.address}</div>
                  <div className="text-slate-600">Tax ID: <strong className="font-mono text-slate-800">{issuer.taxId}</strong></div>
                  <div className="text-slate-600">โทร: {issuer.phone}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 font-heading mb-1 uppercase tracking-wider text-[10px] text-slate-400">
                    ผู้รับเอกสาร (ลูกค้า)
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{currentPreview.clientName}</div>
                  <div className="text-slate-600 mt-0.5">{currentPreview.clientAddress || '-'}</div>
                  <div className="text-slate-600">Tax ID: <strong className="font-mono text-slate-800">{currentPreview.clientTaxId || '-'}</strong></div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-slate-900 bg-slate-50 font-bold text-slate-900 text-[11px]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">รายละเอียดงาน</th>
                      <th className="py-2.5 px-3 w-16 text-center">จำนวน</th>
                      <th className="py-2.5 px-3 w-28 text-right">ราคา/หน่วย</th>
                      <th className="py-2.5 px-3 w-28 text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {currentPreview.items.map((it, idx) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono-numbers">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{it.description}</td>
                        <td className="py-2.5 px-3 text-center font-mono-numbers text-slate-700">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-700">฿{it.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono-numbers text-slate-950">฿{it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Thai Baht Text */}
              <div className="border-t border-slate-900 pt-3.5 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-center">
                  <span className="text-slate-400 text-[10px] font-medium">จำนวนเงินตัวอักษร:</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5">
                    ({thaiBahtText(currentPreview.netTotal)})
                  </span>
                </div>

                <div className="space-y-1.5 text-right text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>รวมเป็นเงิน (Subtotal):</span>
                    <span className="font-semibold text-slate-900 font-mono-numbers">
                      ฿{currentPreview.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>หัก ณ ที่จ่าย 3% (WHT):</span>
                    <span className="font-mono-numbers">
                      -฿{currentPreview.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 my-1"></div>
                  <div className="flex justify-between text-sm font-bold text-slate-950">
                    <span>ยอดชำระสุทธิ (Net Total):</span>
                    <span className="text-indigo-600 font-mono-numbers text-base font-extrabold">
                      ฿{currentPreview.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Box & PromptPay QR Integration */}
              <div className="mt-5 p-4 rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between gap-4 text-[11px]">
                <div className="space-y-1">
                  <div className="font-bold text-slate-950 font-heading">ช่องทางการชำระเงิน (PromptPay & Bank)</div>
                  <div className="text-slate-600">{issuer.bankName} เลขที่: <strong className="font-mono text-slate-900">{issuer.bankAccount}</strong></div>
                  <div className="text-slate-600">ชื่อบัญชี: {issuer.bankAccountName}</div>
                  <div className="text-slate-700 mt-1">พร้อมเพย์: <strong className="font-mono text-indigo-700 font-bold">{issuer.promptPayId}</strong></div>
                </div>

                {liveQrUrl && (
                  <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <img src={liveQrUrl} alt="PromptPay QR" className="w-24 h-24 object-contain" />
                    <span className="text-[9px] font-bold text-slate-700 mt-0.5 tracking-wider uppercase">Thai QR Pay</span>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                <SignatureBlock isRecipient={true} issuer={issuer} />
                <SignatureBlock
                  issuer={issuer}
                  issueDate={currentPreview.issueDate}
                  roleTitle="ผู้วางบิล / ผู้รับเงิน"
                />
              </div>

              {/* Bottom Quick Actions Floating Bar */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLine}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 ${
                      copiedLine
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
                    }`}
                  >
                    {copiedLine ? <Check className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{copiedLine ? 'คัดลอกสำเร็จ!' : 'คัดลอกส่ง LINE'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenLineApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200/80"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>แชร์ LINE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttachingInvoice(currentPreview)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200/80"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>แนบหลักฐาน</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPrint) {
                      onOpenPrint(currentPreview);
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ / บันทึก PDF (A4 เป๊ะ)</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-16 text-center text-slate-400 text-xs">
              เลือกใบวางบิลจากรายการฝั่งซ้ายเพื่อดูตัวอย่างเอกสาร
            </div>
          )}
        </div>

      </div>

      {/* Attachment Modal */}
      {attachingInvoice && (
        <AttachmentModal
          invoice={attachingInvoice}
          onUpdateInvoice={updated => {
            onUpdateInvoice(updated);
            setAttachingInvoice(updated);
          }}
          onClose={() => setAttachingInvoice(null)}
        />
      )}
    </div>
  );
};
