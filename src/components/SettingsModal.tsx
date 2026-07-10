import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Sparkles, RotateCcw, Trash2, Sliders, ShieldCheck } from 'lucide-react';
import { Settings, TokenUsage } from '../types';
import { storage } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onClearAll: () => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave, onClearAll }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<Settings>({ ...settings });
  const [usage, setUsage] = useState<TokenUsage>({ totalTokens: 0, totalMessages: 0 });

  useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
      setUsage(storage.getTokenUsage());
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (key: keyof Settings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSave(updated); // Update in real-time so user can see the effect
  };

  const handleReset = () => {
    const defaultSettings: Settings = {
      theme: 'dark',
      fontSize: 15,
      blurStrength: 16,
      glassOpacity: 0.08,
      animationSpeed: 0.3,
    };
    setLocalSettings(defaultSettings);
    onSave(defaultSettings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card with Premium Liquid Glass style */}
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl transition-all text-gray-800 dark:text-gray-100 dark:bg-[#090909]/90 bg-white/95 backdrop-blur-xl"
        style={{
          backdropFilter: `blur(${localSettings.blurStrength}px)`,
          transition: `all ${localSettings.animationSpeed}s ease-out`,
        }}
      >
        {/* Animated Glow in the background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#4F8CFF]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#7C5CFF]/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#4F8CFF]" />
            <h3 className="text-lg font-bold tracking-tight">Pengaturan Aplikasi</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative space-y-5 overflow-y-auto max-h-[70vh] pr-1">
          {/* Theme Selector */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">Tema Visual</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark', label: 'Dark Mode', icon: Moon },
                { id: 'light', label: 'Light Mode', icon: Sun },
                { id: 'auto', label: 'Auto Theme', icon: Sparkles }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = localSettings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleChange('theme', t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all ${
                      isSelected 
                        ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#4F8CFF] dark:text-[#4F8CFF]' 
                        : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size Selector */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">Ukuran Huruf Chat: {localSettings.fontSize}px</label>
            <input 
              type="range" 
              min="13" 
              max="20" 
              value={localSettings.fontSize} 
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value, 10))}
              className="w-full accent-[#4F8CFF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
              <span>Kecil (13px)</span>
              <span>Sedang (16px)</span>
              <span>Besar (20px)</span>
            </div>
          </div>

          {/* Blur Strength */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Intensitas Blur Kaca: {localSettings.blurStrength}px</label>
            <input 
              type="range" 
              min="0" 
              max="24" 
              value={localSettings.blurStrength} 
              onChange={(e) => handleChange('blurStrength', parseInt(e.target.value, 10))}
              className="w-full accent-[#7C5CFF] cursor-pointer"
            />
          </div>

          {/* Glass Opacity */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Opasitas Panel Kaca: {Math.round(localSettings.glassOpacity * 100)}%</label>
            <input 
              type="range" 
              min="2" 
              max="40" 
              value={Math.round(localSettings.glassOpacity * 100)} 
              onChange={(e) => handleChange('glassOpacity', parseFloat((parseInt(e.target.value, 10) / 100).toFixed(2)))}
              className="w-full accent-[#00D4FF] cursor-pointer"
            />
          </div>

          {/* Animation Speed */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-600 dark:text-gray-400">Kecepatan Animasi UI: {localSettings.animationSpeed}s</label>
            <input 
              type="range" 
              min="10" 
              max="80" 
              value={Math.round(localSettings.animationSpeed * 100)} 
              onChange={(e) => handleChange('animationSpeed', parseFloat((parseInt(e.target.value, 10) / 100).toFixed(2)))}
              className="w-full accent-[#4F8CFF] cursor-pointer"
            />
          </div>

          {/* Usage Statistics */}
          <div className="p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Statistik & Keamanan
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <span className="block text-xs text-gray-500 font-sans">Total Chat:</span>
                <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">{usage.totalMessages} pesan</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-sans">Estimasi Token:</span>
                <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">~{usage.totalTokens} tokens</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-sans">
              *Semua percakapan dan kunci Anda disimpan 100% aman secara lokal di browser Anda. Tidak ada data pribadi yang dikirim ke server pihak ketiga.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-black/5 dark:border-white/5">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-black/5 dark:border-white/5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Default
            </button>
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus semua chat history dan preferensi? Tindakan ini tidak dapat dibatalkan.')) {
                  onClearAll();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
