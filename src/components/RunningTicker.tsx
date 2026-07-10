import React from 'react';

export default function RunningTicker() {
  return (
    <div className="w-full bg-gradient-to-r from-[#7C5CFF]/10 via-[#4F8CFF]/10 to-[#00D4FF]/10 border-b border-white/5 overflow-hidden h-9 flex items-center relative z-50 backdrop-blur-md">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#090909] to-transparent z-10 pointer-events-none dark:block hidden" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#090909] to-transparent z-10 pointer-events-none dark:block hidden" />
      
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F8F9FC] to-transparent z-10 pointer-events-none dark:hidden block" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F8F9FC] to-transparent z-10 pointer-events-none dark:hidden block" />

      <div className="flex whitespace-nowrap animate-ticker py-1 select-none">
        {/* Repeat content multiple times for smooth infinite scroll */}
        {Array.from({ length: 8 }).map((_, idx) => (
          <span 
            key={idx} 
            className="mx-8 text-xs font-semibold uppercase tracking-widest bg-gradient-to-r from-[#4F8CFF] via-[#7C5CFF] to-[#00D4FF] bg-clip-text text-transparent flex items-center gap-2"
          >
            ✦ ChieperAI Is Here ✦
            <span className="text-white/20 dark:text-white/10 mx-2">|</span>
            <span>Unleash The Premium Power of Gemini AI</span>
            <span className="text-white/20 dark:text-white/10 mx-2">|</span>
            <span>No Login Required</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          display: flex;
          width: max-content;
          animation: ticker 25s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
