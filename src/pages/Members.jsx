import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../utils/dateFormatter';
import { openWhatsAppDueReminder } from '../utils/whatsappHelper';

export default function Members() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'ADMIN';

  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState({ 
    total: 0, 
    activeCount: 0, 
    expiredCount: 0, 
    expiringSoonCount: 0,
    totalDuesAmount: 0,
    dueMembersCount: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [qrMember, setQrMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '',
    plan_type: 'MONTHLY',
    custom_months: '1',
    total_amount: '',
    amount_paid: '',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'ACTIVE',
    photo_url: ''
  });

  const [formError, setFormError] = useState('');

  const calculateExpiryDate = (startDateStr, planType, customMonthsVal) => {
    if (!startDateStr) return '';
    const date = new Date(startDateStr);

    if (planType === 'DAILY') date.setDate(date.getDate() + 1);
    else if (planType === 'MONTHLY') date.setMonth(date.getMonth() + 1);
    else if (planType === '2_MONTHS') date.setMonth(date.getMonth() + 2);
    else if (planType === 'QUARTERLY') date.setMonth(date.getMonth() + 3);
    else if (planType === 'HALF_YEARLY') date.setMonth(date.getMonth() + 6);
    else if (planType === 'ANNUAL') date.setFullYear(date.getFullYear() + 1);
    else if (planType === 'CUSTOM') {
      const months = Math.max(1, parseInt(customMonthsVal) || 1);
      date.setMonth(date.getMonth() + months);
    }
    return date.toISOString().split('T')[0];
  };

  const handlePlanChange = (newPlan) => {
    const updatedExpiry = calculateExpiryDate(formData.start_date, newPlan, formData.custom_months);
    setFormData((prev) => ({ ...prev, plan_type: newPlan, expiry_date: updatedExpiry }));
  };

  const handleStartDateChange = (newDate) => {
    const updatedExpiry = calculateExpiryDate(newDate, formData.plan_type, formData.custom_months);
    setFormData((prev) => ({ ...prev, start_date: newDate, expiry_date: updatedExpiry }));
  };

  const handleCustomMonthsChange = (months) => {
    const updatedExpiry = calculateExpiryDate(formData.start_date, 'CUSTOM', months);
    setFormData((prev) => ({ ...prev, custom_months: months, expiry_date: updatedExpiry }));
  };

  const fetchMembersAndSummary = async () => {
    try {
      setLoading(true);
      if (isSuperAdmin) {
        const res = await API.get('/members');
        setMembers(res.data);
      } else {
        const res = await API.get('/members/status-summary');
        setSummary(res.data.summary || { 
          total: 0, activeCount: 0, expiredCount: 0, expiringSoonCount: 0, totalDuesAmount: 0, dueMembersCount: 0
        });
        const allList = [...(res.data.activeMembers || []), ...(res.data.expiredMembers || [])];
        setMembers(allList);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndSummary();
  }, []);

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const initialExpiry = calculateExpiryDate(today, 'MONTHLY', '1');
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      gender: 'MALE',
      dob: '',
      plan_type: 'MONTHLY',
      custom_months: '1',
      total_amount: '',
      amount_paid: '',
      start_date: today,
      expiry_date: initialExpiry,
      status: 'ACTIVE',
      photo_url: ''
    });
    setEditingMember(null);
    setFormError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setFormError('');
    setFormData({
      full_name: member.full_name,
      email: member.email || '',
      phone: member.phone,
      gender: member.gender,
      dob: member.dob ? member.dob.split('T')[0] : '',
      plan_type: member.plan_type || 'MONTHLY',
      custom_months: member.custom_months ? String(member.custom_months) : '1',
      total_amount: member.total_amount || member.amount_paid,
      amount_paid: member.amount_paid,
      start_date: member.start_date ? member.start_date.split('T')[0] : '',
      expiry_date: member.expiry_date ? member.expiry_date.split('T')[0] : '',
      status: member.status,
      photo_url: member.photo_url || ''
    });
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setFormData((prev) => ({ ...prev, photo_url: canvas.toDataURL('image/jpeg', 0.85) }));
      };
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingMember) {
        await API.put(`/members/${editingMember.id}`, formData);
      } else {
        await API.post('/members', formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchMembersAndSummary();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await API.delete(`/members/${memberId}`);
      fetchMembersAndSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  // 📧 Send Single Email Due Reminder
  const handleSendEmailReminder = async (memberId, memberName) => {
    try {
      setActionMessage({ text: `Dispatching due reminder email to ${memberName}...`, type: 'info' });
      const res = await API.post(`/reminders/email/${memberId}`);
      setActionMessage({ text: res.data.message, type: 'success' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to send email.', type: 'error' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    }
  };

  // ⚡ Send Bulk Email Due Reminders
  const handleSendBulkEmailReminders = async () => {
    if (!window.confirm(`Send payment reminder emails to all ${summary.dueMembersCount} members with pending dues?`)) return;
    try {
      setActionMessage({ text: 'Dispatching bulk reminders to all members with pending balance...', type: 'info' });
      const res = await API.post('/reminders/email-bulk');
      setActionMessage({ text: res.data.message, type: 'success' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Bulk reminder failed.', type: 'error' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    }
  };

  const formatPlanLabel = (plan, customMonths) => {
    switch (plan) {
      case 'DAILY': return '⚡ Daily Pass';
      case 'MONTHLY': return '🗓️ 1 Month';
      case '2_MONTHS': return '🗓️ 2 Months';
      case 'QUARTERLY': return '🗓️ 3 Months (Quarterly)';
      case 'HALF_YEARLY': return '🗓️ 6 Months (Half-Yearly)';
      case 'ANNUAL': return '👑 1 Year (Annual)';
      case 'CUSTOM': return `⚙️ Custom (${customMonths || 1} Mos)`;
      default: return plan;
    }
  };

  const planCounts = {
    ALL: members.length,
    DAILY: members.filter(m => m.plan_type === 'DAILY').length,
    MONTHLY: members.filter(m => m.plan_type === 'MONTHLY').length,
    '2_MONTHS': members.filter(m => m.plan_type === '2_MONTHS').length,
    QUARTERLY: members.filter(m => m.plan_type === 'QUARTERLY').length,
    HALF_YEARLY: members.filter(m => m.plan_type === 'HALF_YEARLY').length,
    ANNUAL: members.filter(m => m.plan_type === 'ANNUAL').length,
    CUSTOM: members.filter(m => m.plan_type === 'CUSTOM').length
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(member.expiry_date);
    exp.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    if (statusFilter === 'ACTIVE' && daysLeft < 0) return false;
    if (statusFilter === 'EXPIRING_SOON' && !(daysLeft >= 0 && daysLeft <= 7)) return false;
    if (statusFilter === 'EXPIRED' && daysLeft >= 0) return false;
    if (statusFilter === 'DUES' && !(Number(member.balance_due) > 0)) return false;

    if (planFilter !== 'ALL' && member.plan_type !== planFilter) return false;

    return true;
  });

  const calculatedBalance = Math.max(
    0,
    (Number(formData.total_amount) || 0) - (Number(formData.amount_paid) || 0)
  );

  const planFilterButtons = [
    { id: 'ALL', label: 'All Plans', count: planCounts.ALL, color: 'text-slate-300' },
    { id: 'DAILY', label: '⚡ Daily Pass', count: planCounts.DAILY, color: 'text-[#00F2FE]' },
    { id: 'MONTHLY', label: '🗓️ 1 Month', count: planCounts.MONTHLY, color: 'text-purple-400' },
    { id: '2_MONTHS', label: '🗓️ 2 Months', count: planCounts['2_MONTHS'], color: 'text-pink-400' },
    { id: 'QUARTERLY', label: '🗓️ 3 Months', count: planCounts.QUARTERLY, color: 'text-emerald-400' },
    { id: 'HALF_YEARLY', label: '🗓️ 6 Months', count: planCounts.HALF_YEARLY, color: 'text-amber-400' },
    { id: 'ANNUAL', label: '👑 1 Year', count: planCounts.ANNUAL, color: 'text-blue-400' },
    { id: 'CUSTOM', label: '⚙️ Custom', count: planCounts.CUSTOM, color: 'text-rose-400' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden pb-12">
      
      {/* Action Notification Toast */}
      {actionMessage.text && (
        <div className={`p-4 rounded-2xl border text-xs font-bold shadow-2xl flex items-center justify-between transition-all ${
          actionMessage.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
          actionMessage.type === 'error' ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' :
          'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ text: '', type: '' })} className="text-white hover:opacity-75">✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Members Directory & Dues Engine</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {isSuperAdmin
              ? 'Viewing all system members'
              : 'Automated WhatsApp and Email reminders for pending balances.'}
          </p>
        </div>

        {!isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {summary.dueMembersCount > 0 && (
              <button
                onClick={handleSendBulkEmailReminders}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>⚡</span> Email Reminders to All ({summary.dueMembersCount})
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>+</span> Register New Member
            </button>
          </div>
        )}
      </div>

      {/* Plan Filters */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Filter By Plan Duration:</span>
          {planFilter !== 'ALL' && (
            <button onClick={() => setPlanFilter('ALL')} className="text-[11px] text-[#00F2FE] hover:underline font-bold">
              Reset Plan Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {planFilterButtons.map((btn) => (
            <div
              key={btn.id}
              onClick={() => setPlanFilter(btn.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                planFilter === btn.id
                  ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.04] border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                  : 'bg-[#0B0F19] border-white/10 hover:border-white/20'
              }`}
            >
              <span className={`text-[9px] font-black uppercase tracking-wider truncate ${btn.color}`}>{btn.label}</span>
              <div className="mt-2 flex items-baseline justify-between">
                <h4 className="text-xl sm:text-2xl font-black text-white font-mono">{btn.count}</h4>
                <span className="text-[9px] text-slate-500 font-semibold uppercase">Members</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div onClick={() => setStatusFilter('ALL')} className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'ALL' ? 'bg-[#00F2FE]/10 border-[#00F2FE]' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">All Statuses</p>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">{summary.total}</h3>
          </div>
          <div onClick={() => setStatusFilter('ACTIVE')} className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-emerald-400 tracking-wider">Active</p>
            <h3 className="text-lg sm:text-xl font-black text-emerald-400 mt-1">{summary.activeCount}</h3>
          </div>
          <div onClick={() => setStatusFilter('EXPIRING_SOON')} className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'EXPIRING_SOON' ? 'bg-amber-500/10 border-amber-500' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-amber-400 tracking-wider">Expiring (≤ 7D)</p>
            <h3 className="text-lg sm:text-xl font-black text-amber-400 mt-1">{summary.expiringSoonCount}</h3>
          </div>
          <div onClick={() => setStatusFilter('EXPIRED')} className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'EXPIRED' ? 'bg-red-500/10 border-red-500' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-red-400 tracking-wider">Expired</p>
            <h3 className="text-lg sm:text-xl font-black text-red-400 mt-1">{summary.expiredCount}</h3>
          </div>
          <div onClick={() => setStatusFilter('DUES')} className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'DUES' ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-[#0B0F19] border-white/10'}`}>
            <div className="flex justify-between items-center">
              <p className="text-[9px] uppercase font-black text-rose-400 tracking-wider">Pending Dues</p>
              <span className="text-[9px] font-bold px-1 rounded bg-rose-500/20 text-rose-300 font-mono">{summary.dueMembersCount} Due</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-rose-400 mt-1 font-mono">₹{Number(summary.totalDuesAmount).toLocaleString('en-IN')}</h3>
          </div>
        </div>
      )}

      {/* Search & Status Pill Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-white/15 text-xs text-white outline-none focus:border-[#00F2FE]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {!isSuperAdmin && (
          <div className="flex flex-wrap bg-[#0B0F19] p-1 rounded-xl border border-white/10 text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: '🟢 Active' },
              { id: 'EXPIRING_SOON', label: '🟡 Expiring' },
              { id: 'EXPIRED', label: '🔴 Expired' },
              { id: 'DUES', label: '⚠️ Dues' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all text-[11px] ${statusFilter === f.id ? 'bg-[#00F2FE] text-[#07090E]' : 'text-slate-400 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500 text-xs font-bold">Loading membership directory...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 text-xs font-bold bg-[#0B0F19] rounded-3xl border border-white/10 p-8">
            No members found for this filter.
          </div>
        ) : (
          filteredMembers.map((member) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const exp = new Date(member.expiry_date);
            exp.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;
            const balance = Number(member.balance_due) || 0;

            return (
              <div key={member.id} className="bg-[#0B0F19] p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col justify-between relative overflow-hidden group shadow-xl hover:border-[#00F2FE]/40 transition-all">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full bg-white/10 text-[#00F2FE] border border-white/10">
                      {formatPlanLabel(member.plan_type, member.custom_months)}
                    </span>

                    {balance > 0 ? (
                      <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono">
                        Due: ₹{balance.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Paid
                      </span>
                    )}
                  </div>

                  <span className={`text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : daysLeft <= 7 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isExpired ? 'EXPIRED' : daysLeft <= 7 ? `${daysLeft}D LEFT` : 'ACTIVE'}
                  </span>
                </div>

                {/* Identity */}
                <div className="flex gap-3.5 items-center my-2">
                  <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/50 overflow-hidden border border-white/15 flex-shrink-0 cursor-pointer shadow-md"
                    onClick={() => setViewMember(member)}
                  >
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xl sm:text-2xl">
                        {member.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 
                      className="text-white font-bold truncate text-sm sm:text-base cursor-pointer hover:text-[#00F2FE] transition-colors"
                      onClick={() => setViewMember(member)}
                    >
                      {member.full_name}
                    </h3>
                    <p className="text-slate-400 text-xs font-mono mt-0.5">{member.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Paid: <span className="text-emerald-400 font-bold font-mono">₹{Number(member.amount_paid).toLocaleString('en-IN')}</span> / ₹{Number(member.total_amount || member.amount_paid).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="mt-3 text-[11px] text-slate-400 border-t border-white/5 pt-2.5 space-y-1">
                  <div className="flex justify-between">
                    <span>Joined:</span>
                    <strong className="text-slate-300 font-mono">{formatDate(member.start_date)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pass Expiry:</span>
                    <strong className={`font-mono ${isExpired ? 'text-red-400 font-bold' : daysLeft <= 7 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                      {formatDate(member.expiry_date)}
                    </strong>
                  </div>
                </div>

                {/* 💬 PAYMENT DUE REMINDER ACTION BAR (WHATSAPP + EMAIL) */}
                {balance > 0 && !isSuperAdmin && (
                  <div className="mt-3 pt-2.5 border-t border-rose-500/20 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openWhatsAppDueReminder({ member, gymName: user?.gym_name, ownerPhone: user?.phone })}
                      className="py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <span>💬</span> WhatsApp
                    </button>

                    <button
                      onClick={() => handleSendEmailReminder(member.id, member.full_name)}
                      className="py-1.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <span>📧</span> Email Notice
                    </button>
                  </div>
                )}

                {/* Primary Card Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-3 mt-3 border-t border-white/5">
                  <button onClick={() => setQrMember(member)} className="py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-[#00F2FE] text-xs font-bold transition-all flex items-center justify-center gap-1">
                    🪪 QR
                  </button>
                  
                  <button onClick={() => setViewMember(member)} className="py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center">
                    👁️ Info
                  </button>

                  {!isSuperAdmin && (
                    <>
                      <button onClick={() => handleOpenEditModal(member)} className="py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all flex items-center justify-center">
                        ✏️ Edit
                      </button>

                      <button onClick={() => handleDeleteMember(member.id)} className="py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all flex items-center justify-center">
                        🗑️
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* QR Pass Modal */}
      {qrMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-sm p-6 sm:p-8 rounded-3xl border border-white/20 text-center relative shadow-[0_0_50px_rgba(0,242,254,0.2)]">
            <button onClick={() => setQrMember(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg">✕</button>

            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#00F2FE] to-[#FF0080] flex items-center justify-center text-white font-black text-xs">⚡</div>
              <span className="text-sm font-black tracking-wider text-white">DIGITAL ACCESS BADGE</span>
            </div>

            <h3 className="text-xl font-black text-white">{qrMember.full_name}</h3>
            <p className="text-[11px] text-[#00F2FE] uppercase font-bold tracking-widest mb-4">
              {formatPlanLabel(qrMember.plan_type, qrMember.custom_months)}
            </p>

            <div className="bg-white p-4 rounded-2xl w-fit mx-auto shadow-xl border-4 border-[#00F2FE]/40 mb-4">
              <QRCodeSVG value={`http://${window.location.hostname}:5173/pass/${qrMember.id}`} size={180} level={"H"} includeMargin={false} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <a href={`/pass/${qrMember.id}`} target="_blank" rel="noreferrer" className="py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all flex items-center justify-center">
                Open Pass
              </a>
              <button onClick={() => window.print()} className="py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-white font-bold text-xs hover:opacity-90 transition-all">
                Print Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Member Profile Modal */}
      {viewMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">Member Profile</h2>
              <button onClick={() => setViewMember(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-3xl bg-black/60 border border-white/20 overflow-hidden mx-auto mb-3 shadow-xl flex items-center justify-center">
                {viewMember.photo_url ? (
                  <img src={viewMember.photo_url} alt={viewMember.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-3xl">{viewMember.full_name?.charAt(0)}</div>
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{viewMember.full_name}</h3>
              <p className="text-xs text-[#00F2FE] font-bold uppercase mt-0.5">
                {formatPlanLabel(viewMember.plan_type, viewMember.custom_months)}
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300 border-t border-white/10 pt-4">
              <div className="flex justify-between"><span>Email:</span> <strong className="text-white">{viewMember.email || '—'}</strong></div>
              <div className="flex justify-between"><span>Phone:</span> <strong className="text-white font-mono">{viewMember.phone}</strong></div>
              <div className="flex justify-between"><span>Total Plan Fee:</span> <strong className="text-white font-mono">₹{Number(viewMember.total_amount || viewMember.amount_paid).toLocaleString('en-IN')}</strong></div>
              <div className="flex justify-between"><span>Amount Paid:</span> <strong className="text-emerald-400 font-bold font-mono">₹{Number(viewMember.amount_paid).toLocaleString('en-IN')}</strong></div>
              <div className="flex justify-between">
                <span>Balance Due:</span> 
                <strong className={Number(viewMember.balance_due) > 0 ? 'text-rose-400 font-bold font-mono' : 'text-emerald-400 font-bold'}>
                  ₹{Number(viewMember.balance_due || 0).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between"><span>Joined:</span> <strong className="text-white font-mono">{formatDate(viewMember.start_date)}</strong></div>
              <div className="flex justify-between"><span>Pass Expiration:</span> <strong className="text-amber-400 font-bold font-mono">{formatDate(viewMember.expiry_date)}</strong></div>
            </div>

            {/* Quick Actions inside modal */}
            {Number(viewMember.balance_due) > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => openWhatsAppDueReminder({ member: viewMember, gymName: user?.gym_name, ownerPhone: user?.phone })}
                  className="py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>💬</span> WhatsApp Notice
                </button>
                <button
                  onClick={() => handleSendEmailReminder(viewMember.id, viewMember.full_name)}
                  className="py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>📧</span> Email Notice
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isModalOpen && !isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0B0F19] w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-white/20 max-h-[90vh] overflow-y-auto my-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/10">
              <div>
                <h2 className="text-xl font-black text-white">{editingMember ? 'Update Member Profile' : 'Register Gym Member'}</h2>
                <p className="text-xs text-slate-400">Configure plan duration, auto dates, and partial fees.</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            {formError && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/60 border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-500 font-bold">Photo</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Member Photo (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                  <input type="text" required placeholder="e.g. Rahul Sharma" value={formData.full_name} className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number *</label>
                  <input type="text" required placeholder="9876543210" value={formData.phone} className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input type="email" placeholder="member@gmail.com" value={formData.email} className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
                  <select value={formData.gender} className="w-full bg-[#07090E] border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth *</label>
                  <input type="date" required value={formData.dob} className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plan Duration *</label>
                  <select value={formData.plan_type} className="w-full bg-[#07090E] border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => handlePlanChange(e.target.value)}>
                    <option value="DAILY">⚡ Daily Pass (1 Day)</option>
                    <option value="MONTHLY">🗓️ 1 Month</option>
                    <option value="2_MONTHS">🗓️ 2 Months</option>
                    <option value="QUARTERLY">🗓️ 3 Months (Quarterly)</option>
                    <option value="HALF_YEARLY">🗓️ 6 Months (Half Yearly)</option>
                    <option value="ANNUAL">👑 1 Year (Annual)</option>
                    <option value="CUSTOM">⚙️ Custom Duration</option>
                  </select>
                </div>

                {formData.plan_type === 'CUSTOM' && (
                  <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-[#00F2FE] uppercase mb-1">Custom Months</label>
                    <input type="number" min="1" max="60" value={formData.custom_months} className="w-full bg-black/40 border border-[#00F2FE]/40 px-4 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => handleCustomMonthsChange(e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Fee (₹ INR) *</label>
                  <input type="number" required placeholder="3000" value={formData.total_amount} className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none font-mono" onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount Paid (₹ INR) *</label>
                  <input type="number" required placeholder="1500" value={formData.amount_paid} className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none font-mono" onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })} />
                </div>

                <div className="col-span-full p-3 rounded-xl bg-black/50 border border-white/10 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Remaining Balance Due:</span>
                  <strong className={calculatedBalance > 0 ? 'text-rose-400 font-mono text-sm' : 'text-emerald-400 font-mono text-sm'}>
                    ₹{calculatedBalance.toLocaleString('en-IN')} {calculatedBalance > 0 ? '(PARTIAL DUE)' : '(PAID IN FULL)'}
                  </strong>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Joining Date *</label>
                  <input type="date" required value={formData.start_date} className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => handleStartDateChange(e.target.value)} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiration Date *</label>
                  <input type="date" required value={formData.expiry_date} className="w-full bg-black/40 border border-[#00F2FE]/40 px-4 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-4 hover:opacity-95 active:scale-95 shadow-lg">
                {editingMember ? 'Save Changes' : 'Confirm Registration & Generate Pass'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}