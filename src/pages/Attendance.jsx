import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Attendance() {
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({
    totalActiveMembers: 0,
    todayPresentCount: 0,
    records: [],
    weeklyTrend: []
  });
  const [membersList, setMembersList] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/attendance/dashboard?date=${selectedDate}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get('/members');
      setMembersList(Array.isArray(res.data) ? res.data : res.data.activeMembers || []);
    } catch (err) {
      console.error('Failed to load members for search:', err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    fetchMembers();
  }, []);

  // WebCam QR Scanner
  useEffect(() => {
    if (isCameraActive) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 200, height: 200 },
        rememberLastUsedCamera: true
      });

      scanner.render(
        (decodedText) => {
          const parts = decodedText.split('/');
          const scannedId = parts[parts.length - 1];
          if (scannedId) {
            scanner.clear();
            setIsCameraActive(false);
            handleLogAttendance(scannedId);
          }
        },
        () => {}
      );
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [isCameraActive]);

  const handleLogAttendance = async (idToLog) => {
    const id = idToLog || selectedMember?.id;
    if (!id) return;

    try {
      const res = await API.post('/attendance/record', { member_id: id });
      setMessage({ text: res.data.message, type: 'success' });
      setSelectedMember(null);
      setMemberSearch('');
      fetchAttendance();
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Attendance error', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  const calculateDuration = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diffMs = Math.max(0, end - start);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${user?.gym_name || 'Pulse Fit Hub'} - Attendance Log Sheet`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Filtered Date: ${formatDate(selectedDate)} | Turnout: ${data.todayPresentCount} Athletes Present`, 14, 23);

    const tableRows = data.records.map((r, i) => [
      i + 1,
      `#PF-${String(r.member_id).padStart(5, '0')}`,
      r.full_name,
      r.phone,
      r.plan_type,
      new Date(r.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'In Gym',
      calculateDuration(r.check_in_time, r.check_out_time)
    ]);

    autoTable(doc, {
      head: [['#', 'Member ID', 'Name', 'Phone', 'Plan', 'Check-In', 'Check-Out', 'Duration']],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [0, 242, 254], textColor: [7, 9, 14], fontStyle: 'bold' }
    });

    doc.save(`Attendance_Report_${selectedDate}.pdf`);
  };

  const exportExcel = () => {
    const worksheetData = data.records.map((r, i) => ({
      SNo: i + 1,
      Member_ID: `#PF-${String(r.member_id).padStart(5, '0')}`,
      Full_Name: r.full_name,
      Phone: r.phone,
      Plan: r.plan_type,
      Date: formatDate(r.attendance_date),
      Check_In_Time: new Date(r.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      Check_Out_Time: r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Active in Facility',
      Duration: calculateDuration(r.check_in_time, r.check_out_time),
      Status: r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `Attendance_${selectedDate}.xlsx`);
  };

  const setDateOffset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const attendanceRate = data.totalActiveMembers > 0 
    ? Math.round((data.todayPresentCount / data.totalActiveMembers) * 100) 
    : 0;

  const currentlyInGym = data.records.filter(r => !r.check_out_time).length;

  const filteredSearchMembers = membersList.filter(m => 
    m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone?.includes(memberSearch) ||
    String(m.id).includes(memberSearch)
  ).slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12 px-1 sm:px-0">
      
      {/* Toast Notification */}
      {message.text && (
        <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs font-bold shadow-2xl flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}>✕</button>
        </div>
      )}

      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">Attendance Radar</h1>
          <p className="text-slate-400 text-xs">Live check-ins, date filter history, workout timers, and facility turnout.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE]/20 to-[#7928CA]/20 hover:from-[#00F2FE]/30 hover:to-[#7928CA]/30 border border-[#00F2FE]/40 text-[#00F2FE] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
          >
            <span>{isCameraActive ? '✕ Close' : '📷 Scan QR'}</span>
          </button>
          
          <button onClick={exportPDF} className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all">
            📄 PDF
          </button>
          <button onClick={exportExcel} className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 transition-all">
            📊 Excel
          </button>
        </div>
      </div>

      {/* Webcam Scanner Card */}
      {isCameraActive && (
        <div className="p-4 sm:p-6 rounded-3xl bg-[#0B0F19] border border-[#00F2FE]/40 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">Live QR Scanner Active</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Point mobile pass directly to your camera.</p>
            </div>
            <button onClick={() => setIsCameraActive(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕ Close</button>
          </div>
          <div className="w-full max-w-[280px] mx-auto overflow-hidden rounded-2xl border border-white/20 bg-black">
            <div id="qr-reader" className="w-full"></div>
          </div>
        </div>
      )}

      {/* ⚡ Fast 1-Tap Check-In Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0B0F19] border border-white/10 shadow-xl space-y-2 relative">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#00F2FE] block">
          ⚡ Quick Check-In / Check-Out
        </span>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search athlete by Name, Phone, or ID..."
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setSelectedMember(null);
              }}
              className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]"
            />

            {memberSearch && !selectedMember && filteredSearchMembers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#07090E] border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-30">
                {filteredSearchMembers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMember(m);
                      setMemberSearch(`${m.full_name} (#PF-${String(m.id).padStart(5, '0')})`);
                    }}
                    className="p-3 hover:bg-white/10 cursor-pointer flex items-center justify-between border-b border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-black overflow-hidden border border-white/10 flex items-center justify-center font-bold text-slate-400 text-xs">
                        {m.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{m.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.phone}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#00F2FE] font-bold uppercase">{m.plan_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={!selectedMember && !memberSearch}
            onClick={() => handleLogAttendance()}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg whitespace-nowrap"
          >
            ⚡ Record
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0B0F19] border border-white/10 space-y-0.5 sm:space-y-1">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Active Athletes</span>
          <h3 className="text-lg sm:text-2xl font-black text-white font-mono">{data.totalActiveMembers}</h3>
          <span className="text-[9px] sm:text-[10px] text-slate-500 block">Total enrolled</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0B0F19] border border-white/10 space-y-0.5 sm:space-y-1">
          <span className="text-[9px] font-black uppercase text-[#00F2FE] tracking-wider">Present on Selected Date</span>
          <h3 className="text-lg sm:text-2xl font-black text-[#00F2FE] font-mono">{data.todayPresentCount}</h3>
          <span className="text-[9px] sm:text-[10px] text-slate-500 block">Unique check-ins</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0B0F19] border border-white/10 space-y-0.5 sm:space-y-1">
          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">In Facility</span>
          <h3 className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">{currentlyInGym}</h3>
          <span className="text-[9px] sm:text-[10px] text-emerald-400/80 animate-pulse block">● Active now</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0B0F19] border border-white/10 space-y-0.5 sm:space-y-1">
          <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">Turnout</span>
          <h3 className="text-lg sm:text-2xl font-black text-purple-400 font-mono">{attendanceRate}%</h3>
          <span className="text-[9px] sm:text-[10px] text-slate-500 block">Quota rate</span>
        </div>
      </div>

      {/* Visual Chart Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#0B0F19] border border-white/10 shadow-xl space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">7-Day Turnout Velocity</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Daily attendance volume</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] sm:text-[10px] font-mono text-[#00F2FE] font-bold">
            Live
          </span>
        </div>

        <div className="h-36 sm:h-44 flex items-end justify-between gap-1.5 sm:gap-3 pt-4 px-1 border-b border-white/10">
          {data.weeklyTrend.map((item, idx) => {
            const heightPct = data.totalActiveMembers > 0 
              ? Math.max(12, Math.round((item.totalPresent / data.totalActiveMembers) * 100))
              : 12;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                <span className="text-[9px] sm:text-[10px] font-mono text-[#00F2FE] font-bold">
                  {item.totalPresent}
                </span>
                <div 
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[36px] sm:max-w-[42px] rounded-t-lg sm:rounded-t-xl bg-gradient-to-t from-[#7928CA] to-[#00F2FE] transition-all shadow-[0_0_12px_rgba(0,242,254,0.15)]"
                ></div>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">{item.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📅 ATHLETE LOGBOOK & DATE FILTER */}
      <div className="bg-[#0B0F19] rounded-3xl border border-white/10 p-4 sm:p-6 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Attendance Logbook</h3>
            <p className="text-[10px] sm:text-xs text-slate-400">Timestamps, session length, and historical records</p>
          </div>
          
          {/* Interactive Date Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setDateOffset(0)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 border border-white/10"
            >
              Today
            </button>
            <button
              onClick={() => setDateOffset(-1)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 border border-white/10"
            >
              Yesterday
            </button>
            <div className="flex items-center gap-1.5 bg-black/50 border border-white/15 px-3 py-1 rounded-xl">
              <span className="text-[11px] text-slate-400 font-bold">Filter Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 1. Mobile Card Layout (< 768px) */}
        <div className="block md:hidden space-y-2.5">
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-xs">Loading logs for {selectedDate}...</div>
          ) : data.records.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-bold">No attendance records found for {selectedDate}.</div>
          ) : (
            data.records.map((record) => {
              const isInGym = !record.check_out_time;
              return (
                <div key={record.id} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                        {record.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{record.full_name}</h4>
                        <p className="text-[9px] text-slate-400 font-mono">#PF-{String(record.member_id).padStart(5, '0')}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#00F2FE] px-2 py-0.5 rounded-full bg-white/5 uppercase">
                      {record.plan_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-white/5 text-[10px]">
                    <div>
                      <span className="text-slate-500 block text-[8px] uppercase">In</span>
                      <span className="text-slate-300 font-mono font-bold">
                        {new Date(record.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px] uppercase">Out</span>
                      <span className="text-slate-300 font-mono font-bold">
                        {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8px] uppercase">Session</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {calculateDuration(record.check_in_time, record.check_out_time)}
                      </span>
                    </div>
                  </div>

                  {isInGym && (
                    <button
                      onClick={() => handleLogAttendance(record.member_id)}
                      className="w-full py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-[10px] uppercase tracking-wider active:scale-95"
                    >
                      Check Out Athlete
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Full Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 border-b border-white/10 font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3">Athlete</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Check-In</th>
                <th className="py-3 px-3">Check-Out</th>
                <th className="py-3 px-3">Session Length</th>
                <th className="py-3 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading attendance logbook for {selectedDate}...</td></tr>
              ) : data.records.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500 font-bold">No attendance records found for {selectedDate}.</td></tr>
              ) : (
                data.records.map((record) => {
                  const isInGym = !record.check_out_time;

                  return (
                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-black/60 overflow-hidden border border-white/15 flex items-center justify-center font-bold text-slate-400 text-xs">
                            {record.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{record.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">#PF-{String(record.member_id).padStart(5, '0')}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-[#00F2FE] font-bold text-[11px] uppercase tracking-wider">
                          {record.plan_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 font-mono">
                        {new Date(record.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 font-mono">
                        {record.check_out_time ? (
                          new Date(record.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                        ) : (
                          <span className="text-emerald-400 font-bold animate-pulse text-[11px]">● In Session</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-200">
                        {calculateDuration(record.check_in_time, record.check_out_time)}
                      </td>

                      <td className="py-3.5 px-3">
                        {isInGym && (
                          <button
                            onClick={() => handleLogAttendance(record.member_id)}
                            className="px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95"
                          >
                            Check Out
                          </button>
                        )}
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
  );
}