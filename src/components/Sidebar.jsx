import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import founderImg from '../assets/dinesh_reddy.jpg';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isSuperAdmin = user?.role === 'ADMIN';

  const navContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        
        {/* Header Profile Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 shadow-xl">
          {isSuperAdmin ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#00F2FE] shadow-lg flex-shrink-0 bg-black/60">
                <img src={founderImg} alt="Dinesh Reddy" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white leading-tight truncate">Dinesh Reddy</h2>
                <p className="text-[10px] uppercase font-bold text-[#00F2FE] tracking-widest mt-0.5">👑 Super Admin Hub</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/60 border-2 border-[#00F2FE]/40 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg relative">
                  {user?.gym_logo ? (
                    <img src={user.gym_logo} alt={user.gym_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#00F2FE] to-[#7928CA] flex items-center justify-center text-white font-black text-xl sm:text-2xl">
                      {user?.gym_name ? user.gym_name.charAt(0) : '⚡'}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-black text-white truncate tracking-wide leading-tight">
                    {user?.gym_name || 'Pulse Fit Facility'}
                  </h2>
                  <p className="text-xs text-slate-300 truncate mt-1">
                    Owner: <span className="text-[#00F2FE] font-bold">{user?.gym_owner_name || user?.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[10px] text-slate-400 font-semibold">Role:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] text-[9px] font-black uppercase tracking-wider">
                  {user?.role === 'GYM_OWNER' ? '🏢 Gym Owner' : user?.role === 'TRAINER' ? '🏋️ Trainer' : '📋 Staff'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Links */}
        <nav className="space-y-2 text-xs font-bold">
          {!isSuperAdmin && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00F2FE]/20 to-[#7928CA]/20 text-[#00F2FE] border border-[#00F2FE]/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="text-lg">📊</span>
                <span>Revenue & Analytics</span>
              </NavLink>

              <NavLink
                to="/members"
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00F2FE]/20 to-[#7928CA]/20 text-[#00F2FE] border border-[#00F2FE]/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="text-lg">🪪</span>
                <span>Members Directory</span>
              </NavLink>

              {/* 📋 ATTENDANCE DASHBOARD NAVIGATION LINK */}
              <NavLink
                to="/attendance"
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00F2FE]/20 to-[#7928CA]/20 text-[#00F2FE] border border-[#00F2FE]/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="text-lg">📋</span>
                <span>Attendance Dashboard</span>
              </NavLink>

              <NavLink
                to="/fees"
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00F2FE]/20 to-[#7928CA]/20 text-[#00F2FE] border border-[#00F2FE]/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="text-lg">💰</span>
                <span>Membership Fees</span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/admin/users"
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#00F2FE]/20 to-[#7928CA]/20 text-[#00F2FE] border border-[#00F2FE]/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="text-lg">{isSuperAdmin ? '🏢' : '👥'}</span>
            <span>{isSuperAdmin ? 'Gym Owners Directory' : 'Staff & Activity Trail'}</span>
          </NavLink>
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-slate-300 hover:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <span>🚪</span> Sign Out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#00F2FE] flex-shrink-0 bg-black">
            <img src={founderImg} alt="Dinesh Reddy" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm sm:text-base font-black text-white truncate max-w-[190px] sm:max-w-xs">
            {isSuperAdmin ? 'DINESH REDDY ADMIN' : user?.gym_name || 'PULSE FIT'}
          </span>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 sm:w-80 bg-[#0B0F19] h-full p-5 border-r border-white/15 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <span className="text-xs font-black text-[#00F2FE] uppercase tracking-widest">Navigation Menu</span>
              <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[#0B0F19] border-r border-white/10 flex-col justify-between p-5 min-h-screen sticky top-0 h-screen overflow-y-auto flex-shrink-0">
        {navContent}
      </aside>
    </>
  );
}