import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await API.get('/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const toLocalDateString = (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs font-black text-slate-400 tracking-widest uppercase">
        Loading Visual Intelligence & Charts...
      </div>
    );
  }

  const overall = analytics?.overall || { 
    totalCollected: 0, 
    totalPendingDues: 0, 
    totalBilled: 0, 
    totalMembers: 0, 
    activeMembers: 0, 
    expiredMembers: 0,
    momGrowthPercentage: 0,
    collectionEfficiency: 100
  };

  const growthTrend = analytics?.growthTrend || [];
  const periodData = analytics?.periodRevenue || {};
  const currentPeriodMetrics = periodData[selectedPeriod] || { label: 'Current', collected: 0, dues: 0, billed: 0, count: 0 };
  const planRev = analytics?.planRevenueMap || {};
  const allMembers = analytics?.membersList || [];

  // Filter members according to selected timeframe
  const getFilteredMembers = () => {
    const now = new Date();
    const todayStr = toLocalDateString(now);

    return allMembers.filter(m => {
      const joinDate = m.start_date || m.created_at;
      const joinDateStr = toLocalDateString(joinDate);
      const createdDateStr = toLocalDateString(m.created_at);

      if (selectedPeriod === 'daily') {
        return joinDateStr === todayStr || createdDateStr === todayStr;
      }

      const d = new Date(joinDate);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);

      if (selectedPeriod === 'weekly') return diffDays >= 0 && diffDays <= 7;
      if (selectedPeriod === 'monthly') return diffDays >= 0 && diffDays <= 30;
      if (selectedPeriod === 'quarterly') return diffDays >= 0 && diffDays <= 90;
      if (selectedPeriod === 'halfYearly') return diffDays >= 0 && diffDays <= 180;
      if (selectedPeriod === 'annually') return diffDays >= 0 && diffDays <= 365;
      return true;
    });
  };

  const currentMembersInPeriod = getFilteredMembers();

  // Export handlers
  const handleExportPDF = () => {
    exportToPDF({
      gymName: user?.gym_name || 'Pulse Fit Facility',
      ownerName: user?.gym_owner_name || user?.name,
      timeRangeLabel: currentPeriodMetrics.label,
      metrics: currentPeriodMetrics,
      members: currentMembersInPeriod.length > 0 ? currentMembersInPeriod : allMembers
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      gymName: user?.gym_name || 'Pulse Fit Facility',
      timeRangeLabel: currentPeriodMetrics.label,
      metrics: currentPeriodMetrics,
      members: currentMembersInPeriod.length > 0 ? currentMembersInPeriod : allMembers
    });
  };

  // Chart Data Structuring
  const revenueVsDuesPieData = [
    { name: 'Collected Revenue', value: Number(overall.totalCollected), color: '#10B981' },
    { name: 'Pending Dues', value: Number(overall.totalPendingDues), color: '#F43F5E' }
  ];

  const planYieldBarData = [
    { name: 'Daily', revenue: planRev.DAILY || 0 },
    { name: '1 Mo', revenue: planRev.MONTHLY || 0 },
    { name: '2 Mos', revenue: planRev['2_MONTHS'] || 0 },
    { name: '3 Mos', revenue: planRev.QUARTERLY || 0 },
    { name: '6 Mos', revenue: planRev.HALF_YEARLY || 0 },
    { name: '1 Yr', revenue: planRev.ANNUAL || 0 },
    { name: 'Custom', revenue: planRev.CUSTOM || 0 }
  ];

  const periodicComparisonData = [
    { name: 'Today', Collected: periodData.daily?.collected || 0, Dues: periodData.daily?.dues || 0 },
    { name: '7 Days', Collected: periodData.weekly?.collected || 0, Dues: periodData.weekly?.dues || 0 },
    { name: '30 Days', Collected: periodData.monthly?.collected || 0, Dues: periodData.monthly?.dues || 0 },
    { name: '90 Days', Collected: periodData.quarterly?.collected || 0, Dues: periodData.quarterly?.dues || 0 },
    { name: '180 Days', Collected: periodData.halfYearly?.collected || 0, Dues: periodData.halfYearly?.dues || 0 },
    { name: '1 Year', Collected: periodData.annually?.collected || 0, Dues: periodData.annually?.dues || 0 }
  ];

  const periodButtons = [
    { id: 'daily', label: '⚡ Day Wise (Today)' },
    { id: 'weekly', label: '🗓️ Weekly (7D)' },
    { id: 'monthly', label: '🗓️ Monthly (30D)' },
    { id: 'quarterly', label: '🗓️ Quarterly (90D)' },
    { id: 'halfYearly', label: '🗓️ Half-Yearly (180D)' },
    { id: 'annually', label: '👑 Annually (365D)' }
  ];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B0F19]/95 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ color: item.color || item.fill }} className="font-mono flex justify-between gap-4">
              <span>{item.name}:</span>
              <strong>{typeof item.value === 'number' && item.name !== 'New Members' ? `₹${item.value.toLocaleString('en-IN')}` : item.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-14 overflow-x-hidden">
      
      {/* 🚀 Top Banner with Growth Velocity Badge */}
      <div className="relative rounded-3xl p-5 sm:p-8 bg-gradient-to-r from-[#00F2FE]/20 via-[#7928CA]/20 to-[#FF0080]/20 border border-white/15 shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-gradient-to-tr from-[#00F2FE]/15 to-[#FF0080]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] text-[10px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE] animate-pulse"></span>
                Financial & Growth Engine
              </span>

              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                overall.momGrowthPercentage >= 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {overall.momGrowthPercentage >= 0 ? `▲ +${overall.momGrowthPercentage}% MoM Growth` : `▼ ${overall.momGrowthPercentage}% MoM Growth`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 truncate">
              {user?.gym_name || 'Pulse Fit Financial Intelligence'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Time-series growth curves, dues risk analysis, and visual revenue charts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <span>📄</span> Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <span>📊</span> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 Periodic Filter Navigation Tabs */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Select Revenue Time Horizon:</span>
          <span className="text-[11px] font-bold text-[#00F2FE] bg-[#00F2FE]/10 px-2.5 py-0.5 rounded-full border border-[#00F2FE]/30">
            Active Filter: {currentPeriodMetrics.label}
          </span>
        </div>

        <div className="flex bg-[#0B0F19] p-1.5 rounded-2xl border border-white/10 overflow-x-auto max-w-full gap-1.5 scrollbar-none">
          {periodButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedPeriod(btn.id)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                selectedPeriod === btn.id
                  ? 'bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-white shadow-lg shadow-cyan-500/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 💰 Periodic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-[#0B0F19] p-5 sm:p-6 rounded-3xl border border-emerald-500/30 relative overflow-hidden shadow-xl group hover:border-emerald-500/60 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Collected Revenue</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {currentPeriodMetrics.label}
            </span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white mt-3 font-mono truncate">
            ₹{Number(currentPeriodMetrics.collected).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Verified payments received</p>
        </div>

        <div className="bg-[#0B0F19] p-5 sm:p-6 rounded-3xl border border-rose-500/30 relative overflow-hidden shadow-xl group hover:border-rose-500/60 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Pending Dues</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Outstanding
            </span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-rose-400 mt-3 font-mono truncate">
            ₹{Number(currentPeriodMetrics.dues).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Uncollected partial balances</p>
        </div>

        <div className="bg-[#0B0F19] p-5 sm:p-6 rounded-3xl border border-[#00F2FE]/30 relative overflow-hidden shadow-xl group hover:border-[#00F2FE]/60 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F2FE]/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#00F2FE]">Total Billed Value</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20">
              Contract Value
            </span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white mt-3 font-mono truncate">
            ₹{Number(currentPeriodMetrics.billed).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Total agreed plan fees</p>
        </div>

        <div className="bg-[#0B0F19] p-5 sm:p-6 rounded-3xl border border-purple-500/30 relative overflow-hidden shadow-xl group hover:border-purple-500/60 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform pointer-events-none"></div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Enrollments In Period</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              New Passes
            </span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white mt-3 font-mono truncate">
            {currentPeriodMetrics.count} <span className="text-xs text-slate-400 font-normal">Members</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Joined during this timeframe</p>
        </div>
      </div>

      {/* 📈 SECTION 1: GYM GROWTH CURVE & REVENUE VELOCITY (AREA CHART) */}
      <div className="bg-[#0B0F19] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Gym Growth Trajectory & Revenue Curve (6 Months)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks continuous monthly income progression and new member onboarding velocity.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold font-mono">
            <span className="flex items-center gap-1.5 text-[#00F2FE]">
              <span className="w-3 h-3 rounded-full bg-[#00F2FE]"></span> Revenue (₹)
            </span>
            <span className="flex items-center gap-1.5 text-[#FF0080]">
              <span className="w-3 h-3 rounded-full bg-[#FF0080]"></span> New Members
            </span>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00F2FE" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF0080" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FF0080" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#FF0080" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#00F2FE" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              <Area yAxisId="right" type="monotone" dataKey="newMembers" name="New Members" stroke="#FF0080" strokeWidth={2} fillOpacity={1} fill="url(#colorMembers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 📊 SECTION 2: COMPARATIVE CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart A: Collected Revenue vs Pending Dues (Grouped Bar Chart) */}
        <div className="lg:col-span-7 bg-[#0B0F19] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>📊</span> Collected Revenue vs. Pending Dues Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Realized income versus outstanding balances across time windows.</p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodicComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Collected" name="Collected Revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Dues" name="Pending Dues" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Cash Realization & Collection Efficiency (Donut Chart) */}
        <div className="lg:col-span-5 bg-[#0B0F19] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>🥧</span> Collection Efficiency & Dues Split
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Percentage ratio of realized funds vs pending arrears.</p>
          </div>

          <div className="h-56 sm:h-60 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueVsDuesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueVsDuesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Gauge Text */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-2xl font-black text-white font-mono">{overall.collectionEfficiency}%</span>
              <span className="text-[9px] uppercase font-bold text-emerald-400 block">Realized</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-center">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] uppercase font-black text-emerald-400 block">Collected</span>
              <strong className="text-xs sm:text-sm text-white font-mono">₹{Number(overall.totalCollected).toLocaleString('en-IN')}</strong>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] uppercase font-black text-rose-400 block">Dues</span>
              <strong className="text-xs sm:text-sm text-rose-400 font-mono">₹{Number(overall.totalPendingDues).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 📊 SECTION 3: PLAN-WISE REVENUE & ENROLLED ROSTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Plan Yield Financial Bar Chart */}
        <div className="lg:col-span-5 bg-[#0B0F19] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>🏷️</span> Revenue Yield by Plan Duration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Which membership packages generate the highest income.</p>
          </div>

          <div className="h-60 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planYieldBarData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Total Revenue" fill="#7928CA" radius={[0, 6, 6, 0]}>
                  {planYieldBarData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00F2FE' : '#7928CA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Roster in Active Horizon */}
        <div className="lg:col-span-7 bg-[#0B0F19] p-5 sm:p-7 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Active Horizon Roster ({currentPeriodMetrics.label})
              </h2>
              <p className="text-xs text-slate-400">Members enrolled during the selected time period.</p>
            </div>
            <button
              onClick={() => navigate('/members')}
              className="text-xs text-[#00F2FE] hover:underline font-bold self-start sm:self-auto"
            >
              Full Directory ➔
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="p-3 rounded-l-xl">Member Name</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Paid (₹)</th>
                  <th className="p-3">Due (₹)</th>
                  <th className="p-3">Joined (dd/mm/yyyy)</th>
                  <th className="p-3 rounded-r-xl text-right">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {currentMembersInPeriod.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500 font-bold">
                      No member enrollments recorded during {currentPeriodMetrics.label.toLowerCase()}.
                    </td>
                  </tr>
                ) : (
                  currentMembersInPeriod.slice(0, 6).map((m) => {
                    const due = Number(m.balance_due) || 0;
                    return (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-bold text-white truncate max-w-[140px]">
                          {m.full_name}
                        </td>
                        <td className="p-3 text-[#00F2FE] font-bold text-[11px]">
                          {m.plan_type}
                        </td>
                        <td className="p-3 text-emerald-400 font-mono font-bold">
                          ₹{Number(m.amount_paid).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-mono font-bold">
                          {due > 0 ? <span className="text-rose-400">₹{due.toLocaleString('en-IN')}</span> : <span className="text-slate-500">₹0</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                          {formatDate(m.start_date)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300 whitespace-nowrap">
                          {formatDate(m.expiry_date)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}