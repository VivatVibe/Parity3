import React, { useState } from 'react';
import { Invoice, IssuerProfile, loadDeductionProfile, saveDeductionProfile } from '../domain/storage';
import { aggregatePnd90, estimatePnd90Tax, TaxCategory, TaxDeductionProfile, DEFAULT_DEDUCTION_PROFILE } from '../domain/tax';
import { downloadPnd90Csv } from '../utils/exportCsv';
import { TawiReminderModal } from './TawiReminderModal';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  ArrowUpRight,
  Download,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Receipt,
  FileText,
  MessageSquare
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  issuer?: IssuerProfile;
  onToggle50Tawi?: (invoiceId: string) => void;
}

export const Pnd90Dashboard: React.FC<Props> = ({ invoices, issuer, onToggle50Tawi }) => {
  const [deductions, setDeductions] = useState<TaxDeductionProfile>(loadDeductionProfile);
  const [showDeductionEditor, setShowDeductionEditor] = useState<boolean>(false);
  const [showTawiModal, setShowTawiModal] = useState<boolean>(false);

  const summary = aggregatePnd90(invoices);
  const taxEstimate = estimatePnd90Tax(summary, deductions);
  const netEarnings = summary.totalGrossIncome - summary.totalWhtCredit;
  const activeInvoicesCount = invoices.filter(i => i.status !== 'cancelled').length;

  const handleDeductionChange = (field: keyof TaxDeductionProfile, value: number) => {
    const updated = {
      ...deductions,
      [field]: Math.max(0, value)
    };
    setDeductions(updated);
    saveDeductionProfile(updated);
  };

  const handleResetDeductions = () => {
    setDeductions(DEFAULT_DEDUCTION_PROFILE);
    saveDeductionProfile(DEFAULT_DEDUCTION_PROFILE);
  };
  
  // Calculate percentage of 50-tawi documents collected
  const total50TawiNeeded = summary.received50TawiTotal + summary.pending50TawiTotal;
  const tawiPercentage = total50TawiNeeded > 0
    ? Math.round((summary.received50TawiTotal / total50TawiNeeded) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Bento Grid Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Tile 1: Hero Revenue & Cashflow Tile (7 cols on desktop) */}
        <div className="md:col-span-7 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> สรุปกระแสเงินสดและภาษี
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeInvoicesCount} บิลที่วางแล้ว
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-300 uppercase tracking-wider font-heading">
                รายรับสุทธิที่ได้รับจริง (Net Earnings)
              </span>
              <div className="text-3xl sm:text-4xl font-bold font-mono-numbers text-white mt-1 tracking-tight">
                ฿{netEarnings.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Income breakdown micro-bar */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>ยอดรวมก่อนหัก: <strong className="text-white font-mono-numbers">฿{summary.totalGrossIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></span>
                <span className="text-amber-400">ถูกหัก 3%: <strong className="font-mono-numbers">-฿{summary.totalWhtCredit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong></span>
              </div>
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden flex border border-white/10">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${summary.totalGrossIncome > 0 ? (netEarnings / summary.totalGrossIncome) * 100 : 100}%` }}
                  title="รายรับสุทธิ"
                ></div>
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${summary.totalGrossIncome > 0 ? (summary.totalWhtCredit / summary.totalGrossIncome) * 100 : 0}%` }}
                  title="ภาษีหัก ณ ที่จ่าย 3%"
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> เครดิตภาษีใช้ขอคืนหรือลดหย่อนตอนยื่น ภ.ง.ด. 90
            </span>
            <button
              onClick={() => downloadPnd90Csv(invoices, deductions)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-xs font-semibold cursor-pointer border border-white/15"
              title="ส่งออกรายงานสรุปภาษี ภ.ง.ด. 90 และการหักลดหย่อนเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          </div>
        </div>

        {/* Tile 2: 50 Tawi Radar Card (5 cols on desktop) */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">
                เรดาร์ใบหัก ณ ที่จ่าย (50 ทวิ)
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${
                tawiPercentage === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {tawiPercentage}% ครบถ้วน
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-bold font-mono-numbers text-slate-900">
                  {summary.received50TawiTotal} / {total50TawiNeeded}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  ได้รับเอกสารแล้ว {summary.received50TawiTotal} ฉบับ
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold font-mono-numbers text-amber-600">
                  {summary.pending50TawiTotal}
                </div>
                <div className="text-xs text-amber-700 font-medium mt-0.5">
                  ฉบับที่ต้องทวงถาม
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${tawiPercentage}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              {summary.pending50TawiTotal > 0
                ? '⚠️ เอกสารใบ 50 ทวิ จำเป็นต้องใช้เป็นหลักฐานหากสรรพากรขอตรวจคืนเงินภาษี'
                : '✨ หลักฐานใบ 50 ทวิ ครบถ้วน พร้อมกรอกยื่น ภ.ง.ด. 90 ได้ทันที'}
            </p>

            {summary.pending50TawiTotal > 0 && (
              <button
                type="button"
                onClick={() => setShowTawiModal(true)}
                className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-95"
                title="ดูสรุปรายการใบ 50 ทวิ ที่ยังรอรับแยกตามผู้ว่าจ้าง พร้อมส่งข้อความทวงผ่าน LINE"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>ทวงใบ 50 ทวิ ({summary.pending50TawiTotal} ฉบับ)</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {summary.pending50TawiTotal > 0 ? (
              <button
                type="button"
                onClick={() => setShowTawiModal(true)}
                className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" /> รายการค้างทวง
              </button>
            ) : (
              <span className="text-slate-500">ยื่นแบบออนไลน์:</span>
            )}
            <a
              href="https://efiling.rd.go.th"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
            >
              e-Filing สรรพากร <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* Tile 3: PND 90 Tax Estimation & Refund Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                ประมาณการภาษีเงินได้ ภ.ง.ด. 90 & ยอดขอคืนเงิน (Simulation)
              </h3>
              <p className="text-[11px] text-slate-500">
                คำนวณตามเกณฑ์อัตราก้าวหน้า หักค่าใช้จ่ายเหมาตามกฎหมาย และหักลดหย่อนส่วนตัว 60,000 บาท
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200/80">
              อัตราภาษีเฉลี่ย: <strong className="font-mono">{taxEstimate.effectiveTaxRate}%</strong>
            </span>
            <button
              type="button"
              onClick={() => downloadPnd90Csv(invoices, deductions)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition text-xs font-semibold cursor-pointer border border-indigo-200/80 active:scale-95"
              title="ส่งออกรายงานสรุปภาษี ภ.ง.ด. 90 และการหักลดหย่อนเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Calculation Flow Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 text-[11px]">เงินได้พึงประเมินรวม</div>
            <div className="font-bold text-slate-900 font-mono-numbers text-sm mt-0.5">
              ฿{taxEstimate.totalGrossIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 text-[11px]">หักค่าใช้จ่ายเหมา</div>
            <div className="font-bold text-slate-700 font-mono-numbers text-sm mt-0.5">
              -฿{taxEstimate.totalExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 text-[11px]">หักลดหย่อนภาษีรวม</div>
            <div className="font-bold text-slate-700 font-mono-numbers text-sm mt-0.5">
              -฿{taxEstimate.totalDeductions.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <div className="text-indigo-800 text-[11px] font-medium">เงินได้สุทธิประเมิน</div>
            <div className="font-bold text-indigo-950 font-mono-numbers text-sm mt-0.5">
              ฿{taxEstimate.netTaxableIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Deduction Customizer Toggle Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDeductionEditor(!showDeductionEditor)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg border border-indigo-200/80 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showDeductionEditor ? 'ซ่อนการปรับแต่งค่าลดหย่อน' : 'ปรับแต่งค่าลดหย่อนภาษี (ประกันสังคม / ประกันสุขภาพ / กองทุน)'}</span>
              {showDeductionEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDeductionEditor && (
              <button
                type="button"
                onClick={handleResetDeductions}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="รีเซ็ตค่าลดหย่อนเป็นค่าเริ่มต้น"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ต</span>
              </button>
            )}
          </div>

          {/* Collapsible Deduction Form */}
          {showDeductionEditor && (
            <div className="mt-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-150 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>ประกันสังคม (ม.33/39/40)</span>
                  <span className="text-[10px] text-slate-400">สูงสุด 9,000</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">฿</span>
                  <input
                    type="number"
                    min="0"
                    max="9000"
                    step="100"
                    value={deductions.socialSecurity || ''}
                    onChange={(e) => handleDeductionChange('socialSecurity', parseFloat(e.target.value) || 0)}
                    placeholder="เช่น 9000 หรือ 5184"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>เบี้ยประกันสุขภาพตนเอง</span>
                  <span className="text-[10px] text-slate-400">สูงสุด 25,000</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">฿</span>
                  <input
                    type="number"
                    min="0"
                    max="25000"
                    step="1000"
                    value={deductions.healthInsurance || ''}
                    onChange={(e) => handleDeductionChange('healthInsurance', parseFloat(e.target.value) || 0)}
                    placeholder="เช่น 15000"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>เบี้ยประกันชีวิตทั่วไป</span>
                  <span className="text-[10px] text-slate-400">รวมสุขภาพไม่เกิน 100k</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">฿</span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1000"
                    value={deductions.lifeInsurance || ''}
                    onChange={(e) => handleDeductionChange('lifeInsurance', parseFloat(e.target.value) || 0)}
                    placeholder="เช่น 50000"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>กองทุน Thai ESG / RMF / SSF</span>
                  <span className="text-[10px] text-slate-400">สูงสุด 30% ของเงินได้</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">฿</span>
                  <input
                    type="number"
                    min="0"
                    max="500000"
                    step="5000"
                    value={deductions.retirementFunds || ''}
                    onChange={(e) => handleDeductionChange('retirementFunds', parseFloat(e.target.value) || 0)}
                    placeholder="เช่น 50000"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>ลดหย่อนอื่นๆ (บุตร/พ่อแม่/บริจาค)</span>
                  <span className="text-[10px] text-slate-400">ตามจริง</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={deductions.otherDeductions || ''}
                    onChange={(e) => handleDeductionChange('otherDeductions', parseFloat(e.target.value) || 0)}
                    placeholder="เช่น 30000 (บุตร 1 คน)"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 flex flex-col justify-center text-[11px] text-indigo-900">
                <span className="font-semibold text-indigo-950">💡 ผลรวมลดหย่อนที่ใช้ได้จริง:</span>
                <span className="font-bold text-sm text-indigo-700 font-mono-numbers mt-0.5">
                  ฿{taxEstimate.totalDeductions.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-indigo-800/80 mt-0.5">(รวมสิทธิ์ส่วนตัว 60,000 บาทแล้ว)</span>
              </div>
            </div>
          )}
        </div>

        {/* Final Tax vs 3% WHT Settlement Banner */}
        <div className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          taxEstimate.isRefund
            ? 'bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-200 text-emerald-950'
            : taxEstimate.balance > 0
            ? 'bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              taxEstimate.isRefund ? 'bg-emerald-600 text-white' : taxEstimate.balance > 0 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white'
            }`}>
              {taxEstimate.isRefund ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {taxEstimate.isRefund
                  ? '🎉 สิทธิ์ขอคืนเงินภาษีสุทธิ (Estimated Tax Refund)'
                  : taxEstimate.balance > 0
                  ? '⚠️ ประมาณการภาษีที่ต้องชำระเพิ่ม (Estimated Tax Payable)'
                  : '✓ ไม่มียอดภาษีต้องชำระเพิ่ม'}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                ภาษีที่ต้องเสียตามเกณฑ์: ฿{taxEstimate.finalCalculatedTax.toLocaleString('th-TH', { minimumFractionDigits: 2 })} | หัก ณ ที่จ่าย 3% สะสมแล้ว: ฿{taxEstimate.whtCredit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className={`text-2xl font-bold font-mono-numbers ${
              taxEstimate.isRefund ? 'text-emerald-700' : taxEstimate.balance > 0 ? 'text-amber-800' : 'text-slate-800'
            }`}>
              {taxEstimate.isRefund ? '+' : taxEstimate.balance > 0 ? '-' : ''}฿{Math.abs(taxEstimate.balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-semibold opacity-75">
              {taxEstimate.isRefund ? 'สามารถยื่นขอรับเงินคืนจากสรรพากรได้' : 'แนะนำเตรียมสำรองเงินสดไว้'}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid: 3 Income Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-heading">
            ยอดรายได้แยกตามหมวด ภ.ง.ด. 90 สำหรับกรอกแบบภาษี
          </h3>
          <span className="text-xs text-slate-500">เลือกหักค่าใช้จ่ายเหมาได้ตามเกณฑ์</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(summary.byCategory) as TaxCategory[]).map(catKey => {
            const cat = summary.byCategory[catKey];
            const badgeColor =
              catKey === '40_2' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              catKey === '40_6' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div
                key={catKey}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                      {cat.meta.categoryLabel}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {cat.invoiceCount} บิล
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="text-xs text-slate-500">ยอดเงินได้พึงประเมิน:</div>
                      <div className="text-2xl font-bold font-mono-numbers text-slate-900">
                        ฿{cat.grossIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">ภาษีถูกหัก 3% สะสม:</div>
                      <div className="text-sm font-semibold font-mono-numbers text-amber-700">
                        ฿{cat.whtDeducted.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="font-semibold text-slate-800 font-heading">เกณฑ์หักค่าใช้จ่ายเหมา:</div>
                    <div className="text-slate-600 leading-relaxed">{cat.meta.expenseDeductionRule}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">สถานะ 50 ทวิ:</span>
                  <span className={cat.pending50TawiCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {cat.received50TawiCount} ได้รับแล้ว / {cat.pending50TawiCount} รอดำเนินการ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax Guidance Checklist */}
      <div className="bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-5 text-xs text-indigo-950 space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-sm text-indigo-950 font-heading">
          <FileCheck className="w-4 h-4 text-indigo-600" /> สรุปขั้นตอนเตรียมตัวยื่นภาษี ภ.ง.ด. 90
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-indigo-900 leading-relaxed">
          <div className="p-3 bg-white/70 rounded-xl border border-indigo-100">
            <strong>1. รวมเงินได้ทุกช่องทาง:</strong> นำยอดรวมพึงประเมินของแต่ละหมวด (40(2), 40(6), 40(8)) ไปกรอกในช่องเงินได้ของแบบ ภ.ง.ด. 90
          </div>
          <div className="p-3 bg-white/70 rounded-xl border border-indigo-100">
            <strong>2. กรอกยอดภาษีถูกหัก 3%:</strong> นำยอดรวมภาษีถูกหักสะสมไปกรอกในช่อง "ภาษีเงินได้หัก ณ ที่จ่าย" เพื่อขอคืนเงินหรือหักลบยอดจ่ายเพิ่ม
          </div>
          <div className="p-3 bg-white/70 rounded-xl border border-indigo-100">
            <strong>3. เก็บไฟล์ 50 ทวิ:</strong> เก็บภาพถ่ายใบ 50 ทวิที่แนบไว้ในระบบ เพื่อใช้ยื่นแนบเป็นไฟล์ PDF/JPG เมื่อสรรพากรขอเอกสารเพิ่มเติม
          </div>
          <div className="p-3 bg-white/70 rounded-xl border border-indigo-100">
            <strong>4. ส่งออกไฟล์ Excel สำรอง:</strong> คลิกปุ่ม "Export Excel" ด้านบน เพื่อเก็บไฟล์สรุปตัวเลขไว้เปรียบเทียบในแต่ละปีภาษี
          </div>
        </div>
      </div>

      <TawiReminderModal
        isOpen={showTawiModal}
        onClose={() => setShowTawiModal(false)}
        invoices={invoices}
        issuer={issuer}
        onToggle50Tawi={onToggle50Tawi}
      />
    </div>
  );
};
