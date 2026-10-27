import React, { useState, useEffect } from 'react';
import { Invoice, IssuerProfile, loadInvoices, saveInvoices, loadIssuer } from './domain/storage';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreviewModal } from './components/InvoicePreviewModal';
import { Pnd90Dashboard } from './components/Pnd90Dashboard';
import { IssuerProfileView } from './components/IssuerProfileView';
import { FileText, PieChart, User, PlusCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'tax' | 'profile'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [issuer, setIssuer] = useState<IssuerProfile>(loadIssuer());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  useEffect(() => {
    setInvoices(loadInvoices());
  }, []);

  const handleSaveInvoice = (newInv: Invoice) => {
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    setShowCreateModal(false);
    setSelectedInvoice(newInv); // Open preview immediately
  };

  const handleToggle50Tawi = (id: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, has50Tawi: !inv.has50Tawi };
      }
      return inv;
    });
    setInvoices(updated);
    saveInvoices(updated);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('คุณแน่ใจว่าต้องการลบรายการนี้หรือไม่?')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      saveInvoices(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Sarabun',sans-serif]">
      {/* Top Navigation */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base font-heading">
                Multi-Income Billing & Tax
              </h1>
              <p className="text-[11px] text-slate-500">
                ระบบออกบิลพร้อม PromptPay & คำนวณ ภ.ง.ด. 90 หัก ณ ที่จ่าย 3%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'invoices'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">รายการวางบิล</span>
              </button>

              <button
                onClick={() => setActiveTab('tax')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'tax'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span className="hidden sm:inline">สรุปภาษี ภ.ง.ด. 90</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">โปรไฟล์ผู้รับเงิน</span>
              </button>
            </nav>

            <button
              onClick={() => setShowCreateModal(true)}
              className="hidden sm:flex items-center gap-1.5 ml-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              ออกบิลใหม่
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            onSelectInvoice={setSelectedInvoice}
            onToggle50Tawi={handleToggle50Tawi}
            onDeleteInvoice={handleDeleteInvoice}
            onCreateNew={() => setShowCreateModal(true)}
          />
        )}

        {activeTab === 'tax' && <Pnd90Dashboard invoices={invoices} />}

        {activeTab === 'profile' && (
          <IssuerProfileView issuer={issuer} onUpdate={setIssuer} />
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <InvoiceForm
          onSave={handleSaveInvoice}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Invoice Print & Preview Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          invoice={selectedInvoice}
          issuer={issuer}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
