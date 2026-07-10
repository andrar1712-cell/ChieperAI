import React from 'react';
import { X, Cpu, GraduationCap, Network, Heart, Sparkles } from 'lucide-react';
import { Settings } from '../types';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
}

export default function AboutModal({ isOpen, onClose, settings }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal with Liquid Glass effect */}
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl transition-all text-gray-800 dark:text-gray-100 dark:bg-[#090909]/90 bg-white/95 backdrop-blur-xl"
        style={{
          backdropFilter: `blur(${settings.blurStrength}px)`,
          transition: `all ${settings.animationSpeed}s ease-out`,
        }}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#7C5CFF]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#4F8CFF]/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#4F8CFF]" />
            <h3 className="text-lg font-bold tracking-tight">Tentang CHIEPERAI</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative space-y-4 overflow-y-auto max-h-[70vh] pr-1">
          {/* Logo Brand Large */}
          <div className="flex flex-col items-center justify-center text-center py-4 bg-gradient-to-b from-[#4F8CFF]/5 to-transparent rounded-2xl border border-white/5">
            <span className="text-3xl font-black tracking-widest bg-gradient-to-r from-[#4F8CFF] via-[#7C5CFF] to-[#00D4FF] bg-clip-text text-transparent filter drop-shadow">
              CHIEPERAI
            </span>
            <span className="text-[10px] font-mono tracking-widest text-gray-400 dark:text-gray-500 mt-1 uppercase">
              Production Version 1.0.0
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-center px-2">
            CHIEPERAI adalah platform percakapan AI berkinerja tinggi, responsif, dan elegan, yang dirancang dengan antarmuka <b>Premium Liquid Glass</b>. Nikmati kecerdasan buatan kelas atas tanpa login atau registrasi.
          </p>

          {/* Credentials list */}
          <div className="space-y-2 text-sm">
            {/* Tech stack */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
              <div className="p-2 rounded-xl bg-[#4F8CFF]/15 text-[#4F8CFF]">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 block">Powered by:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">Gemini AI Engine (v3.5 Flash)</span>
              </div>
            </div>

            {/* Developer */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
              <div className="p-2 rounded-xl bg-[#7C5CFF]/15 text-[#7C5CFF]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 block">Developer:</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">Andra Rumdiansah</span>
              </div>
            </div>

            {/* School */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
              <div className="p-2 rounded-xl bg-[#00D4FF]/15 text-[#00D4FF]">
                <Network className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 block">Sekolah & Jurusan:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">SMKN 1 CIPANAS - TJKT</span>
                <span className="text-xs text-gray-500 block mt-0.5">(Teknik Jaringan Komputer & Telekomunikasi)</span>
              </div>
            </div>
          </div>

          {/* Heart label */}
          <div className="text-center pt-2 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>untuk kemudahan belajar semua orang.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
