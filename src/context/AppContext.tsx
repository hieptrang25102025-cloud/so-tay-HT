import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Material, 
  Transaction, 
  PurchaseItem, 
  ParsedVoiceResult, 
  AppTab, 
  TransactionType 
} from '../types';
import * as XLSX from 'xlsx';
import { supabaseService } from '../services/supabaseClient';

const STORAGE_KEYS = {
  MATERIALS: 'so_tay_ht_materials_clean_v2',
  TRANSACTIONS: 'so_tay_ht_transactions_clean_v2',
  PURCHASES: 'so_tay_ht_purchases_clean_v2',
  INITIALIZED_FLAG: 'so_tay_ht_clean_v2_ready'
};

interface AppContextType {
  materials: Material[];
  transactions: Transaction[];
  purchaseItems: PurchaseItem[];
  categories: string[];
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  voiceDraft: ParsedVoiceResult | null;
  setVoiceDraft: (draft: ParsedVoiceResult | null) => void;
  selectedMaterialForDetail: Material | null;
  setSelectedMaterialForDetail: (mat: Material | null) => void;
  
  // Actions
  addMaterial: (data: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => Promise<Material>;
  addSimpleMaterial: (name: string, quantity: number) => Promise<Material>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  processTransaction: (params: {
    type: TransactionType;
    customer_name?: string;
    notes?: string;
    items: Array<{ material_id: string; quantity: number; unit?: string }>;
    allowNegative?: boolean;
  }) => Promise<{ success: boolean; message?: string }>;
  cancelTransaction: (transactionId: string) => Promise<{ success: boolean; message: string }>;
  clearTransactions: () => void;
  deleteTransaction: (id: string) => void;
  
  // Shopping list actions
  addToPurchaseList: (materialId: string, plannedQty: number, reason?: 'LOW_STOCK' | 'MANUAL') => void;
  updatePurchaseItem: (id: string, updates: Partial<PurchaseItem>) => void;
  deletePurchaseItem: (id: string) => void;
  confirmPurchaseBatch: (purchases: Array<{ id: string; material_id: string; actual_quantity: number }>) => Promise<void>;
  confirmPurchaseAndAddToHistory: (purchaseId: string, actualQuantity: number) => Promise<void>;
  markItemAsPurchased: (id: string, actualQty?: number) => void;
  markMultiplePurchased: (ids: string[]) => void;
  unmarkPurchased: (id: string) => void;
  clearPurchasedHistory: () => void;
  
  // Data management
  exportToExcel: () => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonString: string) => boolean;
  clearAllData: () => void;
  
  // Stats
  stats: {
    totalCodes: number;
    inStockCount: number;
    needPurchaseCount: number;
    lowStockCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Purge any legacy sample data from old keys once
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED_FLAG)) {
        localStorage.removeItem('so_tay_ht_materials_v1');
        localStorage.removeItem('so_tay_ht_transactions_v1');
        localStorage.removeItem('so_tay_ht_purchases_v1');
        localStorage.removeItem('so_tay_ht_initialized_v1');
        localStorage.setItem(STORAGE_KEYS.INITIALIZED_FLAG, 'true');
      }
    } catch {}
  }, []);

  // Initialize with strictly EMPTY arrays: No mock data, no demo data
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<AppTab>('materials');
  const [voiceDraft, setVoiceDraft] = useState<ParsedVoiceResult | null>(null);
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] = useState<Material | null>(null);

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchaseItems));
  }, [purchaseItems]);

  // Tự động kéo dữ liệu mới nhất từ Supabase Cloud khi mở app trên thiết bị
  useEffect(() => {
    let isMounted = true;
    const loadCloudData = async () => {
      const config = supabaseService.getConfig();
      if (config.isConnected && config.url && config.anonKey) {
        const res = await supabaseService.fetchAllFromCloud();
        if (isMounted && res.success) {
          if (res.materials && res.materials.length > 0) {
            setMaterials(res.materials);
          }
          if (res.transactions && res.transactions.length > 0) {
            setTransactions(res.transactions);
          }
          if (res.purchaseItems && res.purchaseItems.length > 0) {
            setPurchaseItems(res.purchaseItems);
          }
        }
      }
    };
    loadCloudData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tự động đồng bộ lên Supabase Cloud khi có cập nhật dữ liệu
  useEffect(() => {
    const config = supabaseService.getConfig();
    if (config.isConnected && config.url && config.anonKey) {
      const timer = setTimeout(() => {
        supabaseService.syncAllToCloud({ materials, transactions, purchaseItems });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [materials, transactions, purchaseItems]);

  // Derived categories from user-created materials
  const categories = useMemo(() => {
    const set = new Set<string>();
    materials.forEach(m => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [materials]);

  // Derived dynamic stats
  const stats = useMemo(() => {
    const totalCodes = materials.length;
    let inStockCount = 0;
    let lowStockCount = 0;

    materials.forEach(m => {
      if (m.current_stock > 0) {
        inStockCount += 1;
      }
      if (m.is_inventoried && m.current_stock <= m.min_stock) {
        lowStockCount += 1;
      }
    });

    const needPurchaseCount = purchaseItems.filter(p => !p.is_purchased).length;

    return {
      totalCodes,
      inStockCount,
      needPurchaseCount,
      lowStockCount
    };
  }, [materials, purchaseItems]);

  // Automatically check for low stock materials and create suggestions in purchase list without duplicates
  useEffect(() => {
    if (materials.length === 0) return;

    materials.forEach(mat => {
      if (mat.is_inventoried && mat.current_stock <= mat.min_stock) {
        setPurchaseItems(prev => {
          const exists = prev.some(p => p.material_id === mat.id && !p.is_purchased);
          if (exists) return prev;
          
          const newItem: PurchaseItem = {
            id: 'pur-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            material_id: mat.id,
            material_name: mat.name,
            material_code: mat.code,
            category: mat.category,
            unit: mat.unit,
            planned_quantity: Math.max(1, (mat.min_stock * 2) - mat.current_stock),
            is_purchased: false,
            reason: 'LOW_STOCK',
            created_at: new Date().toISOString()
          };
          return [...prev, newItem];
        });
      }
    });
  }, [materials]);

  // Material Actions
  const addMaterial = async (data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> => {
    const newMaterial: Material = {
      ...data,
      id: 'mat-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setMaterials(prev => [newMaterial, ...prev]);

    // Tự động đẩy qua Tab Cần mua (Đi chợ)
    const qtyToBuy = Math.max(1, newMaterial.current_stock || 1);
    setPurchaseItems(prev => {
      const existingPurchase = prev.find(p => p.material_name.toLowerCase() === newMaterial.name.toLowerCase() && !p.is_purchased);
      if (existingPurchase) {
        return prev.map(p => p.id === existingPurchase.id 
          ? { ...p, planned_quantity: p.planned_quantity + qtyToBuy } 
          : p
        );
      }

      const newPurchase: PurchaseItem = {
        id: 'pur-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        material_id: newMaterial.id,
        material_name: newMaterial.name,
        material_code: newMaterial.code || '',
        category: newMaterial.category || 'Vật tư',
        unit: newMaterial.unit || 'Cái',
        planned_quantity: qtyToBuy,
        is_purchased: false,
        reason: 'MANUAL',
        created_at: new Date().toISOString()
      };
      return [newPurchase, ...prev];
    });

    // If initial stock > 0, log an initial stock transaction
    if (newMaterial.current_stock > 0) {
      const initialTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'STOCK_IN',
        notes: 'Khởi tạo tồn kho ban đầu',
        created_at: new Date().toISOString(),
        total_items: 1,
        items: [
          {
            material_id: newMaterial.id,
            material_name: newMaterial.name,
            material_code: newMaterial.code,
            category: newMaterial.category,
            unit: newMaterial.unit,
            quantity: newMaterial.current_stock,
            stock_before: 0,
            stock_after: newMaterial.current_stock
          }
        ]
      };
      setTransactions(prev => [initialTx, ...prev]);
    }

    return newMaterial;
  };

  const addSimpleMaterial = async (name: string, quantity: number): Promise<Material> => {
    const cleanName = name.trim();
    const qty = Math.max(1, quantity || 1);

    const existingIndex = materials.findIndex(m => m.name.toLowerCase() === cleanName.toLowerCase());
    let targetMaterial: Material;

    if (existingIndex >= 0) {
      const existing = materials[existingIndex];
      const newStock = existing.current_stock + qty;
      targetMaterial = {
        ...existing,
        current_stock: newStock,
        updated_at: new Date().toISOString()
      };
      setMaterials(prev => prev.map(m => m.id === existing.id ? targetMaterial : m));
    } else {
      targetMaterial = {
        id: 'mat-' + Date.now(),
        name: cleanName,
        code: 'VT-' + Math.floor(100 + Math.random() * 900),
        category: 'Vật tư',
        unit: 'Cái',
        current_stock: qty,
        initial_stock: qty,
        min_stock: 2,
        is_inventoried: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setMaterials(prev => [targetMaterial, ...prev]);
    }

    // Tự động đẩy qua Tab Cần mua (Đi chợ)
    setPurchaseItems(prev => {
      const existingPurchase = prev.find(p => p.material_name.toLowerCase() === cleanName.toLowerCase() && !p.is_purchased);
      if (existingPurchase) {
        return prev.map(p => p.id === existingPurchase.id 
          ? { ...p, planned_quantity: p.planned_quantity + qty } 
          : p
        );
      }

      const newPurchase: PurchaseItem = {
        id: 'pur-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        material_id: targetMaterial.id,
        material_name: targetMaterial.name,
        material_code: targetMaterial.code,
        category: 'Vật tư',
        unit: 'Cái',
        planned_quantity: qty,
        is_purchased: false,
        reason: 'MANUAL',
        created_at: new Date().toISOString()
      };
      return [newPurchase, ...prev];
    });

    // 3. Tự động ghi vào Tab Lịch sử: HÀNG ĐÃ XUẤT (như người dùng yêu cầu: tab nhập vào thì đã xuất)
    const exportTx: Transaction = {
      id: 'tx-out-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: 'STOCK_OUT',
      notes: 'Xuất dùng vật tư',
      created_at: new Date().toISOString(),
      total_items: 1,
      items: [
        {
          material_id: targetMaterial.id,
          material_name: targetMaterial.name,
          material_code: targetMaterial.code,
          category: 'Vật tư',
          unit: targetMaterial.unit,
          quantity: qty,
          stock_before: 0,
          stock_after: targetMaterial.current_stock
        }
      ]
    };
    setTransactions(prev => [exportTx, ...prev]);

    return targetMaterial;
  };

  const confirmPurchaseAndAddToHistory = async (purchaseId: string, actualQuantity: number): Promise<void> => {
    const item = purchaseItems.find(p => p.id === purchaseId);
    if (!item) return;

    const actualQty = Math.max(1, actualQuantity || 1);

    // 1. Ghi nhận giao dịch vào Lịch sử: HÀNG ĐÃ NHẬP (như người dùng yêu cầu: tab cần mua là hàng đã nhập)
    const importTx: Transaction = {
      id: 'tx-in-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: 'STOCK_IN',
      notes: 'Nhập hàng từ đi chợ',
      created_at: new Date().toISOString(),
      total_items: 1,
      items: [
        {
          material_id: item.material_id,
          material_name: item.material_name,
          material_code: item.material_code,
          category: item.category || 'Vật tư',
          unit: item.unit || 'Cái',
          quantity: actualQty,
          stock_before: 0,
          stock_after: actualQty
        }
      ]
    };
    setTransactions(prev => [importTx, ...prev]);

    // 2. Cập nhật tăng số lượng tồn vào danh mục Vật tư tương ứng
    setMaterials(prev => prev.map(m => {
      if (m.id === item.material_id || m.name.toLowerCase() === item.material_name.toLowerCase()) {
        return {
          ...m,
          current_stock: m.current_stock + actualQty,
          updated_at: new Date().toISOString()
        };
      }
      return m;
    }));

    // 3. XÓA DỮ LIỆU TRONG TAB CẦN MUA (như người dùng yêu cầu!)
    setPurchaseItems(prev => prev.filter(p => p.id !== purchaseId));
  };

  const updateMaterial = async (id: string, updates: Partial<Material>): Promise<void> => {
    setMaterials(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return m;
    }));
  };

  const markItemAsPurchased = (id: string, actualQty?: number) => {
    setPurchaseItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          is_purchased: true,
          actual_quantity: actualQty !== undefined ? actualQty : item.planned_quantity,
          purchased_at: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const markMultiplePurchased = (ids: string[]) => {
    const idSet = new Set(ids);
    setPurchaseItems(prev => prev.map(item => {
      if (idSet.has(item.id)) {
        return {
          ...item,
          is_purchased: true,
          actual_quantity: item.planned_quantity,
          purchased_at: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const unmarkPurchased = (id: string) => {
    setPurchaseItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          is_purchased: false,
          purchased_at: undefined
        };
      }
      return item;
    }));
  };

  const clearPurchasedHistory = () => {
    setPurchaseItems(prev => prev.filter(p => !p.is_purchased));
  };

  const deleteMaterial = async (id: string): Promise<void> => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    setPurchaseItems(prev => prev.filter(p => p.material_id !== id));
  };

  // Transaction Processing
  const processTransaction = async (params: {
    type: TransactionType;
    customer_name?: string;
    notes?: string;
    items: Array<{ material_id: string; quantity: number; unit?: string }>;
    allowNegative?: boolean;
  }): Promise<{ success: boolean; message?: string }> => {
    const { type, customer_name, notes, items, allowNegative } = params;

    if (!items || items.length === 0) {
      return { success: false, message: 'Danh sách vật tư trống!' };
    }

    // Verify stock availability for STOCK_OUT
    if (type === 'STOCK_OUT' && !allowNegative) {
      for (const item of items) {
        const mat = materials.find(m => m.id === item.material_id);
        if (mat && mat.current_stock < item.quantity) {
          return { 
            success: false, 
            message: `Vật tư "${mat.name}" chỉ còn ${mat.current_stock} ${mat.unit}, không đủ để xuất ${item.quantity} ${item.unit}.` 
          };
        }
      }
    }

    const txItems: Transaction['items'] = [];
    const materialStockUpdates: Record<string, number> = {};

    items.forEach(item => {
      const mat = materials.find(m => m.id === item.material_id);
      if (!mat) return;

      const currentStock = mat.current_stock;
      let newStock = currentStock;

      if (type === 'STOCK_OUT') {
        newStock = currentStock - item.quantity;
      } else if (type === 'STOCK_IN') {
        newStock = currentStock + item.quantity;
      } else if (type === 'ADJUSTMENT') {
        newStock = item.quantity;
      }

      materialStockUpdates[mat.id] = newStock;

      txItems.push({
        material_id: mat.id,
        material_name: mat.name,
        material_code: mat.code,
        category: mat.category,
        unit: item.unit || mat.unit,
        quantity: item.quantity,
        stock_before: currentStock,
        stock_after: newStock
      });
    });

    if (txItems.length === 0) {
      return { success: false, message: 'Không tìm thấy vật tư hợp lệ để tạo giao dịch.' };
    }

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      type,
      customer_name,
      notes: notes || (type === 'STOCK_OUT' && customer_name ? `Gắn cho khách ${customer_name}` : ''),
      created_at: new Date().toISOString(),
      total_items: txItems.length,
      items: txItems
    };

    // Atomic update of materials and transactions
    setMaterials(prev => prev.map(m => {
      if (materialStockUpdates[m.id] !== undefined) {
        return {
          ...m,
          current_stock: materialStockUpdates[m.id],
          is_inventoried: true,
          updated_at: new Date().toISOString()
        };
      }
      return m;
    }));

    setTransactions(prev => [newTx, ...prev]);

    return { success: true };
  };

  // Safe undo / cancel transaction
  const cancelTransaction = async (transactionId: string): Promise<{ success: boolean; message: string }> => {
    const targetTx = transactions.find(t => t.id === transactionId);
    if (!targetTx) {
      return { success: false, message: 'Không tìm thấy giao dịch!' };
    }
    if (targetTx.is_undone) {
      return { success: false, message: 'Giao dịch này đã được hoàn tác trước đó.' };
    }

    // Revert stock effects
    setMaterials(prev => prev.map(m => {
      const item = targetTx.items.find(i => i.material_id === m.id);
      if (!item) return m;

      let revertedStock = m.current_stock;
      if (targetTx.type === 'STOCK_OUT') {
        revertedStock = m.current_stock + item.quantity;
      } else if (targetTx.type === 'STOCK_IN') {
        revertedStock = m.current_stock - item.quantity;
      } else if (targetTx.type === 'ADJUSTMENT') {
        revertedStock = item.stock_before;
      }

      return {
        ...m,
        current_stock: revertedStock,
        updated_at: new Date().toISOString()
      };
    }));

    // Mark transaction as cancelled
    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return {
          ...t,
          is_undone: true,
          notes: `${t.notes || ''} (ĐÃ HỦY/HOÀN TỒN)`
        };
      }
      return t;
    }));

    return { success: true, message: 'Đã hoàn tác giao dịch và khôi phục tồn kho chính xác.' };
  };

  // Purchase actions
  const addToPurchaseList = (materialId: string, plannedQty: number, reason: 'LOW_STOCK' | 'MANUAL' = 'MANUAL') => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;

    setPurchaseItems(prev => {
      const existing = prev.find(p => p.material_id === materialId && !p.is_purchased);
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, planned_quantity: p.planned_quantity + plannedQty } : p);
      }
      const newItem: PurchaseItem = {
        id: 'pur-' + Date.now(),
        material_id: mat.id,
        material_name: mat.name,
        material_code: mat.code,
        category: mat.category,
        unit: mat.unit,
        planned_quantity: plannedQty,
        is_purchased: false,
        reason,
        created_at: new Date().toISOString()
      };
      return [...prev, newItem];
    });
  };

  const updatePurchaseItem = (id: string, updates: Partial<PurchaseItem>) => {
    setPurchaseItems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePurchaseItem = (id: string) => {
    setPurchaseItems(prev => prev.filter(p => p.id !== id));
  };

  const confirmPurchaseBatch = async (
    purchases: Array<{ id: string; material_id: string; actual_quantity: number }>
  ): Promise<void> => {
    const stockInItems: Array<{ material_id: string; quantity: number }> = [];

    purchases.forEach(p => {
      if (p.actual_quantity > 0) {
        stockInItems.push({
          material_id: p.material_id,
          quantity: p.actual_quantity
        });
      }
    });

    if (stockInItems.length > 0) {
      await processTransaction({
        type: 'STOCK_IN',
        notes: 'Mua hàng từ danh sách đi chợ',
        items: stockInItems
      });
    }

    // Mark as purchased in purchase list, or reduce planned if partial
    setPurchaseItems(prev => prev.map(p => {
      const confirmed = purchases.find(c => c.id === p.id);
      if (!confirmed) return p;

      if (confirmed.actual_quantity >= p.planned_quantity) {
        return {
          ...p,
          is_purchased: true,
          actual_quantity: confirmed.actual_quantity,
          purchased_at: new Date().toISOString()
        };
      } else {
        const remaining = p.planned_quantity - confirmed.actual_quantity;
        return {
          ...p,
          planned_quantity: remaining,
          notes: `Đã mua ${confirmed.actual_quantity}, còn thiếu ${remaining}`
        } as PurchaseItem;
      }
    }));
  };

  // Data Import / Export
  const exportToExcel = () => {
    const matSheetData = materials.map(m => ({
      'Mã hàng': m.code,
      'Tên vật tư': m.name,
      'Nhóm': m.category,
      'Đơn vị': m.unit,
      'Tồn hiện tại': m.current_stock,
      'Tồn tối thiểu': m.min_stock,
      'Trạng thái kiểm kê': m.is_inventoried ? 'Đã kiểm kê' : 'Chưa kiểm kê',
      'Ghi chú': m.notes || ''
    }));

    const txSheetData = transactions.map(t => ({
      'Mã GD': t.id,
      'Loại': t.type === 'STOCK_IN' ? 'Nhập hàng' : t.type === 'STOCK_OUT' ? 'Xuất dùng' : 'Điều chỉnh',
      'Khách hàng': t.customer_name || '',
      'Thời gian': new Date(t.created_at).toLocaleString('vi-VN'),
      'Chi tiết': t.items.map(i => `${i.material_name} (${i.quantity} ${i.unit})`).join(', '),
      'Ghi chú': t.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const wsMat = XLSX.utils.json_to_sheet(matSheetData);
    const wsTx = XLSX.utils.json_to_sheet(txSheetData);

    XLSX.utils.book_append_sheet(wb, wsMat, 'Vật tư');
    XLSX.utils.book_append_sheet(wb, wsTx, 'Lịch sử giao dịch');

    XLSX.writeFile(wb, `SO_TAY_HT_BAO_CAO_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportBackupJSON = () => {
    const backupData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      materials,
      transactions,
      purchaseItems
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SO_TAY_HT_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.materials)) {
        setMaterials(data.materials);
      }
      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      if (Array.isArray(data.purchaseItems)) {
        setPurchaseItems(data.purchaseItems);
      }
      return true;
    } catch (e) {
      console.error('Invalid backup file', e);
      return false;
    }
  };

  const clearTransactions = () => {
    setTransactions([]);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    supabaseService.clearTransactionsOnCloud();
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const clearAllData = () => {
    setMaterials([]);
    setTransactions([]);
    setPurchaseItems([]);
    localStorage.removeItem(STORAGE_KEYS.MATERIALS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASES);
  };

  return (
    <AppContext.Provider
      value={{
        materials,
        transactions,
        purchaseItems,
        categories,
        activeTab,
        setActiveTab,
        voiceDraft,
        setVoiceDraft,
        selectedMaterialForDetail,
        setSelectedMaterialForDetail,
        addMaterial,
        addSimpleMaterial,
        updateMaterial,
        deleteMaterial,
        processTransaction,
        cancelTransaction,
        clearTransactions,
        deleteTransaction,
        addToPurchaseList,
        updatePurchaseItem,
        deletePurchaseItem,
        confirmPurchaseBatch,
        confirmPurchaseAndAddToHistory,
        markItemAsPurchased,
        markMultiplePurchased,
        unmarkPurchased,
        clearPurchasedHistory,
        exportToExcel,
        exportBackupJSON,
        importBackupJSON,
        clearAllData,
        stats
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
