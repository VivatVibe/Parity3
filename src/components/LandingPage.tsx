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
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileCheck2,
  Check,
  Smartphone,
  Star
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

  const quickPresets = [15000, 35000, 60000, 100000];

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Sarabun',sans-serif] selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* Background Ambient Radial Glowing Orbs (Mercury/Stripe Aesthetic) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none"></div>
      <div className="absolute top-96 -left-40 w-[500px] h-[500px] bg-blue-600/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-96 -right-40 w-[500px] h-[500px] bg-purple-600/10 blur-[130px] pointer-events-none"></div>

      {/* Top Floating Glass Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight font-heading">
                  Parity3
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  FINTECH SAAS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                ระบบวางบิลและภาษี ภ.ง.ด. 90 เพื่อฟรีแลนซ์ไทย
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
            >
              ราคาแพ็กเกจ
            </button>
            <button
              type="button"
              onClick={onEnterApp}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>เข้าใช้งานระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-16 px-4 relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-indigo-300 text-xs font-bold border border-white/10 shadow-[0_0_25px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>ยกระดับงานวางบิลสู่มาตรฐานฟินเทคระดับสากล</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] font-heading">
            ออกใบวางบิลมืออาชีพใน <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">30 วินาที</span>
            <br />
            พร้อมคำนวณหัก ณ ที่จ่าย 3% และภาษี ภ.ง.ด. 90
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
            บอกลาเอกสาร Word/Excel ผิดฟอร์แมต หรือปวดหัวกับการตามใบ 50 ทวิสิ้นปี Parity3 ผสาน PromptPay Dynamic QR, ลายเซ็นดิจิทัล และระบบติดตามภาษีจบในแพลตฟอร์มเดียว
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base rounded-2xl shadow-[0_8px_30px_rgba(79,70,229,0.45)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>เริ่มออกบิลฟรีทันที (ไม่ต้องสมัคร)</span>
            </button>
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm sm:text-base rounded-2xl border border-white/15 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>อัปเกรดเป็น Pro ฿99/ด.</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ฟรีตลอดชีพ (สูงสุด 5 บิล/ด.)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ฟอร์แมต A4 เป๊ะ ไม่ล้นหน้า</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cloudflare D1 Native Edge</span>
            </div>
          </div>
        </div>

        {/* Live Interactive 3% WHT Simulator Card */}
        <div className="max-w-3xl mx-auto mt-14 glass-panel-dark rounded-3xl overflow-hidden border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="bg-slate-900/90 px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5 font-semibold text-sm text-white">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Calculator className="w-4 h-4" />
              </div>
              <span>Live 3% WHT Simulator: เครื่องคำนวณเงินได้ & หัก ณ ที่จ่ายเรียลไทม์</span>
            </div>
            <span className="text-[11px] text-slate-400">ปรับตัวเลขเพื่อดูยอดเงินเข้าบัญชีจริง</span>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            {/* Left Controller */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ยอดเงินรับตามสัญญา / ค่าจ้าง (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">฿</span>
                  <input
                    type="number"
                    step="1000"
                    value={simAmount}
                    onChange={e => setSimAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full pl-8 pr-3.5 py-2.5 text-lg font-bold text-white bg-slate-800/80 border border-white/15 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {quickPresets.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSimAmount(val)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition font-mono cursor-pointer ${
                        simAmount === val
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      ฿{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ประเภทเงินได้ตามประมวลรัษฎากร
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimCategory('40_2')}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      simCategory === '40_2'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    40(2) จ้างทำของ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCategory('40_6')}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      simCategory === '40_6'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    40(6) วิชาชีพ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCategory('40_8')}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                      simCategory === '40_8'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    40(8) คอนเทนต์
                  </button>
                </div>
              </div>
            </div>

            {/* Right Financial Feedback Card */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/15 space-y-3.5 shadow-inner">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>ยอดเงินก่อนหักภาษี (Subtotal):</span>
                <span className="font-semibold font-mono text-white">฿{billing.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-amber-400">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> หัก ณ ที่จ่าย 3% (WHT):
                </span>
                <span className="font-bold font-mono">-฿{billing.whtAmount.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <div>
                  <div className="text-xs font-bold text-white">ยอดโอนสุทธิ (Net Deposit)</div>
                  <div className="text-[10px] text-emerald-400/80">เงินเข้าบัญชีพร้อมเพย์ทันที</div>
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  ฿{billing.netTotal.toLocaleString()}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>ออกใบวางบิลยอดนี้ทันที</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Bento Feature Grid (Stripe & Linear Inspired) */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            โครงสร้างฟีเจอร์ระดับสถาปัตยกรรมฟินเทค
          </h2>
          <p className="text-slate-400 text-sm font-light">
            ออกแบบทุกจุดเพื่อให้ฟรีแลนซ์ไทยดูเป็นมืออาชีพที่สุด และจัดการภาษีได้รัดกุมไม่มีเงินตกหล่น
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento Tile 1: A4 Printable Engine (8 cols) */}
          <div className="md:col-span-8 glass-panel-dark rounded-3xl p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                A4 Precision Print & ลายเซ็นดิจิทัล
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                ระบบจัดการ Layout อัจฉริยะ การันตีพิมพ์ลงกระดาษ A4 หน้าเดียวพอดี 100% ตรึงบล็อกสรุปเงินและช่องเซ็นไว้ท้ายหน้ากระดาษอย่างสง่างาม พร้อมระบบเซ็นลายเซ็นวาดหรือ Cursive certified timestamp
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-4 text-xs text-indigo-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-indigo-400" /> บล็อก 6 บรรทัดมาตรฐาน
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-indigo-400" /> ตัดหน้าเว้นว่างทิ้งอัตโนมัติ
              </div>
            </div>
          </div>

          {/* Bento Tile 2: Dynamic PromptPay QR (4 cols) */}
          <div className="md:col-span-4 glass-panel-dark rounded-3xl p-7 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                PromptPay Dynamic QR
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                สร้าง Thai QR Pay ฝังลงบนตัวบิลทันที พร้อมล็อกยอดเงินสุทธิหลังหักภาษี 3% ลูกค้าสแกนจ่ายได้รวดเร็ว ลดเวลาทวงเงินถึง 70%
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-purple-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-purple-400" /> สแกนได้ทุก Mobile Banking
            </div>
          </div>

          {/* Bento Tile 3: 50 Tawi Radar (4 cols) */}
          <div className="md:col-span-4 glass-panel-dark rounded-3xl p-7 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                เรดาร์ติดตามใบ 50 ทวิ
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ไม่ทำเงินหายตอนสิ้นปี ระบบแยกบิลที่ได้ใบ 50 ทวิแล้ว และบิลที่ยังรอทวง ให้คุณกดสลับสถานะและแนบรูปถ่ายหนังสือรับรองไว้ในระบบได้ทันที
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> ป้องกันการลืมขอคืนภาษี
            </div>
          </div>

          {/* Bento Tile 4: Multi-Income ภ.ง.ด. 90 Tax Aggregator (8 cols) */}
          <div className="md:col-span-8 glass-panel-dark rounded-3xl p-7 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                แยกหมวดเงินได้ ภ.ง.ด. 90 (40(2), 40(6), 40(8)) พร้อม Export CSV
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                คำนวณภาษีสะสมทั้งปีแยกตามประเภทเงินได้ หักค่าใช้จ่ายตามเกณฑ์สรรพากรจริง รู้ล่วงหน้าว่าต้องจ่ายเพิ่มหรือได้ภาษีคืนเท่าไร พร้อมส่งออกเป็นไฟล์ Excel/CSV กดนำเข้าสรรพากรสิ้นปีได้ทันที
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-4 text-xs text-emerald-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> คำนวณอัตโนมัติเรียลไทม์
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> ส่งออก CSV พร้อมใช้
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free vs Pro Pricing Section */}
      <section className="py-20 px-4 bg-slate-900/50 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
              เลือกแพ็กเกจที่เหมาะกับระดับธุรกิจของคุณ
            </h2>
            <p className="text-slate-400 text-sm">
              เริ่มต้นใช้งานฟรีทันที หรืออัปเกรดเป็น Pro เพื่อปลดล็อกพลังเต็มรูปแบบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Free Tier Card */}
            <div className="glass-panel-dark rounded-3xl p-8 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">Free Tier</h3>
                    <p className="text-xs text-slate-400 mt-0.5">สำหรับฟรีแลนซ์เริ่มต้น</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300">
                    ฟรีตลอดชีพ
                  </span>
                </div>

                <div className="mt-6 mb-6">
                  <span className="text-4xl font-extrabold text-white font-mono">฿0</span>
                  <span className="text-xs text-slate-400 ml-1.5">/ ตลอดไป</span>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" /> ออกใบวางบิลสูงสุด 5 บิล/เดือน
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" /> พิมพ์เอกสาร A4 และส่งออก PDF
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" /> ฝัง QR PromptPay พร้อมเพย์
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-400" /> ระบบสรุปภาษี ภ.ง.ด. 90 พื้นฐาน
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  เริ่มใช้งานฟรี
                </button>
              </div>
            </div>

            {/* Pro Tier Card */}
            <div className="glass-panel-dark rounded-3xl p-8 border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.25)] flex flex-col justify-between relative">
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-slate-950" /> แนะนำสำหรับมืออาชีพ
              </div>

              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading flex items-center gap-1.5">
                      Pro Tier <Sparkles className="w-4 h-4 text-amber-400" />
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5">ปลดล็อกทุกความสามารถเพื่อธุรกิจ</p>
                  </div>
                </div>

                <div className="mt-6 mb-6">
                  <span className="text-4xl font-extrabold text-white font-mono">฿99</span>
                  <span className="text-xs text-slate-400 ml-1.5">/ เดือน (หรือ ฿890/ปี)</span>
                </div>

                <div className="space-y-3 text-xs text-slate-200">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-emerald-400" /> ออกใบวางบิลได้ไม่จำกัดจำนวน
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-emerald-400" /> ซิงค์ข้อมูลข้ามเครื่องด้วย Cloudflare D1
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-emerald-400" /> อัปโหลดและแนบสลิป/ใบ 50 ทวิไม่อั้น
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-emerald-400" /> ใส่โลโก้แบรนด์ส่วนตัวบนใบแจ้งหนี้
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Check className="w-4 h-4 text-emerald-400" /> Export CSV ภ.ง.ด. 90 นำเข้าสรรพากร
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>สมัคร Pro สแกน PromptPay 99 บ.</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">คำถามที่พบบ่อย (FAQ)</h2>
          <p className="text-xs sm:text-sm text-slate-400">ข้อสงสัยเกี่ยวกับการใช้งานและมาตรฐานประมวลรัษฎากร</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div key={idx} className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden transition">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-200 hover:bg-white/5 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="p-4 sm:p-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-slate-900/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-900/80 to-slate-950 border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            พร้อมยกระดับงานวางบิลและภาษีของคุณหรือยัง?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            ไม่ต้องรอสิ้นเดือน ไม่ต้องเสี่ยงกับสูตร Excel พัง จัดการใบวางบิลและภาษีของคุณอย่างเป็นระบบตั้งแต่วันนี้
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onEnterApp}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              เริ่มต้นใช้งานฟรีทันที →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <p>© 2026 Parity3 (Thai Freelancer Billing & Tax). Engineered on Cloudflare Native Edge Stack.</p>
      </footer>
    </div>
  );
};
