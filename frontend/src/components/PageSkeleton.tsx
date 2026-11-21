import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Загрузка страницы..."
      className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse"
    >
      <div className="h-44 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl border border-[#e2e4e8]/60 dark:border-[#273142]/60" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl border border-[#e2e4e8]/60 dark:border-[#273142]/60" />
        <div className="h-80 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl border border-[#e2e4e8]/60 dark:border-[#273142]/60" />
      </div>
      <span className="sr-only">Загрузка данных цифрового деканата...</span>
    </div>
  );
};
