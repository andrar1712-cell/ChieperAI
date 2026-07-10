/**
 * Storage utility to manage all user data in local storage safely.
 */
import { ChatSession, Settings, PromptTemplate, TokenUsage } from '../types';

const PREFIX = 'chieperai_';

export const KEYS = {
  SESSIONS: `${PREFIX}sessions`,
  SETTINGS: `${PREFIX}settings`,
  PROMPTS: `${PREFIX}prompts`,
  TOKEN_USAGE: `${PREFIX}token_usage`,
  ACTIVE_SESSION: `${PREFIX}active_session_id`,
  SIDEBAR_OPEN: `${PREFIX}sidebar_open`,
  SIDEBAR_WIDTH: `${PREFIX}sidebar_width`,
};

// Preloaded Premium Prompt Templates across required categories
export const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'p1',
    category: 'Coding',
    title: 'Refactor Code to clean Clean Code',
    promptText: 'Tolong refactor kode berikut agar mengikuti prinsip Clean Code, modular, memiliki penamaan yang deskriptif, dan aman dari kerentanan umum:\n\n```[bahasa]\n// Tulis kode Anda di sini\n```',
    favorite: false
  },
  {
    id: 'p2',
    category: 'Design',
    title: 'Modern UI/UX Design Feedback',
    promptText: 'Saya sedang mendesain sebuah halaman web [nama halaman] dengan konsep Liquid Glassmorphism. Berikan saya feedback kritis dan rekomendasi untuk palet warna, tipografi, struktur hirarki visual, dan mikro-interaksi agar terlihat sangat premium seperti aplikasi Apple.',
    favorite: false
  },
  {
    id: 'p3',
    category: 'Essay',
    title: 'Academic Argumentative Outline',
    promptText: 'Buatlah kerangka esai argumentatif yang mendalam mengenai topik "[Topik]". Esai ini harus mencakup pendahuluan dengan tesis yang kuat, 3 poin utama argumen pendukung beserta bukti teoritisnya, bantahan terhadap kontra-argumen, dan kesimpulan yang menggugah pikiran.',
    favorite: false
  },
  {
    id: 'p4',
    category: 'Business',
    title: 'One-Page Lean Canvas Plan',
    promptText: 'Buatlah Lean Canvas untuk ide bisnis saya: "[Deskripsi Ide Bisnis]". Uraikan Problem, Customer Segments, Unique Value Proposition, Solution, Channels, Revenue Streams, Cost Structure, Key Metrics, dan Unfair Advantage dengan analisis yang tajam.',
    favorite: false
  },
  {
    id: 'p5',
    category: 'Marketing',
    title: 'AIDA Copywriting Strategy',
    promptText: 'Tuliskan salinan pemasaran menggunakan formula AIDA (Attention, Interest, Desire, Action) untuk mempromosikan produk "[Nama Produk]". Produk ini menargetkan audiens [Target Audiens]. Buat gaya bahasanya persuasif, elegan, dan emosional.',
    favorite: false
  },
  {
    id: 'p6',
    category: 'AI',
    title: 'Optimize AI Prompt Efficiency',
    promptText: 'Saya ingin mengoptimalkan prompt AI berikut agar memberikan output yang lebih konsisten, berstruktur JSON, dan meminimalkan halusinasi. Ini prompt asli saya:\n\n"[Tulis prompt Anda di sini]"',
    favorite: false
  },
  {
    id: 'p7',
    category: 'Programming',
    title: 'Explain Complex Algorithm Simply',
    promptText: 'Jelaskan konsep algoritma [Nama Algoritma, misal: Dijkstra atau QuickSort] dengan analogi kehidupan sehari-hari yang sangat mudah dipahami oleh pemula, lalu sertakan contoh implementasi kodenya dalam bahasa TypeScript yang sangat bersih.',
    favorite: false
  },
  {
    id: 'p8',
    category: 'School',
    title: 'Study Guide & Concept Summary',
    promptText: 'Saya sedang mempelajari mata pelajaran/kuliah [Mata Pelajaran] tentang bab "[Nama Bab]". Tolong rangkum konsep-konsep kunci yang paling sering keluar dalam ujian, berikan rumus-rumus pentingnya, dan buat 3 soal latihan beserta pembahasannya yang mudah dimengerti.',
    favorite: false
  },
  {
    id: 'p9',
    category: 'Productivity',
    title: 'Hyper-Focus Time Blocking Routine',
    promptText: 'Saya memiliki waktu 8 jam hari ini untuk menyelesaikan tugas berikut: [Sebutkan tugas-tugas]. Tolong rancang jadwal harian berbasis Time Blocking dengan teknik Pomodoro, waktu istirahat yang optimal, dan strategi meminimalkan distraksi agar produktivitas saya maksimal.',
    favorite: false
  },
  {
    id: 'p10',
    category: 'Social Media',
    title: 'Viral Instagram Hook & Script',
    promptText: 'Rancang 5 ide Hook yang sangat menarik perhatian untuk video Reels Instagram tentang "[Topik]". Setelah itu, tulis 1 naskah lengkap berdurasi 30 detik yang dinamis, memiliki transisi visual yang menyenangkan, dan ajakan bertindak (CTA) yang natural.',
    favorite: false
  },
  {
    id: 'p11',
    category: 'Technology',
    title: 'Emerging Tech Future Analysis',
    promptText: 'Berikan analisis tren masa depan mengenai perkembangan teknologi "[Nama Teknologi, misal: WebAssembly atau Quantum Computing]". Jelaskan tantangan adopsi saat ini, potensi disrupsi industri, dan bagaimana teknologi ini dapat mengubah kehidupan sehari-hari dalam 5 tahun ke depan.',
    favorite: false
  },
  {
    id: 'p12',
    category: 'Cyber Security',
    title: 'Web Application Security Audit Checklist',
    promptText: 'Saya sedang mengembangkan aplikasi web full-stack. Berikan daftar audit keamanan komprehensif untuk mencegah serangan OWASP Top 10 (seperti SQL Injection, XSS, CSRF, Broken Auth) yang sesuai untuk diintegrasikan dalam siklus CI/CD saya.',
    favorite: false
  },
  {
    id: 'p13',
    category: 'Network',
    title: 'Subnetting & Network Design Guide',
    promptText: 'Saya perlu merancang jaringan untuk kantor cabang dengan 3 departemen: Admin (20 host), Technical (50 host), dan Publik (10 host). IP blok yang dialokasikan adalah 192.168.10.0/24. Tolong buatkan skema subnetting VLSM yang paling efisien, lengkap dengan IP network, broadcast, dan range IP yang valid.',
    favorite: false
  },
  {
    id: 'p14',
    category: 'Creative',
    title: 'Sci-Fi Short Story Worldbuilding',
    promptText: 'Bantu saya membangun dunia fiksi ilmiah (worldbuilding) untuk cerita pendek. Dunianya berlatar tahun 2240 di mana [Kondisi Dunia, misal: kota terapung di atas awan racun]. Berikan detail tentang struktur sosial, teknologi energi utama, dan konflik politik utama yang bisa memicu cerita menarik.',
    favorite: false
  },
];

// Default Settings
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 15,
  blurStrength: 16,
  glassOpacity: 0.08,
  animationSpeed: 0.3,
};

export const storage = {
  // --- Settings ---
  getSettings(): Settings {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Sessions (Chat History) ---
  getSessions(): ChatSession[] {
    const data = localStorage.getItem(KEYS.SESSIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveSessions(sessions: ChatSession[]): void {
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  // --- Prompt Library ---
  getPrompts(): PromptTemplate[] {
    const data = localStorage.getItem(KEYS.PROMPTS);
    if (!data) {
      // Initialize with default prompts
      this.savePrompts(DEFAULT_PROMPTS);
      return DEFAULT_PROMPTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_PROMPTS;
    }
  },

  savePrompts(prompts: PromptTemplate[]): void {
    localStorage.setItem(KEYS.PROMPTS, JSON.stringify(prompts));
  },

  // --- Token and Message Usage Tracker ---
  getTokenUsage(): TokenUsage {
    const data = localStorage.getItem(KEYS.TOKEN_USAGE);
    if (!data) return { totalTokens: 0, totalMessages: 0 };
    try {
      return JSON.parse(data);
    } catch {
      return { totalTokens: 0, totalMessages: 0 };
    }
  },

  saveTokenUsage(usage: TokenUsage): void {
    localStorage.setItem(KEYS.TOKEN_USAGE, JSON.stringify(usage));
  },

  addTokenUsage(tokens: number, messagesCount: number = 1): void {
    const current = this.getTokenUsage();
    this.saveTokenUsage({
      totalTokens: current.totalTokens + tokens,
      totalMessages: current.totalMessages + messagesCount,
    });
  },

  // --- Active Session ID ---
  getActiveSessionId(): string | null {
    return localStorage.getItem(KEYS.ACTIVE_SESSION);
  },

  setActiveSessionId(id: string | null): void {
    if (id) {
      localStorage.setItem(KEYS.ACTIVE_SESSION, id);
    } else {
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
    }
  },

  // --- Sidebar States ---
  getSidebarOpen(): boolean {
    const val = localStorage.getItem(KEYS.SIDEBAR_OPEN);
    return val !== 'false'; // defaults to true
  },

  setSidebarOpen(open: boolean): void {
    localStorage.setItem(KEYS.SIDEBAR_OPEN, open ? 'true' : 'false');
  },

  getSidebarWidth(): number {
    const val = localStorage.getItem(KEYS.SIDEBAR_WIDTH);
    if (!val) return 280;
    const num = parseInt(val, 10);
    return isNaN(num) ? 280 : num;
  },

  setSidebarWidth(width: number): void {
    localStorage.setItem(KEYS.SIDEBAR_WIDTH, width.toString());
  }
};
