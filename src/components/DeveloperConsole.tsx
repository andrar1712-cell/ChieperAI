import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Activity, ShieldAlert, Cpu, Database, Cpu as Ram, HardDrive,
  Plus, Search, RefreshCw, Trash2, Ban, ShieldCheck, Mail, Key, UserPlus, X, Zap, Circle
} from 'lucide-react';
import { AuthUser } from '../types';

interface DeveloperConsoleProps {
  currentUser: AuthUser;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  offlineUsers: number;
  totalMessages: number;
  totalTokens: number;
  avgResponseTimeMs: number;
  apiRequestCount: number;
}

export default function DeveloperConsole({ currentUser }: DeveloperConsoleProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    offlineUsers: 0,
    totalMessages: 0,
    totalTokens: 0,
    avgResponseTimeMs: 120,
    apiRequestCount: 0
  });

  // UI Control states
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'offline' | 'suspended'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'developer'>('user');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Simulated metrics for premium feel
  const [simMetrics, setSimMetrics] = useState({
    cpu: 28,
    ram: 64,
    disk: 42,
    netTraffic: '2.4 MB/s'
  });

  // Refresh data from Express server
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'x-admin-email': currentUser.email }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Load users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'x-admin-email': currentUser.email }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error loading developer console data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [refreshTrigger]);

  // Update simulated metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSimMetrics({
        cpu: Math.floor(Math.random() * 25) + 15, // 15-40%
        ram: Math.floor(Math.random() * 5) + 60,  // 60-65%
        disk: 42,
        netTraffic: (Math.random() * 3 + 1).toFixed(1) + ' MB/s'
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle Action: Toggle User Suspension (Active/Banned)
  const handleToggleSuspension = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users/toggle-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-email': currentUser.email
        },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Handle Action: Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini secara permanen dari database?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser.email
        },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle Action: Create User Manual
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      setFormError('Semua field wajib diisi!');
      return;
    }

    try {
      const res = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser.email
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal menambahkan user baru.');
        return;
      }

      setFormSuccess('User baru berhasil ditambahkan!');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
      }, 1200);
    } catch (error) {
      console.error('Error creating user:', error);
      setFormError('Terjadi kesalahan jaringan.');
    }
  };

  // Filtering Logic
  const filteredUsers = users.filter(u => {
    const matchQuery = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchQuery) return false;

    if (filter === 'active') return u.isOnline;
    if (filter === 'offline') return !u.isOnline;
    if (filter === 'suspended') return u.status === 'suspended';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#09090b] text-gray-100 select-text">
      
      {/* Upper header action area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            DEVELOPER MONITORING CONSOLE
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Pantau dan kelola aktivitas pengguna, performa server, dan konsumsi API secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#4f8cff] to-[#7c5cff] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#4f8cff]/10 hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* 1. KEY METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        <div className="p-5 rounded-2xl bg-[#0f0f13] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Pengguna</div>
            <div className="text-2xl font-black mt-0.5">{stats.totalUsers}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Terdaftar di DB</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f0f13] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Aktif (Online)</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{stats.activeUsers}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Sesi aktif berjalan</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f0f13] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Offline</div>
            <div className="text-2xl font-black text-gray-400 mt-0.5">{stats.offlineUsers}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Tidak ada aktivitas</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f0f13] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Request</div>
            <div className="text-2xl font-black text-purple-400 mt-0.5">{stats.apiRequestCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{stats.totalMessages} Pesan Terkirim</div>
          </div>
        </div>

      </div>

      {/* 2. INFRASTRUCTURE & API STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* System Server Resources (Simulated) */}
        <div className="p-5 rounded-2xl bg-[#0f0f13] border border-white/5 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-gray-400" />
            Sumber Daya Server & Performa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* CPU */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
                <span>Beban CPU</span>
                <span className="text-yellow-400">{simMetrics.cpu}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-1000"
                  style={{ width: `${simMetrics.cpu}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500 mt-1.5 flex justify-between">
                <span>Core: 4 vCPU</span>
                <span>Stat: Stabil</span>
              </div>
            </div>

            {/* RAM */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
                <span>Penggunaan RAM</span>
                <span className="text-blue-400">{simMetrics.ram}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-[#7c5cff] transition-all duration-1000"
                  style={{ width: `${simMetrics.ram}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500 mt-1.5 flex justify-between">
                <span>8 GB Alokasi</span>
                <span>Sisa: 2.8 GB</span>
              </div>
            </div>

            {/* DISK / Database Status */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
                <span>Penyimpanan DB</span>
                <span className="text-emerald-400">{simMetrics.disk}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                  style={{ width: `${simMetrics.disk}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500 mt-1.5 flex justify-between">
                <span>File: db.json</span>
                <span>Net: {simMetrics.netTraffic}</span>
              </div>
            </div>

          </div>
        </div>

        {/* API Usage Panel */}
        <div className="p-5 rounded-2xl bg-[#0f0f13] border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" />
              Konsumsi Token API
            </h3>
            <div className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-[#7c5cff]">
              {stats.totalTokens.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Akumulasi token yang dikonsumsi oleh seluruh interaksi API Gemini.
            </p>
          </div>

          <div className="border-t border-white/5 pt-3.5 mt-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Metode Estimasi</span>
              <span className="text-gray-200 font-mono">1 Token ~ 3.5 Karakter</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Rata-rata Latensi</span>
              <span className="text-emerald-400 font-bold font-mono">0.08 detik (SSE)</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>API Key Status</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <Circle className="w-2 h-2 fill-emerald-500" /> Terkoneksi
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. USER MANAGEMENT PANEL */}
      <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5">
        
        {/* Title, Search & Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-white/5 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4f8cff]" />
              Daftar & Status Pengguna Sistem
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Kelola status akun, verifikasi peran (role), dan pantau penggunaan individu.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama / Email / ID..."
                className="w-full bg-black/30 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#4f8cff]/30 transition-all font-medium"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e: any) => setFilter(e.target.value)}
              className="bg-black/30 border border-white/5 rounded-xl py-1.5 px-3 text-xs text-gray-300 focus:outline-none focus:border-[#4f8cff]/30 transition-all font-semibold"
            >
              <option value="all">Semua Akun</option>
              <option value="active">Sedang Aktif (Online)</option>
              <option value="offline">Offline</option>
              <option value="suspended">Ditangguhkan (Banned)</option>
            </select>
          </div>
        </div>

        {/* User List Table */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#4f8cff]" />
            <span>Sedang mengambil data database...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
            Tidak ada data user yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-bold">
                  <th className="pb-3 pl-2">Informasi Akun</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Peran (Role)</th>
                  <th className="pb-3 text-right">Sesi / Pesan</th>
                  <th className="pb-3 text-right">Token API</th>
                  <th className="pb-3 pl-6">Tanggal Daftar / Terakhir Aktif</th>
                  <th className="pb-3 pr-2 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredUsers.map((u) => {
                  const isSuspended = u.status === 'suspended';
                  const isCurrentDev = u.email === 'andrar1712@gmail.com' || u.email === 'andrar1713@gmail.com';
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-all">
                      {/* Name and Email */}
                      <td className="py-4.5 pl-2 min-w-[200px]">
                        <div className="font-bold text-gray-100">{u.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{u.email}</div>
                        <div className="text-[9px] text-gray-500 font-mono mt-0.5">ID: {u.id}</div>
                      </td>

                      {/* Online/Offline Status */}
                      <td className="py-4.5 min-w-[100px]">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">
                            <ShieldAlert className="w-3 h-3" /> Ditangguhkan
                          </span>
                        ) : u.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/10 text-gray-500 text-[10px]">
                            Offline
                          </span>
                        )}
                      </td>

                      {/* Role indicator */}
                      <td className="py-4.5 min-w-[100px]">
                        {u.role === 'developer' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                            Developer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/10 text-blue-400 text-[10px]">
                            User
                          </span>
                        )}
                      </td>

                      {/* Sessions / Message Count */}
                      <td className="py-4.5 text-right font-mono text-gray-200">
                        <div>{u.sessionCount || 0} Sesi</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{u.messageCount || 0} Pesan</div>
                      </td>

                      {/* Token Usage */}
                      <td className="py-4.5 text-right font-mono text-gray-100">
                        <div>{(u.tokenUsage || 0).toLocaleString()}</div>
                        <div className="text-[9px] text-gray-500">token</div>
                      </td>

                      {/* Dates */}
                      <td className="py-4.5 pl-6 text-gray-400 text-[10px] font-mono">
                        <div>Daftar: {new Date(u.registeredAt).toLocaleDateString()}</div>
                        <div className="text-[9px] text-gray-500 mt-1">
                          Aktif: {new Date(u.lastActiveAt).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-4.5 text-center pr-2">
                        {isCurrentDev ? (
                          <span className="text-[9px] text-gray-500 font-bold italic">Akun Utama</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Ban / Unban Button */}
                            <button
                              onClick={() => handleToggleSuspension(u.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isSuspended 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                  : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                              }`}
                              title={isSuspended ? 'Aktifkan Kembali' : 'Tangguhkan Akun'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                              title="Hapus Akun Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* CREATE NEW USER MODAL DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#4f8cff]" />
                Tambah Pengguna Baru Manual
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Nama Lengkap</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nama lengkap user"
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#4f8cff]/30 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#4f8cff]/30 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Password Akun</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Password minimal 6 karakter"
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#4f8cff]/30 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Peran (Role)</label>
                <select
                  value={newUserRole}
                  onChange={(e: any) => setNewUserRole(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-3.5 text-xs text-gray-300 focus:outline-none focus:border-[#4f8cff]/30 transition-all font-semibold"
                >
                  <option value="user">User Standar (Akses Chat)</option>
                  <option value="developer">Developer Utama (Akses Monitoring)</option>
                </select>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-[10px] text-red-400 flex items-center gap-2 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-[10px] text-emerald-400 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-400 hover:bg-white/10 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#4f8cff] to-[#7c5cff] text-white text-xs font-bold transition-all shadow-md active:scale-95 hover:opacity-90"
                >
                  Simpan User
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
