import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Calendar, 
  Clock,
  Package, 
  CheckCircle2, 
  ShoppingCart, 
  AlertTriangle, 
  Mic, 
  ChevronRight,
  PlusCircle,
  Inbox
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductThumbnail } from './ProductThumbnail';

interface HomeScreenProps {
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenSettings }) => {
  const { 
    stats, 
    materials, 
    transactions, 
    purchaseItems, 
    setActiveTab 
  } = useApp();

  // Realtime clock and dynamic date in Vietnam timezone (Asia/Ho_Chi_Minh)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { dateFormatted, timeFormatted } = useMemo(() => {
    const now = currentDateTime;

    // Vietnam weekday and date format: Thứ, DD/MM/YYYY
    const vnDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    
    // Format in Asia/Ho_Chi_Minh timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const partMap: Record<string, string> = {};
    parts.forEach(p => {
      partMap[p.type] = p.value;
    });

    // Determine day of week in Vietnam timezone
    const vnDateObj = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const dayName = vnDays[vnDateObj.getDay()];

    const dd = partMap['day'] || '01';
    const mm = partMap['month'] || '01';
    const yyyy = partMap['year'] || '2026';
    const hh = partMap['hour'] || '00';
    const min = partMap['minute'] || '00';
    const ss = partMap['second'] || '00';

    return {
      dateFormatted: `${dayName}, ${dd}/${mm}/${yyyy}`,
      timeFormatted: `${hh}:${min}:${ss}`
    };
  }, [currentDateTime]);

  // Recent used items (from real STOCK_OUT transactions)
  const recentUsedItems = useMemo(() => {
    const list: Array<{
      material_id: string;
      material_name: string;
      material_code: string;
      quantity: number;
      unit: string;
      timeAgo: string;
    }> = [];

    const stockOutTxs = transactions.filter(t => t.type === 'STOCK_OUT');
    for (const tx of stockOutTxs) {
      const diffMs = Date.now() - new Date(tx.created_at).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      let timeAgo = 'Vừa xong';
      if (diffMins < 60 && diffMins > 0) timeAgo = `${diffMins} phút trước`;
      else if (diffHours < 24 && diffHours > 0) timeAgo = `${diffHours} giờ trước`;
      else if (diffDays > 0) timeAgo = `${diffDays} ngày trước`;

      for (const item of tx.items) {
        list.push({
          material_id: item.material_id,
          material_name: item.material_name,
          material_code: item.material_code,
          quantity: item.quantity,
          unit: item.unit,
          timeAgo
        });
        if (list.length >= 2) break;
      }
      if (list.length >= 2) break;
    }
    return list;
  }, [transactions]);

  // Recent purchase items (real items in purchase list)
  const recentPurchases = useMemo(() => {
    return purchaseItems.filter(p => !p.is_purchased).slice(0, 2);
  }, [purchaseItems]);

  return (
    <div className="flex-1 px-4 pb-20 pt-1 max-w-md mx-auto w-full space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          {/* Logo Brand House + Wrench */}
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
              <defs>
                <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F3E5C8" />
                  <stop offset="50%" stopColor="#DFBE82" />
                  <stop offset="100%" stopColor="#C5A66A" />
                </linearGradient>
              </defs>
              <path d="M50 14L16 42V82C16 84.2 17.8 86 20 86H80C82.2 86 84 84.2 84 82V42L50 14Z" stroke="url(#logoGold)" strokeWidth="8" strokeLinejoin="round"/>
              <path d="M42 68L56 54C57.5 52.5 59 52 61 52.5L66 49C65.5 45.5 66.8 41.8 69.8 38.8C73.4 35.2 78.5 34.2 82 36L74 44L77 47L85 39C86.8 42.5 85.8 47.6 82.2 51.2C79.2 54.2 75.5 55.5 72 55L68.5 60C69 62 68.5 63.5 67 65L53 79C51.5 80.5 49 80.5 47.5 79L42 73.5C40.5 72 40.5 69.5 42 68Z" fill="url(#logoGold)"/>
            </svg>
          </div>
          <span className="text-lg font-black tracking-wider text-gold-gradient uppercase">
            SỔ TAY HT
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-[#1E2C41]/80 text-[#94A3B8] hover:text-white transition-all active:scale-95"
          title="Cài đặt hệ thống"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Greeting & Realtime Dynamic Date */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Chào anh!
        </h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-[#94A3B8]">
            Chúc công việc luôn thuận lợi!
          </p>
          {/* Dynamic Realtime Date & Clock Badge */}
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#1A2638] border border-[#2E415E]/60 text-xs text-[#CBD5E1] shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#C5A66A]" />
            <span className="font-semibold text-white/90">{dateFormatted}</span>
            <span className="text-[#64748B]">•</span>
            <span className="font-mono text-[#38BDF8] text-[11px] font-bold">{timeFormatted}</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Mã vật tư */}
        <div 
          onClick={() => setActiveTab('materials')}
          className="bg-white rounded-2xl p-3.5 flex items-center space-x-3 shadow-md cursor-pointer active:scale-98 transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] flex items-center justify-center text-[#EA580C]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0F172A] leading-tight">
              {stats.totalCodes}
            </div>
            <div className="text-xs font-semibold text-[#64748B]">
              Mã vật tư
            </div>
          </div>
        </div>

        {/* Card 2: Đang có */}
        <div 
          onClick={() => setActiveTab('materials')}
          className="bg-white rounded-2xl p-3.5 flex items-center space-x-3 shadow-md cursor-pointer active:scale-98 transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0F172A] leading-tight">
              {stats.inStockCount}
            </div>
            <div className="text-xs font-semibold text-[#64748B]">
              Đang có
            </div>
          </div>
        </div>

        {/* Card 3: Cần mua */}
        <div 
          onClick={() => setActiveTab('shopping')}
          className="bg-white rounded-2xl p-3.5 flex items-center space-x-3 shadow-md cursor-pointer active:scale-98 transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FFF1F2] flex items-center justify-center text-[#E11D48]">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0F172A] leading-tight">
              {stats.needPurchaseCount}
            </div>
            <div className="text-xs font-semibold text-[#64748B]">
              Cần mua
            </div>
          </div>
        </div>

        {/* Card 4: Sắp hết */}
        <div 
          onClick={() => setActiveTab('materials')}
          className="bg-white rounded-2xl p-3.5 flex items-center space-x-3 shadow-md cursor-pointer active:scale-98 transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FEF2F2] flex items-center justify-center text-[#DC2626]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#0F172A] leading-tight">
              {stats.lowStockCount}
            </div>
            <div className="text-xs font-semibold text-[#64748B]">
              Sắp hết
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Golden Button: GHI NHANH BẰNG GIỌNG NÓI */}
      <div className="pt-1">
        <button
          onClick={() => setActiveTab('voice')}
          className="w-full bg-gold-gradient text-[#121A29] rounded-2xl py-4 px-6 flex items-center justify-center space-x-3 shadow-gold-button hover:brightness-105 active:scale-98 transition-all group relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-full bg-[#121A29]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mic className="w-6 h-6 text-[#121A29]" />
          </div>
          <span className="text-base font-extrabold tracking-wider uppercase text-[#121A29]">
            GHI NHANH BẰNG GIỌNG NÓI
          </span>
        </button>

        {/* Soundwave graphic underneath */}
        <div className="flex items-center justify-center space-x-1 py-2 opacity-70">
          <div className="w-0.5 h-1.5 bg-[#C5A66A] rounded-full animate-pulse" />
          <div className="w-0.5 h-3 bg-[#DFBE82] rounded-full animate-pulse delay-75" />
          <div className="w-0.5 h-5 bg-[#C5A66A] rounded-full animate-pulse delay-150" />
          <div className="w-0.5 h-2 bg-[#DFBE82] rounded-full animate-pulse delay-100" />
          <div className="w-0.5 h-4 bg-[#C5A66A] rounded-full animate-pulse delay-200" />
          <div className="w-0.5 h-6 bg-[#F3E5C8] rounded-full animate-pulse delay-75" />
          <div className="w-0.5 h-3 bg-[#C5A66A] rounded-full animate-pulse delay-150" />
          <div className="w-0.5 h-1.5 bg-[#DFBE82] rounded-full animate-pulse" />
        </div>
      </div>

      {/* Empty State Banner if no materials in inventory yet */}
      {materials.length === 0 && (
        <div className="bg-[#1A2638] border border-[#C5A66A]/30 rounded-2xl p-4 text-center space-y-2.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#C5A66A]/15 text-[#C5A66A] flex items-center justify-center mx-auto">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Kho chưa có vật tư nào
            </h4>
            <p className="text-xs text-[#8E9EB2] mt-0.5 max-w-[280px] mx-auto">
              Bạn có thể tự tạo danh mục từ đầu hoặc bấm micro để ghi nhận công việc ngay!
            </p>
          </div>
          <button
            onClick={() => setActiveTab('materials')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tạo vật tư đầu tiên</span>
          </button>
        </div>
      )}

      {/* Section: Vừa sử dụng */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-white tracking-wide">
            Vừa sử dụng
          </span>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-[#94A3B8] hover:text-[#C5A66A] flex items-center transition-colors font-medium"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {recentUsedItems.length > 0 ? (
          <div className="space-y-2">
            {recentUsedItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#172235] border border-[#22334A] rounded-2xl p-3 flex items-center justify-between hover:border-[#2E415E] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <ProductThumbnail name={item.material_name} size="sm" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {item.material_name}
                    </h4>
                    <span className="text-xs font-bold text-[#EF4444]">
                      - {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-[#64748B]">
                  {item.timeAgo}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#172235]/60 border border-[#22334A] rounded-2xl p-4 text-center text-xs text-[#64748B]">
            Chưa có vật tư nào được ghi nhận sử dụng.
          </div>
        )}
      </div>

      {/* Section: Cần mua gần đây */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-white tracking-wide">
            Cần mua gần đây
          </span>
          <button
            onClick={() => setActiveTab('shopping')}
            className="text-xs text-[#94A3B8] hover:text-[#C5A66A] flex items-center transition-colors font-medium"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {recentPurchases.length > 0 ? (
          <div className="space-y-2">
            {recentPurchases.map((item) => (
              <div
                key={item.id}
                className="bg-[#172235] border border-[#22334A] rounded-2xl p-3 flex items-center justify-between hover:border-[#2E415E] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <ProductThumbnail name={item.material_name} size="sm" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {item.material_name}
                    </h4>
                    <span className="text-xs font-bold text-[#F59E0B]">
                      Cần mua: {item.planned_quantity} {item.unit}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('shopping')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#22334A] text-[#DFBE82] hover:bg-[#2A3E59] font-medium"
                >
                  Mua ngay
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#172235]/60 border border-[#22334A] rounded-2xl p-4 text-center text-xs text-[#64748B]">
            Danh sách mua hàng đang trống.
          </div>
        )}
      </div>
    </div>
  );
};
