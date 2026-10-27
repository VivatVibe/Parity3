import React from 'react';
import { Invoice } from '../domain/storage';
import { aggregatePnd90, TaxCategory } from '../domain/tax';
import { Calculator, AlertTriangle, CheckCircle, ShieldCheck, FileCheck, ArrowUpRight } from 'lucide-react';

interface Props {
  invoices: Invoice[];
}

export const Pnd90Dashboard: React.FC<Props> = ({ invoices }) => {
  const summary = aggregatePnd90(invoices);

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <Calculator className="w-3.5 h-3.5" /> สรุปข้อมูลภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90)
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading">
              สรุปรายรับสะสมและเครดิตภาษีหัก ณ ที่จ่าย
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              สำหรับคนทำงานที่มีรายได้หลายทาง ระบบคำนวณแยกหมวดเงินได้ 40(2), 40(6), 40(8) และติดตามสถานะเอกสาร 50 ทวิ เพื่อใช้กรอกยื่นภาษีประจำปีได้ทันที
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-56">
            <div className="text-xs text-blue-200">ภาษีหัก ณ ที่จ่ายสะสม (Tax Credit)</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-300 mt-1">
              ฿{summary.totalWhtCredit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-blue-100/80 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> นำไปหักลบภาษีหรือขอคืนเงินได้
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">รายรับรวมทุกช่องทาง (Gross)</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ฿{summary.totalGrossIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            จากทั้งหมด {invoices.filter(i => i.status !== 'cancelled').length} ใบแจ้งหนี้
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">ยอดเงินโอนสุทธิที่ได้รับจริง</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ฿{(summary.totalGrossIncome - summary.totalWhtCredit).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ยอดเงินหลังหักภาษี 3% เรียบร้อย
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">สถานะใบหักภาษี (ใบ 50 ทวิ)</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-emerald-700 font-bold text-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              {summary.received50TawiTotal} ได้รับแล้ว
            </div>
            <div className="text-slate-300">|</div>
            <div className="flex items-center gap-1 text-amber-700 font-bold text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {summary.pending50TawiTotal} รอทวง
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.pending50TawiTotal > 0 ? '⚠️ ยังมีใบ 50 ทวิที่ต้องทวงถามจากลูกค้า' : 'ครบถ้วน พร้อมยื่นภาษี'}
          </div>
        </div>
      </div>

      {/* Category Breakdown for P.N.D. 90 */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-heading">
          รายละเอียดแยกตามหมวดเงินได้สำหรับกรอกยื่น ภ.ง.ด. 90
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.keys(summary.byCategory) as TaxCategory[]).map(catKey => {
            const cat = summary.byCategory[catKey];
            return (
              <div key={catKey} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm font-heading">{cat.meta.categoryLabel}</span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {cat.invoiceCount} ใบ
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="text-xs text-slate-500">ยอดเงินได้พึงประเมิน:</div>
                      <div className="text-xl font-bold text-slate-900">
                        ฿{cat.grossIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">ภาษีถูกหักสะสม 3%:</div>
                      <div className="text-sm font-semibold text-amber-700">
                        ฿{cat.whtDeducted.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="font-semibold text-slate-800">เกณฑ์คำนวณหักค่าใช้จ่าย:</div>
                    <div className="text-slate-600 leading-relaxed">{cat.meta.expenseDeductionRule}</div>
                    <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-200 mt-1">
                      ตัวอย่างงาน: {cat.meta.typicalJobs}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">สถานะ 50 ทวิ:</span>
                  <span className={cat.pending50TawiCount > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                    {cat.received50TawiCount} ได้รับ / {cat.pending50TawiCount} รอดำเนินการ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax Filing Tips */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-xs text-emerald-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-950 font-heading">
          <FileCheck className="w-4 h-4 text-emerald-700" /> เคล็ดลับการยื่นแบบ ภ.ง.ด. 90 สำหรับฟรีแลนซ์หลายทาง
        </div>
        <ul className="list-disc list-inside space-y-1 text-emerald-800 leading-relaxed">
          <li>
            <strong>เงินได้ 40(2) จ้างทำของ:</strong> หักค่าใช้จ่ายเป็นการเหมาได้ 50% แต่เมื่อรวมกับเงินเดือน 40(1) แล้วต้องไม่เกิน 100,000 บาท
          </li>
          <li>
            <strong>เงินได้ 40(6) วิชาชีพอิสระ:</strong> หากเป็นงานเฉพาะทางที่มีใบประกอบวิชาชีพ สามารถหักค่าใช้จ่ายได้สูงสุด 30% หรือ 60% ซึ่งประหยัดภาษีได้มากกว่า 40(2)
          </li>
          <li>
            <strong>เงินได้ 40(8) อื่นๆ/คอนเทนต์:</strong> หักค่าใช้จ่ายแบบเหมาได้ 60% หรือจะเลือกหักตามค่าใช้จ่ายจริงที่เกิดขึ้นก็ได้หากมีบิลค่าใช้จ่ายครบ
          </li>
          <li>
            <strong>เก็บใบ 50 ทวิให้ครบ:</strong> หากไม่มีใบ 50 ทวิ สรรพากรอาจไม่อนุญาตให้นำยอดหัก 3% มาเครดิตภาษีหรือขอคืนเงิน
          </li>
        </ul>
        <div className="pt-2">
          <a
            href="https://efiling.rd.go.th"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-950 font-semibold underline"
          >
            ไปที่ระบบ e-Filing กรมสรรพากร <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
