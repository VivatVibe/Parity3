import React, { useState } from 'react';
import { Invoice } from '../domain/storage';
import { TAX_CATEGORIES, TaxCategory } from '../domain/tax';
import { downloadPnd90Csv } from '../utils/exportCsv';
import { Plus, CheckCircle2, Clock, Trash2, Printer, Download } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onToggle50Tawi: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onCreateNew: () => void;
}

export const InvoiceList: React.FC<Props> = ({
  invoices,
  onSelectInvoice,
  onToggle50Tawi,
  onDeleteInvoice,
  onCreateNew
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = invoices.filter(inv => {
    const matchesCat = filterCategory === 'all' || inv.category === filterCategory;
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="ค้นหาเลขที่บิล หรือ ชื่อลูกค้า..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">ทุกประเภทเงินได้ (All)</option>
            <option value="40_2">40(2) จ้างทำของ / ฟรีแลนซ์</option>
            <option value="40_6">40(6) วิชาชีพอิสระ</option>
            <option value="40_8">40(8) คอนเทนต์ / การค้า</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadPnd90Csv(invoices)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition border border-slate-300 cursor-pointer"
            title="ส่งออกรายการทั้งหมดเป็นไฟล์ Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            สร้างใบแจ้งหนี้ใหม่
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">เลขที่ / วันที่</th>
                <th className="px-4 py-3">ประเภทเงินได้</th>
                <th className="px-4 py-3">ลูกค้า</th>
                <th className="px-4 py-3 text-right">ยอดก่อนหัก</th>
                <th className="px-4 py-3 text-right">หัก ณ ที่จ่าย 3%</th>
                <th className="px-4 py-3 text-right">ยอดสุทธิ</th>
                <th className="px-4 py-3 text-center">สถานะ 50 ทวิ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    ไม่พบรายการวางบิลที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map(inv => {
                  const catMeta = TAX_CATEGORIES[inv.category as TaxCategory];
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                        <div className="text-xs text-slate-500">{inv.issueDate}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {catMeta?.categoryLabel || inv.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900 line-clamp-1">{inv.clientName}</div>
                        <div className="text-xs text-slate-500">Tax ID: {inv.clientTaxId || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium">
                        ฿{inv.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right text-amber-700 font-medium">
                        -฿{inv.whtAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        ฿{inv.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => onToggle50Tawi(inv.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                            inv.has50Tawi
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title="คลิกเพื่อสลับสถานะใบ 50 ทวิ"
                        >
                          {inv.has50Tawi ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ได้รับแล้ว
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              รอทวงถาม
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="ดูใบวางบิล / พิมพ์"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
