import React, { useState, useRef } from 'react';
import { Invoice, IssuerProfile, saveIssuer, saveInvoices, SEED_INVOICES, DEFAULT_ISSUER } from '../domain/storage';
import { downloadBackupFile, parseBackupFile, BackupPayload } from '../utils/backupRestore';
import { SignaturePad } from './SignaturePad';
import { Check, QrCode, Download, Upload, RefreshCw, AlertTriangle, Database, PenTool, Sparkles } from 'lucide-react';

interface Props {
  issuer: IssuerProfile;
  invoices: Invoice[];
  onUpdate: (updated: IssuerProfile) => void;
  onRestoreData: (issuer: IssuerProfile, invoices: Invoice[]) => void;
}

export const IssuerProfileView: React.FC<Props> = ({ issuer, invoices, onUpdate, onRestoreData }) => {
  const [profile, setProfile] = useState<IssuerProfile>(issuer);
  const [saved, setSaved] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<BackupPayload | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof IssuerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveIssuer(profile);
    onUpdate(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const payload = await parseBackupFile(file);
      setRestoreCandidate(payload);
    } catch (err: any) {
      setRestoreError(err.message || 'ไม่สามารถอ่านไฟล์สำรองได้');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const executeRestore = (mode: 'replace' | 'merge') => {
    if (!restoreCandidate) return;

    let targetInvoices: Invoice[];
    if (mode === 'replace') {
      targetInvoices = restoreCandidate.invoices;
    } else {
      // Merge: keep current, append missing by ID
      const existingIds = new Set(invoices.map(i => i.id));
      const newItems = restoreCandidate.invoices.filter(i => !existingIds.has(i.id));
      targetInvoices = [...invoices, ...newItems];
    }

    const targetIssuer = restoreCandidate.issuer || profile;
    saveIssuer(targetIssuer);
    saveInvoices(targetInvoices);
    setProfile(targetIssuer);
    onRestoreData(targetIssuer, targetInvoices);

    setRestoreSuccess(`กู้คืนสำเร็จ: นำเข้า ${restoreCandidate.invoices.length} รายการเรียบร้อย`);
    setRestoreCandidate(null);
    setTimeout(() => setRestoreSuccess(null), 4000);
  };

  const handleResetDemo = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าตัวอย่างเริ่มต้น (Demo Data) หรือไม่? ข้อมูลที่แก้ไขจะถูกแทนที่')) {
      saveIssuer(DEFAULT_ISSUER);
      saveInvoices(SEED_INVOICES);
      setProfile(DEFAULT_ISSUER);
      onRestoreData(DEFAULT_ISSUER, SEED_INVOICES);
      setRestoreSuccess('รีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้นเรียบร้อยแล้ว');
      setTimeout(() => setRestoreSuccess(null), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">ข้อมูลโปรไฟล์ผู้รับเงิน</h2>
            <p className="text-xs text-slate-500 mt-1">ข้อมูลนี้จะถูกแสดงบนหัวใบแจ้งหนี้ และใช้สร้าง QR Code PromptPay</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล / ชื่อร้านค้า *</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => handleChange('name', e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เลขประจำตัวประชาชน / ผู้เสียภาษี (13 หลัก) *</label>
              <input
                type="text"
                value={profile.taxId}
                onChange={e => handleChange('taxId', e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={profile.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ที่อยู่สำหรับออกเอกสาร</label>
            <textarea
              rows={2}
              value={profile.address}
              onChange={e => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
              ข้อมูลการรับชำระเงิน (PromptPay & ธนาคาร)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์พร้อมเพย์ หรือ เลขบัตร ปชช. (ใช้สร้าง QR Code) *
              </label>
              <input
                type="text"
                placeholder="0812345678 หรือ 1100400987654"
                value={profile.promptPayId}
                onChange={e => handleChange('promptPayId', e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ธนาคาร</label>
                <input
                  type="text"
                  placeholder="เช่น ธนาคารกสิกรไทย"
                  value={profile.bankName}
                  onChange={e => handleChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลขที่บัญชี</label>
                <input
                  type="text"
                  placeholder="เช่น 045-2-98765-4"
                  value={profile.bankAccount}
                  onChange={e => handleChange('bankAccount', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อบัญชีธนาคาร</label>
              <input
                type="text"
                value={profile.bankAccountName}
                onChange={e => handleChange('bankAccountName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Signature Configuration Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  ลายเซ็นผู้วางบิล / ผู้รับเงิน (Electronic Signature)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  เลือกลักษณะลายเซ็นที่จะประทับบนใบแจ้งหนี้อัตโนมัติ
                </p>
              </div>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProfile(prev => ({ ...prev, signatureMode: 'auto' }))}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  (profile.signatureMode || 'auto') === 'auto'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>ลายเซ็นอัตโนมัติ</span>
              </button>

              <button
                type="button"
                onClick={() => setProfile(prev => ({ ...prev, signatureMode: 'drawn' }))}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  profile.signatureMode === 'drawn'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>วาดลายมือชื่อ</span>
              </button>

              <button
                type="button"
                onClick={() => setProfile(prev => ({ ...prev, signatureMode: 'none' }))}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  profile.signatureMode === 'none'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>ไม่ใส่ลายเซ็น (เซ็นสด)</span>
              </button>
            </div>

            {/* Mode Details & Preview */}
            {(profile.signatureMode || 'auto') === 'auto' && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  ตัวอย่างลายเซ็นอัตโนมัติที่จะประทับบนใบวางบิล:
                </span>
                <div className="py-3 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center">
                  <span className="font-['Mali','Caveat',cursive] italic font-semibold text-2xl text-indigo-950 tracking-wide select-none leading-none transform -rotate-1">
                    {profile.name || 'ชื่อผู้วางบิล'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ลงนามอิเล็กทรอนิกส์ (วันเวลาออกเอกสาร)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  * ระบบจะนำชื่อของคุณมาสร้างเป็นลายเซ็นฟอนต์ลายมือพร้อมประทับวันเวลาออกบิลโดยอัตโนมัติ
                </p>
              </div>
            )}

            {profile.signatureMode === 'drawn' && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  วาดลายมือชื่อของคุณในกรอบด้านล่าง:
                </span>
                <SignaturePad
                  initialDataUrl={profile.signatureDataUrl}
                  onSaveSignature={dataUrl => {
                    setProfile(prev => ({ ...prev, signatureDataUrl: dataUrl }));
                  }}
                  onClearSignature={() => {
                    setProfile(prev => ({ ...prev, signatureDataUrl: '' }));
                  }}
                />
              </div>
            )}

            {profile.signatureMode === 'none' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                เอกสารจะเว้นช่องว่างพร้อมเส้นประเพื่อให้พิมพ์ออกไปเซ็นด้วยปากกาจริง
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            {saved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> บันทึกเรียบร้อย
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-xs transition cursor-pointer"
            >
              บันทึกข้อมูลโปรไฟล์
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restore Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" /> สำรองและกู้คืนข้อมูล (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ข้อมูลทั้งหมด (บิล, รูปสลิป, ภาพใบ 50 ทวิ, ข้อมูลโปรไฟล์) ถูกเก็บในเครื่องของคุณ ปลอดภัย 100% สามารถ Export ไปใช้บนเครื่องอื่นได้
            </p>
          </div>
        </div>

        {restoreSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600" /> {restoreSuccess}
          </div>
        )}

        {restoreError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-red-600" /> {restoreError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download Backup */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm font-heading">สำรองข้อมูลทั้งหมด (Backup JSON)</div>
              <p className="text-xs text-slate-500 mt-1">
                ดาวน์โหลดข้อมูลบิลทั้ง {invoices.length} รายการ และภาพแนบทั้งหมด เก็บเป็นไฟล์ .json ลงเครื่อง
              </p>
            </div>
            <button
              onClick={() => downloadBackupFile(profile, invoices)}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" /> ดาวน์โหลดไฟล์ Backup (.json)
            </button>
          </div>

          {/* Upload Restore */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm font-heading">กู้คืนข้อมูล (Restore JSON)</div>
              <p className="text-xs text-slate-500 mt-1">
                นำเข้าไฟล์สำรองข้อมูลเพื่อนำกลับมาแสดงผล หรือย้ายเครื่องทำงาน
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelected}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4" /> เลือกไฟล์สำรองเพื่อกู้คืน
              </button>
            </div>
          </div>
        </div>

        {/* Restore Confirmation Modal / Alert */}
        {restoreCandidate && (
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 space-y-3 text-xs">
            <div className="font-bold text-indigo-950 text-sm flex items-center gap-1.5 font-heading">
              <Check className="w-4 h-4 text-indigo-600" /> ตรวจสอบไฟล์สำรองข้อมูลสำเร็จ
            </div>
            <div className="text-slate-700 space-y-1">
              <div>วันที่สำรองข้อมูล: <span className="font-semibold">{new Date(restoreCandidate.exportedAt).toLocaleString('th-TH')}</span></div>
              <div>ชื่อผู้รับเงินในไฟล์: <span className="font-semibold">{restoreCandidate.issuer.name}</span></div>
              <div>จำนวนรายการบิลที่พบ: <span className="font-bold text-indigo-900">{restoreCandidate.invoices.length} รายการ</span></div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => executeRestore('replace')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition cursor-pointer"
              >
                กู้คืนแบบแทนที่ทั้งหมด (Replace)
              </button>
              <button
                onClick={() => executeRestore('merge')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition cursor-pointer"
              >
                รวมกับข้อมูลปัจจุบัน (Merge)
              </button>
              <button
                onClick={() => setRestoreCandidate(null)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 font-medium transition cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Reset Demo Data Button */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400">ต้องการรีเซ็ตเพื่อเริ่มใหม่:</span>
          <button
            onClick={handleResetDemo}
            className="text-slate-500 hover:text-red-600 flex items-center gap-1 font-medium transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น
          </button>
        </div>
      </div>
    </div>
  );
};
