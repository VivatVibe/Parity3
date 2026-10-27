import React, { useState } from 'react';
import {
  FileText,
  Calculator,
  QrCode,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  HelpCircle,
  TrendingDown,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { calculateBilling } from '../domain/tax';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenUpgradeModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenUpgradeModal }) => {
  // Live Simulator State
  const [simAmount, setSimAmount] = useState<number>(35000);
  const [simCategory, setSimCategory] = useState<'40_2' | '40_6' | '40_8'>('40_2');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const billing = calculateBilling(simAmount);

  const faqs = [
    {
      q: 'ใบวางบิลและเอกสารจากระบบนี้สามารถใช้ทางกฎหมายและภาษีได้จริงไหม?',
      a: 'ใช้ได้จริง 100% เอกสารออกตามมาตรฐานประมวลรัษฎากรระบุเลขประจำตัวผู้เสียภาษี 13 หลักของผู้ว่าจ้างและผู้รับจ้าง พร้อมแจกแจงภาษีหัก ณ ที่จ่าย 3% ถูกต้องตามมาตรา 40(2), 40(6), 40(8) สามารถนำไปประกอบใบเสร็จและใบ 50 ทวิ ยื่นสรรพากรได้ทันที'
    },
    {
      q: 'ข้อมูลใบวางบิลและลูกค้าถูกเก็บไว้ที่ไหน ปลอดภัยหรือไม่?',
      a: 'ระบบทำงานบน Cloudflare Native Edge (Cloudflare Pages Functions + D1 Serverless SQL) และรองรับ Local Offline-First ข้อมูลของคุณจะถูกเข้ารหัสและไม่ถูกส่งต่อไปยังบุคคลที่สาม มีความปลอดภัยสูงระดับ Enterprise'
    },
    {
      q: 'แพ็กเกจฟรี (Free Tier) มีข้อจำกัดอะไรบ้าง?',
      a: 'แพ็กเกจฟรีสามารถออกใบวางบิลได้สูงสุด 5 ฉบับต่อเดือน พร้อมสร้าง QR PromptPay ลายเซ็นดิจิทัล และพิมพ์ PDF A4 ได้ครบถ้วน หากต้องการออกบิลไม่จำกัด ซิงค์ข้ามอุปกรณ์ และใส่โลโก้ส่วนตัว สามารถอัปเกรดเป็น Pro ได้ในราคาเพียง 99 บาท/เดือน'
    },
    {
      q: 'การชำระเงินค่าสมัคร Pro Tier ทำอย่างไร?',
      a: 'สามารถสแกนชำระผ่าน PromptPay QR Code ได้ด้วย Mobile Banking ทุกธนาคาร ระบบจะตรวจสอบรหัสอ้างอิงสลิปและเปิดสิทธิ์ Pro ให้ทันทีโดยไม่ต้องรอแอดมิน'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Sarabun',sans-serif] selection:bg-indigo-600 selection:text-white">
      {/* Top Floating Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight font-heading">
                Thai Freelancer Billing
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenUpgradeModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
            >
              ราคาแพ็กเกจ
            </button>
            <button
              onClick={onEnterApp}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all hover:shadow flex items-center gap-1.5"
            >
              <span>เข้าใช้งานระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 shadow-2xs animate-in fade-in">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            ระบบวางบิล & บัญชีภาษีที่ออกแบบเพื่อฟรีแลนซ์ไทยโดยเฉพาะ
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            ออกใบวางบิลมืออาชีพใน <span className="text-indigo-600 underline decoration-indigo-300">30 วินาที</span>
            <br className="hidden sm:inline" /> พร้อมคำนวณหัก ณ ที่จ่าย 3% และภาษี ภ.ง.ด. 90
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            หมดปัญหาเอกสารล้นหน้ากระดาษ A4 คำนวณหักภาษีผิด หรือตามเงินลูกค้ายาก ระบบสร้าง PromptPay QR และเซ็นดิจิทัลในตัว พิมพ์ PDF แผ่นเดียวจบ
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>ทดลองออกบิลได้ทันที (ไม่ต้องสมัคร)</span>
            </button>
            <button
              onClick={onOpenUpgradeModal}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm sm:text-base rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>อัปเกรดเป็น Pro ฿99/ด.</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ฟรีตลอดชีพ (สูงสุด 5 บิล/ด.)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ไม่ต้องลงโปรแกรมเพิ่ม</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Cloudflare D1 Native</span>
            </div>
          </div>
        </div>

        {/* Live Simulator Widget */}
        <div className="max-w-3xl mx-auto mt-12 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>เครื่องคำนวณเงินได้ & หัก ณ ที่จ่าย 3% แบบเรียลไทม์</span>
            </div>
            <span className="text-slate-400 text-[11px]">ลองปรับตัวเลขเพื่อดูผลลัพธ์</span>
          </div>

          <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยอดเงินรับตามสัญญา / ค่าจ้าง (บาท)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={simAmount}
                  onChange={e => setSimAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทเงินได้ตามประมวลรัษฎากร
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimCategory('40_2')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                      simCategory === '40_2'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    40(2) จ้างทำของ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCategory('40_6')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                      simCategory === '40_6'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    40(6) วิชาชีพ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCategory('40_8')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                      simCategory === '40_8'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    40(8) ธุรกิจ/รีวิว
                  </button>
                </div>
              </div>
            </div>

            {/* Live Calculation Card */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>ยอดรวมก่อนหักภาษี (Subtotal):</span>
                <span className="font-semibold font-mono">฿{billing.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-rose-600">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> หัก ณ ที่จ่าย 3% (WHT):
                </span>
                <span className="font-semibold font-mono">-฿{billing.whtAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <div className="text-xs font-bold text-slate-900">ยอดเงินโอนสุทธิ (Net Total)</div>
                  <div className="text-[10px] text-slate-500">เงินที่จะเข้าบัญชีพร้อมเพย์ของคุณ</div>
                </div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono">
                  ฿{billing.netTotal.toLocaleString()}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onEnterApp}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  ออกใบวางบิลยอดนี้ทันที →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            สร้างมาเพื่อแก้ปัญหาที่ฟรีแลนซ์ไทยเจอทุกวัน
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            ครบถ้วนตั้งแต่ร่างใบแจ้งหนี้ จัดพิมพ์ A4 1 แผ่นพอดี ติดตามใบ 50 ทวิ จนถึงสรุปยื่นภาษีประจำปี
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">A4 Print เป๊ะ ลายเซ็นดิจิทัล</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ตาราง 6 บรรทัดมาตรฐาน บล็อกข้อมูลล่างตรึงท้ายกระดาษพอดี ไม่มีช่องว่างสีขาวว่างเปล่า พร้อมลายเซ็นวาดหรือ Cursive certified timestamp
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">QR Code พร้อมเพย์ฝังในบิล</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              สร้าง Dynamic PromptPay QR Code ระบุยอดเงินสุทธิหลังหัก 3% อัตโนมัติ ลูกค้าสแกนจ่ายได้ทันทีไม่ต้องพิมพ์เลขบัญชีเอง
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Dashboard ภ.ง.ด. 90 เชิงลึก</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              รวมเงินได้และภาษีที่ถูกหัก 3% ตลอดทั้งปี คำนวณหักค่าใช้จ่ายตามจริงหรือเหมาจ่าย พร้อมสิทธิ์ลดหย่อนภาษีส่วนบุคคล
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Table */}
      <section className="py-16 px-4 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              ราคาโปร่งใส จ่ายเท่าที่ใช้ ไม่แอบแฝง
            </h2>
            <p className="text-slate-600 text-sm">
              เริ่มต้นใช้งานได้ฟรีตลอดไป หรืออัปเกรดเพื่อประสิทธิภาพสูงสุดของธุรกิจฟรีแลนซ์
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-lg font-bold text-slate-900">Free Tier</h3>
                  <span className="text-2xl font-bold text-slate-900">฿0 <span className="text-xs text-slate-500 font-normal">ตลอดไป</span></span>
                </div>
                <p className="text-xs text-slate-500">เหมาะสำหรับฟรีแลนซ์เริ่มต้น หรือออกเอกสารไม่บ่อย</p>

                <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ออกใบวางบิลสูงสุด 5 ฉบับ / เดือน
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    คำนวณหัก ณ ที่จ่าย 3% อัตโนมัติ
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    พิมพ์ PDF เอกสาร A4 พร้อมลายเซ็นดิจิทัล
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    สร้าง PromptPay QR Code รับเงิน
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ไม่มีโลโก้ส่วนตัวบนหัวบิล
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={onEnterApp}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                >
                  เริ่มใช้งานฟรี
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl border-2 border-indigo-600 p-6 sm:p-8 flex flex-col justify-between shadow-lg relative">
              <div className="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-full shadow-xs">
                ยอดนิยม
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> PRO Member
                  </h3>
                  <span className="text-2xl font-bold text-slate-900">฿99 <span className="text-xs text-slate-500 font-normal">/ เดือน</span></span>
                </div>
                <p className="text-xs text-indigo-900/70">สำหรับฟรีแลนซ์มืออาชีพและผู้รับจ้างที่มีลูกค้าประจำ</p>

                <ul className="space-y-2.5 text-xs text-slate-800 font-medium pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    ออกใบวางบิลได้ไม่จำกัดจำนวน (Unlimited)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    อัปโหลดโลโก้ร้านค้า/บริษัทแสดงบนหัวบิล A4
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    Cloud Sync ฐานข้อมูล D1 ซิงค์เรียลไทม์ข้ามเครื่อง
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    เครื่องมือจำลองลดหย่อนภาษี ภ.ง.ด. 90 ขั้นสูง
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    ระบบแจ้งเตือนทวงเงินลูกค้าเกินกำหนด
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={onOpenUpgradeModal}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  สมัคร Pro สแกน PromptPay 99 บ.
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">คำถามที่พบบ่อย (FAQ)</h2>
          <p className="text-xs text-slate-500 mt-1">ข้อสงสัยเกี่ยวกับการใช้งานและระบบภาษี</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div key={idx} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">พร้อมยกระดับงานเอกสารและการเงินของคุณหรือยัง?</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            ไม่ต้องรอสิ้นเดือน ไม่ต้องปวดหัวกับสูตร Excel จัดการใบวางบิลและภาษีของคุณอย่างเป็นระบบตั้งแต่วันนี้
          </p>
          <div className="pt-2">
            <button
              onClick={onEnterApp}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              เริ่มต้นใช้งานฟรีทันที →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Thai Freelancer Billing & Tax. พัฒนาบน Cloudflare Native Edge Stack.</p>
      </footer>
    </div>
  );
};
