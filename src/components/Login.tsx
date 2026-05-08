import React, { useState } from 'react';
import { authAPI } from '@/api/endpoints';
import { ACCESS_TOKEN_STORAGE_KEY } from '@/api/client';
import { ChefHat, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';

export const Login: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [username, setUsername] = useState('kitchen01');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login(username.trim(), password);
      const token = res.data.data.accessToken;
      // IMPORTANT: Must use sessionStorage to match client.ts interceptor
      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.message ?? axiosErr?.message ?? 'Đăng nhập thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-kds-bg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kds-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-kds-blueText/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kds-gold/10 border border-kds-gold/30 mb-4">
            <ChefHat className="text-kds-gold" size={32} />
          </div>
          <h1 className="text-3xl font-display text-white tracking-[0.12em]">LUMIÈRE</h1>
          <p className="text-gray-400 text-sm mt-1 tracking-widest uppercase">Kitchen Display System</p>
        </div>

        {/* Card */}
        <form
          onSubmit={submit}
          className="bg-kds-card border border-kds-border rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Đăng nhập ca bếp</h2>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-lg bg-kds-redBg border border-kds-redText/40 text-kds-redText text-sm">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                id="kds-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Nhập tên đăng nhập"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/20 border border-kds-border text-white placeholder-gray-600 focus:outline-none focus:border-kds-gold/60 focus:ring-1 focus:ring-kds-gold/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-7">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                id="kds-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/20 border border-kds-border text-white placeholder-gray-600 focus:outline-none focus:border-kds-gold/60 focus:ring-1 focus:ring-kds-gold/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            id="kds-login-submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-kds-gold text-black font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>

          <p className="text-center text-xs text-gray-600 mt-5">
            Chỉ tài khoản <span className="text-gray-400">KITCHEN</span> hoặc{' '}
            <span className="text-gray-400">MANAGER</span> mới có quyền truy cập
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;

