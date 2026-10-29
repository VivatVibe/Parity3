import React, { useState } from 'react';
import { Invoice, IssuerProfile } from '../domain/storage';
import { groupPending50TawiByClient } from '../domain/tax';
import { formatTawiReminderMessage, generateLineTawiReminderUrl } from '../utils/shareInvoice';
import { X, Check, Copy, MessageSquare, ExternalLink, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  issuer?: IssuerProfile;
  onToggle50Tawi?: (invoiceId: string) => void;
}

export const TawiReminderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  invoices,
  issuer,
  onToggle50Tawi
}) => {
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  if (!isOpen) return null;

  const groups = groupPending50TawiByClient(invoices);
  const totalPendingInvoices = groups.reduce((sum, g) => sum + g.invoices.length, 0);
  const totalPendingWht = groups.reduce((sum, g) => sum + g.totalWht, 0);

  const handleCopy = (group: typeof groups[0]) => {
    const text = formatTawiReminderMessage(group, issuer?.name);
    navigator.clipboard.writeText(text);
    setCopiedClientId(group.clientName);
    setTimeout(() => {
      setCopiedClientId(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                รายการใบ 50 ทวิ ที่ยังรอทวงถาม
              </h3>
              <p className="text-xs text-slate-500">
                สรุปแยกตามผู้ว่าจ้าง พร้อมส่งข้อความทวงเอกสารผ่าน LINE ในคลิกเดียว
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {groups.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">
                ยอดเยี่ยม! ได้รับเอกสารครบถ้วนแล้ว
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                ไม่มีรายการใบ 50 ทวิ ค้างทวงถาม คุณมีหลักฐานครบสำหรับแนบยื่นแบบ ภ.ง.ด. 90
              </p>
            </div>
          ) : (
            <>
              {/* Summary KPIs Banner */}
              <div className="p-3.5 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-950">รวมยอดภาษีหัก 3% ที่ต้องตาม:</span>
                  <span className="font-bold text-sm text-amber-900 font-mono-numbers">
                    ฿{totalPendingWht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-amber-800 font-medium">
                  {groups.length} ผู้ว่าจ้าง ({totalPendingInvoices} บิล)
                </div>
              </div>

              {/* Group Cards List */}
              <div className="space-y-3">
                {groups.map((group) => {
                  const isCopied = copiedClientId === group.clientName;
                  const lineUrl = generateLineTawiReminderUrl(group, issuer?.name);

                  return (
                    <div
                      key={group.clientName}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition"
                    >
                      {/* Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold text-sm text-slate-900 font-heading">
                              {group.clientName}
                            </div>
                            {group.clientTaxId && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                เลขประจำตัวผู้เสียภาษี: {group.clientTaxId}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium font-mono">
                            {group.invoices.length} บิล
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold font-mono">
                            ภาษี 3%: ฿{group.totalWht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Invoices List */}
                      <div className="py-2.5 space-y-1.5 text-xs">
                        {group.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50/70 hover:bg-slate-50 text-slate-700 text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                              <span className="text-slate-400">({inv.issueDate})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono-numbers text-slate-600">
                                ยอด ฿{inv.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="font-mono-numbers font-semibold text-amber-700">
                                หัก ฿{inv.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                              {onToggle50Tawi && (
                                <button
                                  type="button"
                                  onClick={() => onToggle50Tawi(inv.id)}
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition cursor-pointer"
                                  title="กดเพื่อบันทึกว่าได้รับเอกสารแล้ว"
                                >
                                  <Check className="w-2.5 h-2.5" /> ได้รับแล้ว
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions Bar */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(group)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                            isCopied
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความทวง'}</span>
                        </button>

                        <a
                          href={lineUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                          title="เปิดแอป LINE เพื่อส่งข้อความทวงไปยังผู้ว่าจ้าง"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>ส่งผ่าน LINE</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>* เอกสารใบ 50 ทวิ ใช้ประกอบการขอคืนเงินภาษีกับกรมสรรพากร</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
