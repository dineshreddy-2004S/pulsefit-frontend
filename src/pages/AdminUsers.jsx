import React, { useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function AdminUsers() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('STAFF'); // 'STAFF' or 'LOGS'
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const [selectedOwner, setSelectedOwner] = useState(null);
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [logStaffFilter, setLogStaffFilter] = useState('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'TRAINER' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Self-contained safe date and time formatting
  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateVal) => {
    if (!dateVal) return '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      const params = {};
      if (logActionFilter !== 'ALL') params.action = logActionFilter;
      if (logStaffFilter !== 'ALL') params.staffId = logStaffFilter;

      const res = await API.get('/admin/logs', { params });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    }
  }, [logActionFilter, logStaffFilter]);

  // Initial load once on component mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchLogs()]);
      setLoading(false);
    };
    init();
  }, []);

  // Filter change load only
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleUpdateStatus = async (userId, newStatus, currentRole) => {
    try {
      await API.put(`/admin/users/${userId}`, { status: newStatus, role: currentRole });
      await Promise.all([fetchUsers(), fetchLogs()]);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleRoleChange = async (userId, currentStatus, newRole) => {
    try {
      await API.put(`/admin/users/${userId}`, { status: currentStatus, role: newRole });
      await Promise.all([fetchUsers(), fetchLogs()]);
    } catch (err) {
      alert(err.response?.data?.message || 'Role update failed');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this account?')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      await Promise.all([fetchUsers(), fetchLogs()]);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await API.post('/admin/users/create', newUserData);
      setFormSuccess(`${newUserData.role === 'TRAINER' ? 'Trainer' : 'Staff'} account created successfully!`);
      setNewUserData({ name: '', email: '', password: '', role: 'TRAINER' });
      await Promise.all([fetchUsers(), fetchLogs()]);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const getActionBadge = (type) => {
    switch (type) {
      case 'REGISTERED_MEMBER':
      case 'ADDED_MEMBER':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">➕ Member Enrolled</span>;
      case 'UPDATED_MEMBER':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">✏️ Member Modified</span>;
      case 'DELETED_MEMBER':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 whitespace-nowrap">🗑️ Member Deleted</span>;
      case 'SENT_DUES_REMINDER':
      case 'DUES_REMINDER_SENT':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 whitespace-nowrap">📧 Dues Reminder</span>;
      case 'CREATED_STAFF':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 whitespace-nowrap">👤 Staff Added</span>;
      case 'UPDATED_STAFF':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30 whitespace-nowrap">⚙️ Staff Role Shift</span>;
      case 'DELETED_STAFF':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 whitespace-nowrap">🚫 Staff Removed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/30 whitespace-nowrap">{type?.replace(/_/g, ' ') || 'LOGGED'}</span>;
    }
  };

  const filteredUsers = users.filter((u) => (filter === 'ALL' ? true : u.status === filter));

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] uppercase tracking-wider">
              {isSuperAdmin ? '👑 Super Admin Control' : '🏢 Gym Operations Hub'}
            </span>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">
            {isSuperAdmin ? 'Registered Gym Facilities & Owners' : 'Facility Team & Activity Trail'}
          </h1>
          
          <p className="text-slate-400 text-xs mt-0.5">
            {isSuperAdmin
              ? 'Inspect gym owner profiles, review facility logos, addresses, and grant or revoke access.'
              : 'Track member enrollments, staff changes, and dues reminder history in real-time.'}
          </p>
        </div>

        {!isSuperAdmin && (
          <button
            onClick={() => { setFormError(''); setFormSuccess(''); setIsCreateModalOpen(true); }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-white font-bold text-xs shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 flex-shrink-0"
          >
            <span>+</span> Create Staff / Trainer Account
          </button>
        )}
      </div>

      {/* Tab Switcher & Status Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-white/10 pb-4">
        {!isSuperAdmin ? (
          <div className="grid grid-cols-2 sm:flex gap-2">
            <button
              onClick={() => setActiveTab('STAFF')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center ${
                activeTab === 'STAFF' ? 'bg-[#00F2FE] text-[#07090E] shadow-[0_0_15px_rgba(0,242,254,0.3)]' : 'text-slate-400 bg-white/5'
              }`}
            >
              👥 Staff Logins ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 ${
                activeTab === 'LOGS' ? 'bg-[#FF0080] text-white shadow-[0_0_15px_rgba(255,0,128,0.3)]' : 'text-slate-400 bg-white/5'
              }`}
            >
              📜 Activity Trail ({logs.length})
            </button>
          </div>
        ) : (
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Total Facilities: <span className="text-white font-bold">{users.length}</span>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-white/10 text-xs self-start sm:self-auto overflow-x-auto max-w-full">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-[11px] whitespace-nowrap ${
                filter === st ? 'bg-[#00F2FE] text-[#07090E]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* SUPER ADMIN VIEW */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-slate-500 text-xs font-bold">Loading gym owner profiles...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 text-xs font-bold">No gym owner registrations found for this filter.</div>
          ) : (
            filteredUsers.map((owner) => (
              <div key={owner.id} className="bg-[#0B0F19] rounded-3xl border border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl hover:border-[#00F2FE]/40 transition-all group">
                <div className="flex justify-between items-start">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    owner.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    owner.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
                    'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {owner.status}
                  </span>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Joined: {formatDate(owner.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
                    {owner.gym_logo ? (
                      <img src={owner.gym_logo} alt={owner.gym_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="text-2xl font-black text-[#00F2FE]">
                        {owner.gym_name ? owner.gym_name.charAt(0) : '⚡'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-black text-white truncate">{owner.gym_name || 'Pulse Fit Facility'}</h3>
                    <p className="text-xs text-[#00F2FE] font-bold">Owner: {owner.name}</p>
                    {owner.gst_number && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">GSTIN: {owner.gst_number}</p>
                    )}
                  </div>
                </div>

                <div className="bg-black/40 rounded-2xl p-3.5 border border-white/5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-500">Email:</span><strong className="text-white font-mono truncate max-w-[160px]">{owner.email}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone:</span><strong className="text-white font-mono">{owner.phone || '—'}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Location:</span><strong className="text-slate-200 truncate max-w-[160px]">{owner.city || '—'}, {owner.state || '—'}</strong></div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {owner.status !== 'APPROVED' ? (
                    <button
                      onClick={() => handleUpdateStatus(owner.id, 'APPROVED', owner.role)}
                      className="py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-all active:scale-95"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(owner.id, 'REJECTED', owner.role)}
                      className="py-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition-all active:scale-95"
                    >
                      Revoke
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOwner(owner)}
                    className="py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => handleDeleteUser(owner.id)}
                    className="py-2 rounded-xl bg-red-500/20 text-red-300 font-bold text-xs hover:bg-red-500/30 transition-all active:scale-95"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* GYM OWNER VIEW: TAB 1 (STAFF LIST) */}
      {!isSuperAdmin && activeTab === 'STAFF' && (
        <div className="space-y-4">
          
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-xs">Loading staff roster...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-[#0B0F19] p-8 text-center rounded-2xl border border-white/10 text-slate-500 text-xs font-bold">
                No staff or trainer accounts created yet.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="bg-[#0B0F19] p-4 rounded-2xl border border-white/10 shadow-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-[#00F2FE]">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{u.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{u.email}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      u.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                    }`}>
                      {u.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Saved Password:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs text-[#00F2FE] truncate">
                          {visiblePasswords[u.id] ? (u.plain_password || '••••••••') : '••••••••'}
                        </span>
                        <button onClick={() => togglePasswordVisibility(u.id)} className="text-slate-400 hover:text-white text-xs">
                          {visiblePasswords[u.id] ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Role:</span>
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.id, u.status, e.target.value)} 
                        className="bg-[#07090E] border border-white/15 text-xs rounded-lg px-2 py-1 text-white w-full mt-0.5"
                      >
                        <option value="TRAINER">🏋️ Trainer</option>
                        <option value="STAFF">📋 Staff</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button 
                      onClick={() => handleDeleteUser(u.id)} 
                      className="w-full py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 transition-all"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#0B0F19] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="p-4">Staff / Trainer</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Saved Password</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading roster...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-bold">No staff or trainer accounts created yet.</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white">{u.name}</td>
                      <td className="p-4 text-slate-300 font-mono">{u.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#00F2FE] bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                            {visiblePasswords[u.id] ? (u.plain_password || '••••••••') : '••••••••'}
                          </span>
                          <button onClick={() => togglePasswordVisibility(u.id)} className="text-slate-400 hover:text-white text-xs">
                            {visiblePasswords[u.id] ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <select value={u.role} onChange={(e) => handleRoleChange(u.id, u.status, e.target.value)} className="bg-[#07090E] border border-white/15 text-xs rounded-xl px-2.5 py-1 text-white">
                          <option value="TRAINER">🏋️ Trainer</option>
                          <option value="STAFF">📋 Staff</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${u.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>{u.status}</span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1.5 bg-red-500/20 text-red-300 font-bold rounded-xl hover:bg-red-500/30">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GYM OWNER VIEW: TAB 2 (ACTIVITY LOGS TRAIL) */}
      {!isSuperAdmin && activeTab === 'LOGS' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B0F19] p-4 rounded-2xl border border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Action Type:</label>
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="bg-[#07090E] border border-white/15 text-xs rounded-xl px-3 py-2 text-white outline-none focus:border-[#00F2FE] w-full"
                >
                  <option value="ALL">All Actions</option>
                  <option value="REGISTERED_MEMBER">➕ Member Enrolled</option>
                  <option value="UPDATED_MEMBER">✏️ Member Updated</option>
                  <option value="DELETED_MEMBER">🗑️ Member Deleted</option>
                  <option value="SENT_DUES_REMINDER">📧 Dues Reminder Sent</option>
                  <option value="CREATED_STAFF">👤 Staff Created</option>
                  <option value="UPDATED_STAFF">⚙️ Staff Updated</option>
                  <option value="DELETED_STAFF">🚫 Staff Removed</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Performed By:</label>
                <select
                  value={logStaffFilter}
                  onChange={(e) => setLogStaffFilter(e.target.value)}
                  className="bg-[#07090E] border border-white/15 text-xs rounded-xl px-3 py-2 text-white outline-none focus:border-[#00F2FE] w-full"
                >
                  <option value="ALL">All Team Members</option>
                  <option value={user?.id}>{user?.name} (Gym Owner)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={fetchLogs}
              className="text-xs text-[#00F2FE] hover:underline font-bold self-start sm:self-center mt-2 sm:mt-0"
            >
              ↻ Refresh Trail
            </button>
          </div>

          {/* Mobile Logs Cards */}
          <div className="lg:hidden space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-xs">Loading activity logs...</div>
            ) : logs.length === 0 ? (
              <div className="bg-[#0B0F19] p-8 text-center rounded-2xl border border-white/10 text-slate-500 text-xs font-bold">
                No activity logs recorded yet for this filter.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-[#0B0F19] p-4 rounded-2xl border border-white/10 space-y-2.5 shadow-lg">
                  <div className="flex justify-between items-center">
                    {getActionBadge(log.action_type)}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Target Member/Staff:</span>
                    <strong className="text-[#00F2FE] truncate max-w-[180px]">{log.target_name || '—'}</strong>
                  </div>

                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Actor:</span>
                      <strong className="text-white font-mono">{log.performed_by_name} ({log.performed_by_role})</strong>
                    </div>
                    <div className="text-slate-300 text-[11px] pt-1 border-t border-white/5">
                      {log.details || 'No additional details.'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Logs Table */}
          <div className="hidden lg:block bg-[#0B0F19] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Performed By</th>
                  <th className="p-4">Target Member / Staff</th>
                  <th className="p-4">Operation Details</th>
                  <th className="p-4 text-right">Date & Time (IST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading activity trail...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-bold">No activity recorded yet for the selected filters.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">{getActionBadge(log.action_type)}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{log.performed_by_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.performed_by_role} • {log.performed_by_email || 'N/A'}</div>
                      </td>
                      <td className="p-4 font-bold text-[#00F2FE]">{log.target_name || '—'}</td>
                      <td className="p-4 text-slate-300 max-w-xs">{log.details || '—'}</td>
                      <td className="p-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Super Admin Modal: Inspect Gym Details */}
      {selectedOwner && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-white/20 relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedOwner(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg">✕</button>

            <div className="text-center space-y-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black/60 border-2 border-[#00F2FE]/40 overflow-hidden mx-auto shadow-xl flex items-center justify-center">
                {selectedOwner.gym_logo ? (
                  <img src={selectedOwner.gym_logo} alt={selectedOwner.gym_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-[#00F2FE]">{selectedOwner.gym_name?.charAt(0)}</span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{selectedOwner.gym_name}</h2>
              <p className="text-xs text-[#00F2FE] uppercase font-bold tracking-wider">Facility ID: #GYM-{String(selectedOwner.id).padStart(4, '0')}</p>
            </div>

            <div className="space-y-3 text-xs bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/10">
              <div className="flex justify-between"><span>Owner Name:</span><strong className="text-white">{selectedOwner.name}</strong></div>
              <div className="flex justify-between"><span>Email:</span><strong className="text-white font-mono">{selectedOwner.email}</strong></div>
              <div className="flex justify-between"><span>Phone:</span><strong className="text-white font-mono">{selectedOwner.phone || '—'}</strong></div>
              <div className="flex justify-between"><span>Location:</span><strong className="text-white">{selectedOwner.city}, {selectedOwner.state} ({selectedOwner.pincode})</strong></div>
              <div className="flex justify-between"><span>GST Registration:</span><strong className="text-emerald-400 font-mono">{selectedOwner.gst_number || 'N/A'}</strong></div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-slate-400 block text-[10px] uppercase">Registered Address:</span>
                <p className="text-slate-200 mt-1">{selectedOwner.gym_address}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gym Owner Modal: Create Staff Account */}
      {isCreateModalOpen && !isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] w-full max-w-md p-6 rounded-3xl border border-white/20 shadow-2xl relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Create Staff / Trainer Login</h2>
              <p className="text-xs text-slate-400 mt-0.5">Assign credentials and save password to view anytime.</p>
            </div>

            {formError && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">{formError}</div>}
            {formSuccess && <div className="mb-4 text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">{formSuccess}</div>}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
                  placeholder="e.g. Rahul Sharma"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
                  placeholder="trainer@gym.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Set Password</label>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-black/40 border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] pr-12"
                    placeholder="••••••••"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] font-bold"
                  >
                    {showModalPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role Type</label>
                <select
                  className="w-full bg-[#07090E] border border-white/15 px-4 py-2.5 rounded-xl text-xs text-white outline-none"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="TRAINER">🏋️ Trainer</option>
                  <option value="STAFF">📋 Ground Staff</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-2 hover:opacity-90 transition-all active:scale-95"
              >
                Create Account & Save Credentials
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}