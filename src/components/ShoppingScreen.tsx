import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  CheckCircle2, 
  Trash2, 
  Check, 
  Plus, 
  Minus,
  Sparkles,
  Package,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductThumbnail } from './ProductThumbnail';
import { PurchaseItem } from '../types';

export const ShoppingScreen: React.FC = () => {
  const { 
    purchaseItems, 
    confirmPurchaseAndAddToHistory,
    deletePurchaseItem,
    updatePurchaseItem,
    setActiveTab 
  } = useApp();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for purchase quantity confirmation
  const [confirmModalItem, setConfirmModalItem] = useState<PurchaseItem | null>(null);
  const [actualBuyQty, setActualBuyQty] = useState<number>(1);

  const pendingItems = useMemo(() => {
    return purchaseItems.filter(p => !p.is_purchased);
  }, [purchaseItems]);

  const handleOpenPurchaseModal = (item: PurchaseItem) => {
    setConfirmModalItem(item);
    setActualBuyQty(item.planned_quantity || 1);
  };

  const handleConfirmPurchase = async () => {
    if (!confirmModalItem) return;

    const qty = Math.max(1, actualBuyQty || 1);
    await confirmPurchaseAndAddToHistory(confirmModalItem.id, qty);

    showToast(`Đã lưu vào Lịch sử: Nhập "${confirmModalItem.material_name}" (+${qty})!`);
    setConfirmModalItem(null);
  };

  const handleQuantityDelta = (item: PurchaseItem, delta: number) => {
    const newQty = Math.max(1, item.planned_quantity + delta);
    updatePurchaseItem(item.id, { planned_quantity: newQty });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pb-24 pt-2 max-w-md mx-auto w-full space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button 
            onClick={() => setActiveTab('history')}
            className="text-[11px] font-bold text-[#C5A66A] underline shrink-0 ml-2"
          >
            Xem Lịch sử
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-[#C5A66A]" />
            <span>Hàng cần mua đi chợ ({pendingItems.length})</span>
          </h2>
          <span className="text-[11px] text-[#8E9EB2]">
            Tự động lấy từ danh sách hàng bạn vừa nhập
          </span>
        </div>

        <button
          onClick={() => setActiveTab('history')}
          className="text-xs font-semibold text-[#DFBE82] flex items-center space-x-1 hover:underline"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Xem Lịch sử</span>
        </button>
      </div>

      {/* DANH SÁCH HÀNG CẦN MUA */}
      <div className="space-y-2.5">
        {pendingItems.length > 0 ? (
          pendingItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#172235] border border-[#22334A] rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-[#2E415E] transition-all"
            >
              {/* Product Thumbnail & Name */}
              <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                <ProductThumbnail name={item.material_name} size="md" />

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate leading-tight">
                    {item.material_name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-[#94A3B8]">Cần mua:</span>
                    <span className="text-base font-extrabold text-[#C5A66A]">
                      {item.planned_quantity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Counter & Action Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => handleQuantityDelta(item, -1)}
                  className="w-7 h-7 rounded-lg bg-[#0F172A] border border-[#2E415E] flex items-center justify-center text-white active:scale-95 text-xs font-bold"
                  title="Bớt số lượng"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleQuantityDelta(item, 1)}
                  className="w-7 h-7 rounded-lg bg-[#0F172A] border border-[#2E415E] flex items-center justify-center text-white active:scale-95 text-xs font-bold"
                  title="Tăng số lượng"
                >
                  <Plus className="w-3 h-3" />
                </button>

                {/* NÚT ĐÃ MUA: MỞ HỘP THOẠI XÁC NHẬN SỐ LƯỢNG */}
                <button
                  onClick={() => handleOpenPurchaseModal(item)}
                  className="px-3 py-1.5 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs flex items-center space-x-1 shadow-gold-button active:scale-95 ml-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Đã mua</span>
                </button>

                <button
                  onClick={() => deletePurchaseItem(item.id)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-red-400 hover:bg-red-500/10 active:scale-95"
                  title="Xóa món"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#172235]/60 border border-[#22334A] rounded-3xl p-8 text-center space-y-3 shadow-inner">
            <ShoppingCart className="w-12 h-12 text-[#64748B] mx-auto opacity-50" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Không có món nào cần mua!
              </h3>
              <p className="text-xs text-[#8E9EB2] mt-1 max-w-xs mx-auto leading-relaxed">
                Mỗi khi bạn nhập hàng ở tab <strong className="text-white">Vật tư</strong>, các món sẽ tự động nhảy qua đây để bạn đi chợ.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('materials')}
              className="px-4 py-2 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs shadow-md"
            >
              + Nhập vật tư mới ngay
            </button>
          </div>
        )}
      </div>

      {/* HỘP THOẠI XÁC NHẬN SỐ LƯỢNG ĐÃ MUA THỰC TẾ */}
      {confirmModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#172235] border border-[#2E415E] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#22334A]">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#C5A66A]" />
                <span>Xác nhận đã mua hàng</span>
              </h3>
              <button 
                onClick={() => setConfirmModalItem(null)}
                className="text-[#94A3B8] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Info */}
            <div className="bg-[#0F172A] p-3 rounded-2xl border border-[#22334A] flex items-center space-x-3">
              <ProductThumbnail name={confirmModalItem.material_name} size="md" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-[#8E9EB2] block">Tên hàng hóa:</span>
                <h4 className="text-sm font-bold text-white truncate">
                  {confirmModalItem.material_name}
                </h4>
              </div>
            </div>

            {/* Input actual buy quantity */}
            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">
                Lần này bạn đã mua thực tế bao nhiêu cái?
              </label>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActualBuyQty(q => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-2xl bg-[#0F172A] border border-[#2E415E] flex items-center justify-center text-white active:scale-95 text-lg font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="1"
                  value={actualBuyQty}
                  onChange={(e) => setActualBuyQty(Math.max(1, parseInt(e.target.value) || 1))}
                  autoFocus
                  className="flex-1 h-12 bg-[#0F172A] border border-[#2E415E] rounded-2xl text-center text-lg font-extrabold text-[#C5A66A] focus:outline-none focus:border-[#C5A66A]"
                />

                <button
                  type="button"
                  onClick={() => setActualBuyQty(q => q + 1)}
                  className="w-12 h-12 rounded-2xl bg-[#0F172A] border border-[#2E415E] flex items-center justify-center text-white active:scale-95 text-lg font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#8E9EB2] italic">
              Khi bấm Lưu: Món này sẽ được chuyển sang tab Lịch sử (Hàng đã nhập) và xóa khỏi tab Cần mua.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setConfirmModalItem(null)}
                className="flex-1 py-3 rounded-2xl bg-[#1A2638] text-[#94A3B8] font-bold text-xs hover:text-white border border-[#2E415E]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="flex-1 py-3 rounded-2xl bg-gold-gradient text-[#121A29] font-bold text-xs shadow-gold-button hover:brightness-105 active:scale-95 flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Lưu & Chuyển Lịch sử</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
