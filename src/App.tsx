import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/AppHeader';
import { BottomNavBar } from './components/BottomNavBar';
import { MaterialsScreen } from './components/MaterialsScreen';
import { ShoppingScreen } from './components/ShoppingScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsModal } from './components/SettingsModal';
import { WifiOff, CheckCircle2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Monitor online / offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Đã kết nối lại Internet');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Mất kết nối Internet - Dữ liệu vẫn được lưu an toàn trên máy');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#0C121E] flex flex-col items-center justify-start p-0 selection:bg-[#C5A66A] selection:text-[#121A29]">
      {/* Main Container: Mobile-first responsive layout */}
      <div className="w-full max-w-md min-h-screen bg-[#172235] text-[#F7F5F0] relative overflow-hidden flex flex-col shadow-2xl">
        {/* Offline Warning Banner if disconnected */}
        {!isOnline && (
          <div className="bg-amber-900/90 border-b border-amber-700 text-amber-200 text-xs px-4 py-1.5 flex items-center justify-center space-x-2 z-50">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Mất kết nối mạng - Dữ liệu vẫn được lưu an toàn trên máy</span>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-[#1A2638] border border-[#C5A66A] text-[#F7F5F0] text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dynamic App Header with Brand & Realtime Clock */}
        <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* 3 MAIN TABS CONTENT SWITCHER */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col pt-1 pb-24">
          {activeTab === 'shopping' && <ShoppingScreen />}
          {activeTab === 'history' && <HistoryScreen />}
          {activeTab !== 'shopping' && activeTab !== 'history' && <MaterialsScreen />}
        </div>

        {/* Fixed 3-Tab Bottom Navigation Bar */}
        <BottomNavBar />
      </div>

      {/* Settings Modal (Excel Export, Supabase Cloud Backup) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
