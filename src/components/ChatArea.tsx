import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Send, Copy, Check, Sparkles, Pin, Star, Trash2, Edit2, 
  ArrowDown, Loader2, Play, Square, RefreshCw, FileText, Download, 
  Printer, Share2, Clipboard, MessageSquareHeart, Paperclip, X, Image, Eye,
  Mic, MicOff
} from 'lucide-react';
import { ChatSession, Message, Settings, AttachedFile } from '../types';
import logoImg from '../assets/images/chieperai_logo_1783699616048.jpg';

interface ChatAreaProps {
  session: ChatSession | null;
  settings: Settings;
  isGenerating: boolean;
  onSendMessage: (text: string, files?: AttachedFile[]) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerateResponse: () => void;
  onStopGenerating: () => void;
  onContinueGenerating: () => void;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onSelectSuggestion: (text: string) => void;
}

// Separate Component for Beautiful Code Blocks with Syntax Look and Copy
interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-white/10 overflow-hidden dark:bg-[#0c0c0c] bg-gray-900 shadow-xl max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 dark:bg-[#151515] bg-gray-800 text-xs text-gray-400 dark:text-gray-500 font-mono select-none border-b border-white/5">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      {/* Content */}
      <div className="p-4 overflow-x-auto font-mono text-xs text-gray-200 leading-relaxed scrollbar-thin">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
}

export default function ChatArea({
  session,
  settings,
  isGenerating,
  onSendMessage,
  onEditMessage,
  onRegenerateResponse,
  onStopGenerating,
  onContinueGenerating,
  onTogglePin,
  onToggleFavorite,
  onSelectSuggestion,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedEntire, setCopiedEntire] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const copyMessageContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Web Speech API / Voice Recording States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung Web Speech API / Perekaman Suara. Harap gunakan browser Google Chrome atau Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'id-ID';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let resultText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            resultText += event.results[i][0].transcript;
          }
        }
        if (resultText) {
          setInput(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${resultText.trim()}` : resultText.trim();
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Akses mikrofon ditolak. Harap izinkan akses mikrofon di pengaturan browser Anda.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // File Staging and Drag States
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // File loading and parsing logic
  const processFiles = (filesList: FileList) => {
    const filesArray = Array.from(filesList);
    
    filesArray.forEach(file => {
      const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      const fileType = file.type;
      const isImage = fileType.startsWith('image/');
      const isPdf = fileType === 'application/pdf';
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      const textExtensions = ['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'csv', 'py', 'go', 'rs', 'c', 'cpp', 'java', 'sh', 'yaml', 'yml', 'ini', 'conf'];
      const isText = fileType.startsWith('text/') || (ext && textExtensions.includes(ext));

      const newAttachedFile: AttachedFile = {
        id,
        name: file.name,
        type: fileType || 'application/octet-stream',
        size: file.size
      };

      if (isImage || isPdf) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newAttachedFile.base64 = e.target.result as string;
            setAttachedFiles(prev => [...prev, newAttachedFile]);
          }
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newAttachedFile.content = e.target.result as string;
            setAttachedFiles(prev => [...prev, newAttachedFile]);
          }
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newAttachedFile.base64 = e.target.result as string;
            setAttachedFiles(prev => [...prev, newAttachedFile]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Quick Suggestion Prompts
  const suggestions = [
    { text: 'Optimize code', label: 'Optimize Code', desc: 'Refactor kode ke prinsip clean code.' },
    { text: 'Outline an essay', label: 'Essay Outline', desc: 'Kerangka akademis berstruktur tajam.' },
    { text: 'Design UI Feedback', label: 'UI/UX Feedback', desc: 'Rekomendasi visual Liquid Glass.' },
    { text: 'Lean Business Canvas', label: 'Business Plan', desc: 'Analisis satu halaman untuk ide bisnis.' }
  ];

  // Auto Scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages?.length, isGenerating]);

  // Monitor Scroll position to show Floating Scroll-To-Bottom Button
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
  };

  const handleSend = () => {
    if ((!input.trim() && attachedFiles.length === 0) || isGenerating) return;
    onSendMessage(input.trim(), attachedFiles);
    setInput('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Double click or trigger to edit past user prompts
  const startEditing = (msg: Message) => {
    if (msg.role !== 'user') return;
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const saveEdit = (id: string) => {
    if (editContent.trim()) {
      onEditMessage(id, editContent.trim());
    }
    setEditingMessageId(null);
  };

  // EXPORT UTILITIES
  const copyEntireChat = () => {
    if (!session || session.messages.length === 0) return;
    const text = session.messages.map(m => `[${m.role.toUpperCase()}] (${m.timestamp})\n${m.content}\n`).join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopiedEntire(true);
    setTimeout(() => setCopiedEntire(false), 2000);
  };

  const exportAsTxt = () => {
    if (!session) return;
    const text = session.messages.map(m => `[${m.role.toUpperCase()}] (${m.timestamp})\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}_history.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsMarkdown = () => {
    if (!session) return;
    const md = `# ${session.title}\n*Dibuat pada: ${session.createdAt}*\n\n` + 
      session.messages.map(m => `### **${m.role === 'user' ? 'User' : 'CHIEPERAI'}**\n*Waktu: ${m.timestamp}*\n\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}_history.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-full flex-1 relative overflow-hidden bg-transparent select-text transition-all ${
        isDragging ? 'bg-[#4F8CFF]/5 dark:bg-[#4F8CFF]/5 outline-2 outline-dashed outline-[#4F8CFF] outline-offset-[-4px]' : ''
      }`}
    >
      {/* Drag & Drop Overlay Indicator */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-[#090909]/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none transition-all">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c0c0c] border border-dashed border-[#4F8CFF] shadow-2xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF]">
              <Download className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 text-center">
                Lepaskan File di Sini
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                Kirim dokumen, kode, atau gambar secara langsung ke CHIEPERAI
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Top Controls Bar */}
      {session && (
        <div className="h-14 shrink-0 flex items-center justify-between pl-14 pr-6 lg:px-6 border-b border-black/5 dark:border-white/5 backdrop-blur-md relative z-10 bg-white/40 dark:bg-black/40">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold truncate tracking-tight">{session.title}</h2>
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <span className="text-[10px] bg-black/5 dark:bg-white/5 font-mono text-gray-500 px-2 py-0.5 rounded-full font-bold">
                {session.messages.length} PESAN
              </span>
            </div>
          </div>

          {/* Actions: Pin, Favorite, Copy, Download */}
          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePin}
              className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all ${
                session.pinned ? 'text-orange-400' : 'text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
              title={session.pinned ? 'Lepas Sematan' : 'Sematkan Obrolan'}
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all ${
                session.favorite ? 'text-amber-500' : 'text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
              title={session.favorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
            >
              <Star className={`w-4 h-4 ${session.favorite ? 'fill-amber-500' : ''}`} />
            </button>

            <span className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />

            {/* Export Toolbar */}
            <button
              onClick={copyEntireChat}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all"
              title="Salin Seluruh Obrolan"
            >
              {copiedEntire ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
            </button>

            {/* Dropdown-like simple toolbar items */}
            <button
              onClick={exportAsMarkdown}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all"
              title="Export Markdown (.md)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={exportAsTxt}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all"
              title="Download TXT"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all"
              title="Cetak / Simpan PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area scroll container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin relative print:overflow-visible print:h-auto"
      >
        {session && session.messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {session.messages.map((msg, index) => {
              // Hide empty assistant messages during generation to avoid empty bubbles on screen
              if (msg.role === 'assistant' && !msg.content) {
                return null;
              }
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col group ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                {/* Bubble Outer */}
                <div className="flex gap-3 max-w-[88%] items-start relative">
                  
                  {/* Left Icon (Assistant only) */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white shadow-md shadow-[#4F8CFF]/15 border border-white/10 select-none">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Body */}
                  <div className="flex flex-col">
                    {/* Timestamp & Name */}
                    <div className={`text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1 select-none flex items-center gap-1.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-between w-full'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <span>{msg.role === 'user' ? 'Anda' : 'CHIEPERAI'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => copyMessageContent(msg.id, msg.content)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors select-none font-sans font-medium"
                          title="Salin Pesan"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider">Disalin</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3 h-3" />
                              <span className="text-[9px] uppercase tracking-wider">Salin</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Chat Bubble Glass card */}
                    <div 
                      className={`rounded-2xl border p-4 shadow-sm transition-all relative ${
                        msg.role === 'user'
                          ? 'bg-[#4F8CFF] border-transparent text-white shadow-[#4F8CFF]/10'
                          : 'bg-white/50 border-black/5 dark:bg-white/[0.04] dark:border-white/5 text-gray-800 dark:text-gray-100 backdrop-blur-md'
                      }`}
                      style={{
                        fontSize: `${settings.fontSize}px`,
                        lineHeight: '1.65',
                      }}
                    >
                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-2 min-w-[260px]">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-black/15 border border-white/10 rounded-xl p-2 focus:outline-none font-sans text-white text-sm"
                            rows={3}
                          />
                          <div className="flex gap-1.5 self-end">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(msg.id)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white text-blue-600 shadow"
                            >
                              Save & Regenerate
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="markdown-body prose dark:prose-invert max-w-none break-words">
                          <Markdown
                            components={{
                              code({ node, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeContent = String(children).replace(/\n$/, '');
                                const isInline = !match && !codeContent.includes('\n');
                                
                                if (!isInline) {
                                  return (
                                    <CodeBlock language={match ? match[1] : 'text'} code={codeContent} />
                                  );
                                }
                                return (
                                  <code className="bg-black/10 dark:bg-white/10 text-[#7C5CFF] font-semibold dark:text-[#00D4FF] rounded px-1.5 py-0.5 text-xs font-mono" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </Markdown>
                        </div>
                      )}

                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex flex-wrap gap-2">
                          {msg.files.map((file) => {
                            const isImage = file.type.startsWith('image/');
                            return (
                              <div 
                                key={file.id} 
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs max-w-[240px] border ${
                                  msg.role === 'user' 
                                    ? 'bg-white/10 border-white/10 text-white hover:bg-white/15' 
                                    : 'bg-black/5 border-black/5 dark:bg-white/5 dark:border-white/5 text-gray-800 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10'
                                } transition-all`}
                              >
                                {isImage && file.base64 ? (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/15 flex-shrink-0">
                                    <img 
                                      src={file.base64} 
                                      alt={file.name} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 text-white flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold truncate">{file.name}</div>
                                  <div className="text-[10px] opacity-75">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    if (file.base64) {
                                      link.href = file.base64;
                                    } else if (file.content) {
                                      const blob = new Blob([file.content], { type: file.type });
                                      link.href = URL.createObjectURL(blob);
                                    }
                                    link.download = file.name;
                                    link.click();
                                  }}
                                  className="p-1 rounded-md hover:bg-black/15 dark:hover:bg-white/15 transition-all flex-shrink-0"
                                  title="Unduh File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Double-click hint or hover controls */}
                    {msg.role === 'user' && editingMessageId !== msg.id && (
                      <button
                        onClick={() => startEditing(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity self-end mt-1 text-[10px] text-gray-400 hover:text-[#4F8CFF] flex items-center gap-1 select-none"
                      >
                        <Edit2 className="w-3 h-3" /> Double-klik / klik untuk edit prompt
                      </button>
                    )}
                  </div>

                </div>

                {/* Conversation Divider between sets */}
                {index < session.messages.length - 1 && (
                  <div className="w-full border-b border-black/[0.02] dark:border-white/[0.02] my-1" />
                )}
              </div>
            );})}

            {/* Skeleton / Thinking Animation during generation */}
            {isGenerating && (!session.messages[session.messages.length - 1] || !session.messages[session.messages.length - 1].content) && (
              <div className="flex gap-3 max-w-[88%] items-start">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white shadow-md animate-spin">
                  <Loader2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="text-[10px] font-mono text-gray-500 mb-1 select-none">
                    CHIEPERAI sedang berpikir...
                  </div>
                  <div className="rounded-2xl border border-black/5 dark:bg-white/[0.04] dark:border-white/5 p-4 flex gap-1 items-center bg-white/50 backdrop-blur-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4F8CFF] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFF] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Empty Chat Area / Dashboard State */
          <div className="h-full flex flex-col justify-center items-center py-12 max-w-2xl mx-auto text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#4F8CFF] via-[#7C5CFF] to-[#00D4FF] p-0.5 shadow-xl animate-float pointer-events-none mb-6">
              <div className="w-full h-full rounded-[22px] dark:bg-[#090909] bg-white flex items-center justify-center overflow-hidden">
                <img 
                  src={logoImg} 
                  alt="CHIEPERAI Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-[#4F8CFF] via-[#7C5CFF] to-[#00D4FF] bg-clip-text text-transparent select-none">
              CHIEPERAI
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-md leading-relaxed select-none">
              Selamat datang! Ajukan pertanyaan apa saja. CHIEPERAI siap membantu Anda menyelesaikan tugas pemrograman, copywriting, esai, hingga rancangan subnetting jaringan.
            </p>

            {/* Prompt Suggestions Grid */}
            <div className="w-full space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none flex items-center justify-center gap-1">
                <MessageSquareHeart className="w-4 h-4 text-[#7C5CFF]" /> Rekomendasi Prompt
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectSuggestion(s.text)}
                    className="p-3.5 text-left rounded-2xl border border-black/5 dark:bg-white/[0.02] dark:border-white/5 dark:hover:bg-white/5 bg-black/[0.01] hover:bg-black/5 hover:-translate-y-0.5 active:translate-y-0 transition-all group"
                  >
                    <span className="block text-xs font-bold group-hover:text-[#4F8CFF] transition-colors">{s.label}</span>
                    <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-normal">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLLERS (Stop generating, Continue response, input bar) */}
      <div className="p-4 shrink-0 border-t border-black/5 dark:border-white/5 backdrop-blur-md relative z-10 bg-white/40 dark:bg-black/40">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          
          {/* Quick action triggers (Stop, Regenerate, Continue) */}
          {session && (
            <div className="flex justify-center items-center gap-2 text-xs font-semibold">
              {isGenerating ? (
                <button
                  onClick={onStopGenerating}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-red-500/15 hover:bg-red-500/20 text-red-500 transition-all animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-red-500" /> Stop Generating
                </button>
              ) : (
                session.messages.length > 0 && (
                  <>
                    <button
                      onClick={onRegenerateResponse}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-full border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate Response
                    </button>
                    <button
                      onClick={onContinueGenerating}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-full border border-[#4F8CFF]/20 bg-[#4F8CFF]/5 hover:bg-[#4F8CFF]/10 text-[#4F8CFF] transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#4F8CFF]" /> Continue Response
                    </button>
                  </>
                )
              )}
            </div>
          )}

          {/* File Staging Area */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl max-h-[160px] overflow-y-auto scrollbar-thin">
              {attachedFiles.map((file) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 bg-white dark:bg-[#151515] border border-black/5 dark:border-white/5 rounded-xl text-xs shadow-sm hover:border-black/10 dark:hover:border-white/10 transition-all"
                  >
                    {isImage && file.base64 ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/15 flex-shrink-0">
                        <img
                          src={file.base64}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/10 dark:bg-white/10 text-gray-500 dark:text-gray-400 flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="max-w-[120px] min-w-[60px]">
                      <div className="font-semibold truncate text-gray-700 dark:text-gray-300">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Voice Recording / Speech Indicator */}
          {isListening && (
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-500 dark:text-red-400 font-mono tracking-wide uppercase">
                  Mendengarkan... Silakan Berbicara
                </span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="w-1 h-3 bg-red-500/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-red-500/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-red-500/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1 h-5 bg-red-500/80 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
            </div>
          )}

          {/* Core Input box */}
          <div className="relative flex items-center">
            {/* Hidden input for files */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-40"
              title="Unggah File / Dokumen / Gambar"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Speech to text microphone button */}
            <button
              type="button"
              onClick={startSpeechRecognition}
              disabled={isGenerating}
              className={`absolute left-12 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all disabled:opacity-40 ${
                isListening 
                  ? 'bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/30 animate-pulse' 
                  : 'text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={isListening ? 'Hentikan Perekaman Suara' : 'Mulai Perekaman Suara (Voice to Text)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder={isGenerating ? 'Mohon tunggu...' : 'Ketik pesan Anda di sini... (Shift+Enter untuk baris baru)'}
              className="w-full bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 rounded-2xl pl-24 pr-12 py-3.5 text-sm focus:outline-none focus:border-[#4F8CFF]/30 transition-all font-medium resize-none min-h-[50px] max-h-[160px] text-gray-800 dark:text-gray-100 disabled:opacity-50"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isGenerating}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C5CFF] text-white shadow-lg shadow-[#4F8CFF]/15 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer Notice */}
          <div className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-mono select-none">
            CHIEPERAI dapat membuat kekeliruan. Pertimbangkan untuk memverifikasi informasi penting.
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (Scroll to bottom) */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-6 z-20 p-2.5 rounded-full border border-black/5 dark:border-white/10 dark:bg-[#090909]/85 bg-white/85 shadow-lg backdrop-blur-md text-[#4F8CFF] hover:scale-110 active:scale-95 transition-all"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Styled css print sheet only */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide non-printable panels */
          aside, nav, .fixed, .h-14, .border-t, button {
            display: none !important;
          }
          /* Expand main container to max */
          main, .flex-1, .max-w-3xl {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            height: auto !important;
          }
          .prose {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
