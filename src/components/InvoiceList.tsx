import React, { useState, useEffect } from 'react';
import { Invoice, IssuerProfile } from '../domain/storage';
import { TAX_CATEGORIES, TaxCategory } from '../domain/tax';
import { downloadPnd90Csv } from '../utils/exportCsv';
import { AttachmentModal } from './AttachmentModal';
import { generatePromptPayQrDataUrl } from '../domain/promptpay';
import { thaiBahtText } from '../utils/thaiBaht';
import { formatLineInvoiceMessage, encodeInvoiceToShareUrl } from '../utils/shareInvoice';
import {
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Printer,
  Download,
  Paperclip,
  Eye,
  FileText,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  MessageCircle,
  Check,
  Share2
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  issuer: IssuerProfile;
  selectedInvoice: Invoice | null;
  onSelectInvoice: (invoice: Invoice) => void;
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

  // Keyboard shortcut listener: Cmd/Ctrl + N to create new invoice
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

  return (
    <div className="space-y-4">
      {/* Top Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่บิล หรือ ชื่อลูกค้า..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-slate-50/50"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">ทุกหมวดเงินได้</option>
            <option value="40_2">40(2) จ้างทำของ</option>
            <option value="40_6">40(6) วิชาชีพอิสระ</option>
            <option value="40_8">40(8) คอนเทนต์/ค้าขาย</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">สถานะ 50 ทวิทั้งหมด</option>
            <option value="tawi_received">เฉพาะที่ได้รับ 50 ทวิแล้ว</option>
            <option value="tawi_pending">เฉพาะที่รอทวง 50 ทวิ</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadPnd90Csv(invoices)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-200 cursor-pointer"
            title="ส่งออกรายการทั้งหมดเป็นไฟล์ Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ออกบิลใหม่</span>
            <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.2 bg-indigo-800 text-[10px] text-indigo-200 rounded">
              ⌘N
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Responsive Layout: Split-View on Desktop (lg), List on Mobile */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
        
        {/* Left Column: Invoices List (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              ไม่พบรายการวางบิลที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filtered.map(inv => {
              const isSelected = currentPreview?.id === inv.id;
              const catMeta = TAX_CATEGORIES[inv.category as TaxCategory];

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className={`p-4 rounded-2xl border transition cursor-pointer bg-white relative flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm bg-indigo-50/10'
                      : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm font-heading">{inv.invoiceNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                          {catMeta?.categoryLabel || inv.category}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-1 line-clamp-1">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">ออกเมื่อ: {inv.issueDate}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono-numbers text-slate-900">
                        ฿{inv.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-amber-700 font-mono-numbers">
                        หัก 3%: -฿{inv.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggle50Tawi(inv.id);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[11px] font-semibold cursor-pointer transition ${
                        inv.has50Tawi
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                      title="แตะเพื่อสลับสถานะใบ 50 ทวิ"
                    >
                      {inv.has50Tawi ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 50 ทวิ ได้รับแล้ว
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" /> 50 ทวิ รอทวง
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
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
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="ลบรายการบิล"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="lg:hidden">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Sticky Invoice Document (7 cols on lg, hidden on mobile/small screens) */}
        <div className="hidden lg:block lg:col-span-7 sticky top-20">
          {currentPreview ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-slate-800 text-xs">
              
              {/* Top Document Header */}
              <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900">
                <div>
                  <span className="text-xl font-bold font-heading text-slate-950">ใบแจ้งหนี้ / ใบวางบิล</span>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">INVOICE / BILLING NOTE</div>
                  <div className="mt-2 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 inline-block px-2.5 py-0.5 rounded-md font-semibold">
                    {TAX_CATEGORIES[currentPreview.category]?.nameThai}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900 font-mono-numbers">{currentPreview.invoiceNumber}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">วันที่: {currentPreview.issueDate}</div>
                  <div className="text-slate-600 text-[11px]">ครบกำหนด: {currentPreview.dueDate}</div>
                </div>
              </div>

              {/* Issuer & Client Info */}
              <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-200 text-[11px] leading-relaxed">
                <div>
                  <div className="font-bold text-slate-900 font-heading mb-1">ผู้ออกเอกสาร (ผู้รับเงิน):</div>
                  <div className="font-semibold text-slate-800">{issuer.name}</div>
                  <div className="text-slate-500">{issuer.address}</div>
                  <div className="text-slate-500">Tax ID: {issuer.taxId}</div>
                  <div className="text-slate-500">โทร: {issuer.phone}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 font-heading mb-1">ผู้รับเอกสาร (ลูกค้า):</div>
                  <div className="font-semibold text-slate-800">{currentPreview.clientName}</div>
                  <div className="text-slate-500">{currentPreview.clientAddress || '-'}</div>
                  <div className="text-slate-500">Tax ID: {currentPreview.clientTaxId || '-'}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-slate-900 bg-slate-50/80 font-bold text-slate-900 text-[11px]">
                      <th className="py-2 px-2.5 w-10 text-center">#</th>
                      <th className="py-2 px-2.5">รายละเอียด</th>
                      <th className="py-2 px-2.5 w-16 text-center">จำนวน</th>
                      <th className="py-2 px-2.5 w-24 text-right">ราคา/หน่วย</th>
                      <th className="py-2 px-2.5 w-24 text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {currentPreview.items.map((it, idx) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-2.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-2.5 font-medium text-slate-900">{it.description}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono-numbers">{it.quantity}</td>
                        <td className="py-2.5 px-2.5 text-right font-mono-numbers">฿{it.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-2.5 text-right font-bold font-mono-numbers">฿{it.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Thai Baht */}
              <div className="border-t border-slate-900 pt-3 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                  <span className="text-slate-400 text-[10px]">จำนวนเงินตัวอักษร:</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5">
                    ({thaiBahtText(currentPreview.netTotal)})
                  </span>
                </div>

                <div className="space-y-1 text-right text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>รวมเป็นเงิน:</span>
                    <span className="font-semibold text-slate-900 font-mono-numbers">฿{currentPreview.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>หัก ณ ที่จ่าย 3%:</span>
                    <span className="font-semibold font-mono-numbers">-฿{currentPreview.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-slate-300 my-1"></div>
                  <div className="flex justify-between text-sm font-bold text-slate-950">
                    <span>ยอดชำระสุทธิ:</span>
                    <span className="text-indigo-700 font-mono-numbers">฿{currentPreview.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Payment Box & PromptPay QR */}
              <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 text-[11px]">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 font-heading">ช่องทางการชำระเงิน</div>
                  <div className="text-slate-600">{issuer.bankName} เลขที่: <strong className="font-mono">{issuer.bankAccount}</strong></div>
                  <div className="text-slate-600">ชื่อบัญชี: {issuer.bankAccountName}</div>
                  <div className="text-slate-700 mt-1">พร้อมเพย์: <strong className="font-mono text-indigo-700">{issuer.promptPayId}</strong></div>
                </div>

                {liveQrUrl && (
                  <div className="flex flex-col items-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <img src={liveQrUrl} alt="PromptPay QR" className="w-24 h-24 object-contain" />
                    <span className="text-[9px] font-bold text-slate-600 mt-0.5 uppercase tracking-wide">Thai QR Pay</span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyLine}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      copiedLine
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                    title="คัดลอกข้อความสรุปและบัญชีโอนสำหรับส่งใน LINE"
                  >
                    {copiedLine ? <Check className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{copiedLine ? 'คัดลอกแล้ว!' : 'คัดลอกส่ง LINE'}</span>
                  </button>

                  <button
                    onClick={handleOpenLineApp}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                    title="เปิดแอป LINE ทันที"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>แชร์ LINE</span>
                  </button>

                  <button
                    onClick={() => setAttachingInvoice(currentPreview)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> แนบหลักฐาน
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> สั่งพิมพ์ / PDF
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
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
