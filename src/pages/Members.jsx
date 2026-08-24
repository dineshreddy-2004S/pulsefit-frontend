import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../utils/dateFormatter';

export default function Members() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'ADMIN';
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
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
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [qrMember, setQrMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);

  // Live Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [mediaStream, setMediaStream] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '',
    plan_type: 'MONTHLY',
    custom_months: '1',
    base_price: '',
    discount: '0',
    total_amount: '',
    amount_paid: '',
    payment_mode: 'UPI', // Default payment mode
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'ACTIVE',
    photo_url: ''
  });

  const [formError, setFormError] = useState('');

  const fetchPlans = async () => {
    try {
      const res = await API.get('/plans');
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pricing plans:', err);
    }
  };

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
    const matchedPlan = plans.find(p => p.plan_type === newPlan);
    const planBasePrice = matchedPlan ? Number(matchedPlan.price) : 0;
    const discountVal = Number(formData.discount) || 0;
    const computedTotal = Math.max(0, planBasePrice - discountVal);
    const updatedExpiry = calculateExpiryDate(formData.start_date, newPlan, formData.custom_months);

    setFormData(prev => ({
      ...prev,
      plan_type: newPlan,
      base_price: planBasePrice > 0 ? planBasePrice : prev.base_price,
      total_amount: computedTotal > 0 ? computedTotal : prev.total_amount,
      expiry_date: updatedExpiry
    }));
  };

  const handleDiscountChange = (discountStr) => {
    const disc = Number(discountStr) || 0;
    const base = Number(formData.base_price) || 0;
    const computedTotal = Math.max(0, base - disc);

    setFormData(prev => ({
      ...prev,
      discount: discountStr,
      total_amount: computedTotal
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size exceeds 5MB. Please upload a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const startLiveCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access webcam. Check browser permissions.');
      setIsCameraActive(false);
    }
  };

  const stopLiveCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg', 0.85);
    setFormData(prev => ({ ...prev, photo_url: base64Image }));

    stopLiveCamera();
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopLiveCamera();
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
    if (!isSuperAdmin) fetchPlans();
  }, []);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const resetForm = () => {
    stopLiveCamera();
    const today = new Date().toISOString().split('T')[0];
    const initialExpiry = calculateExpiryDate(today, 'MONTHLY', '1');
    const monthlyPlan = plans.find(p => p.plan_type === 'MONTHLY');
    const basePrice = monthlyPlan ? monthlyPlan.price : 1000;

    setFormData({
      full_name: '',
      email: '',
      phone: '',
      gender: 'MALE',
      dob: '',
      plan_type: 'MONTHLY',
      custom_months: '1',
      base_price: basePrice,
      discount: '0',
      total_amount: basePrice,
      amount_paid: basePrice,
      payment_mode: 'UPI',
      start_date: today,
      expiry_date: initialExpiry,
      status: 'ACTIVE',
      photo_url: ''
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditingMember(null);
    setFormError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    stopLiveCamera();
    setEditingMember(member);
    setFormError('');
    setFormData({
      full_name: member.full_name,
      email: member.email || '',
      phone: member.phone,
      gender: member.gender || 'MALE',
      dob: member.dob ? member.dob.split('T')[0] : '',
      plan_type: member.plan_type || 'MONTHLY',
      custom_months: member.custom_months ? String(member.custom_months) : '1',
      base_price: (Number(member.total_amount) || 0) + (Number(member.discount) || 0),
      discount: member.discount ? String(member.discount) : '0',
      total_amount: member.total_amount || member.amount_paid,
      amount_paid: member.amount_paid,
      payment_mode: member.payment_mode || 'UPI',
      start_date: member.start_date ? member.start_date.split('T')[0] : '',
      expiry_date: member.expiry_date ? member.expiry_date.split('T')[0] : '',
      status: member.status,
      photo_url: member.photo_url || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    stopLiveCamera();

    try {
      if (editingMember) {
        await API.put(`/members/${editingMember.id}`, formData);
        setActionMessage({ text: 'Member updated successfully!', type: 'success' });
      } else {
        await API.post('/members', formData);
        setActionMessage({ 
          text: formData.email 
            ? `Member registered! Access QR badge sent directly to ${formData.email}`
            : `Member registered successfully!`, 
          type: 'success' 
        });
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

  const sendWhatsAppDueReminder = (member) => {
    const facility = user?.gym_name || 'Pulse Fit Hub';
    let cleanPhone = member.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const text = `*Payment Reminder from ${facility.toUpperCase()}*\n\n` +
      `Hello *${member.full_name}*,\n` +
      `This is a friendly reminder regarding your pending membership balance at *${facility}*.\n\n` +
      `📋 *Plan:* ${member.plan_type}\n` +
      `💰 *Total Agreed Fee:* ₹${Number(member.total_amount).toLocaleString('en-IN')}\n` +
      `✅ *Amount Paid:* ₹${Number(member.amount_paid).toLocaleString('en-IN')} (${member.payment_mode || 'UPI'})\n` +
      `⚠️ *Outstanding Balance Due:* ₹${Number(member.balance_due).toLocaleString('en-IN')}\n` +
      `📅 *Expiration Date:* ${formatDate(member.expiry_date)}\n\n` +
      `Kindly settle your dues at the gym front desk to maintain uninterrupted access. Thank you! 💪`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendEmailDueReminder = async (member) => {
    if (!member.email) {
      alert('This member does not have an email address registered.');
      return;
    }
    try {
      await API.post(`/members/${member.id}/reminder/email`);
      setActionMessage({ text: `Dues reminder email sent to ${member.email}`, type: 'success' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reminder email');
    }
  };

  const shareAttendanceQRWhatsApp = (member) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? `http://${window.location.host}` : 'https://pulsefit-dinesh.vercel.app';
    const passUrl = `${baseUrl}/pass/${member.id}`;
    const facility = user?.gym_name || 'Pulse Fit Hub';

    let cleanPhone = member.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const text = `*${facility.toUpperCase()} - Official Attendance Access Pass*\n\n` +
      `Hello *${member.full_name}*,\n` +
      `Here is your digital check-in QR code for daily gym attendance.\n\n` +
      `🪪 *Athlete ID:* #PF-${String(member.id).padStart(5, '0')}\n` +
      `⚡ *Tier:* ${member.plan_type}\n` +
      `📅 *Valid Until:* ${formatDate(member.expiry_date)}\n\n` +
      `👉 *Open your Live Pass & QR Code:*\n${passUrl}\n\n` +
      `Present this badge to the scanner upon arrival! 💪`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const calculatedBalance = Math.max(
    0,
    (Number(formData.total_amount) || 0) - (Number(formData.amount_paid) || 0)
  );

  const getLivePassUrl = (id) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? `http://${window.location.host}` : 'https://pulsefit-dinesh.vercel.app';
    return `${baseUrl}/pass/${id}`;
  };

  const formatPlanLabel = (plan) => {
    switch (plan) {
      case 'DAILY': return '⚡ Daily Pass';
      case 'MONTHLY': return '🗓️ 1 Month';
      case '2_MONTHS': return '🗓️ 2 Months';
      case 'QUARTERLY': return '🗓️ 3 Months';
      case 'HALF_YEARLY': return '🗓️ 6 Months';
      case 'ANNUAL': return '👑 1 Year';
      case 'CUSTOM': return '⚙️ Custom';
      default: return plan;
    }
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
    if (paymentModeFilter !== 'ALL' && (member.payment_mode || 'UPI') !== paymentModeFilter) return false;

    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12 px-1 sm:px-0">
      
      {/* Toast Notification */}
      {actionMessage.text && (
        <div className={`p-4 rounded-2xl border text-xs font-bold shadow-2xl flex items-center justify-between ${
          actionMessage.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">Members Directory</h1>
          <p className="text-slate-400 text-xs">Payment mode tracking (Cash/UPI), Shareable QR badges, and dues reminders.</p>
        </div>

        {!isSuperAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>+</span> Register New Member
          </button>
        )}
      </div>

      {/* Metrics Row */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          <div onClick={() => setStatusFilter('ALL')} className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer ${statusFilter === 'ALL' ? 'bg-[#00F2FE]/10 border-[#00F2FE]' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-slate-400">All Members</p>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">{summary.total}</h3>
          </div>
          <div onClick={() => setStatusFilter('ACTIVE')} className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer ${statusFilter === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-emerald-400">Active</p>
            <h3 className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">{summary.activeCount}</h3>
          </div>
          <div onClick={() => setStatusFilter('EXPIRING_SOON')} className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer ${statusFilter === 'EXPIRING_SOON' ? 'bg-amber-500/10 border-amber-500' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-amber-400">Expiring (≤7D)</p>
            <h3 className="text-base sm:text-lg font-black text-amber-400 mt-0.5">{summary.expiringSoonCount}</h3>
          </div>
          <div onClick={() => setStatusFilter('EXPIRED')} className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer ${statusFilter === 'EXPIRED' ? 'bg-red-500/10 border-red-500' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-red-400">Expired</p>
            <h3 className="text-base sm:text-lg font-black text-red-400 mt-0.5">{summary.expiredCount}</h3>
          </div>
          <div onClick={() => setStatusFilter('DUES')} className={`col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl border cursor-pointer ${statusFilter === 'DUES' ? 'bg-rose-500/15 border-rose-500' : 'bg-[#0B0F19] border-white/10'}`}>
            <p className="text-[9px] uppercase font-black text-rose-400">Pending Dues</p>
            <h3 className="text-base sm:text-lg font-black text-rose-400 mt-0.5 font-mono">₹{Number(summary.totalDuesAmount).toLocaleString('en-IN')}</h3>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-white/15 text-xs text-white outline-none focus:border-[#00F2FE]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Payment Mode Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Payment Mode:</span>
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="bg-[#0B0F19] border border-white/15 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
          >
            <option value="ALL">All Modes (Cash & UPI)</option>
            <option value="CASH">💵 Cash Only</option>
            <option value="UPI">📱 UPI / Online Only</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-bold text-xs">Loading membership directory...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-bold bg-[#0B0F19] rounded-3xl border border-white/10 text-xs">No members found matching filters.</div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="bg-[#0B0F19] p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col justify-between hover:border-[#00F2FE]/40 transition-all shadow-xl">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-[#00F2FE]">
                      {formatPlanLabel(member.plan_type)}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${member.payment_mode === 'CASH' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'}`}>
                      {member.payment_mode === 'CASH' ? '💵 Cash' : '📱 UPI'}
                    </span>
                  </div>

                  {Number(member.balance_due) > 0 ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-mono">
                      Due: ₹{Number(member.balance_due).toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Paid</span>
                  )}
                </div>

                <div className="flex gap-3.5 items-center my-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/60 overflow-hidden border border-white/15 flex-shrink-0 flex items-center justify-center">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="font-bold text-slate-500 text-lg">{member.full_name?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-bold text-xs sm:text-sm truncate">{member.full_name}</h3>
                    <p className="text-slate-400 text-xs font-mono">{member.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paid: <span className="text-emerald-400 font-bold font-mono">₹{Number(member.amount_paid).toLocaleString('en-IN')}</span> / ₹{Number(member.total_amount || member.amount_paid).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Dues Reminder Buttons */}
                {Number(member.balance_due) > 0 && !isSuperAdmin && (
                  <div className="mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-1.5">
                    <span className="text-[9px] font-bold text-rose-400">Remind:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => sendWhatsAppDueReminder(member)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1 transition-all"
                      >
                        <span>💬</span> WhatsApp
                      </button>
                      <button
                        onClick={() => sendEmailDueReminder(member)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[10px] flex items-center gap-1 transition-all"
                      >
                        <span>📧</span> Email
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-3 mt-2 border-t border-white/5">
                <button onClick={() => setQrMember(member)} className="py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-[#00F2FE] text-xs font-bold transition-all">
                  🪪 QR Pass
                </button>
                <button onClick={() => setViewMember(member)} className="py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold transition-all">
                  👁️ Info
                </button>
                {!isSuperAdmin && (
                  <>
                    <button onClick={() => handleOpenEditModal(member)} className="py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDeleteMember(member.id)} className="py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all">
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR MODAL */}
      {qrMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-sm p-6 rounded-3xl border border-white/20 text-center relative shadow-2xl space-y-3">
            <button onClick={() => setQrMember(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-base">✕</button>

            <span className="text-[10px] font-black tracking-widest text-[#00F2FE] uppercase block">OFFICIAL ATTENDANCE BADGE</span>
            <h3 className="text-lg font-black text-white">{qrMember.full_name}</h3>
            <p className="text-xs text-slate-400 font-mono mb-2">#PF-{String(qrMember.id).padStart(5, '0')}</p>

            <div className="bg-white p-4 rounded-2xl w-fit mx-auto shadow-xl border-4 border-[#00F2FE]/40">
              <QRCodeSVG 
                value={getLivePassUrl(qrMember.id)} 
                size={180} 
                level={"H"} 
                includeMargin={false} 
              />
            </div>

            <p className="text-[10px] text-slate-400">Scan at the front desk for immediate check-in / check-out</p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => shareAttendanceQRWhatsApp(qrMember)}
                className="py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-all"
              >
                <span>💬</span> Share Pass
              </button>
              <button onClick={() => window.print()} className="py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-white font-bold text-xs">
                Print Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MEMBER INFO MODAL */}
      {viewMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-md p-6 rounded-3xl border border-white/20 relative shadow-2xl space-y-4">
            <button onClick={() => setViewMember(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-base">✕</button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black/60 overflow-hidden border border-white/15 flex-shrink-0 flex items-center justify-center">
                {viewMember.photo_url ? (
                  <img src={viewMember.photo_url} alt={viewMember.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="font-bold text-slate-500 text-xl">{viewMember.full_name?.charAt(0)}</div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{viewMember.full_name}</h3>
                <p className="text-xs text-slate-400 font-mono">#PF-{String(viewMember.id).padStart(5, '0')}</p>
                <span className="text-[10px] font-bold text-[#00F2FE] uppercase">{formatPlanLabel(viewMember.plan_type)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Payment Mode:</span><span className="font-bold text-[#00F2FE]">{viewMember.payment_mode || 'UPI'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Gender:</span><span className="text-white font-bold">{viewMember.gender || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span><span className="text-white">{viewMember.dob ? formatDate(viewMember.dob) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="font-mono text-white">{viewMember.phone}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="text-white">{viewMember.email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Start Date:</span><span className="text-white">{formatDate(viewMember.start_date)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Expiry Date:</span><span className="text-amber-400 font-bold">{formatDate(viewMember.expiry_date)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Fee:</span><span className="font-mono text-white">₹{Number(viewMember.total_amount).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount Paid:</span><span className="font-mono text-emerald-400 font-bold">₹{Number(viewMember.amount_paid).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Discount Given:</span><span className="font-mono text-amber-300 font-bold">₹{Number(viewMember.discount || 0).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Remaining Due:</span><span className="font-mono text-rose-400 font-bold">₹{Number(viewMember.balance_due || 0).toLocaleString('en-IN')}</span></div>
            </div>

            <button onClick={() => setViewMember(null)} className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs">
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* REGISTER / EDIT MEMBER MODAL */}
      {isModalOpen && !isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] w-full max-w-2xl p-5 sm:p-8 rounded-3xl border border-white/20 max-h-[92vh] overflow-y-auto my-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">{editingMember ? 'Update Member Profile' : 'Register Gym Member'}</h2>
                <p className="text-[11px] text-slate-400">Auto-pricing, discounts, and payment mode tracking.</p>
              </div>
              <button onClick={() => { stopLiveCamera(); setIsModalOpen(false); }} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            {formError && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{formError}</div>}
            {cameraError && <div className="mb-4 text-xs p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">{cameraError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Photo Options: Upload + Camera */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-black/80 border-2 border-dashed border-[#00F2FE]/40 overflow-hidden flex items-center justify-center flex-shrink-0 relative shadow-inner">
                    {isCameraActive ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : formData.photo_url ? (
                      <img src={formData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-500">
                        <span className="text-2xl block">👤</span>
                        <span className="text-[8px] uppercase font-bold text-slate-400">No Photo</span>
                      </div>
                    )}
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <span className="text-[10px] font-bold text-slate-300 uppercase block">Athlete Photo (Digital QR Pass)</span>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => { stopLiveCamera(); fileInputRef.current?.click(); }}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>📁</span> Upload Photo
                      </button>

                      {!isCameraActive ? (
                        <button
                          type="button"
                          onClick={startLiveCamera}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00F2FE]/20 to-[#7928CA]/20 hover:from-[#00F2FE]/30 hover:to-[#7928CA]/30 border border-[#00F2FE]/40 text-[#00F2FE] font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <span>📷</span> Take Live Photo
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={captureLivePhoto}
                            className="px-4 py-1.5 rounded-xl bg-[#00F2FE] hover:bg-[#00F2FE]/90 text-black font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,254,0.4)]"
                          >
                            <span>📸</span> Capture
                          </button>
                          <button
                            type="button"
                            onClick={stopLiveCamera}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {formData.photo_url && !isCameraActive && (
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-[9px] text-slate-500">Choose from gallery or snap real-time webcam photo.</p>
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                  <input type="text" required placeholder="e.g. Rahul Sharma" value={formData.full_name} className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number *</label>
                  <input type="text" required placeholder="9876543210" value={formData.phone} className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#00F2FE] uppercase mb-1">Email Address *</label>
                  <input type="email" required placeholder="member@gmail.com" value={formData.email} className="w-full bg-black/40 border border-[#00F2FE]/40 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth (DOB)</label>
                  <input type="date" value={formData.dob} className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
                  <select value={formData.gender} className="w-full bg-[#07090E] border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Membership Plan Duration *</label>
                  <select value={formData.plan_type} className="w-full bg-[#07090E] border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => handlePlanChange(e.target.value)}>
                    <option value="DAILY">⚡ Daily Pass</option>
                    <option value="MONTHLY">🗓️ 1 Month</option>
                    <option value="2_MONTHS">🗓️ 2 Months</option>
                    <option value="QUARTERLY">🗓️ 3 Months (Quarterly)</option>
                    <option value="HALF_YEARLY">🗓️ 6 Months (Half Yearly)</option>
                    <option value="ANNUAL">👑 1 Year (Annual)</option>
                    <option value="CUSTOM">⚙️ Custom Duration</option>
                  </select>
                </div>

                {/* Pricing & Discount */}
                <div>
                  <label className="block text-[10px] font-bold text-[#00F2FE] uppercase mb-1">Plan Standard Fee (Auto-Fetched ₹)</label>
                  <input type="number" readOnly value={formData.base_price} className="w-full bg-black/60 border border-[#00F2FE]/40 px-3.5 py-2.5 rounded-xl text-xs text-[#00F2FE] font-bold font-mono outline-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">Special Discount (₹ INR)</label>
                  <input type="number" min="0" placeholder="0" value={formData.discount} className="w-full bg-black/40 border border-amber-400/40 px-3.5 py-2.5 rounded-xl text-xs text-amber-300 font-bold font-mono outline-none" onChange={(e) => handleDiscountChange(e.target.value)} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Net Agreed Fee (₹ INR) *</label>
                  <input type="number" required value={formData.total_amount} className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none font-mono" onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount Paid (₹ INR) *</label>
                  <input type="number" required value={formData.amount_paid} className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none font-mono" onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })} />
                </div>

                {/* 💳 PAYMENT MODE DROPDOWN */}
                <div className="col-span-full">
                  <label className="block text-[10px] font-bold text-[#00F2FE] uppercase mb-1">Payment Method / Mode *</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="w-full bg-[#07090E] border border-[#00F2FE]/40 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none font-bold"
                  >
                    <option value="UPI">📱 UPI / Online Transfer (GPay, PhonePe, Paytm, Bank)</option>
                    <option value="CASH">💵 Cash (Physical Currency Handover)</option>
                  </select>
                </div>

                <div className="col-span-full p-3 rounded-xl bg-black/50 border border-white/10 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px]">Remaining Balance Due:</span>
                  <strong className={calculatedBalance > 0 ? 'text-rose-400 font-mono text-xs' : 'text-emerald-400 font-mono text-xs'}>
                    ₹{calculatedBalance.toLocaleString('en-IN')} {calculatedBalance > 0 ? '(PARTIAL DUE)' : '(PAID IN FULL)'}
                  </strong>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Joining Date *</label>
                  <input type="date" required value={formData.start_date} className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiration Date *</label>
                  <input type="date" required value={formData.expiry_date} className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none" onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-3 active:scale-95 transition-all shadow-lg">
                {editingMember ? 'Save Changes' : 'Confirm Registration & Send QR Pass to Email'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}