import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or incomplete password reset link.');
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/reset-password-token', {
        email,
        token,
        newPassword
      });
      setSuccess(res.data.message);
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-[#7928CA]/30 via-[#FF0080]/20 to-[#00F2FE]/20 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0B0F19] rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] flex items-center justify-center text-white font-black text-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Reset Account Password</h1>
            <p className="text-xs text-slate-400 font-mono truncate max-w-[220px]">{email || 'Pulse Fit Account'}</p>
          </div>
        </div>

        {error && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">{error}</div>}
        {success && <div className="mb-4 text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">{success}</div>}

        {!token || !email ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-slate-400">Please request a new reset link from the homepage sign-in dialog.</p>
            <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-2 hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}