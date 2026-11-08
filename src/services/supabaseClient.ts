import { Material, Transaction, PurchaseItem, SupabaseConfig } from '../types';

const STORAGE_KEY_SUPABASE = 'so_tay_ht_supabase_config';

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        isConnected: parsed.isConnected ?? (!!(parsed.url || envUrl) && !!(parsed.anonKey || envKey)),
        lastSyncedAt: parsed.lastSyncedAt
      };
    }
  } catch (e) {
    console.error('Failed to read Supabase config from localStorage', e);
  }
  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: !!(envUrl && envKey)
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
}

export class SupabaseService {
  private config: SupabaseConfig;

  constructor() {
    this.config = getStoredSupabaseConfig();
  }

  public updateConfig(config: SupabaseConfig) {
    this.config = config;
    saveStoredSupabaseConfig(config);
  }

  public getConfig(): SupabaseConfig {
    return this.config;
  }

  private getHeaders(): HeadersInit {
    return {
      'apikey': this.config.anonKey,
      'Authorization': `Bearer ${this.config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.url || !this.config.anonKey) {
      return { success: false, message: 'Chưa nhập URL hoặc Anon Key' };
    }

    try {
      const cleanUrl = this.config.url.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/materials?select=id&limit=1`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (res.ok) {
        this.config.isConnected = true;
        this.config.lastSyncedAt = new Date().toISOString();
        saveStoredSupabaseConfig(this.config);
        return { success: true, message: 'Kết nối Supabase đám mây thành công!' };
      } else {
        const errorText = await res.text();
        return { 
          success: false, 
          message: `Lỗi kết nối (${res.status}): ${errorText.slice(0, 100)}` 
        };
      }
    } catch (err: any) {
      return { success: false, message: `Không thể kết nối: ${err.message}` };
    }
  }

  /**
   * Tải toàn bộ dữ liệu từ Supabase Cloud về thiết bị
   */
  public async fetchAllFromCloud(): Promise<{
    success: boolean;
    materials?: Material[];
    transactions?: Transaction[];
    purchaseItems?: PurchaseItem[];
    message?: string;
  }> {
    if (!this.config.url || !this.config.anonKey) {
      return { success: false, message: 'Chưa cấu hình Supabase' };
    }

    try {
      const cleanUrl = this.config.url.replace(/\/+$/, '');
      const [matRes, txRes, purRes] = await Promise.all([
        fetch(`${cleanUrl}/rest/v1/materials?select=*`, { headers: this.getHeaders() }),
        fetch(`${cleanUrl}/rest/v1/transactions?select=*&order=created_at.desc`, { headers: this.getHeaders() }),
        fetch(`${cleanUrl}/rest/v1/purchase_items?select=*`, { headers: this.getHeaders() })
      ]);

      if (!matRes.ok || !txRes.ok || !purRes.ok) {
        return { success: false, message: 'Lỗi tải dữ liệu từ máy chủ' };
      }

      const rawMats = await matRes.json();
      const rawTxs = await txRes.json();
      const rawPurs = await purRes.json();

      // Format materials
      const materials: Material[] = (rawMats || []).map((m: any) => ({
        ...m,
        current_stock: Number(m.current_stock) || 0,
        initial_stock: Number(m.initial_stock) || 0,
        min_stock: Number(m.min_stock) || 1
      }));

      // Format transactions
      const transactions: Transaction[] = (rawTxs || []).map((t: any) => ({
        ...t,
        items: t.items || []
      }));

      // Format purchases
      const purchaseItems: PurchaseItem[] = (rawPurs || []).map((p: any) => ({
        ...p,
        planned_quantity: Number(p.planned_quantity) || 1,
        actual_quantity: p.actual_quantity ? Number(p.actual_quantity) : undefined
      }));

      this.config.isConnected = true;
      this.config.lastSyncedAt = new Date().toISOString();
      saveStoredSupabaseConfig(this.config);

      return {
        success: true,
        materials,
        transactions,
        purchaseItems,
        message: 'Đã tải dữ liệu mới nhất từ đám mây'
      };
    } catch (e: any) {
      return { success: false, message: `Lỗi kết nối đám mây: ${e.message}` };
    }
  }

  /**
   * Đẩy toàn bộ dữ liệu thiết bị lên đám mây
   */
  public async syncAllToCloud(data: {
    materials: Material[];
    transactions: Transaction[];
    purchaseItems: PurchaseItem[];
  }): Promise<{ success: boolean; message: string }> {
    if (!this.config.url || !this.config.anonKey) {
      return { success: false, message: 'Supabase chưa kết nối' };
    }

    try {
      const cleanUrl = this.config.url.replace(/\/+$/, '');
      
      // Upsert materials
      if (data.materials.length > 0) {
        await fetch(`${cleanUrl}/rest/v1/materials?on_conflict=id`, {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(data.materials)
        });
      }

      // Upsert transactions
      if (data.transactions.length > 0) {
        const txPayload = data.transactions.map(t => ({
          id: t.id,
          type: t.type,
          customer_name: t.customer_name || null,
          notes: t.notes || null,
          total_items: t.total_items || 1,
          is_undone: !!t.is_undone,
          created_at: t.created_at
        }));
        await fetch(`${cleanUrl}/rest/v1/transactions?on_conflict=id`, {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(txPayload)
        });
      }

      // Upsert purchase items
      if (data.purchaseItems.length > 0) {
        await fetch(`${cleanUrl}/rest/v1/purchase_items?on_conflict=id`, {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(data.purchaseItems)
        });
      }

      this.config.isConnected = true;
      this.config.lastSyncedAt = new Date().toISOString();
      saveStoredSupabaseConfig(this.config);
      return { success: true, message: 'Đồng bộ lên đám mây thành công!' };
    } catch (e: any) {
      return { success: false, message: `Đồng bộ thất bại: ${e.message}` };
    }
  }

  /**
   * Xóa giao dịch trên đám mây khi người dùng bấm Xóa lịch sử
   */
  public async clearTransactionsOnCloud(): Promise<void> {
    if (!this.config.url || !this.config.anonKey) return;
    try {
      const cleanUrl = this.config.url.replace(/\/+$/, '');
      await fetch(`${cleanUrl}/rest/v1/transactions?id=neq.placeholder`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
    } catch (e) {
      console.error('Lỗi xóa giao dịch trên đám mây:', e);
    }
  }
}

export const supabaseService = new SupabaseService();
