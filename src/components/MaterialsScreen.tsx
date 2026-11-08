import React, { useState, useMemo, useRef } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Mic, 
  Sparkles,
  Edit2,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductThumbnail } from './ProductThumbnail';
import { Material } from '../types';

export const MaterialsScreen: React.FC = () => {
  const { 
    materials, 
    addSimpleMaterial, 
    updateMaterial, 
    deleteMaterial, 
    setActiveTab,
    stats 
  } = useApp();

  // Simple Add State: Only Name and Quantity!
  const [itemName, setItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick Inline Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleAddMaterial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!itemName.trim()) {
      alert('Vui lòng nhập tên hàng hóa!');
      nameInputRef.current?.focus();
      return;
    }

    const qty = Math.max(1, quantity || 1);
    const added = await addSimpleMaterial(itemName.trim(), qty);

    // Show success notification
    setSuccessToast(`Đã thêm "${added.name}" (${qty}) & tự động đưa vào Cần mua!`);
    setTimeout(() => setSuccessToast(null), 3500);

    // Reset form
    setItemName('');
    setQuantity(1);
    nameInputRef.current?.focus();
  };

  const handleStockChange = (mat: Material, delta: number) => {
    const newStock = Math.max(0, mat.current_stock + delta);
    updateMaterial(mat.id, { current_stock: newStock });
  };

  const handleSaveEdit = (matId: string) => {
    if (editingName.trim()) {
      updateMaterial(matId, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  // Filter materials by search query
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  return (
    <div className="flex-1 flex flex-col px-4 pb-24 pt-2 max-w-md mx-auto w-full space-y-4">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-emerald-950/90 border border-emerald-600/80 text-emerald-200 text-xs px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button 
            onClick={() => setActiveTab('shopping')}
            className="text-[11px] font-bold text-[#C5A66A] underline shrink-0 ml-2"
          >
            Xem Cần mua
          </button>
        </div>
      )}

      {/* QUICK ADD CARD: Chỉ cần Tên hàng hóa và Số lượng */}
      <div className="bg-gradient-to-b from-[#1E293B] to-[#172235] border border-[#2E415E] rounded-3xl p-4 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between pb-1 border-b border-[#22334A]/80">
          <span className="text-xs font-bold text-white flex items-center space-x-1.5 uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5 text-[#C5A66A]" />
            <span>Thêm vật tư mới</span>
          </span>
          <span className="text-[10px] text-[#C5A66A] bg-[#101726] px-2 py-0.5 rounded-full border border-[#C5A66A]/30">
            Tự động đồng bộ Cần mua
          </span>
        </div>

        <form onSubmit={handleAddMaterial} className="space-y-3">
          {/* Field 1: Tên hàng hóa */}
          <div>
            <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
              Tên hàng hóa:
            </label>
            <div className="relative">
              <input
                ref={nameInputRef}
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="VD: Bóng đèn H4, Dây CORO A123..."
                className="w-full bg-[#0F172A] border border-[#2E415E] rounded-2xl pl-3.5 pr-10 py-3 text-sm text-white placeholder-[#475569] font-medium focus:outline-none focus:border-[#C5A66A] transition-colors shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  nameInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#94A3B8] hover:text-[#C5A66A] hover:bg-[#1E293B] transition-colors"
                title="Bấm micro trên bàn phím để nói"
              >
                <Mic className="w-4 h-4 text-[#C5A66A]" />
              </button>
            </div>
          </div>

          {/* Field 2: Số lượng */}
          <div>
            <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
              Số lượng:
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-2xl bg-[#0F172A] border border-[#2E415E] flex items-center justify-center text-white active:scale-95 text-lg font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-11 bg-[#0F172A] border border-[#2E415E] rounded-2xl text-center text-base font-extrabold text-[#C5A66A] focus:outline-none focus:border-[#C5A66A]"
              />

              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-11 h-11 rounded-2xl bg-[#0F172A] border border-[#2E415E] flex items-center justify-center text-white active:scale-95 text-lg font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gold-gradient text-[#121A29] rounded-2xl py-3 px-4 font-bold text-sm tracking-wide shadow-gold-button hover:brightness-105 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm vật tư & Tự động vào Cần mua</span>
          </button>
        </form>
      </div>

      {/* Search Input */}
      {materials.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên vật tư..."
            className="w-full bg-[#172235] border border-[#22334A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#C5A66A]"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Materials List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Danh mục hàng hóa ({materials.length})
          </span>
          {stats.needPurchaseCount > 0 && (
            <button
              onClick={() => setActiveTab('shopping')}
              className="text-xs font-semibold text-[#DFBE82] flex items-center space-x-1 hover:underline"
            >
              <span>{stats.needPurchaseCount} món cần mua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filteredMaterials.length > 0 ? (
          <div className="space-y-2.5">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-[#172235] border border-[#22334A] rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-[#2E415E] transition-all"
              >
                {/* Left: Thumbnail & Name */}
                <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                  <ProductThumbnail name={mat.name} size="md" />
                  <div className="flex-1 min-w-0">
                    {editingId === mat.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(mat.id)}
                          autoFocus
                          className="w-full bg-[#0F172A] border border-[#C5A66A] rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(mat.id)}
                          className="px-2 py-0.5 rounded bg-[#C5A66A] text-[#121A29] text-xs font-bold"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-1.5">
                          <h4 
                            onClick={() => {
                              setEditingId(mat.id);
                              setEditingName(mat.name);
                            }}
                            className="text-sm font-bold text-white truncate leading-tight cursor-pointer hover:text-[#C5A66A]"
                            title="Bấm để sửa tên"
                          >
                            {mat.name}
                          </h4>
                          <button
                            onClick={() => {
                              setEditingId(mat.id);
                              setEditingName(mat.name);
                            }}
                            className="text-[#64748B] hover:text-[#C5A66A] p-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-[#94A3B8]">Số lượng tồn:</span>
                          <span className="text-sm font-extrabold text-[#C5A66A]">
                            {mat.current_stock}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Quick + / - Stock Counter & Delete */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleStockChange(mat, -1)}
                    className="w-8 h-8 rounded-xl bg-[#1A2638] border border-[#2E415E] flex items-center justify-center text-white active:scale-95"
                    title="Bớt 1"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleStockChange(mat, 1)}
                    className="w-8 h-8 rounded-xl bg-[#1A2638] border border-[#2E415E] flex items-center justify-center text-white active:scale-95"
                    title="Thêm 1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa vật tư "${mat.name}"?`)) {
                        deleteMaterial(mat.id);
                      }
                    }}
                    className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center active:scale-95 ml-1"
                    title="Xóa vật tư"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#172235]/60 border border-[#22334A] rounded-3xl p-8 text-center space-y-3 shadow-inner">
            <Package className="w-12 h-12 text-[#64748B] mx-auto opacity-50" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {searchQuery ? 'Không tìm thấy kết quả' : 'Danh mục vật tư đang trống'}
              </h3>
              <p className="text-xs text-[#8E9EB2] mt-1 max-w-xs mx-auto leading-relaxed">
                {searchQuery 
                  ? 'Hãy thử tìm kiếm với từ khóa khác.' 
                  : 'Chỉ cần nhập Tên hàng hóa và Số lượng ở trên, hệ thống sẽ tự động lưu và đưa sang tab Cần mua!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
