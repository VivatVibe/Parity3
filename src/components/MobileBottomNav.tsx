import React from 'react';
import { FileText, PieChart, User, Plus } from 'lucide-react';

interface Props {
  activeTab: 'invoices' | 'tax' | 'profile';
  onChangeTab: (tab: 'invoices' | 'tax' | 'profile') => void;
  onQuickCreate: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({ activeTab, onChangeTab, onQuickCreate }) => {
  return (
    <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 px-3 py-1.5 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Tab 1: Invoices */}
        <button
          onClick={() => onChangeTab('invoices')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'invoices' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className={`w-5 h-5 ${activeTab === 'invoices' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 font-heading">รายการบิล</span>
        </button>

        {/* Center Quick Create Floating Button */}
        <button
          onClick={onQuickCreate}
          className="flex flex-col items-center justify-center -top-4 relative group cursor-pointer"
          title="สร้างบิลใหม่"
        >
          <div className="w-12 h-12 rounded-full bg-linear-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-active:scale-95 transition">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-indigo-700 mt-0.5 font-heading">ออกบิล</span>
        </button>

        {/* Tab 2: Tax Dashboard */}
        <button
          onClick={() => onChangeTab('tax')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'tax' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className={`w-5 h-5 ${activeTab === 'tax' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 font-heading">สรุป ภ.ง.ด. 90</span>
        </button>

        {/* Tab 3: Profile */}
        <button
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 font-heading">โปรไฟล์</span>
        </button>
      </div>
    </div>
  );
};
