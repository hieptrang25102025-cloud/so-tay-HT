import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Trash2, 
  Calendar,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductThumbnail } from './ProductThumbnail';
import { Transaction } from '../types';

export const HistoryScreen: React.FC = () => {
  const { transactions, clearTransactions, deleteTransaction } = useApp();

  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Format date and time in Vietnamese: Ngày DD/MM/YYYY lúc HH:mm
  const formatDateTimeVN = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');

      return `Ngày ${day}/${month}/${year} lúc ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  const handleClearAllHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử nhập xuất này không? (Dùng để dọn dẹp sau khi test)')) {
      clearTransactions();
      showToast('Đã xóa sạch toàn bộ lịch sử!');
    }
  };

  const handleDeleteSingle = (id: string) => {
    if (confirm('Xóa bản ghi này khỏi lịch sử?')) {
      deleteTransaction(id);
      showToast('Đã xóa 1 bản ghi khỏi lịch sử!');
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter by type
      if (filterType === 'IN' && t.type !== 'STOCK_IN') return false;
      if (filterType === 'OUT' && t.type !== 'STOCK_OUT') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const hasMatch = t.items.some(i => i.material_name.toLowerCase().includes(query));
        return hasMatch;
      }

      return true;
    });
  }, [transactions, filterType, searchQuery]);

  return (
    <div className="flex-1 flex flex-col px-4 pb-24 pt-2 max-w-md mx-auto w-full space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Info & Nút Xóa Toàn Bộ Lịch Sử */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#C5A66A]" />
            <span>Lịch sử ({transactions.length})</span>
          </h2>
          <span className="text-[11px] text-[#8E9EB2]">
            Theo dõi chi tiết ngày tháng & số lượng
          </span>
        </div>

        {/* NÚT XÓA TOÀN BỘ LỊCH SỬ TEST */}
        {transactions.length > 0 && (
          <button
            onClick={handleClearAllHistory}
            className="px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center space-x-1 active:scale-95 transition-all shadow-sm"
            title="Dọn dẹp xóa sạch toàn bộ lịch sử test"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Xóa sạch lịch sử</span>
          </button>
        )}
      </div>

      {/* Filter Tabs: Tất cả | Hàng đã nhập | Hàng đã xuất */}
      <div className="bg-[#172235] p-1 rounded-2xl border border-[#22334A] flex items-center shadow-md">
        <button
          onClick={() => setFilterType('ALL')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
            filterType === 'ALL'
              ? 'bg-gold-gradient text-[#121A29] shadow-md'
              : 'text-[#8E9EB2] hover:text-white'
          }`}
        >
          Tất cả ({transactions.length})
        </button>

        <button
          onClick={() => setFilterType('IN')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
            filterType === 'IN'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-[#8E9EB2] hover:text-white'
          }`}
        >
          Hàng đã nhập
        </button>

        <button
          onClick={() => setFilterType('OUT')}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
            filterType === 'OUT'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-[#8E9EB2] hover:text-white'
          }`}
        >
          Hàng đã xuất
        </button>
      </div>

      {/* Search Input */}
      {transactions.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hàng hóa đã nhập/xuất..."
            className="w-full bg-[#172235] border border-[#22334A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#C5A66A]"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const isImport = tx.type === 'STOCK_IN';

            return (
              <div
                key={tx.id}
                className="bg-[#172235] border border-[#22334A] rounded-2xl p-3.5 space-y-2.5 shadow-sm hover:border-[#2E415E] transition-all"
              >
                {/* Header: Badge, Timestamp & Delete Single Button */}
                <div className="flex items-center justify-between pb-2 border-b border-[#22334A]/60">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    isImport 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {isImport ? (
                      <>
                        <ArrowDownLeft className="w-3 h-3 stroke-[3]" />
                        <span>HÀNG ĐÃ NHẬP</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                        <span>HÀNG ĐÃ XUẤT</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-medium text-[#8E9EB2] flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-[#C5A66A]" />
                      <span>{formatDateTimeVN(tx.created_at)}</span>
                    </span>

                    {/* Nút xóa bản ghi đơn lẻ */}
                    <button
                      onClick={() => handleDeleteSingle(tx.id)}
                      className="p-1 rounded-lg text-[#64748B] hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-colors"
                      title="Xóa bản ghi này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Items Detail */}
                <div className="space-y-1.5">
                  {tx.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                        <ProductThumbnail name={it.material_name} size="sm" />
                        <span className="text-sm font-bold text-white truncate">
                          {it.material_name}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-base font-extrabold ${
                          isImport ? 'text-emerald-400' : 'text-[#C5A66A]'
                        }`}>
                          {isImport ? `+${it.quantity}` : `-${it.quantity}`}
                        </span>
                        <span className="text-xs text-white/80 ml-1">
                          {it.unit || 'cái'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Notes */}
                {tx.notes && (
                  <div className="text-[11px] text-[#8E9EB2] pt-1 border-t border-[#22334A]/40">
                    <span>Ghi chú: {tx.notes}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-[#172235]/60 border border-[#22334A] rounded-3xl p-8 text-center space-y-3 shadow-inner">
            <Clock className="w-12 h-12 text-[#64748B] mx-auto opacity-50" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử nhập xuất nào'}
              </h3>
              <p className="text-xs text-[#8E9EB2] mt-1 max-w-xs mx-auto leading-relaxed">
                Khi bạn nhập hàng ở tab <strong className="text-white">Vật tư</strong> (Hàng đã xuất) hoặc mua hàng ở tab <strong className="text-white">Cần mua</strong> (Hàng đã nhập), toàn bộ lịch sử sẽ tự động hiển thị tại đây!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
