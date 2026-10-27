import React, { useState, useEffect } from 'react';
import { Invoice, IssuerProfile, loadInvoices, saveInvoices, loadIssuer } from './domain/storage';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreviewModal } from './components/InvoicePreviewModal';
import { Pnd90Dashboard } from './components/Pnd90Dashboard';
import { IssuerProfileView } from './components/IssuerProfileView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ClientInvoiceView } from './components/ClientInvoiceView';
import { decodeInvoiceFromShareParam } from './utils/shareInvoice';
import { FileText, PieChart, User, PlusCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'tax' | 'profile'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [issuer, setIssuer] = useState<IssuerProfile>(loadIssuer());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [sharedView, setSharedView] = useState<{ invoice: Invoice; issuer: IssuerProfile } | null>(null);

  useEffect(() => {
    // Check if opened via share link ?view=...
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
      const decoded = decodeInvoiceFromShareParam(viewParam);
      if (decoded) {
        setSharedView(decoded);
        return;
      }
    }

    const loaded = loadInvoices();
    setInvoices(loaded);
    if (loaded.length > 0) {
      setSelectedInvoice(loaded[0]);
    }
  }, []);

  const handleSaveInvoice = (newInv: Invoice) => {
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    setShowCreateModal(false);
    setSelectedInvoice(newInv);
    setShowPrintModal(true); // Open modal preview on save
  };

  const handleUpdateInvoice = (updatedInv: Invoice) => {
    const updated = invoices.map(inv => (inv.id === updatedInv.id ? updatedInv : inv));
    setInvoices(updated);
    saveInvoices(updated);
    if (selectedInvoice && selectedInvoice.id === updatedInv.id) {
      setSelectedInvoice(updatedInv);
    }
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
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(updated[0] || null);
      }
    }
  };

  // On mobile (< 1024px), selecting an invoice opens the modal preview
  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    if (window.innerWidth < 1024) {
      setShowPrintModal(true);
    }
  };

  // If opened via share link, show the client-facing public view
  if (sharedView) {
    return (
      <ClientInvoiceView
        invoice={sharedView.invoice}
        issuer={sharedView.issuer}
        onBackToApp={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setSharedView(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Sarabun',sans-serif]">
      {/* Top Header */}
      <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-950 text-base font-heading">
                  Multi-Income Billing
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Pro Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                ระบบออกบิลพร้อม PromptPay & สรุปภาษี ภ.ง.ด. 90 หัก ณ ที่จ่าย 3%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'invoices'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>รายการวางบิล</span>
              </button>

              <button
                onClick={() => setActiveTab('tax')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'tax'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>สรุปภาษี ภ.ง.ด. 90</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>โปรไฟล์ผู้รับเงิน</span>
              </button>
            </nav>

            <button
              onClick={() => setShowCreateModal(true)}
              className="hidden md:flex items-center gap-1.5 ml-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              ออกบิลใหม่
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            issuer={issuer}
            selectedInvoice={selectedInvoice}
            onSelectInvoice={handleSelectInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onToggle50Tawi={handleToggle50Tawi}
            onDeleteInvoice={handleDeleteInvoice}
            onCreateNew={() => setShowCreateModal(true)}
          />
        )}

        {activeTab === 'tax' && <Pnd90Dashboard invoices={invoices} />}

        {activeTab === 'profile' && (
          <IssuerProfileView
            issuer={issuer}
            invoices={invoices}
            onUpdate={setIssuer}
            onRestoreData={(newIssuer, newInvoices) => {
              setIssuer(newIssuer);
              setInvoices(newInvoices);
              if (newInvoices.length > 0) setSelectedInvoice(newInvoices[0]);
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on < 768px) */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onQuickCreate={() => setShowCreateModal(true)}
      />

      {/* Invoice Creation Form Modal */}
      {showCreateModal && (
        <InvoiceForm
          onSave={handleSaveInvoice}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Full-Screen Print / PDF Modal */}
      {showPrintModal && selectedInvoice && (
        <InvoicePreviewModal
          invoice={selectedInvoice}
          issuer={issuer}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
