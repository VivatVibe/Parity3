import React, { useState } from 'react';
import { Invoice } from '../domain/storage';
import { compressImageFile } from '../utils/imageCompressor';
import { X, Upload, Trash2, CheckCircle2, FileText, Image as ImageIcon, Eye } from 'lucide-react';

interface Props {
  invoice: Invoice;
  onUpdateInvoice: (updated: Invoice) => void;
  onClose: () => void;
}

export const AttachmentModal: React.FC<Props> = ({ invoice, onUpdateInvoice, onClose }) => {
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [uploadingTawi, setUploadingTawi] = useState(false);

  const handleFileUpload = async (type: 'slip' | 'tawi', file: File) => {
    try {
      if (type === 'slip') setUploadingSlip(true);
      if (type === 'tawi') setUploadingTawi(true);

      const base64 = await compressImageFile(file, 1200, 0.75);
      const updated: Invoice = {
        ...invoice,
        ...(type === 'slip' ? { slipImage: base64, status: 'paid' } : { tawiImage: base64, has50Tawi: true })
      };
      onUpdateInvoice(updated);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploadingSlip(false);
      setUploadingTawi(false);
    }
  };

  const handleRemove = (type: 'slip' | 'tawi') => {
    if (confirm('คุณต้องการลบรูปภาพหลักฐานนี้หรือไม่?')) {
      const updated: Invoice = {
        ...invoice,
        ...(type === 'slip' ? { slipImage: undefined } : { tawiImage: undefined })
      };
      onUpdateInvoice(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              หลักฐานแนบสำหรับบิล {invoice.invoiceNumber}
            </h2>
            <p className="text-xs text-slate-500">
              ลูกค้า: {invoice.clientName} | ยอดสุทธิ: ฿{invoice.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Box 1: Payment Slip */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm font-heading">
                    <ImageIcon className="w-4 h-4 text-blue-600" /> สลิปโอนเงิน (Payment Slip)
                  </div>
                  {invoice.slipImage ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      มีหลักฐานแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">ยังไม่แนบ</span>
                  )}
                </div>

                <div className="mt-3">
                  {invoice.slipImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-black aspect-3/4 flex items-center justify-center">
                      <img
                        src={invoice.slipImage}
                        alt="Payment Slip"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setActivePreview(invoice.slipImage!)}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          onClick={() => setActivePreview(invoice.slipImage!)}
                          className="p-2 bg-white/90 text-slate-800 rounded-lg hover:bg-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> ดูภาพขยาย
                        </button>
                        <button
                          onClick={() => handleRemove('slip')}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-blue-50/30 hover:border-blue-400 cursor-pointer transition aspect-3/4">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700">คลิกเพื่ออัปโหลดสลิป</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">หรือถ่ายรูปจากมือถือ (JPG, PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) handleFileUpload('slip', e.target.files[0]);
                        }}
                        disabled={uploadingSlip}
                      />
                    </label>
                  )}
                </div>
              </div>

              {invoice.slipImage && (
                <div className="mt-3 pt-2 text-center">
                  <label className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline">
                    เปลี่ยนรูปสลิปใหม่
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) handleFileUpload('slip', e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Box 2: 50 Tawi Certificate */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm font-heading">
                    <FileText className="w-4 h-4 text-amber-600" /> รูปใบ 50 ทวิ (3% Withholding)
                  </div>
                  {invoice.tawiImage ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> แนบแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      รอทวงถาม
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {invoice.tawiImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-black aspect-3/4 flex items-center justify-center">
                      <img
                        src={invoice.tawiImage}
                        alt="50 Tawi Document"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setActivePreview(invoice.tawiImage!)}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          onClick={() => setActivePreview(invoice.tawiImage!)}
                          className="p-2 bg-white/90 text-slate-800 rounded-lg hover:bg-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> ดูภาพขยาย
                        </button>
                        <button
                          onClick={() => handleRemove('tawi')}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-amber-50/30 hover:border-amber-400 cursor-pointer transition aspect-3/4">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700">คลิกเพื่ออัปโหลดใบ 50 ทวิ</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">ภาพถ่ายหรือสแกนใบหักภาษี</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) handleFileUpload('tawi', e.target.files[0]);
                        }}
                        disabled={uploadingTawi}
                      />
                    </label>
                  )}
                </div>
              </div>

              {invoice.tawiImage && (
                <div className="mt-3 pt-2 text-center">
                  <label className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline">
                    เปลี่ยนรูปใบ 50 ทวิใหม่
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) handleFileUpload('tawi', e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen Lightbox Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActivePreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activePreview}
              alt="Enlarged Document"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
