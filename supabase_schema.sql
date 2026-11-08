-- =========================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU SỔ TAY HT - SUPABASE SCHEMA V1.1 (ONLINE PRODUCTION)
-- Tương thích 100% ID linh hoạt (UUID và client id: mat-..., pur-..., tx-...)
-- =========================================================================

-- 1. BẢNG NHÓM VẬT TƯ (categories)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG VẬT TƯ (materials)
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Vật tư',
  unit TEXT NOT NULL DEFAULT 'Cái',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  initial_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 1,
  is_inventoried BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  image_type TEXT DEFAULT 'box',
  image_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG KHÁCH HÀNG (customers)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG GIAO DỊCH / LỊCH SỬ (transactions)
-- Types: 'STOCK_OUT' (Xuất kho / Giao khách), 'STOCK_IN' (Nhập hàng), 'ADJUSTMENT' (Kiểm kê/Điều chỉnh), 'CANCELLED' (Hủy)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL CHECK (type IN ('STOCK_OUT', 'STOCK_IN', 'ADJUSTMENT', 'CANCELLED')),
  customer_name TEXT,
  notes TEXT,
  total_items INTEGER NOT NULL DEFAULT 1,
  is_undone BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG CHI TIẾT GIAO DỊCH (transaction_items)
CREATE TABLE IF NOT EXISTS transaction_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  material_code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Vật tư',
  unit TEXT NOT NULL DEFAULT 'Cái',
  quantity NUMERIC NOT NULL,
  stock_before NUMERIC NOT NULL DEFAULT 0,
  stock_after NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG DANH SÁCH CẦN MUA / ĐI CHỢ (purchase_items)
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  material_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  material_code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Vật tư',
  unit TEXT NOT NULL DEFAULT 'Cái',
  planned_quantity NUMERIC NOT NULL DEFAULT 1,
  actual_quantity NUMERIC,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ,
  reason TEXT NOT NULL DEFAULT 'MANUAL' CHECK (reason IN ('LOW_STOCK', 'MANUAL')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- CHÍNH SÁCH BẢO MẬT HÀNG (ROW LEVEL SECURITY - RLS)
-- =========================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc/ghi an toàn bằng API Key đã cấu hình
DROP POLICY IF EXISTS "Public read/write categories" ON categories;
CREATE POLICY "Public read/write categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write materials" ON materials;
CREATE POLICY "Public read/write materials" ON materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write customers" ON customers;
CREATE POLICY "Public read/write customers" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write transactions" ON transactions;
CREATE POLICY "Public read/write transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write transaction_items" ON transaction_items;
CREATE POLICY "Public read/write transaction_items" ON transaction_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write purchase_items" ON purchase_items;
CREATE POLICY "Public read/write purchase_items" ON purchase_items FOR ALL USING (true) WITH CHECK (true);
