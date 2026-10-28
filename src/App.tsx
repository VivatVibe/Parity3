import React, { useState, useEffect } from 'react';
import {
  Invoice,
  IssuerProfile,
  loadInvoices,
  saveInvoices,
  loadIssuer,
  saveIssuer,
  loadDeletedInvoiceIds,
  addDeletedInvoiceId,
  clearDeletedInvoiceIds
} from './domain/storage';
import {
  SubscriptionState,
  UserAccount,
  loadSubscription,
  saveSubscription,
  loadUser,
  saveUser,
  checkInvoiceLimit,
  isSubscriptionPro
} from './domain/subscription';
import { uploadToCloud, downloadFromCloud } from './domain/cloudSync';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreviewModal } from './components/InvoicePreviewModal';
import { Pnd90Dashboard } from './components/Pnd90Dashboard';
import { IssuerProfileView } from './components/IssuerProfileView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ClientInvoiceView } from './components/ClientInvoiceView';
import { LandingPage } from './components/LandingPage';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { decodeInvoiceFromShareParam } from './utils/shareInvoice';
import { FileText, PieChart, User, PlusCircle, Sparkles, Home, Zap } from 'lucide-react';

export default function App() {
  // Determine initial view mode: show landing page by default to new visitors
  const determineInitialView = (): 'app' | 'landing' => {
    if (typeof window === 'undefined') return 'landing';
    const params = new URLSearchParams(window.location.search);
    if (params.get('view')) return 'app'; // share link opens invoice
    if (params.get('page') === 'app') return 'app';
    if (params.get('page') === 'landing') return 'landing';
    if (loadUser()) return 'app'; // logged in users go straight to app
    return 'landing'; // default to commercial landing page
  };

  const [viewMode, setViewMode] = useState<'app' | 'landing'>(determineInitialView);
  const [activeTab, setActiveTab] = useState<'invoices' | 'tax' | 'profile'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [issuer, setIssuer] = useState<IssuerProfile>(loadIssuer());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [sharedView, setSharedView] = useState<{ invoice: Invoice; issuer: IssuerProfile } | null>(null);

  // User Account & Subscription States
  const [user, setUser] = useState<UserAccount | null>(loadUser());
  const [subscription, setSubscription] = useState<SubscriptionState>(loadSubscription());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  const handleEnterApp = () => {
    setViewMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloudSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const pendingDeleted = loadDeletedInvoiceIds();
      const result = await uploadToCloud(user, invoices, issuer, pendingDeleted);
      if (result.success) {
        if (pendingDeleted.length > 0) {
          clearDeletedInvoiceIds(pendingDeleted);
        }
        // Also pull any remote updates
        const remote = await downloadFromCloud(user);
        if (remote.success) {
          if (remote.subscription) {
            setSubscription(remote.subscription);
          }
          if (remote.invoices && remote.invoices.length > 0) {
            const merged = remote.invoices.map(rem => {
              const local = invoices.find(loc => loc.id === rem.id);
              return {
                ...rem,
                slipImage: rem.slipImage || local?.slipImage,
                tawiImage: rem.tawiImage || local?.tawiImage
              };
            });
            setInvoices(merged);
            saveInvoices(merged);
          }
        }
      }
    } catch {
      // offline resilient
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoginSuccess = async (loggedInUser: UserAccount, sub?: SubscriptionState) => {
    setUser(loggedInUser);
    saveUser(loggedInUser);
    if (sub) {
      setSubscription(sub);
      saveSubscription(sub);
    }
    // Pull user cloud data if exists
    try {
      setIsSyncing(true);
      const remote = await downloadFromCloud(loggedInUser);
      if (remote.success) {
        if (remote.issuerProfile) {
          setIssuer(remote.issuerProfile);
          saveIssuer(remote.issuerProfile);
        }
        if (remote.invoices && remote.invoices.length > 0) {
          const merged = remote.invoices.map(rem => {
            const local = invoices.find(loc => loc.id === rem.id);
            return {
              ...rem,
              slipImage: rem.slipImage || local?.slipImage,
              tawiImage: rem.tawiImage || local?.tawiImage
            };
          });
          setInvoices(merged);
          saveInvoices(merged);
          setSelectedInvoice(merged[0]);
        }
        if (remote.subscription) {
          setSubscription(remote.subscription);
          saveSubscription(remote.subscription);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    saveUser(null);
  };

  const handleUpgradeSuccess = (newSub: SubscriptionState) => {
    setSubscription(newSub);
    saveSubscription(newSub);
  };

  const handleSaveInvoice = (newInv: Invoice) => {
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    setShowCreateModal(false);
    setSelectedInvoice(newInv);
    setShowPrintModal(true);

    if (user) {
      uploadToCloud(user, updated, issuer).catch(() => {});
    }
  };

  const handleUpdateInvoice = (updatedInv: Invoice) => {
    const updated = invoices.map(inv => (inv.id === updatedInv.id ? updatedInv : inv));
    setInvoices(updated);
    saveInvoices(updated);
    if (selectedInvoice && selectedInvoice.id === updatedInv.id) {
      setSelectedInvoice(updatedInv);
    }

    if (user) {
      uploadToCloud(user, updated, issuer).catch(() => {});
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

    if (user) {
      uploadToCloud(user, updated, issuer).catch(() => {});
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('คุณแน่ใจว่าต้องการลบรายการนี้หรือไม่?')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      saveInvoices(updated);
      addDeletedInvoiceId(id);
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(updated[0] || null);
      }

      if (user) {
        uploadToCloud(user, updated, issuer, [id]).then(res => {
          if (res.success) {
            clearDeletedInvoiceIds([id]);
          }
        }).catch(() => {});
      }
    }
  };

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

  // If viewing the Landing Page
  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={handleEnterApp}
          onOpenUpgradeModal={() => setShowUpgradeModal(true)}
        />
        <ProUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          user={user}
          currentSubscription={subscription}
          onUpgradeSuccess={handleUpgradeSuccess}
        />
      </>
    );
  }

  const isPro = isSubscriptionPro(subscription);
  const limitInfo = checkInvoiceLimit(invoices, subscription);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Sarabun',sans-serif]">
      {/* Top Header */}
      <header className="no-print bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-hidden">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-[0_4px_14px_rgba(79,70,229,0.35)] shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-slate-950 text-base font-heading tracking-tight">
                  Parity3
                </h1>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> PRO
                  </span>
                ) : (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <Zap className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" /> อัปเกรด Pro
                  </button>
                )}
              </div>
              <p className="hidden lg:block text-[11px] text-slate-500">
                ระบบออกบิลพร้อม PromptPay & สรุปภาษี ภ.ง.ด. 90 หัก ณ ที่จ่าย 3%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Navigation Tabs (Desktop / Tablet Adaptive Pill) */}
            <nav className="hidden md:flex items-center gap-0.5 sm:gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>โปรไฟล์</span>
              </button>
            </nav>

            {/* Switch to Landing Page */}
            <button
              onClick={() => setViewMode('landing')}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="ดูหน้าหลักแนะนำระบบและราคา"
            >
              <Home className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[11px] sm:text-xs">หน้าแรก</span>
            </button>

            {/* Google Login / Account Info */}
            <GoogleLoginButton
              user={user}
              subscription={subscription}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
              onSyncRequest={handleCloudSync}
              isSyncing={isSyncing}
            />

            {/* New Invoice Button (Desktop) */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-[0_4px_14px_rgba(79,70,229,0.3)] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>ออกบิลใหม่</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 ${showPrintModal ? 'no-print' : ''}`}>
        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            issuer={issuer}
            selectedInvoice={selectedInvoice}
            onSelectInvoice={handleSelectInvoice}
            onOpenPrint={(inv) => {
              setSelectedInvoice(inv);
              setShowPrintModal(true);
            }}
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
            isPro={isPro}
            onOpenUpgradeModal={() => setShowUpgradeModal(true)}
            onUpdate={(newIssuer) => {
              setIssuer(newIssuer);
              saveIssuer(newIssuer);
              if (user) uploadToCloud(user, invoices, newIssuer).catch(() => {});
            }}
            onRestoreData={(newIssuer, newInvoices) => {
              setIssuer(newIssuer);
              setInvoices(newInvoices);
              if (newInvoices.length > 0) setSelectedInvoice(newInvoices[0]);
              if (user) uploadToCloud(user, newInvoices, newIssuer).catch(() => {});
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
          invoices={invoices}
          isPro={isPro}
          onOpenUpgradeModal={() => {
            setShowCreateModal(false);
            setShowUpgradeModal(true);
          }}
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

      {/* Pro Tier Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        user={user}
        currentSubscription={subscription}
        onUpgradeSuccess={handleUpgradeSuccess}
      />
    </div>
  );
}
