import fs from 'fs';
import path from 'path';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'developer';
  registeredAt: string;
  lastActiveAt: string;
  isOnline: boolean;
  status: 'active' | 'suspended';
  tokenUsage: number;
  messageCount: number;
  sessionCount: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  totalMessages: number;
  totalTokens: number;
  avgResponseTimeMs: number;
  apiRequestCount: number;
}

const isVercel = process.env.VERCEL === '1';
const BUNDLED_DB_DIR = path.join(process.cwd(), 'data');
const BUNDLED_DB_FILE = path.join(BUNDLED_DB_DIR, 'db.json');

const DB_DIR = isVercel ? '/tmp' : BUNDLED_DB_DIR;
const DB_FILE = isVercel ? '/tmp/db.json' : BUNDLED_DB_FILE;

export const DEVELOPER_EMAILS = [
  'andrar1712@gmail.com',
  'andrawebdev@gmail.com',
  'andrar1713@gmail.com'
];

// In-memory cache & fallback in case of filesystem issues or when scaling horizontally
let memoryDbCache: any = null;

// Ensure database directory and file exist
function initializeDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const defaultDeveloper: DbUser = {
      id: 'dev-andra-1712',
      name: 'Andra Developer',
      email: 'andrar1712@gmail.com',
      password: 'Andra1712@', // Secure but simple for direct matching
      role: 'developer',
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isOnline: false,
      status: 'active',
      tokenUsage: 0,
      messageCount: 0,
      sessionCount: 0,
    };

    if (!fs.existsSync(DB_FILE)) {
      let initialData = null;
      
      // Try to seed from bundled DB if on Vercel
      if (isVercel && fs.existsSync(BUNDLED_DB_FILE)) {
        try {
          initialData = JSON.parse(fs.readFileSync(BUNDLED_DB_FILE, 'utf-8'));
        } catch (e) {
          console.error('Error loading bundled DB file:', e);
        }
      }

      if (!initialData) {
        initialData = {
          users: [defaultDeveloper],
          stats: {
            totalMessages: 0,
            totalTokens: 0,
            avgResponseTimeMs: 120,
            apiRequestCount: 0,
          }
        };
      } else {
        const devExists = initialData.users?.some((u: DbUser) => u.email === 'andrar1712@gmail.com');
        if (!devExists) {
          initialData.users = initialData.users || [];
          initialData.users.push(defaultDeveloper);
        }
      }

      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      memoryDbCache = initialData;
    } else {
      // Read and verify developer account exists
      try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        const devExists = data.users?.some((u: DbUser) => u.email === 'andrar1712@gmail.com');
        if (!devExists) {
          data.users = data.users || [];
          data.users.push(defaultDeveloper);
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
        memoryDbCache = data;
      } catch (e) {
        // Re-create if corrupted
        const initialData = {
          users: [defaultDeveloper],
          stats: {
            totalMessages: 0,
            totalTokens: 0,
            avgResponseTimeMs: 120,
            apiRequestCount: 0,
          }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        memoryDbCache = initialData;
      }
    }
  } catch (err) {
    console.error('Database initialization caught non-blocking error:', err);
  }
}

// Load DB helper
function readDb() {
  initializeDb();
  if (memoryDbCache) {
    // Self-healing: Ensure any user in the developer list has 'developer' role
    let modified = false;
    if (memoryDbCache.users && Array.isArray(memoryDbCache.users)) {
      memoryDbCache.users = memoryDbCache.users.map((u: DbUser) => {
        if (DEVELOPER_EMAILS.includes(u.email.toLowerCase().trim()) && u.role !== 'developer') {
          u.role = 'developer';
          modified = true;
        }
        return u;
      });
    }
    if (modified) {
      writeDb(memoryDbCache);
    }
    return memoryDbCache;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    let modified = false;
    if (data.users && Array.isArray(data.users)) {
      data.users = data.users.map((u: DbUser) => {
        if (DEVELOPER_EMAILS.includes(u.email.toLowerCase().trim()) && u.role !== 'developer') {
          u.role = 'developer';
          modified = true;
        }
        return u;
      });
    }
    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
    memoryDbCache = data;
    return data;
  } catch (error) {
    console.error('Error reading database file, using memory fallback:', error);
    if (!memoryDbCache) {
      memoryDbCache = {
        users: [
          {
            id: 'dev-andra-1712',
            name: 'Andra Developer',
            email: 'andrar1712@gmail.com',
            password: 'Andra1712@',
            role: 'developer',
            registeredAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            isOnline: false,
            status: 'active',
            tokenUsage: 0,
            messageCount: 0,
            sessionCount: 0,
          }
        ],
        stats: { totalMessages: 0, totalTokens: 0, avgResponseTimeMs: 120, apiRequestCount: 0 }
      };
    }
    return memoryDbCache;
  }
}

// Save DB helper
function writeDb(data: any) {
  memoryDbCache = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database file, proceeding in memory:', error);
  }
}

export const dbService = {
  // Get all users (Admin view)
  getUsers(): DbUser[] {
    const data = readDb();
    // Dynamically calculate online/offline based on lastActiveAt (heartbeat check)
    const now = Date.now();
    const updatedUsers = data.users.map((u: DbUser) => {
      const lastActive = new Date(u.lastActiveAt).getTime();
      // If inactive for more than 60 seconds, mark as offline
      const isOnline = u.isOnline && (now - lastActive < 60000);
      return { ...u, isOnline };
    });
    return updatedUsers;
  },

  // Find user by email
  findUserByEmail(email: string): DbUser | undefined {
    const users = this.getUsers();
    const normalized = email.toLowerCase().trim();
    const found = users.find(u => u.email.toLowerCase() === normalized);
    if (found) return found;

    // Self-healing: if it is a developer email but not found (e.g., on Vercel temporary instances),
    // automatically register and return it!
    if (DEVELOPER_EMAILS.includes(normalized)) {
      const regResult = this.registerUser('Andra Developer', normalized, undefined, 'developer');
      if (regResult.success && regResult.user) {
        return regResult.user;
      }
    }
    return undefined;
  },

  // Register a new user
  registerUser(name: string, email: string, password?: string, role?: 'user' | 'developer'): { success: boolean; user?: DbUser; message: string } {
    const data = readDb();
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = data.users.find((u: DbUser) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      // If it exists but role needs upgrading to developer, do it here
      if (DEVELOPER_EMAILS.includes(normalizedEmail) && existingUser.role !== 'developer') {
        existingUser.role = 'developer';
        writeDb(data);
      }
      return { success: true, user: existingUser, message: 'Email sudah terdaftar!' };
    }

    const newUser: DbUser = {
      id: 'usr-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      email: normalizedEmail,
      password: password, // For Google accounts this can be empty
      role: role || (DEVELOPER_EMAILS.includes(normalizedEmail) ? 'developer' : 'user'),
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isOnline: true,
      status: 'active',
      tokenUsage: 0,
      messageCount: 0,
      sessionCount: 0,
    };

    data.users.push(newUser);
    writeDb(data);

    return { success: true, user: newUser, message: 'Registrasi berhasil!' };
  },

  // Verify login credentials
  loginUser(email: string, password?: string, isGoogle: boolean = false, name?: string): { success: boolean; user?: DbUser; message: string } {
    const data = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = data.users.findIndex((u: DbUser) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      if (isGoogle) {
        // Auto-register google users
        const defaultName = name || email.split('@')[0];
        const regResult = this.registerUser(defaultName, email);
        if (regResult.success && regResult.user) {
          // Update active status
          const updatedData = readDb();
          const freshUserIdx = updatedData.users.findIndex((u: DbUser) => u.id === regResult.user!.id);
          if (freshUserIdx !== -1) {
            updatedData.users[freshUserIdx].isOnline = true;
            updatedData.users[freshUserIdx].lastActiveAt = new Date().toISOString();
            writeDb(updatedData);
          }
          return { success: true, user: regResult.user, message: 'Login Google Berhasil' };
        }
        return { success: false, message: 'Gagal meregistrasikan akun Google baru.' };
      }
      return { success: false, message: 'Email tidak ditemukan!' };
    }

    const user = data.users[userIndex];

    if (user.status === 'suspended') {
      return { success: false, message: 'Akun Anda telah ditangguhkan oleh Developer!' };
    }

    if (!isGoogle) {
      if (!user.password || user.password !== password) {
        return { success: false, message: 'Password salah!' };
      }
    } else if (name && user.name !== name) {
      user.name = name;
    }

    // Set online status and update active timestamp
    user.isOnline = true;
    user.lastActiveAt = new Date().toISOString();
    data.users[userIndex] = user;
    writeDb(data);

    return { success: true, user, message: 'Login berhasil!' };
  },

  // Update user's heartbeat (liveness check)
  updateHeartbeat(email: string): boolean {
    const data = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = data.users.findIndex((u: DbUser) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex !== -1) {
      data.users[userIndex].isOnline = true;
      data.users[userIndex].lastActiveAt = new Date().toISOString();
      writeDb(data);
      return true;
    }
    return false;
  },

  // Set user's offline status manually on logout
  logoutUser(email: string): void {
    const data = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = data.users.findIndex((u: DbUser) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex !== -1) {
      data.users[userIndex].isOnline = false;
      writeDb(data);
    }
  },

  // Track chat usage increments (messages, tokens, sessions)
  trackUsage(email: string, tokens: number, messages: number = 1, isNewSession: boolean = false): void {
    const data = readDb();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = data.users.findIndex((u: DbUser) => u.email.toLowerCase() === normalizedEmail);

    // Increment global system stats too
    data.stats.totalMessages = (data.stats.totalMessages || 0) + messages;
    data.stats.totalTokens = (data.stats.totalTokens || 0) + tokens;
    data.stats.apiRequestCount = (data.stats.apiRequestCount || 0) + 1;

    if (userIndex !== -1) {
      data.users[userIndex].tokenUsage = (data.users[userIndex].tokenUsage || 0) + tokens;
      data.users[userIndex].messageCount = (data.users[userIndex].messageCount || 0) + messages;
      if (isNewSession) {
        data.users[userIndex].sessionCount = (data.users[userIndex].sessionCount || 0) + 1;
      }
      data.users[userIndex].lastActiveAt = new Date().toISOString();
      data.users[userIndex].isOnline = true;
    }

    writeDb(data);
  },

  // Admin: Suspend or Reactivate a user
  toggleUserSuspension(userId: string): { success: boolean; user?: DbUser; message: string } {
    const data = readDb();
    const userIdx = data.users.findIndex((u: DbUser) => u.id === userId);

    if (userIdx === -1) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const user = data.users[userIdx];
    if (user.role === 'developer') {
      return { success: false, message: 'Tidak dapat menangguhkan akun developer utama!' };
    }

    user.status = user.status === 'suspended' ? 'active' : 'suspended';
    data.users[userIdx] = user;
    writeDb(data);

    return { success: true, user, message: `Status akun diubah menjadi ${user.status}` };
  },

  // Admin: Toggle a user's role (user <-> developer)
  toggleUserRole(userId: string): { success: boolean; user?: DbUser; message: string } {
    const data = readDb();
    const userIdx = data.users.findIndex((u: DbUser) => u.id === userId);

    if (userIdx === -1) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    const user = data.users[userIdx];
    if (DEVELOPER_EMAILS.includes(user.email.toLowerCase().trim())) {
      return { success: false, message: 'Tidak dapat mengubah peran akun developer utama!' };
    }

    user.role = user.role === 'developer' ? 'user' : 'developer';
    data.users[userIdx] = user;
    writeDb(data);

    return { success: true, user, message: `Peran akun diubah menjadi ${user.role}` };
  },

  // Admin: Delete a user
  deleteUser(userId: string): { success: boolean; message: string } {
    const data = readDb();
    const userIdx = data.users.findIndex((u: DbUser) => u.id === userId);

    if (userIdx === -1) {
      return { success: false, message: 'User tidak ditemukan' };
    }

    if (data.users[userIdx].role === 'developer') {
      return { success: false, message: 'Tidak dapat menghapus developer utama!' };
    }

    data.users.splice(userIdx, 1);
    writeDb(data);

    return { success: true, message: 'User berhasil dihapus' };
  },

  // Get administrative global stats
  getAdminStats(): SystemStats {
    const users = this.getUsers();
    const data = readDb();
    
    const activeUsers = users.filter(u => u.isOnline).length;
    const offlineUsers = users.length - activeUsers;

    return {
      totalUsers: users.length,
      activeUsers,
      offlineUsers,
      totalMessages: data.stats.totalMessages || 0,
      totalTokens: data.stats.totalTokens || 0,
      avgResponseTimeMs: data.stats.avgResponseTimeMs || 120,
      apiRequestCount: data.stats.apiRequestCount || 0,
    };
  }
};
