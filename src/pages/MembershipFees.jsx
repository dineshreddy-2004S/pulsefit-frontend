import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';

export default function MembershipFees() {
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === 'GYM_OWNER';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: 'MONTHLY',
    duration_months: 1,
    duration_days: 30,
    price: '',
    admission_fee: '0',
    description: '',
    features: '',
    is_active: 1
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await API.get('/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to load membership plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setFormData({
      plan_name: '',
      plan_type: 'MONTHLY',
      duration_months: 1,
      duration_days: 30,
      price: '',
      admission_fee: '0',
      description: '',
      features: '',
      is_active: 1
    });
    setEditingPlan(null);
    setFormError('');
    setFormSuccess('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormError('');
    setFormSuccess('');
    setFormData({
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      duration_months: plan.duration_months || 1,
      duration_days: plan.duration_days || 30,
      price: plan.price,
      admission_fee: plan.admission_fee || 0,
      description: plan.description || '',
      features: plan.features || '',
      is_active: plan.is_active !== undefined ? plan.is_active : 1
    });
    setIsModalOpen(true);
  };

  const handlePlanTypeChange = (type) => {
    let months = 1;
    let days = 30;
    if (type === 'DAILY') { months = 0; days = 1; }
    else if (type === '2_MONTHS') { months = 2; days = 60; }
    else if (type === 'QUARTERLY') { months = 3; days = 90; }
    else if (type === 'HALF_YEARLY') { months = 6; days = 180; }
    else if (type === 'ANNUAL') { months = 12; days = 365; }

    setFormData(prev => ({
      ...prev,
      plan_type: type,
      duration_months: months,
      duration_days: days
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      if (editingPlan) {
        await API.put(`/plans/${editingPlan.id}`, formData);
        setFormSuccess('Plan updated successfully!');
      } else {
        await API.post('/plans', formData);
        setFormSuccess('New membership plan published successfully!');
      }
      fetchPlans();
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to remove this membership plan?')) return;
    try {
      await API.delete(`/plans/${planId}`);
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 overflow-x-hidden">
      
      {/* 🚀 Header Banner */}
      <div className="relative rounded-3xl p-5 sm:p-8 bg-gradient-to-r from-[#00F2FE]/20 via-[#7928CA]/20 to-[#FF0080]/20 border border-white/15 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] text-[10px] font-black uppercase tracking-widest">
              {isOwner ? '⚡ Full Rate Control' : '👁️ View-Only Desk Reference'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 truncate">
              Membership Fees & Package Details
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {isOwner 
                ? 'Create, edit, or adjust pricing tiers, admission charges, and included package perks.' 
                : 'Official pricing reference for front desk consultations and member inquiries.'}
            </p>
          </div>

          {isOwner && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-white font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all active:scale-95 flex items-center gap-2 flex-shrink-0"
            >
              <span>+</span> Add New Package
            </button>
          )}
        </div>
      </div>

      {/* 📋 Permission Notice for Staff & Trainers */}
      {!isOwner && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔒</span>
            <span>You are viewing official gym pricing in <strong>Review-Only Mode</strong>. Pricing modifications are reserved for Gym Owners.</span>
          </div>
          <span className="font-mono text-[#00F2FE] font-bold">₹ INR Validated</span>
        </div>
      )}

      {/* 💳 Membership Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-xs font-black uppercase tracking-widest text-slate-500">
            Loading Membership Packages...
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-[#0B0F19] rounded-3xl border border-white/10 text-slate-500 text-xs font-bold">
            No membership fee packages configured yet.
          </div>
        ) : (
          plans.map((plan) => {
            const featureList = (plan.features || '').split(',').map(f => f.trim()).filter(Boolean);
            const isDaily = plan.plan_type === 'DAILY';

            return (
              <div 
                key={plan.id} 
                className={`bg-[#0B0F19] p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all group ${
                  plan.plan_type === 'QUARTERLY' 
                    ? 'border-[#00F2FE]/50 shadow-[0_0_30px_rgba(0,242,254,0.15)]' 
                    : plan.plan_type === 'ANNUAL'
                      ? 'border-[#FF0080]/50 shadow-[0_0_30px_rgba(255,0,128,0.15)]'
                      : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular Pill */}
                {plan.plan_type === 'QUARTERLY' && (
                  <span className="absolute top-4 right-4 bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-black text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                {plan.plan_type === 'ANNUAL' && (
                  <span className="absolute top-4 right-4 bg-[#FF0080] text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                    VIP Elite
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#00F2FE] block">
                      {plan.plan_type} PACKAGE
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">{plan.plan_name}</h3>
                  </div>

                  {/* Price Block */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                        ₹{Number(plan.price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        / {isDaily ? 'day' : plan.duration_months > 1 ? `${plan.duration_months} mos` : 'month'}
                      </span>
                    </div>

                    {Number(plan.admission_fee) > 0 ? (
                      <p className="text-[11px] text-amber-400 font-bold font-mono">
                        + ₹{Number(plan.admission_fee).toLocaleString('en-IN')} One-time Admission Fee
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-400 font-bold">
                        ✓ Zero Admission Fee
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {plan.description || 'Standard facility floor access with training assistance.'}
                  </p>

                  {/* Features List */}
                  {featureList.length > 0 && (
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Included Privileges:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {featureList.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold text-sm">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Owner Actions */}
                {isOwner && (
                  <div className="grid grid-cols-2 gap-2.5 pt-6 mt-4 border-t border-white/5">
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>✏️</span> Edit Fee
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-xs border border-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>🗑️</span> Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 📝 ADD / EDIT PLAN MODAL (GYM OWNER ONLY) */}
      {isModalOpen && isOwner && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/10">
              <div>
                <h2 className="text-xl font-black text-white">{editingPlan ? 'Edit Membership Package' : 'Create New Membership Plan'}</h2>
                <p className="text-xs text-slate-400">Set rates, duration, admission fee, and package perks.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            {formError && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">{formError}</div>}
            {formSuccess && <div className="mb-4 text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">{formSuccess}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quarterly Pro"
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plan Duration Category *</label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => handlePlanTypeChange(e.target.value)}
                    className="w-full bg-[#07090E] border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
                  >
                    <option value="DAILY">⚡ Daily Pass (1 Day)</option>
                    <option value="MONTHLY">🗓️ 1 Month</option>
                    <option value="2_MONTHS">🗓️ 2 Months</option>
                    <option value="QUARTERLY">🗓️ 3 Months (Quarterly)</option>
                    <option value="HALF_YEARLY">🗓️ 6 Months (Half-Yearly)</option>
                    <option value="ANNUAL">👑 1 Year (Annual)</option>
                    <option value="CUSTOM">⚙️ Custom Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Membership Fee (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 3999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Admission Fee (₹ INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500 (or 0 for Free)"
                    value={formData.admission_fee}
                    onChange={(e) => setFormData({ ...formData, admission_fee: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] font-mono"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Short Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Full facility access with trainer assistance."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Included Features (Comma Separated)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Full Floor Access, Locker Included, Free Diet Plan, Sauna Access"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-4 hover:opacity-95 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
              >
                {editingPlan ? 'Save Changes' : 'Publish Membership Package'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}