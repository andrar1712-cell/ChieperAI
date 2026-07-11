import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Sliders, Info, BookOpen, MessageCircle, Moon, Sun, 
  Menu, ChevronLeft, ChevronRight, Check, RotateCcw, AlertTriangle, Undo
} from 'lucide-react';
import { ChatSession, Settings, ActiveTab, Message, ThemeType, AttachedFile, AuthUser } from './types';
import { storage, DEFAULT_SETTINGS } from './utils/storage';
import RunningTicker from './components/RunningTicker';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import PromptLibraryModal from './components/PromptLibraryModal';
import ContactModal from './components/ContactModal';
import AboutModal from './components/AboutModal';
import AuthScreen from './components/AuthScreen';
import DeveloperConsole from './components/DeveloperConsole';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal Open States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Undo Delete State
  const [lastDeletedSession, setLastDeletedSession] = useState<ChatSession | null>(null);
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('chieper_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('chieper_user');
      }
    }

    const savedSettings = storage.getSettings();
    setSettings(savedSettings);
    applyTheme(savedSettings.theme);

    const savedSessions = storage.getSessions();
    setSessions(savedSessions);

    const savedActiveId = storage.getActiveSessionId();
    if (savedActiveId && savedSessions.some(s => s.id === savedActiveId)) {
      setActiveSessionId(savedActiveId);
    } else if (savedSessions.length > 0) {
      setActiveSessionId(savedSessions[0].id);
    }
  }, []);

  // Heartbeat / Liveness liveness check
  useEffect(() => {
    if (!currentUser) return;
    
    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
        const data = await res.json();
        if (data.success && data.user) {
          const freshUser = data.user;
          // Dynamically sync updated properties (like role upgrades) on-the-fly
          if (
            freshUser.role !== currentUser.role ||
            freshUser.name !== currentUser.name ||
            freshUser.status !== currentUser.status
          ) {
            setCurrentUser(freshUser);
            localStorage.setItem('chieper_user', JSON.stringify(freshUser));
          }
        }
      } catch (err) {
        console.warn('Liveness heartbeat error:', err);
      }
    };

    sendHeartbeat(); // run immediately
    const interval = setInterval(sendHeartbeat, 25000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
      } catch (err) {
        console.warn('Logout endpoint failed:', err);
      }
    }
    setCurrentUser(null);
    setActiveTab('chat');
    localStorage.removeItem('chieper_user');
    showToast('Anda berhasil keluar dari sistem.');
  };

  // Monitor window resize to adjust sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(storage.getSidebarOpen());
      }
    };
    window.addEventListener('resize', handleResize);
    // Run immediately to establish initial responsive layout state
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // System theme change listener (for Auto theme)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'auto') {
        applyTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // Apply Theme Helper
  const applyTheme = (theme: ThemeType) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // auto
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + N: New Chat
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateSession();
      }
      // Alt + S: Toggle Sidebar
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const nextVal = !isSidebarOpen;
        setIsSidebarOpen(nextVal);
        storage.setSidebarOpen(nextVal);
      }
      // Alt + P: Open Settings
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessions, isSidebarOpen]);

  // Toast notifications helper
  const showToast = (message: string, actionLabel?: string, onAction?: () => void) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, actionLabel, onAction });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 6000); // 6s duration for premium usability
  };

  const handleCreateSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Obrolan Baru',
      messages: [],
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      pinned: false,
      favorite: false
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    storage.saveSessions(updated);
    setActiveSessionId(newSession.id);
    storage.setActiveSessionId(newSession.id);
    setActiveTab('chat');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    storage.setActiveSessionId(id);
    setActiveTab('chat');
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, title: newTitle } : s);
    setSessions(updated);
    storage.saveSessions(updated);
    showToast('Nama obrolan berhasil diubah!');
  };

  const handleDeleteSession = (id: string) => {
    const sessionToDelete = sessions.find(s => s.id === id);
    if (!sessionToDelete) return;

    setLastDeletedSession(sessionToDelete);
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    storage.saveSessions(updated);

    if (activeSessionId === id) {
      const nextActive = updated.length > 0 ? updated[0].id : null;
      setActiveSessionId(nextActive);
      storage.setActiveSessionId(nextActive);
    }

    // Show Undo Toast
    showToast('Obrolan telah dihapus', 'Batal', () => {
      const restored = [sessionToDelete, ...updated];
      setSessions(restored);
      storage.saveSessions(restored);
      setActiveSessionId(sessionToDelete.id);
      storage.setActiveSessionId(sessionToDelete.id);
      showToast('Obrolan berhasil dipulihkan!');
    });
  };

  const handleTogglePinSession = (id: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
    // Sort: pinned first
    const sorted = [...updated].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
    setSessions(sorted);
    storage.saveSessions(sorted);
  };

  const handleToggleFavoriteSession = (id: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s);
    setSessions(updated);
    storage.saveSessions(updated);
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    storage.saveSessions([]);
    setActiveSessionId(null);
    storage.setActiveSessionId(null);
    showToast('Semua riwayat obrolan telah dibersihkan.');
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    applyTheme(newSettings.theme);
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setSessions([]);
    setActiveSessionId(null);
    setSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    setIsSettingsOpen(false);
    showToast('Semua data aplikasi telah dihapus.');
  };

  const handleOpenTab = (tab: ActiveTab) => {
    if (tab === 'settings') setIsSettingsOpen(true);
    if (tab === 'prompts') setIsPromptsOpen(true);
    if (tab === 'contact') setIsContactOpen(true);
    if (tab === 'about') setIsAboutOpen(true);
  };

  // TITLE GENERATOR based on first query
  const generateTitle = (text: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= 4) return text;
    return words.slice(0, 4).join(' ') + '...';
  };

  // SEND MESSAGE handler with dynamic streaming reader
  const handleSendMessage = async (text: string, files?: AttachedFile[]) => {
    let currentSessionId = activeSessionId;
    let updatedSessions = [...sessions];

    // 1. Auto-create session if none active
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: generateTitle(text),
        messages: [],
        createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        pinned: false,
        favorite: false
      };
      updatedSessions = [newSession, ...sessions];
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
      storage.setActiveSessionId(newSession.id);
    }

    // 2. Format user message
    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      files: files || []
    };

    const activeSessionIndex = updatedSessions.findIndex(s => s.id === currentSessionId);
    if (activeSessionIndex === -1) return;

    const activeSession = updatedSessions[activeSessionIndex];
    // Rename title if it's the first message
    if (activeSession.messages.length === 0) {
      activeSession.title = generateTitle(text);
    }

    activeSession.messages = [...activeSession.messages, userMessage];
    setSessions(updatedSessions);
    storage.saveSessions(updatedSessions);

    // Track statistics locally
    storage.addTokenUsage(0, 1);

    // 3. Initiate API stream connection
    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Append loading skeletal assistant reply
      const assistantMsgId = Date.now().toString() + '-assistant';
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      activeSession.messages = [...activeSession.messages, assistantMessage];
      setSessions([...updatedSessions]);

      // Call Express proxy endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: activeSession.messages.slice(0, -1), // send context
          temperature: 0.7,
          userEmail: currentUser?.email,
          isNewSession: activeSession.messages.length <= 2
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error('Gagal menginisialisasi aliran data.');
      }

      let accumulatedText = '';
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Save the last incomplete line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const rawData = trimmed.slice(6).trim();
            if (rawData === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.error) {
                accumulatedText = parsed.error;
                break;
              }
              if (parsed.text) {
                accumulatedText += parsed.text;

                // Update text state dynamically with a functional state update to trigger proper re-renders
                setSessions(prevSessions => {
                  return prevSessions.map(s => {
                    if (s.id === currentSessionId) {
                      const updatedMessages = s.messages.map(m => {
                        if (m.id === assistantMsgId) {
                          return { ...m, content: accumulatedText };
                        }
                        return m;
                      });
                      return { ...s, messages: updatedMessages };
                    }
                    return s;
                  });
                });
              }
            } catch {
              // ignore partial line parsing issues
            }
          }
        }
      }

      // Finish streaming, compute tokens, and store
      setSessions(prevSessions => {
        const finalSessions = prevSessions.map(s => {
          if (s.id === currentSessionId) {
            const updatedMessages = s.messages.map(m => {
              if (m.id === assistantMsgId) {
                const estimatedTokens = Math.ceil(accumulatedText.length / 3.5) + Math.ceil(text.length / 3.5);
                storage.addTokenUsage(estimatedTokens, 1);
                return { ...m, content: accumulatedText, tokens: estimatedTokens };
              }
              return m;
            });
            return { ...s, messages: updatedMessages };
          }
          return s;
        });
        
        // Save to local storage after calculating
        storage.saveSessions(finalSessions);
        return finalSessions;
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Streaming dihentikan oleh pengguna.');
      } else {
        console.error('Fetch stream error:', error);
        const refreshedSessions = [...updatedSessions];
        const sessionToUpdate = refreshedSessions.find(s => s.id === currentSessionId);
        if (sessionToUpdate) {
          sessionToUpdate.messages = [
            ...sessionToUpdate.messages.slice(0, -1),
            {
              id: Date.now().toString() + '-err',
              role: 'assistant',
              content: `Maaf, terjadi kendala saat menghubungi server AI: ${error.message || 'Koneksi terputus.'}`,
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            }
          ];
          setSessions(refreshedSessions);
          storage.saveSessions(refreshedSessions);
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // EDIT HISTORIC PROMPT (Double-click feature)
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeSessionId) return;
    const updatedSessions = [...sessions];
    const activeSession = updatedSessions.find(s => s.id === activeSessionId);
    if (!activeSession) return;

    const msgIndex = activeSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // Replace user prompt and slice any messages downstream
    activeSession.messages[msgIndex].content = newContent;
    activeSession.messages = activeSession.messages.slice(0, msgIndex + 1);

    setSessions(updatedSessions);
    storage.saveSessions(updatedSessions);

    // Stream fresh response based on the new truncated context
    await handleSendMessage(newContent);
  };

  // REGENERATE Response
  const handleRegenerateResponse = async () => {
    if (!activeSessionId || isGenerating) return;
    const updatedSessions = [...sessions];
    const activeSession = updatedSessions.find(s => s.id === activeSessionId);
    if (!activeSession || activeSession.messages.length === 0) return;

    // Pull last assistant message from stack
    const lastMsg = activeSession.messages[activeSession.messages.length - 1];
    if (lastMsg.role === 'assistant') {
      activeSession.messages = activeSession.messages.slice(0, -1);
    }

    if (activeSession.messages.length === 0) return;

    const lastUserMsg = activeSession.messages[activeSession.messages.length - 1];
    const userText = lastUserMsg.content;

    // Pop the user message temporarily to pass it to handleSendMessage
    activeSession.messages = activeSession.messages.slice(0, -1);
    setSessions(updatedSessions);
    storage.saveSessions(updatedSessions);

    await handleSendMessage(userText);
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      showToast('Generasi jawaban dihentikan.');
    }
  };

  const handleContinueGenerating = async () => {
    if (!activeSessionId || isGenerating) return;
    await handleSendMessage('Lanjutkan jawaban sebelumnya.');
  };

  const handleTogglePinActive = () => {
    if (!activeSessionId) return;
    handleTogglePinSession(activeSessionId);
  };

  const handleToggleFavoriteActive = () => {
    if (!activeSessionId) return;
    handleToggleFavoriteSession(activeSessionId);
  };

  // Active Session Finder
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  if (!currentUser) {
    return (
      <AuthScreen 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('chieper_user', JSON.stringify(user));
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden dark:bg-[#090909] bg-[#F8F9FC] text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* 1. Premium Infinite Running Text */}
      <RunningTicker />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 2. Responsive Sidebar with resizer drag */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          settings={settings}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onTogglePinSession={handleTogglePinSession}
          onToggleFavoriteSession={handleToggleFavoriteSession}
          onClearAllSessions={handleClearAllSessions}
          onOpenTab={handleOpenTab}
          isOpen={isSidebarOpen}
          onToggleOpen={(open) => {
            setIsSidebarOpen(open);
            storage.setSidebarOpen(open);
          }}
          currentUser={currentUser}
          activeTab={activeTab}
          onSetActiveTab={setActiveTab}
          onLogout={handleLogout}
        />

        {/* Outer Sidebar Toggle Grip for Desktops */}
        <div className="hidden lg:flex flex-col justify-center h-full absolute z-10 select-none pointer-events-none" style={{ left: isSidebarOpen ? 'auto' : '10px' }}>
          <button
            onClick={() => {
              const nextVal = !isSidebarOpen;
              setIsSidebarOpen(nextVal);
              storage.setSidebarOpen(nextVal);
            }}
            className="p-1.5 rounded-r-xl border-y border-r border-black/5 dark:border-white/10 dark:bg-[#090909]/95 bg-white/95 shadow text-gray-400 hover:text-gray-800 dark:hover:text-white pointer-events-auto active:scale-95 transition-all"
            title={isSidebarOpen ? 'Sembunyikan Sidebar (Alt+S)' : 'Tampilkan Sidebar (Alt+S)'}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* 3. Core Chat Area OR Developer Dashboard */}
        {activeTab === 'admin' && currentUser?.role === 'developer' ? (
          <DeveloperConsole currentUser={currentUser} onBackToChat={() => setActiveTab('chat')} />
        ) : (
          <ChatArea
            session={activeSession}
            settings={settings}
            isGenerating={isGenerating}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onRegenerateResponse={handleRegenerateResponse}
            onStopGenerating={handleStopGenerating}
            onContinueGenerating={handleContinueGenerating}
            onTogglePin={handleTogglePinActive}
            onToggleFavorite={handleToggleFavoriteActive}
            onSelectSuggestion={handleSendMessage}
          />
        )}
      </div>

      {/* Modals Controllers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onClearAll={handleClearAllData}
      />

      <PromptLibraryModal
        isOpen={isPromptsOpen}
        onClose={() => setIsPromptsOpen(false)}
        settings={settings}
        onSelectPrompt={(text) => handleSendMessage(text)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        settings={settings}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        settings={settings}
      />

      {/* 4. Beautiful Glassmorphic Floating Undo Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 p-4 max-w-sm rounded-2xl border border-white/10 dark:bg-[#090909]/90 bg-white/90 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4 animate-float">
          <span className="text-xs font-semibold">{toast.message}</span>
          {toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#4F8CFF]/15 text-[#4F8CFF] text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
              {toast.actionLabel || 'Batal'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
