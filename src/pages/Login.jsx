import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [activeOtp, setActiveOtp] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, loginData);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'ADMIN' ? '/admin/users' : '/members');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email: forgotEmail });
      setForgotSuccess(res.data.message);
      if (res.data.otp) setActiveOtp(res.data.otp);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Account not found');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        email: forgotEmail,
        otp: otpCode,
        newPassword
      });
      setForgotSuccess(res.data.message);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setForgotError('');
        setForgotSuccess('');
      }, 1500);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4 relative font-sans">
      <div className="bg-[#0B0F19] w-full max-w-md p-8 rounded-3xl border border-white/20 shadow-2xl relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#FF0080] flex items-center justify-center text-white font-black text-sm">
            ⚡
          </div>
          <span className="text-xl font-black tracking-wider text-white">PULSE FIT</span>
        </div>

        <h2 className="text-2xl font-black text-white">Welcome Back</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">Sign in to your Gym Management dashboard.</p>

        {error && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
              placeholder="owner@gym.com"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
              
              {/* 🔗 FORGOT PASSWORD LINK */}
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(loginData.email || '');
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                  setIsForgotModalOpen(true);
                }}
                className="text-xs text-[#00F2FE] hover:underline font-bold"
              >
                Forgot Password?
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] pr-12"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-2 hover:opacity-90 transition-all active:scale-95"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* 🔐 FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl relative">
            <button onClick={() => setIsForgotModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

            <h2 className="text-xl font-black text-white">Reset Account Password</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              {forgotStep === 1 
                ? 'Enter your registered email address to receive an OTP.' 
                : 'Enter your 6-digit OTP code and choose your new password.'}
            </p>

            {forgotError && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">{forgotError}</div>}
            {forgotSuccess && <div className="mb-4 text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">{forgotSuccess}</div>}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
                    placeholder="e.g. owner@gym.com / trainer@gym.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-2 hover:opacity-90 transition-all active:scale-95"
                >
                  {loading ? 'Generating Code...' : 'Get Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                {activeOtp && (
                  <div className="p-3 rounded-xl bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-xs text-[#00F2FE] flex justify-between items-center">
                    <span>Generated OTP:</span>
                    <strong className="font-mono text-sm tracking-widest">{activeOtp}</strong>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">6-Digit Verification OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] tracking-widest font-mono text-center text-base"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] pr-12"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] font-bold"
                    >
                      {showResetPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider hover:opacity-90 transition-all active:scale-95"
                  >
                    {loading ? 'Saving...' : 'Set Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}