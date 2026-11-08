import React from 'react';
import { Package, Zap, Lightbulb, Wrench } from 'lucide-react';

interface ProductThumbnailProps {
  type?: 'wire' | 'lightbulb' | 'box' | 'tool' | 'custom';
  imageUrl?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  type = 'box',
  imageUrl,
  name = '',
  className = '',
  size = 'md'
}) => {
  // Infer type from name if not specified
  let resolvedType = type;
  const lower = name.toLowerCase();
  if (lower.includes('dây') || lower.includes('coro') || lower.includes('cogo') || lower.includes('điện')) {
    resolvedType = 'wire';
  } else if (lower.includes('đèn') || lower.includes('bóng') || lower.includes('led')) {
    resolvedType = 'lightbulb';
  }

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl'
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} object-cover border border-[#2E415E]/60 ${className}`}
      />
    );
  }

  if (resolvedType === 'wire') {
    // Blue coiled wire spool matching mockup
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#1D4ED8] p-2 flex items-center justify-center border border-[#3B82F6]/40 shadow-inner ${className}`}>
        <svg viewBox="0 0 40 40" className="w-full h-full text-blue-200 fill-none stroke-current" strokeWidth="3" strokeLinecap="round">
          <ellipse cx="20" cy="20" rx="14" ry="10" stroke="#60A5FA" strokeWidth="3.5" />
          <ellipse cx="20" cy="20" rx="9" ry="6" stroke="#93C5FD" strokeWidth="2.5" />
          <path d="M12 24 C14 28, 26 28, 28 24" stroke="#BFDBFE" strokeWidth="2.5" />
        </svg>
      </div>
    );
  }

  if (resolvedType === 'lightbulb') {
    // LED lightbulb matching mockup
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#334155] via-[#475569] to-[#1E293B] p-2 flex items-center justify-center border border-[#94A3B8]/30 shadow-inner ${className}`}>
        <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
          <path d="M20 7C14.5 7 10 11.5 10 17C10 20.8 12.3 24 15.5 25.5V28C15.5 28.8 16.2 29.5 17 29.5H23C23.8 29.5 24.5 28.8 24.5 28V25.5C27.7 24 30 20.8 30 17C30 11.5 25.5 7 20 7Z" fill="#F8FAFC" />
          <path d="M16 31H24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <path d="M17.5 33.5H22.5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-[#22334A] border border-[#2E415E] flex items-center justify-center text-[#C5A66A] ${className}`}>
      <Package className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} />
    </div>
  );
};
