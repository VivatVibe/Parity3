import React, { useState } from 'react';
import { Invoice, InvoiceItem } from '../domain/storage';
import { TaxCategory, TAX_CATEGORIES, calculateBilling, roundCurrency } from '../domain/tax';
import { X, Plus, Trash2 } from 'lucide-react';

interface Props {
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<Props> = ({ onSave, onCancel }) => {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [category, setCategory] = useState<TaxCategory>('40_2');
  const [clientName, setClientName] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [has50Tawi, setHas50Tawi] = useState(false);

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'บริการพัฒนาซอฟต์แวร์ / ออกแบบระบบ', quantity: 1, unitPrice: 20000, amount: 20000 }
  ]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = roundCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
    }
    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = roundCurrency(items.reduce((acc, it) => acc + (it.amount || 0), 0));
  const billing = calculateBilling(subtotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('กรุณากรอกชื่อลูกค้า / บริษัท');
      return;
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      issueDate,
      dueDate,
      category,
      clientName,
      clientTaxId,
      clientAddress,
      items,
      subtotal: billing.subtotal,
      whtRate: billing.whtRate,
      whtAmount: billing.whtAmount,
      netTotal: billing.netTotal,
      status: 'sent',
      has50Tawi,
      notes
    };

    onSave(newInvoice);
  };

  const selectedCat = TAX_CATEGORIES[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">สร้างใบแจ้งหนี้ / ใบวางบิลใหม่</h2>
            <p className="text-xs text-slate-500">คำนวณหัก ณ ที่จ่าย 3% และจัดกลุ่มตามประเภทเงินได้ ภ.ง.ด. 90</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เลขที่ใบแจ้งหนี้</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่ออกเอกสาร</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">วันครบกำหนดชำระ</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
            <label className="block text-xs font-bold text-blue-900 mb-1">ประเภทเงินได้สำหรับยื่นภาษี (ภ.ง.ด. 90)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {(Object.keys(TAX_CATEGORIES) as TaxCategory[]).map(catKey => {
                const item = TAX_CATEGORIES[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`p-3 text-left rounded-lg border text-xs transition cursor-pointer ${
                      category === catKey
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="font-bold">{item.categoryLabel}</div>
                    <div className={`text-[11px] mt-1 ${category === catKey ? 'text-blue-100' : 'text-slate-500'}`}>
                      {item.typicalJobs}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-blue-800">
              💡 <span className="font-medium">เกณฑ์หักค่าใช้จ่าย:</span> {selectedCat.expenseDeductionRule}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading">ข้อมูลผู้ว่าจ้าง / ลูกค้า</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อบริษัท / ลูกค้า *</label>
                <input
                  type="text"
                  placeholder="เช่น บริษัท ดิจิทัล เอเจนซี่ จำกัด"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                <input
                  type="text"
                  placeholder="เช่น 0105562098765"
                  value={clientTaxId}
                  onChange={e => setClientTaxId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ที่อยู่ลูกค้า</label>
              <textarea
                rows={2}
                placeholder="เลขที่ อาคาร ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-heading">รายการงาน / ค่าบริการ</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="รายละเอียดงาน..."
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    required
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="จำนวน"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                    className="w-20 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="ราคา/หน่วย"
                    value={item.unitPrice}
                    onChange={e => updateItem(index, 'unitPrice', Number(e.target.value))}
                    className="w-32 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                  />
                  <div className="w-28 text-right font-medium text-slate-800 text-sm">
                    ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-end space-y-1 text-sm">
            <div className="flex justify-between w-64 text-slate-600">
              <span>รวมเป็นเงิน (Subtotal):</span>
              <span className="font-medium text-slate-900">฿{billing.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between w-64 text-amber-700">
              <span>หักภาษี ณ ที่จ่าย 3% (WHT):</span>
              <span className="font-medium">-฿{billing.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-slate-300 w-64 my-1"></div>
            <div className="flex justify-between w-64 text-base font-bold text-slate-900">
              <span>ยอดชำระสุทธิ (Net Total):</span>
              <span className="text-blue-600">฿{billing.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tawiReceived"
              checked={has50Tawi}
              onChange={e => setHas50Tawi(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="tawiReceived" className="text-xs text-slate-700 font-medium cursor-pointer">
              ได้รับเอกสารหนังสือรับรองการหัก ณ ที่จ่าย (ใบ 50 ทวิ) แล้ว
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-100 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-xs transition"
            >
              บันทึกใบแจ้งหนี้
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
