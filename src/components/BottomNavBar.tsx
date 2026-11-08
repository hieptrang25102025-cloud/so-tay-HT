import React from 'react';
import { Package, ShoppingCart, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppTab } from '../types';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, stats, materials, transactions } = useApp();

  const tabs: Array<{ 
    id: AppTab; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { 
      id: 'materials', 
      label: 'Vật tư', 
      icon: Package,
    },
    { 
      id: 'shopping', 
      label: 'Cần mua', 
      icon: ShoppingCart,
      badgeCount: stats.needPurchaseCount
    },
    { 
      id: 'history', 
      label: 'Lịch sử', 
      icon: Clock,
      badgeCount: transactions.length > 0 ? transactions.length : undefined
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#172235]/95 backdrop-blur-md border-t border-[#22334A] pb-[env(safe-area-inset-bottom,8px)] pt-2 px-3 max-w-md mx-auto">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-2xl relative transition-all duration-200 active:scale-95 focus:outline-none border ${
                isActive
                  ? 'bg-gold-gradient text-[#121A29] border-[#DFBE82] shadow-gold-button'
                  : 'bg-[#1A2638] text-[#8E9EB2] border-[#2E415E] hover:text-white hover:border-[#475569]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#121A29] stroke-[2.5]' : 'text-[#C5A66A]'
                  }`}
                />
                {/* Badge for Shopping List or History */}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className={`absolute -top-1.5 -right-3 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[17px] text-center shadow-md ${
                    tab.id === 'shopping'
                      ? isActive ? 'bg-[#121A29] text-[#DFBE82]' : 'bg-[#EF4444] text-white'
                      : isActive ? 'bg-[#121A29] text-[#DFBE82]' : 'bg-[#2E415E] text-slate-200'
                  }`}>
                    {tab.badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-xs font-bold mt-1 block leading-none ${
                isActive ? 'text-[#121A29]' : 'text-white'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
