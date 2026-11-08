import React, { useState } from 'react';
import { X, Plus, Trash2, Check, User, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { materials, processTransaction, setActiveTab } = useApp();

  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [entryItems, setEntryItems] = useState<Array<{ material_id: string; quantity: number }>>(() => {
    return materials.length > 0 ? [{ material_id: materials[0].id, quantity: 1 }] : [];
  });

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (materials.length > 0) {
      setEntryItems(prev => [...prev, { material_id: materials[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (idx: number) => {
    setEntryItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 vật tư.');
      return;
    }

    const res = await processTransaction({
      type: 'STOCK_OUT',
      customer_name: customerName.trim(),
      notes: notes.trim(),
      items: entryItems,
      allowNegative: true
    });

    if (res.success) {
      onSuccess();
      onClose();
      setActiveTab('history');
    } else {
      alert(res.message || 'Lưu giao dịch thất bại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#172235] border border-[#2E415E] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#22334A]">
          <h3 className="text-base font-bold text-white">
            Nhập tay nhanh giao dịch
          </h3>
          <button type="button" onClick={onClose} className="text-[#94A3B8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {materials.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#22334A] text-center space-y-3">
            <Package className="w-8 h-8 text-[#64748B] mx-auto opacity-60" />
            <p className="text-xs text-[#8E9EB2]">
              Kho chưa có vật tư nào để xuất. Vui lòng vào tab "Vật tư" để tạo vật tư trước.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveTab('materials');
              }}
              className="px-4 py-2 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs shadow-sm hover:brightness-105 active:scale-95"
            >
              + Đến tạo vật tư ngay
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8E9EB2] font-semibold block mb-1">
                  Tên khách hàng
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E9EB2] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Anh Tuấn, Chú Minh..."
                    className="w-full bg-[#0F172A] border border-[#2E415E] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C5A66A]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E9EB2] font-semibold">Vật tư sử dụng</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] text-[#C5A66A] font-bold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm dòng</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {entryItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-[#0F172A] p-2 rounded-xl border border-[#22334A]">
                      <select
                        value={item.material_id}
                        onChange={(e) => {
                          const id = e.target.value;
                          setEntryItems(prev => {
                            const next = [...prev];
                            next[idx].material_id = id;
                            return next;
                          });
                        }}
                        className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                      >
                        {materials.map(m => (
                          <option key={m.id} value={m.id} className="bg-[#172235]">
                            {m.name} ({m.code})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = Math.max(1, parseInt(e.target.value) || 1);
                          setEntryItems(prev => {
                            const next = [...prev];
                            next[idx].quantity = qty;
                            return next;
                          });
                        }}
                        className="w-14 bg-[#172235] border border-[#C5A66A] rounded-lg px-1.5 py-1 text-xs font-bold text-white text-center focus:outline-none"
                      />

                      {entryItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[#8E9EB2] font-semibold block mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Gắn cho khách anh Tuấn..."
                  className="w-full bg-[#0F172A] border border-[#2E415E] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gold-gradient text-[#121A29] font-bold text-sm shadow-gold-button"
            >
              Lưu giao dịch & Trừ kho
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
