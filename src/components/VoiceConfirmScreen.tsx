import React, { useState } from 'react';
import { 
  ChevronLeft, 
  User, 
  Edit2, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  RotateCcw,
  AlertCircle,
  Package,
  Sparkles,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductThumbnail } from './ProductThumbnail';
import { ParsedVoiceItem, Material } from '../types';

interface VoiceConfirmScreenProps {
  onBack: () => void;
  onSaved: () => void;
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('coro')) return 'Dây CORO';
  if (lower.includes('cogo')) return 'Dây COGO';
  if (lower.includes('dây')) return 'Dây điện';
  if (lower.includes('đèn') || lower.includes('bóng') || lower.includes('led')) return 'Bóng đèn';
  if (lower.includes('keo') || lower.includes('băng') || lower.includes('vít') || lower.includes('ốc') || lower.includes('ắc quy')) return 'Phụ kiện';
  return 'Linh kiện';
}

function guessImageType(name: string): 'wire' | 'lightbulb' | 'box' | 'tool' | 'custom' {
  const lower = name.toLowerCase();
  if (lower.includes('dây') || lower.includes('coro') || lower.includes('cogo')) return 'wire';
  if (lower.includes('đèn') || lower.includes('bóng') || lower.includes('led')) return 'lightbulb';
  if (lower.includes('kìm') || lower.includes('búa') || lower.includes('tuốc')) return 'tool';
  return 'box';
}

function generateCode(name: string): string {
  const words = name.trim().split(/\s+/);
  const prefix = words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return (prefix.length >= 2 ? prefix : 'VT') + '-' + rand;
}

export const VoiceConfirmScreen: React.FC<VoiceConfirmScreenProps> = ({
  onBack,
  onSaved
}) => {
  const { voiceDraft, materials, addMaterial, processTransaction, setActiveTab } = useApp();

  // Dynamic customer name from voice parsing or empty
  const [customerName, setCustomerName] = useState<string>(
    voiceDraft?.customer_name || ''
  );
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(
    voiceDraft?.notes || ''
  );

  const [items, setItems] = useState<ParsedVoiceItem[]>(() => {
    if (voiceDraft?.items && voiceDraft.items.length > 0) {
      return voiceDraft.items.map(item => {
        // Match with materials if not matched
        if (!item.matched_material_id) {
          const match = materials.find(m => 
            m.name.toLowerCase() === item.material_name.toLowerCase() ||
            m.name.toLowerCase().includes(item.material_name.toLowerCase()) ||
            item.material_name.toLowerCase().includes(m.name.toLowerCase()) ||
            (m.code && item.material_name.toLowerCase().includes(m.code.toLowerCase()))
          );
          if (match) {
            return {
              ...item,
              material_name: match.name,
              material_code: match.code,
              unit: match.unit || item.unit,
              matched_material_id: match.id,
              matched_material: match
            };
          }
        }
        return item;
      });
    }

    return [];
  });

  // State for editing a specific item name
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemName, setEditingItemName] = useState<string>('');
  const [editingItemUnit, setEditingItemUnit] = useState<string>('');

  // State for adding item modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<string>('Cái');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuantityChange = (index: number, delta: number) => {
    setItems(prev => {
      const next = [...prev];
      const newQty = Math.max(1, next[index].quantity + delta);
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const startEditItem = (index: number) => {
    setEditingItemIndex(index);
    setEditingItemName(items[index].material_name);
    setEditingItemUnit(items[index].unit);
  };

  const saveEditItem = () => {
    if (editingItemIndex !== null && editingItemName.trim()) {
      setItems(prev => {
        const next = [...prev];
        const match = materials.find(m => 
          m.name.toLowerCase() === editingItemName.trim().toLowerCase()
        );
        next[editingItemIndex] = {
          ...next[editingItemIndex],
          material_name: editingItemName.trim(),
          unit: editingItemUnit.trim() || next[editingItemIndex].unit,
          matched_material_id: match?.id,
          matched_material: match
        };
        return next;
      });
    }
    setEditingItemIndex(null);
  };

  const handleAddNewItemSubmit = () => {
    if (!newItemName.trim()) return;

    const match = materials.find(m => 
      m.name.toLowerCase() === newItemName.trim().toLowerCase()
    );

    setItems(prev => [
      ...prev,
      {
        material_name: newItemName.trim(),
        quantity: Math.max(1, newItemQty),
        unit: newItemUnit.trim() || 'Cái',
        matched_material_id: match?.id,
        matched_material: match
      }
    ]);

    setNewItemName('');
    setNewItemQty(1);
    setNewItemUnit('Cái');
    setIsAddItemModalOpen(false);
  };

  const handleSaveTransaction = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Danh sách vật tư đang trống. Vui lòng thêm ít nhất 1 vật tư!');
      setIsSubmitting(false);
      return;
    }

    try {
      const txItems: Array<{ material_id: string; quantity: number; unit?: string }> = [];

      // Loop through all items: if material doesn't exist, AUTO-CREATE IT!
      for (const item of items) {
        let matId = item.matched_material_id;

        if (!matId) {
          // Check if already in materials
          const found = materials.find(m => 
            m.name.toLowerCase() === item.material_name.toLowerCase() ||
            m.name.toLowerCase().includes(item.material_name.toLowerCase()) ||
            item.material_name.toLowerCase().includes(m.name.toLowerCase())
          );

          if (found) {
            matId = found.id;
          } else {
            // Auto create new material in catalog with 0 stock!
            const cleanName = item.material_name.trim();
            const newMat = await addMaterial({
              name: cleanName,
              code: item.material_code || generateCode(cleanName),
              category: guessCategory(cleanName),
              unit: item.unit || 'Cái',
              current_stock: 0,
              initial_stock: 0,
              min_stock: 2,
              is_inventoried: true,
              image_type: guessImageType(cleanName),
              notes: 'Tự động tạo từ giao dịch gắn cho khách ' + (customerName || 'vãng lai')
            });
            matId = newMat.id;
          }
        }

        if (matId) {
          txItems.push({
            material_id: matId,
            quantity: item.quantity,
            unit: item.unit
          });
        }
      }

      const res = await processTransaction({
        type: 'STOCK_OUT',
        customer_name: customerName.trim(),
        notes: notes.trim(),
        items: txItems,
        allowNegative: true
      });

      setIsSubmitting(false);

      if (res.success) {
        onSaved();
        setActiveTab('history');
      } else {
        setErrorMessage(res.message || 'Lưu giao dịch thất bại.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage('Lỗi xử lý giao dịch: ' + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-4 pb-20 pt-1 max-w-md mx-auto w-full min-h-[92vh]">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-2 border-b border-[#22334A]/50">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-white hover:text-[#C5A66A] transition-colors flex items-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-base font-bold text-white tracking-wide">
            Xác nhận thông tin
          </h2>
          <div className="w-6" />
        </div>

        {/* Customer Card */}
        <div className="bg-[#172235] border border-[#22334A] rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3.5 flex-1 mr-2">
            <div className="w-11 h-11 rounded-full bg-[#1A2638] border border-[#2E415E] flex items-center justify-center text-[#94A3B8] shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-[#8E9EB2] font-medium block">
                Khách hàng
              </span>
              {isEditingCustomer ? (
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onBlur={() => setIsEditingCustomer(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingCustomer(false)}
                  placeholder="Nhập tên khách hàng..."
                  autoFocus
                  className="w-full bg-[#0F172A] border border-[#C5A66A] rounded px-2 py-0.5 text-sm font-bold text-white focus:outline-none"
                />
              ) : (
                <h3 
                  onClick={() => setIsEditingCustomer(true)}
                  className={`text-base font-bold cursor-pointer ${
                    customerName ? 'text-white' : 'text-[#64748B] italic text-sm'
                  }`}
                >
                  {customerName || 'Chưa nhập tên khách (chạm để nhập)'}
                </h3>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditingCustomer(!isEditingCustomer)}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#C5A66A] hover:bg-[#1E2C41] transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Material List Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-white tracking-wide">
              Danh sách vật tư
            </span>
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="text-xs text-[#C5A66A] hover:underline font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm món</span>
            </button>
          </div>

          {items.length > 0 ? (
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const existingMat = materials.find(m => 
                  m.id === item.matched_material_id || 
                  m.name.toLowerCase() === item.material_name.toLowerCase()
                );

                return (
                  <div
                    key={idx}
                    className="bg-[#172235] border border-[#22334A] rounded-2xl p-3.5 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                      <ProductThumbnail name={item.material_name} size="md" />
                      <div className="flex-1 min-w-0">
                        {editingItemIndex === idx ? (
                          <div className="flex items-center space-x-1.5 py-0.5">
                            <input
                              type="text"
                              value={editingItemName}
                              onChange={(e) => setEditingItemName(e.target.value)}
                              placeholder="Tên vật tư..."
                              autoFocus
                              className="w-full bg-[#0F172A] border border-[#C5A66A] rounded px-2 py-0.5 text-xs text-white font-bold"
                            />
                            <input
                              type="text"
                              value={editingItemUnit}
                              onChange={(e) => setEditingItemUnit(e.target.value)}
                              placeholder="ĐVT"
                              className="w-16 bg-[#0F172A] border border-[#2E415E] rounded px-1.5 py-0.5 text-xs text-white"
                            />
                            <button
                              onClick={saveEditItem}
                              className="p-1 rounded bg-[#C5A66A] text-[#121A29]"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-1.5">
                              <h4 
                                onClick={() => startEditItem(idx)}
                                className="text-sm font-bold text-white leading-tight truncate cursor-pointer hover:text-[#C5A66A]"
                              >
                                {item.material_name}
                              </h4>
                              <button
                                onClick={() => startEditItem(idx)}
                                className="text-[#64748B] hover:text-[#C5A66A]"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-baseline space-x-1">
                                <span className="text-base font-extrabold text-[#C5A66A]">
                                  {item.quantity}
                                </span>
                                <span className="text-xs font-semibold text-white/90">
                                  {item.unit}
                                </span>
                              </div>

                              {existingMat ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A2638] text-[#94A3B8] border border-[#2E415E]">
                                  Kho: {existingMat.current_stock} {existingMat.unit}
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center space-x-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Tự động tạo mới vào kho</span>
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Counter controls */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleQuantityChange(idx, -1)}
                        className="w-8 h-8 rounded-xl bg-[#1A2638] border border-[#2E415E] flex items-center justify-center text-white active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleQuantityChange(idx, 1)}
                        className="w-8 h-8 rounded-xl bg-[#1A2638] border border-[#2E415E] flex items-center justify-center text-white active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center active:scale-95 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#172235]/60 border border-[#22334A] rounded-2xl p-6 text-center space-y-2">
              <Package className="w-8 h-8 text-[#64748B] mx-auto opacity-60" />
              <p className="text-xs text-[#8E9EB2]">
                Chưa có vật tư nào được chọn.
              </p>
              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#22334A] text-[#DFBE82] text-xs font-semibold hover:bg-[#2A3E59]"
              >
                + Thêm vật tư mới
              </button>
            </div>
          )}
        </div>

        {/* Notes Card */}
        <div className="bg-[#172235] border border-[#22334A] rounded-2xl p-3.5 space-y-1 shadow-sm">
          <span className="text-xs text-[#8E9EB2] font-medium block">
            Ghi chú giao dịch
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Gắn cho khách MTX, mang thêm dụng cụ..."
            className="w-full bg-transparent text-xs text-[#38BDF8] focus:outline-none"
          />
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="bg-red-950/70 border border-red-800 rounded-2xl p-3 flex items-start space-x-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="flex-1 leading-relaxed">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="space-y-2.5 pt-4">
        <button
          onClick={handleSaveTransaction}
          disabled={isSubmitting || items.length === 0}
          className="w-full bg-gold-gradient text-[#121A29] rounded-2xl py-3.5 px-6 flex items-center justify-center space-x-2 font-bold tracking-wide shadow-gold-button hover:brightness-105 active:scale-98 transition-all disabled:opacity-40"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>{isSubmitting ? 'Đang lưu giao dịch...' : 'Lưu giao dịch'}</span>
        </button>

        <button
          onClick={onBack}
          className="w-full bg-[#1A2638] border border-[#2E415E] text-white rounded-2xl py-3 px-6 flex items-center justify-center space-x-2 font-semibold text-sm hover:border-[#C5A66A] active:scale-98 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-[#94A3B8]" />
          <span>Sửa lại câu nói / nhập lại</span>
        </button>
      </div>

      {/* Modal: Thêm món vật tư thủ công */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#172235] border border-[#2E415E] rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#22334A]">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-[#C5A66A]" />
                <span>Thêm vật tư vào giao dịch</span>
              </h3>
              <button 
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {materials.length > 0 && (
                <div>
                  <label className="text-[#8E9EB2] block mb-1">Chọn từ danh mục có sẵn</label>
                  <select
                    onChange={(e) => {
                      const sel = materials.find(m => m.id === e.target.value);
                      if (sel) {
                        setNewItemName(sel.name);
                        setNewItemUnit(sel.unit);
                      }
                    }}
                    className="w-full bg-[#0F172A] border border-[#2E415E] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
                  >
                    <option value="">-- Hoặc tự gõ tên mới bên dưới --</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[#8E9EB2] block mb-1">Tên vật tư</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bóng đèn H4, Dây CORO A123..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#2E415E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#8E9EB2] block mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#0F172A] border border-[#2E415E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
                  />
                </div>
                <div>
                  <label className="text-[#8E9EB2] block mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    placeholder="Bóng, Cái, Sợi..."
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#2E415E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#1A2638] text-[#94A3B8] font-bold text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleAddNewItemSubmit}
                disabled={!newItemName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs disabled:opacity-40"
              >
                Thêm món
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
