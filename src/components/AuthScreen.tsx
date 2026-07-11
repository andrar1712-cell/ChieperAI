import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, User, Sparkles, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowRight, Chrome
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen to Google OAuth popup callback messages
  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data.accessToken;
        if (token) {
          await handleActualGoogleLogin(token);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validations
    if (!email.trim() || !password) {
      setError('Silakan isi semua kolom!');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setError('Nama wajib diisi!');
        return;
      }
      if (password.length < 6) {
        setError('Password harus minimal 6 karakter!');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi password tidak cocok!');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Terjadi kesalahan sistem.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        setSuccess('Login Berhasil! Mengalihkan...');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else {
        setSuccess('Registrasi Berhasil! Silakan masuk.');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server. Silakan coba lagi.');
      setLoading(false);
    }
  };

  const handleActualGoogleLogin = async (token: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Gagal masuk menggunakan Google.');
        setLoading(false);
        return;
      }

      setSuccess(`Selamat datang kembali, ${data.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 800);
    } catch (err) {
      console.error(err);
      setError('Koneksi Google gagal. Coba lagi.');
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setError(null);
    const clientId = '1002695452383-e5oi3dlgfk68voddfm03a3te0p581d0r.apps.googleusercontent.com';
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scopes = 'openid email profile';
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}`;

    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      googleUrl,
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      setError('Popup diblokir! Silakan izinkan popup untuk situs ini.');
    }
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-gray-100 relative overflow-hidden select-none">
      
      {/* Background visual graphics - High contrast ambient colors */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#4f8cff]/20 to-[#7c5cff]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-gradient-to-r from-[#ff4fca]/10 to-[#7c5cff]/10 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] mx-4 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#4f8cff] backdrop-blur-md mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CHIEPERAI Intelligent Assistant</span>
          </motion.div>
          <motion.h1 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent font-sans"
          >
            CHIEPERAI
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-gray-400 mt-2"
          >
            Satu-satunya asisten cerdas yang Anda butuhkan
          </motion.p>
        </div>

        {/* Authentication Form Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#0f0f13]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative"
        >
          {/* Card Glass Accent */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Toggle Tabs */}
          <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/5">
            <button
              onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isLogin ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLogin ? 'bg-white/10 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            <AnimatePresence mode="popLayout">
              {/* Name Field for Register */}
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="space-y-1.5"
                >
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#4f8cff]/40 transition-all font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#4f8cff]/40 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-11 pr-11 text-sm text-white focus:outline-none focus:border-[#4f8cff]/40 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {/* Confirm Password Field for Register */}
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="space-y-1.5"
                >
                  <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Konfirmasi Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#4f8cff]/40 transition-all font-medium"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications (Success / Error) */}
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-[#4f8cff] to-[#7c5cff] text-white hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#4f8cff]/10"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Masuk Sekarang' : 'Buat Akun Baru'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <span className="relative bg-[#0f0f13] px-3 text-[10px] uppercase font-bold tracking-wider text-gray-500">
              Atau alternatif lain
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-xs font-semibold flex items-center justify-center gap-2 text-gray-300"
          >
            <Chrome className="w-4 h-4 text-red-400" />
            <span>Masuk dengan Google</span>
          </button>


        </motion.div>
      </div>

    </div>
  );
}
