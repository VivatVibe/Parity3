import React from 'react';
import { Invoice } from '../domain/storage';
import { aggregatePnd90, TaxCategory } from '../domain/tax';
import { downloadPnd90Csv } from '../utils/exportCsv';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  ArrowUpRight,
  Download,
  TrendingUp,
  Receipt,
  FileText
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
}

export const Pnd90Dashboard: React.FC<Props> = ({ invoices }) => {
  const summary = aggregatePnd90(invoices);
  const netEarnings = summary.totalGrossIncome - summary.totalWhtCredit;
  const activeInvoicesCount = invoices.filter(i => i.status !== 'cancelled').length;
  
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
              onClick={() => downloadPnd90Csv(invoices)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-xs font-semibold cursor-pointer border border-white/15"
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
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">ยื่นแบบออนไลน์:</span>
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
    </div>
  );
};
