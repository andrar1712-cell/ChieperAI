import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, MessageSquare, Pin, Star, Trash2, Edit3, X, 
  Menu, Sparkles, BookOpen, Sliders, Info, MessageCircle, RefreshCw, PinOff
} from 'lucide-react';
import { ChatSession, Settings, ActiveTab } from '../types';
import { storage } from '../utils/storage';
import logoImg from '../assets/images/chieperai_logo_1783699616048.jpg';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  settings: Settings;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  onToggleFavoriteSession: (id: string) => void;
  onClearAllSessions: () => void;
  onOpenTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  settings,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onTogglePinSession,
  onToggleFavoriteSession,
  onClearAllSessions,
  onOpenTab,
  isOpen,
  onToggleOpen,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isDraggingRef = useRef(false);

  // Load saved sidebar width
  useEffect(() => {
    setSidebarWidth(storage.getSidebarWidth());
  }, []);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newWidth = Math.max(220, Math.min(420, e.clientX));
    setSidebarWidth(newWidth);
    storage.setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Clean up listeners if unmounted
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Rename Session Actions
  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveRename(id);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Grouped sessions
  const pinnedSessions = filteredSessions.filter(s => s.pinned);
  const otherSessions = filteredSessions.filter(s => !s.pinned);

  return (
    <>
      {/* Mobile Sidebar Toggle Button (floating top-left when sidebar closed) */}
      {!isOpen && (
        <button
          onClick={() => onToggleOpen(true)}
          className="absolute left-4 top-4 z-40 p-2.5 rounded-full border border-black/5 dark:border-white/10 dark:bg-[#090909]/85 bg-white/85 shadow-lg backdrop-blur-md text-gray-700 dark:text-gray-200 hover:scale-105 transition-all lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: `${sidebarWidth}px`,
        }}
      >
        {/* Main Glass Panel */}
        <div 
          className="relative flex flex-col h-full w-full border-r border-black/5 dark:border-white/5 dark:bg-[#090909]/85 bg-white/90 backdrop-blur-2xl transition-all"
          style={{
            backdropFilter: `blur(${settings.blurStrength}px)`,
          }}
        >
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 select-none">
              <img 
                src={logoImg} 
                alt="CHIEPERAI Logo" 
                className="w-6 h-6 rounded-lg object-cover shadow-sm border border-black/5 dark:border-white/10"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-black tracking-widest bg-gradient-to-r from-[#4F8CFF] via-[#7C5CFF] to-[#00D4FF] bg-clip-text text-transparent">
                CHIEPERAI
              </span>
              <div className="flex items-center justify-center bg-[#4F8CFF]/15 text-[#4F8CFF] rounded-lg p-1 text-[10px] font-black uppercase font-mono tracking-widest">
                v1
              </div>
            </div>
            
            {/* Close sidebar button (Mobile Only) */}
            <button 
              onClick={() => onToggleOpen(false)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-all lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-3.5 pt-3.5 pb-2 shrink-0">
            <button
              onClick={() => {
                onCreateSession();
                // Close sidebar on mobile after choosing new chat
                if (window.innerWidth < 1024) onToggleOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-lg shadow-[#4F8CFF]/20 active:scale-95 transition-all group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Obrolan Baru
            </button>
          </div>

          {/* Search history bar */}
          <div className="px-3.5 pb-2 shrink-0 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari obrolan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#4F8CFF]/30 transition-all text-gray-700 dark:text-gray-200"
            />
          </div>

          {/* History List (Scrollable Area) */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-none">
            {/* Pinned list */}
            {pinnedSessions.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 px-3 mb-1.5 flex items-center gap-1 select-none">
                  <Pin className="w-3.5 h-3.5 text-orange-400" /> Disematkan ({pinnedSessions.length})
                </h4>
                <div className="space-y-1">
                  {pinnedSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        if (window.innerWidth < 1024) onToggleOpen(false);
                      }}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        activeSessionId === session.id
                          ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] font-semibold border-l-2 border-[#4F8CFF]'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {/* Left: icon & title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare className="w-4 h-4 shrink-0 text-orange-400" />
                        
                        {editingSessionId === session.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveRename(session.id)}
                            onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black/10 dark:bg-white/10 text-xs px-1.5 py-0.5 rounded focus:outline-none w-full text-gray-900 dark:text-white"
                          />
                        ) : (
                          <span className="text-xs truncate">{session.title}</span>
                        )}
                      </div>

                      {/* Right: action hover buttons */}
                      {editingSessionId !== session.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); onTogglePinSession(session.id); }}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-orange-400"
                            title="Unpin chat"
                          >
                            <PinOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavoriteSession(session.id); }}
                            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${session.favorite ? 'text-amber-500' : 'text-gray-400'}`}
                            title="Favorite chat"
                          >
                            <Star className={`w-3.5 h-3.5 ${session.favorite ? 'fill-amber-500' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => startRename(session, e)}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            title="Rename"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Chats */}
            <div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 px-3 mb-1.5 select-none flex items-center justify-between">
                <span>RIWAYAT OBROLAN ({otherSessions.length})</span>
                {sessions.length > 0 && (
                  <button 
                    onClick={onClearAllSessions}
                    className="text-[9px] text-gray-400 hover:text-red-500 transition-colors uppercase tracking-tight font-sans font-semibold cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                )}
              </h4>
              
              {otherSessions.length > 0 ? (
                <div className="space-y-1">
                  {otherSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        if (window.innerWidth < 1024) onToggleOpen(false);
                      }}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        activeSessionId === session.id
                          ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] font-semibold border-l-2 border-[#4F8CFF]'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {/* Left: icon & title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                        
                        {editingSessionId === session.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveRename(session.id)}
                            onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black/10 dark:bg-white/10 text-xs px-1.5 py-0.5 rounded focus:outline-none w-full text-gray-900 dark:text-white"
                          />
                        ) : (
                          <span className="text-xs truncate">{session.title}</span>
                        )}
                      </div>

                      {/* Right: action hover buttons */}
                      {editingSessionId !== session.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); onTogglePinSession(session.id); }}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-orange-400"
                            title="Pin chat"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavoriteSession(session.id); }}
                            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${session.favorite ? 'text-amber-500' : 'text-gray-400'}`}
                            title="Favorite chat"
                          >
                            <Star className={`w-3.5 h-3.5 ${session.favorite ? 'fill-amber-500' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => startRename(session, e)}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            title="Rename"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 text-gray-400 dark:text-gray-600">
                  <MessageCircle className="w-8 h-8 stroke-[1.2] mx-auto mb-1.5 text-gray-300 dark:text-gray-700" />
                  <p className="text-[11px]">Belum ada riwayat obrolan</p>
                  <p className="text-[10px] mt-0.5 opacity-70">Mulai chat baru sekarang.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation Links */}
          <div className="shrink-0 p-3 border-t border-black/5 dark:border-white/5 space-y-1">
            <button
              onClick={() => onOpenTab('prompts')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
            >
              <BookOpen className="w-4.5 h-4.5 text-[#4F8CFF] group-hover:scale-110 transition-transform" />
              Prompt Library
            </button>
            <button
              onClick={() => onOpenTab('settings')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
            >
              <Sliders className="w-4.5 h-4.5 text-[#7C5CFF] group-hover:scale-110 transition-transform" />
              Pengaturan UI
            </button>
            <button
              onClick={() => onOpenTab('contact')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
            >
              <MessageCircle className="w-4.5 h-4.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              Contact Developer
            </button>
            <button
              onClick={() => onOpenTab('about')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group"
            >
              <Info className="w-4.5 h-4.5 text-[#00D4FF] group-hover:scale-110 transition-transform" />
              Tentang Aplikasi
            </button>
          </div>
        </div>

        {/* DRAG Div Handle for Desktop */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 h-full cursor-col-resize hover:bg-[#4F8CFF]/50 active:bg-[#4F8CFF] bg-transparent transition-colors z-50 select-none hidden lg:block"
          title="Drag to resize sidebar"
        />
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={() => onToggleOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
}
