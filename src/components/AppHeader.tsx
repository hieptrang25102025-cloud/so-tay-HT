import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Calendar, Clock, Wrench } from 'lucide-react';

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSettings }) => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { dateFormatted, timeFormatted } = useMemo(() => {
    const now = currentDateTime;
    const vnDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const partMap: Record<string, string> = {};
    parts.forEach(p => {
      partMap[p.type] = p.value;
    });

    const vnDateObj = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const dayName = vnDays[vnDateObj.getDay()];

    const dd = partMap['day'] || '01';
    const mm = partMap['month'] || '01';
    const yyyy = partMap['year'] || '2026';
    const hh = partMap['hour'] || '00';
    const min = partMap['minute'] || '00';
    const ss = partMap['second'] || '00';

    return {
      dateFormatted: `${dayName}, ${dd}/${mm}/${yyyy}`,
      timeFormatted: `${hh}:${min}:${ss}`
    };
  }, [currentDateTime]);

  return (
    <header className="px-4 py-2.5 border-b border-[#22334A]/80 bg-[#172235]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#1A2638] border border-[#C5A66A]/40 flex items-center justify-center text-[#C5A66A] shadow-sm">
          <Wrench className="w-4 h-4 text-[#C5A66A]" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-wider text-white">
            SỔ TAY HT
          </h1>
          <span className="text-[10px] text-[#8E9EB2] block -mt-0.5">
            Trợ lý công việc & Quản lý vật tư
          </span>
        </div>
      </div>

      {/* Realtime Date/Clock & Settings Cog */}
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-[#101726] border border-[#2E415E] text-[10px] text-[#DFBE82]">
            <Calendar className="w-2.5 h-2.5 text-[#C5A66A]" />
            <span className="font-semibold">{dateFormatted}</span>
          </div>
          <div className="text-[10px] font-mono text-[#8E9EB2] font-bold">
            {timeFormatted}
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#C5A66A] hover:bg-[#1E293B] transition-colors"
          title="Cài đặt & Dữ liệu"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
