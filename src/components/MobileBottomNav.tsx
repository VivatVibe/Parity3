import React from 'react';
import { FileText, PieChart, User, Plus } from 'lucide-react';

interface Props {
  activeTab: 'invoices' | 'tax' | 'profile';
  onChangeTab: (tab: 'invoices' | 'tax' | 'profile') => void;
  onQuickCreate: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({ activeTab, onChangeTab, onQuickCreate }) => {
  return (
    <aside
      aria-label="Mobile Navigation Dock"
      className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pointer-events-none"
    >
      <nav className="glass-dock rounded-full px-3.5 py-2 flex items-center justify-between text-slate-300 max-w-sm mx-auto pointer-events-auto">
        {/* Tab 1: Invoices */}
        <button
          type="button"
          onClick={() => onChangeTab('invoices')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === 'invoices'
              ? 'text-white bg-indigo-500/20 ring-1 ring-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
              : 'text-slate-400 hover:text-slate-200 active:scale-95'
          }`}
        >
          <FileText className={`w-5 h-5 ${activeTab === 'invoices' ? 'stroke-[2.5] text-indigo-400' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 font-heading font-medium tracking-tight">รายการวางบิล</span>
        </button>

        {/* Center Quick Create Floating Pill Button */}
        <button
          type="button"
          onClick={onQuickCreate}
          className="relative -top-3 group cursor-pointer focus:outline-none"
          title="สร้างบิลใหม่"
          aria-label="สร้างบิลใหม่"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(79,70,229,0.55)] border-2 border-white/30 group-hover:scale-105 active:scale-90 transition-all duration-200">
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </div>
          <span className="sr-only">สร้างบิลใหม่</span>
        </button>

        {/* Tab 2: Tax Dashboard */}
        <button
          type="button"
          onClick={() => onChangeTab('tax')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === 'tax'
              ? 'text-white bg-indigo-500/20 ring-1 ring-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
              : 'text-slate-400 hover:text-slate-200 active:scale-95'
          }`}
        >
          <PieChart className={`w-5 h-5 ${activeTab === 'tax' ? 'stroke-[2.5] text-indigo-400' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 font-heading font-medium tracking-tight">สรุป ภ.ง.ด. 90</span>
          <span className="sr-only">สรุปภาษี ภ.ง.ด. 90</span>
        </button>

        {/* Tab 3: Profile */}
        <button
          type="button"
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer ${
            activeTab === 'profile'
              ? 'text-white bg-indigo-500/20 ring-1 ring-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
              : 'text-slate-400 hover:text-slate-200 active:scale-95'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5] text-indigo-400' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 font-heading font-medium tracking-tight">โปรไฟล์</span>
        </button>
      </nav>
    </aside>
  );
};
