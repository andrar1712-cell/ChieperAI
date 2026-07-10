import React from 'react';
import { X, Send, Phone, Instagram, ShieldAlert, MessageCircleHeart } from 'lucide-react';
import { Settings } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
}

export default function ContactModal({ isOpen, onClose, settings }: ContactModalProps) {
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
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#00D4FF]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#7C5CFF]/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <MessageCircleHeart className="w-5 h-5 text-[#7C5CFF]" />
            <h3 className="text-lg font-bold tracking-tight">Hubungi Developer</h3>
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
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Punya saran fitur menarik, kendala teknis, atau ingin melaporkan bug? Jangan ragu untuk langsung menghubungi developer CHIEPERAI. Masukan Anda sangat dihargai!
          </p>

          <div className="space-y-3">
            {/* WhatsApp Card */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">WhatsApp</span>
                  <span className="font-mono text-sm font-semibold tracking-wide dark:text-gray-200">085899928895</span>
                </div>
              </div>
              <a
                href="https://wa.me/6285899928895"
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300"
              >
                Open WhatsApp
              </a>
            </div>

            {/* Instagram Card */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-pink-500/5 hover:bg-pink-500/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Instagram</span>
                  <span className="text-sm font-semibold tracking-wide dark:text-gray-200">@andra_gal1agher</span>
                </div>
              </div>
              <a
                href="https://instagram.com/andra_gal1agher"
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3.5 text-xs font-bold rounded-xl bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/20 transition-all duration-300"
              >
                Open Instagram
              </a>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="flex gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            <ShieldAlert className="w-4 h-4 text-[#7C5CFF] shrink-0" />
            <span>Developer biasanya merespons pesan WhatsApp dalam kurun waktu 1x24 jam. Terima kasih atas pengertian dan antusiasme Anda terhadap CHIEPERAI!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
