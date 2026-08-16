import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await register(formData);
      setMessage(res.data.message);
      setFormData({ name: '', email: '', password: '', role: 'STAFF' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-neonCyan to-accentPink bg-clip-text text-transparent">
            JOIN PULSE FIT
          </h1>
          <p className="text-slate-400 text-sm mt-1">Request Staff or Trainer Access</p>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs mb-6 text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1 font-semibold">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1 font-semibold">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1 font-semibold">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1 font-semibold">Requested Role</label>
            <select
              className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-slate-900"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="STAFF">Front Desk Staff</option>
              <option value="TRAINER">Fitness Trainer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-cyan-gradient font-bold text-slate-950 tracking-wide hover:opacity-90 transition-all mt-4"
          >
            {loading ? 'Submitting...' : 'Submit Access Request'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-6">
          Already have approved access?{' '}
          <Link to="/login" className="text-neonCyan hover:underline font-semibold">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}