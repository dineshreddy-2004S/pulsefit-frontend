import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { formatDate } from '../utils/dateFormatter';

export default function MemberPassView() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMemberQRDetails = async () => {
      try {
        const res = await API.get(`/members/verify-qr/${memberId}`);
        setMember(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired QR pass.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberQRDetails();
  }, [memberId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#00F2FE] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Verifying Digital Pass...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4">
        <div className="bg-[#0B0F19] max-w-sm w-full p-8 rounded-3xl border border-red-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-white">Verification Failed</h2>
          <p className="text-xs text-red-400 font-medium">{error}</p>
          <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isValid = member.status === 'ACTIVE' && !member.isExpired;
  const balance = Number(member.balance_due) || 0;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00F2FE]/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0B0F19] rounded-[28px] border border-white/20 p-5 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#FF0080] flex items-center justify-center text-white font-black text-base shadow-lg">
              ⚡
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white truncate max-w-[150px] sm:max-w-[200px]">
                {member.gym_name || 'PULSE FIT'}
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-[#00F2FE] font-bold">Official Member Pass</p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            isValid 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
              : 'bg-red-500/20 text-red-300 border-red-500/40'
          }`}>
            {isValid ? 'VERIFIED ACTIVE' : 'EXPIRED'}
          </span>
        </div>

        {/* Member Photo */}
        <div className="text-center mb-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3">
            <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${isValid ? 'from-[#00F2FE] to-emerald-400' : 'from-red-500 to-amber-500'} blur-sm opacity-80`}></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] bg-black/60 border border-white/30 overflow-hidden flex items-center justify-center">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-slate-500">{member.full_name.charAt(0)}</span>
              )}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">{member.full_name}</h2>
          <p className="text-xs text-[#00F2FE] font-bold tracking-wider uppercase mt-0.5">
            {member.plan_type === 'DAILY' ? '⚡ Daily Pass' : `${member.plan_type} Pass`}
          </p>
        </div>

        {/* Details Grid */}
        <div className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-slate-400">Member ID:</span>
            <strong className="text-white font-mono">#PF-{String(member.id).padStart(5, '0')}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-slate-400">Phone Number:</span>
            <strong className="text-white font-mono">{member.phone}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-slate-400">Total Plan Fee:</span>
            <strong className="text-white font-mono">₹{Number(member.total_amount || member.amount_paid).toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-slate-400">Amount Paid:</span>
            <strong className="text-emerald-400 font-bold font-mono">₹{Number(member.amount_paid).toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-slate-400">Balance Due:</span>
            <strong className={balance > 0 ? 'text-rose-400 font-bold font-mono' : 'text-emerald-400 font-bold'}>
              ₹{balance.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-slate-400">Start Date:</span>
            <strong className="text-white font-mono">{formatDate(member.start_date)}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Expiration Date:</span>
            <strong className={`font-mono ${isValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}`}>
              {formatDate(member.expiry_date)}
            </strong>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-1">
          <p className="text-[10px] text-slate-400">
            Facility: <span className="text-white font-bold">{member.gym_name || member.gym_owner_name || 'Pulse Fit Hub'}</span>
          </p>
          <p className="text-[9px] text-slate-500">Scan Verified: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
        </div>
      </div>
    </div>
  );
}