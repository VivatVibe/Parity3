import React, { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceItem, getKnownClients, KnownClient, loadDraftInvoice, saveDraftInvoice, clearDraftInvoice } from '../domain/storage';
import { TaxCategory, TAX_CATEGORIES, calculateBilling, roundCurrency } from '../domain/tax';
import { X, Plus, Trash2, Check, Sparkles, Building2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<Props> = ({ invoices, onSave, onCancel }) => {
  const knownClients = getKnownClients(invoices);
  const draft = loadDraftInvoice();

  const [invoiceNumber, setInvoiceNumber] = useState(
    draft?.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [issueDate, setIssueDate] = useState(draft?.issueDate || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    draft?.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState<TaxCategory>(draft?.category || '40_2');
  const [clientName, setClientName] = useState(draft?.clientName || '');
  const [clientTaxId, setClientTaxId] = useState(draft?.clientTaxId || '');
  const [clientAddress, setClientAddress] = useState(draft?.clientAddress || '');
  const [notes, setNotes] = useState(draft?.notes || '');
  const [has50Tawi, setHas50Tawi] = useState(draft?.has50Tawi || false);

  const [items, setItems] = useState<InvoiceItem[]>(
    draft?.items && draft.items.length > 0
      ? draft.items
      : [{ id: '1', description: 'บริการพัฒนาซอฟต์แวร์ / ออกแบบระบบ', quantity: 1, unitPrice: 20000, amount: 20000 }]
  );

  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showExtraClientDetails, setShowExtraClientDetails] = useState(Boolean(clientTaxId || clientAddress));
  const [draftRestored, setDraftRestored] = useState(Boolean(draft && (draft.clientName || draft.items?.length)));
  const clientInputRef = useRef<HTMLDivElement>(null);

  // Filter client suggestions by search term
  const filteredClients = knownClients.filter(c =>
    clientName.trim() ? c.clientName.toLowerCase().includes(clientName.toLowerCase()) : true
  );

  // Debounced auto-save draft to LocalStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraftInvoice({
        invoiceNumber,
        issueDate,
        dueDate,
        category,
        clientName,
        clientTaxId,
        clientAddress,
        items,
        notes,
        has50Tawi
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [invoiceNumber, issueDate, dueDate, category, clientName, clientTaxId, clientAddress, items, notes, has50Tawi]);

  // Click outside to close client suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientInputRef.current && !clientInputRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClient = (client: KnownClient) => {
    setClientName(client.clientName);
    setClientTaxId(client.clientTaxId);
    setClientAddress(client.clientAddress);
    setShowExtraClientDetails(Boolean(client.clientTaxId || client.clientAddress));
    setShowClientSuggestions(false);
  };

  const handleResetDraft = () => {
    clearDraftInvoice();
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setClientName('');
    setClientTaxId('');
    setClientAddress('');
    setNotes('');
    setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    setDraftRestored(false);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = roundCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
    }
    updated[index] = item;
    setItems(updated);
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...items];
    const currentQty = Number(updated[index].quantity) || 1;
    const newQty = Math.max(1, currentQty + delta);
    updated[index].quantity = newQty;
    updated[index].amount = roundCurrency(newQty * (Number(updated[index].unitPrice) || 0));
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
      clientName: clientName.trim(),
      clientTaxId: clientTaxId.trim(),
      clientAddress: clientAddress.trim(),
      items,
      subtotal: billing.subtotal,
      whtRate: billing.whtRate,
      whtAmount: billing.whtAmount,
      netTotal: billing.netTotal,
      status: 'sent',
      has50Tawi,
      notes: notes.trim()
    };

    clearDraftInvoice();
    onSave(newInvoice);
  };

  const selectedCat = TAX_CATEGORIES[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto font-['Sarabun',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-heading">ออกใบวางบิลใหม่</h2>
              {draftRestored && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> กู้คืนแบบร่างแล้ว
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">บันทึกแบบร่างอัตโนมัติ • คำนวณหัก ณ ที่จ่าย 3%</p>
          </div>

          <div className="flex items-center gap-1">
            {draftRestored && (
              <button
                type="button"
                onClick={handleResetDraft}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                title="ล้างข้อมูลและเริ่มกรอกใหม่"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">ล้างแบบร่าง</span>
              </button>
            )}
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Row 1: Invoice metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">เลขที่บิล</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">วันที่ออกเอกสาร</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">วันครบกำหนดชำระ</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Tax Category Selector (Compact segmented control on mobile) */}
          <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2">
            <label className="block text-[11px] font-bold text-indigo-950 font-heading">
              ประเภทเงินได้สรรพากร (ภ.ง.ด. 90)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TAX_CATEGORIES) as TaxCategory[]).map(catKey => {
                const item = TAX_CATEGORIES[catKey];
                const active = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`p-2.5 text-center rounded-xl border text-xs transition cursor-pointer flex flex-col items-center justify-center ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 font-medium'
                    }`}
                  >
                    <span className="text-[11px]">{item.categoryLabel}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-indigo-800 pt-0.5 leading-relaxed">
              💡 <span className="font-semibold">เกณฑ์หักค่าใช้จ่าย:</span> {selectedCat.expenseDeductionRule}
            </div>
          </div>

          {/* Row 3: Client Autocomplete & Info */}
          <div className="space-y-3" ref={clientInputRef}>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-900 font-heading">
                ข้อมูลลูกค้า / ผู้ว่าจ้าง *
              </label>
              <button
                type="button"
                onClick={() => setShowExtraClientDetails(!showExtraClientDetails)}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{showExtraClientDetails ? 'ซ่อน Tax ID & ที่อยู่' : '+ ระบุ Tax ID & ที่อยู่'}</span>
                {showExtraClientDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="พิมพ์ชื่อบริษัท หรือ ชื่อลูกค้า..."
                value={clientName}
                onChange={e => {
                  setClientName(e.target.value);
                  setShowClientSuggestions(true);
                }}
                onFocus={() => setShowClientSuggestions(true)}
                required
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />

              {/* Client Auto-complete Suggestions Dropdown */}
              {showClientSuggestions && filteredClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> ลูกค้าที่เคยออกบิลให้ (แตะเพื่อเติมข้อมูลทันที)
                  </div>
                  {filteredClients.map(c => (
                    <button
                      key={c.clientName}
                      type="button"
                      onClick={() => handleSelectClient(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50/70 transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{c.clientName}</div>
                        {c.clientTaxId && <div className="text-[10px] text-slate-400">Tax ID: {c.clientTaxId}</div>}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold">เลือก</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Collapsible Tax ID & Address */}
            {showExtraClientDetails && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 0105562098765"
                    value={clientTaxId}
                    onChange={e => setClientTaxId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    ที่อยู่สำหรับลงในใบวางบิล
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เลขที่ อาคาร ถนน แขวง เขต จังหวัด..."
                    value={clientAddress}
                    onChange={e => setClientAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Line Items with Steppers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-900 font-heading">
                รายการงาน / ค่าบริการ
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ชื่องาน / รายละเอียดค่าบริการ..."
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      required
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60 text-xs">
                    {/* Stepper Quantity control */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">จำนวน:</span>
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, -1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-mono-numbers font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">ราคา/หน่วย:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unitPrice || ''}
                        onChange={e => updateItem(index, 'unitPrice', Number(e.target.value))}
                        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-lg text-right font-mono-numbers bg-white"
                      />
                    </div>

                    {/* Subtotal Item Amount */}
                    <div className="font-bold text-slate-900 font-mono-numbers text-xs">
                      ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & 50 Tawi checkbox */}
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น ชำระหลังส่งมอบงานขั้นสุดท้าย"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="tawiReceivedInForm"
                checked={has50Tawi}
                onChange={e => setHas50Tawi(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="tawiReceivedInForm" className="text-xs text-slate-700 font-medium cursor-pointer">
                ได้รับหนังสือรับรองการหัก ณ ที่จ่าย (ใบ 50 ทวิ) แล้ว
              </label>
            </div>
          </div>

          {/* Spacer for sticky bottom bar */}
          <div className="h-16"></div>
        </form>

        {/* Sticky Mobile/Desktop Bottom Action Bar */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 shadow-lg">
          <div>
            <div className="text-[10px] text-slate-500">
              รวม ฿{billing.subtotal.toLocaleString('th-TH')} • <span className="text-amber-700 font-semibold">หัก 3%: -฿{billing.whtAmount.toLocaleString('th-TH')}</span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono-numbers text-indigo-700 leading-tight">
              ฿{billing.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition cursor-pointer"
            >
              บันทึกใบวางบิล
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
