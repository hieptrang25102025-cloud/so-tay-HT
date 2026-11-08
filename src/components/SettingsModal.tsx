import React, { useState } from 'react';
import { 
  X, 
  Database, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Mic,
  Key,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabaseService, getStoredSupabaseConfig } from '../services/supabaseClient';
import { getStoredSTTConfig, saveStoredSTTConfig, STTConfig } from '../services/sttService';
import { SupabaseConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    materials, 
    transactions, 
    purchaseItems, 
    exportToExcel, 
    exportBackupJSON, 
    importBackupJSON, 
    clearAllData 
  } = useApp();

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({
    tested: !!supabaseConfig.isConnected,
    success: !!supabaseConfig.isConnected,
    message: supabaseConfig.isConnected ? 'Đã kết nối Supabase' : 'Chưa kết nối Supabase'
  });

  const [syncing, setSyncing] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Speech-to-Text State
  const [sttConfig, setSttConfig] = useState<STTConfig>(getStoredSTTConfig());
  const [sttSavedSuccess, setSttSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    supabaseService.updateConfig(supabaseConfig);
    const res = await supabaseService.testConnection();
    setConnectionStatus({
      tested: true,
      success: res.success,
      message: res.message
    });
    setTestingConnection(false);
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    const res = await supabaseService.syncAllToCloud({
      materials,
      transactions,
      purchaseItems
    });
    alert(res.message);
    setSyncing(false);
  };

  const handleSaveSTT = () => {
    saveStoredSTTConfig(sttConfig);
    setSttSavedSuccess(true);
    setTimeout(() => setSttSavedSuccess(false), 2000);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupJSON(content);
        if (ok) {
          alert('Khôi phục dữ liệu từ bản sao lưu thành công!');
          onClose();
        } else {
          alert('Tệp sao lưu không hợp lệ.');
        }
      }
    };
    reader.readAsText(file);
  };

  const copySqlSchema = () => {
    const sqlText = `-- Chạy script này trong SQL Editor của Supabase:
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Cái',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 1,
  is_inventoried BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access" ON materials FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#172235] border border-[#2E415E] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[#22334A]">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-[#C5A66A]" />
            <span>Cài đặt & Dữ liệu</span>
          </h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Speech-to-Text API Configuration */}
        <div className="space-y-3 bg-[#0F172A] p-3.5 rounded-2xl border border-[#22334A]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Mic className="w-4 h-4 text-[#C5A66A]" />
              <span>Dịch vụ giọng nói (Speech-to-Text)</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              sttConfig.apiKey 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {sttConfig.apiKey ? '✓ Sẵn sàng sử dụng' : 'Chưa nhập Key'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[#8E9EB2] block mb-0.5">Dịch vụ nhận diện</label>
              <select
                value={sttConfig.provider}
                onChange={(e) => setSttConfig(prev => ({ ...prev, provider: e.target.value as any }))}
                className="w-full bg-[#172235] border border-[#2E415E] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
              >
                <option value="gemini">Google Gemini Flash (Khuyên dùng - Miễn phí)</option>
                <option value="groq">Groq Whisper Large-v3 (Miễn phí & Cực nhanh)</option>
                <option value="openai">OpenAI Whisper-1</option>
              </select>
            </div>

            <div>
              <label className="text-[#8E9EB2] block mb-0.5">API Key {sttConfig.provider.toUpperCase()}</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Dán API Key của bạn tại đây..."
                  value={sttConfig.apiKey}
                  onChange={(e) => setSttConfig(prev => ({ ...prev, apiKey: e.target.value.trim() }))}
                  className="w-full bg-[#172235] border border-[#2E415E] rounded-xl pl-2.5 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
                />
                <Key className="w-3.5 h-3.5 text-[#8E9EB2] absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-[#1E293B] border border-[#C5A66A]/50 text-[#DFBE82] text-xs font-semibold flex items-center justify-center space-x-1.5 hover:bg-[#25354D] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lấy API Key Gemini miễn phí (Google AI Studio)</span>
            </a>

            <button
              onClick={handleSaveSTT}
              className="w-full py-2.5 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-1"
            >
              {sttSavedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Đã lưu API Key thành công!</span>
                </>
              ) : (
                <span>Lưu cấu hình giọng nói</span>
              )}
            </button>

            <div className="bg-[#172235] p-2.5 rounded-xl border border-[#22334A] text-[11px] text-[#8E9EB2] space-y-1">
              <span className="font-bold text-white block">3 bước đơn giản:</span>
              <p>1. Bấm nút lấy Key ở trên (đăng nhập Gmail).</p>
              <p>2. Bấm nút màu xanh <strong className="text-white">"Create API key"</strong> ➔ Bấm <strong className="text-white">Copy</strong>.</p>
              <p>3. Dán vào ô trên và bấm <strong className="text-[#DFBE82]">"Lưu cấu hình giọng nói"</strong>.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Supabase Cloud Database */}
        <div className="space-y-3 bg-[#0F172A] p-3.5 rounded-2xl border border-[#22334A]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              <span>Cơ sở dữ liệu Supabase</span>
            </span>
            {connectionStatus.tested && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                connectionStatus.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
              }`}>
                {connectionStatus.success ? 'Đã kết nối' : 'Chưa kết nối'}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[#8E9EB2] block mb-0.5">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfig(prev => ({ ...prev, url: e.target.value }))}
                className="w-full bg-[#172235] border border-[#2E415E] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
              />
            </div>

            <div>
              <label className="text-[#8E9EB2] block mb-0.5">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJh..."
                value={supabaseConfig.anonKey}
                onChange={(e) => setSupabaseConfig(prev => ({ ...prev, anonKey: e.target.value }))}
                className="w-full bg-[#172235] border border-[#2E415E] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C5A66A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="py-2 rounded-xl bg-[#22334A] text-white font-semibold text-xs hover:bg-[#2A3E59] active:scale-95 transition-all disabled:opacity-50"
              >
                {testingConnection ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </button>

              <button
                onClick={handleSyncToCloud}
                disabled={syncing || !connectionStatus.success}
                className="py-2 rounded-xl bg-gold-gradient text-[#121A29] font-bold text-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-40"
              >
                {syncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}
              </button>
            </div>

            <button
              onClick={copySqlSchema}
              className="w-full py-1.5 text-[11px] text-[#C5A66A] hover:underline flex items-center justify-center space-x-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedSql ? '✓ Đã sao chép SQL Schema!' : 'Sao chép mã tạo bảng SQL Supabase'}</span>
            </button>
          </div>
        </div>

        {/* Section 3: Export & Backup */}
        <div className="space-y-2.5 text-xs">
          <span className="font-bold text-white block px-1">Sao lưu & Xuất báo cáo</span>

          <button
            onClick={exportToExcel}
            className="w-full p-3 rounded-2xl bg-[#1A2638] border border-[#2E415E] text-white flex items-center justify-between hover:border-[#10B981] active:scale-98 transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <FileSpreadsheet className="w-4 h-4 text-[#10B981]" />
              <span className="font-semibold">Xuất báo cáo Excel (.xlsx)</span>
            </div>
            <Download className="w-4 h-4 text-[#8E9EB2]" />
          </button>

          <button
            onClick={exportBackupJSON}
            className="w-full p-3 rounded-2xl bg-[#1A2638] border border-[#2E415E] text-white flex items-center justify-between hover:border-[#C5A66A] active:scale-98 transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <Download className="w-4 h-4 text-[#DFBE82]" />
              <span className="font-semibold">Tải bản sao lưu JSON đầy đủ</span>
            </div>
            <span className="text-[10px] text-[#C5A66A] font-bold">Lưu an toàn</span>
          </button>

          <label className="w-full p-3 rounded-2xl bg-[#1A2638] border border-[#2E415E] text-white flex items-center justify-between hover:border-[#38BDF8] active:scale-98 transition-all cursor-pointer">
            <div className="flex items-center space-x-2.5">
              <Upload className="w-4 h-4 text-[#38BDF8]" />
              <span className="font-semibold">Khôi phục từ tệp sao lưu</span>
            </div>
            <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
          </label>
        </div>

        {/* Reset Data */}
        <div className="pt-2 border-t border-[#22334A] text-xs">
          <button
            onClick={() => {
              if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ danh mục và lịch sử? Hành động này không thể hoàn tác!')) {
                clearAllData();
                alert('Đã xóa sạch dữ liệu.');
              }
            }}
            className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 font-semibold flex items-center justify-center space-x-1.5 hover:bg-red-900/40 active:scale-98 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa sạch dữ liệu (Đặt lại kho trống)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
