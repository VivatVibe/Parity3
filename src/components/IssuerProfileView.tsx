import React, { useState } from 'react';
import { IssuerProfile, saveIssuer } from '../domain/storage';
import { Check, QrCode } from 'lucide-react';

interface Props {
  issuer: IssuerProfile;
  onUpdate: (updated: IssuerProfile) => void;
}

export const IssuerProfileView: React.FC<Props> = ({ issuer, onUpdate }) => {
  const [profile, setProfile] = useState<IssuerProfile>(issuer);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
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
  );
};
