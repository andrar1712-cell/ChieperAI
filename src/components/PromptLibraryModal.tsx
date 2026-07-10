import React, { useState, useEffect } from 'react';
import { X, Search, Heart, Copy, Check, MessageSquareCode, Terminal } from 'lucide-react';
import { PromptTemplate, Settings } from '../types';
import { storage } from '../utils/storage';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSelectPrompt: (promptText: string) => void;
}

export default function PromptLibraryModal({ isOpen, onClose, settings, onSelectPrompt }: PromptLibraryModalProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // List of all requested categories
  const categories = [
    'All',
    'Coding',
    'Design',
    'Essay',
    'Business',
    'Marketing',
    'AI',
    'Programming',
    'School',
    'Productivity',
    'Social Media',
    'Technology',
    'Cyber Security',
    'Network',
    'Creative'
  ];

  useEffect(() => {
    if (isOpen) {
      setPrompts(storage.getPrompts());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = prompts.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p);
    setPrompts(updated);
    storage.savePrompts(updated);
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.promptText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl transition-all text-gray-800 dark:text-gray-100 dark:bg-[#090909]/95 bg-white/95 backdrop-blur-xl flex flex-col h-[85vh]"
        style={{
          backdropFilter: `blur(${settings.blurStrength}px)`,
          transition: `all ${settings.animationSpeed}s ease-out`,
        }}
      >
        {/* Glow BG */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-[#4F8CFF]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-[#7C5CFF]/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquareCode className="w-5 h-5 text-[#4F8CFF]" />
            <h3 className="text-xl font-bold tracking-tight">Prompt Library</h3>
            <span className="text-xs bg-[#4F8CFF]/10 text-[#4F8CFF] px-2.5 py-0.5 rounded-full font-semibold font-mono">
              PREMIUM TEMPLATES
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="relative space-y-3 mb-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari ribuan prompt premium (misal: 'code', 'AIDA', 'network')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#4F8CFF]/50 focus:ring-1 focus:ring-[#4F8CFF]/30 transition-all font-medium"
            />
          </div>

          {/* Horizontally scrollable Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap border ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white border-transparent shadow-lg shadow-[#4F8CFF]/10 scale-[1.03]' 
                      : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompts list */}
        <div className="relative flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
          {filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
              {filteredPrompts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPrompt(p.promptText);
                    onClose();
                  }}
                  className="group flex flex-col justify-between p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] hover:bg-black/5 dark:bg-white/[0.01] dark:hover:bg-white/5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  {/* Category Accent Line */}
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[#4F8CFF] to-[#7C5CFF] opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Header line of the item */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold font-mono text-[#4F8CFF] uppercase bg-[#4F8CFF]/10 px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleCopy(p.id, p.promptText, e)}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white transition-all"
                          title="Copy prompt"
                        >
                          {copiedId === p.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => toggleFavorite(p.id, e)}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 transition-all"
                          title="Favorite prompt"
                        >
                          <Heart className={`w-4 h-4 ${p.favorite ? 'text-red-500 fill-red-500' : 'hover:text-red-500'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold tracking-tight mb-2 group-hover:text-[#4F8CFF] transition-colors">
                      {p.title}
                    </h4>

                    {/* Excerpt of the prompt */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed font-mono bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-black/5 dark:border-white/5">
                      {p.promptText}
                    </p>
                  </div>

                  {/* Actions line footer of card */}
                  <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-gray-400 dark:text-gray-500 pt-2 border-t border-black/5 dark:border-white/5">
                    <span>Klik untuk gunakan prompt</span>
                    <span className="text-[#4F8CFF] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Use Prompt →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-gray-500">
              <Terminal className="w-12 h-12 stroke-[1.5] mb-2 text-gray-300 dark:text-gray-700 animate-pulse" />
              <p className="text-sm font-semibold">Tidak ada prompt yang cocok</p>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-600">Coba gunakan kata kunci pencarian atau kategori lain.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
