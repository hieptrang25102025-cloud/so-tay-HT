export type TransactionType = 'STOCK_OUT' | 'STOCK_IN' | 'ADJUSTMENT' | 'CANCELLED';

export interface Material {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  current_stock: number;
  initial_stock: number;
  min_stock: number;
  is_inventoried: boolean; // true = đã kiểm kê, false = chưa kiểm kê
  notes?: string;
  image_type?: 'wire' | 'lightbulb' | 'box' | 'tool' | 'custom';
  image_url?: string;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id?: string;
  material_id: string;
  material_name: string;
  material_code: string;
  category: string;
  unit: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  customer_name?: string;
  notes?: string;
  created_at: string;
  total_items: number;
  items: TransactionItem[];
  is_undone?: boolean;
}

export interface PurchaseItem {
  id: string;
  material_id: string;
  material_name: string;
  material_code: string;
  category: string;
  unit: string;
  planned_quantity: number;
  actual_quantity?: number;
  is_purchased: boolean;
  purchased_at?: string;
  reason: 'LOW_STOCK' | 'MANUAL';
  created_at: string;
}

export interface ParsedVoiceItem {
  material_name: string;
  material_code?: string;
  quantity: number;
  unit: string;
  matched_material_id?: string;
  matched_material?: Material;
}

export interface ParsedVoiceResult {
  customer_name: string;
  notes: string;
  raw_text: string;
  items: ParsedVoiceItem[];
  intent: 'USAGE' | 'PURCHASE' | 'ADD_MATERIAL' | 'UNKNOWN';
  confidence: number;
}

export type AppTab = 'home' | 'voice' | 'shopping' | 'materials' | 'history';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
