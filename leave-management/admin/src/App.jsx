import React, { useState, useEffect } from 'react';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle, UserPlus, Clock, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { useLeaveManagement } from './hooks/useLeaveManagement';
import AdminLogin from './components/AdminLogin';
import LeaveHistoryTable from './components/LeaveHistoryTable';
import PendingRequestsTable from './components/PendingRequestsTable';
import ReviewModal from './components/ReviewModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { formatDateRange } from './formatDateRange';

export default function App() {
  const {
    leaves,
    agents,
    loading,
    lastUpdated,
    token,
    email,
    setEmail,
    password,
    setPassword,
    authError,
    isLoggingIn,
    handleLogin,
    handleLogout,
    fetchData,
    updateLeaveStatus,
    assignLeave,
    deleteLeave
  } = useLeaveManagement();

  // Auto-refresh every 30s and on window focus
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, fetchData]);

  // Assign Leave Form State
  const [assignName, setAssignName] = useState("");
  const [assignStart, setAssignStart] = useState("");
  const [assignEnd, setAssignEnd] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveToDelete, setLeaveToDelete] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const handleAssignLeave = async (e) => {
    e.preventDefault();
    setAssignSubmitting(true);
    await assignLeave({ assignName, assignStart, assignEnd }, () => {
      setAssignName("");
      setAssignStart("");
      setAssignEnd("");
    });
    setAssignSubmitting(false);
  };

  const handleUpdateLeaveStatus = (id, status, reason = null) => {
    updateLeaveStatus(id, status, () => setSelectedLeave(null), reason);
  };

  const handleDeleteLeave = (id) => {
    deleteLeave(id, () => setLeaveToDelete(null));
  };

  const todayDate = new Date();
  const todayStr = format(todayDate, 'yyyy-MM-dd');
  
  // Derived state: strictly check approved status and date boundaries
  const todayLeaves = leaves.filter(l => 
    l.status === 'approved' && l.start_date <= todayStr && l.end_date >= todayStr
  );
  
  const upcomingLeaves = leaves.filter(l => 
    l.status === 'approved' && l.start_date > todayStr
  );
  
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  if (!token) {
    return (
      <AdminLogin 
        email={email} 
        password={password} 
        setEmail={setEmail} 
        setPassword={setPassword} 
        authError={authError} 
        isLoggingIn={isLoggingIn} 
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header relative">
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-full"></div>
          </div>
        )}
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="header-title">AgentFlow Admin</h1>
              <p className="text-[11px] text-ink-muted hidden sm:block">Leave Management & Team Scheduling</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Last Sync</span>
                <span className="text-xs font-semibold text-ink-secondary">
                  {format(lastUpdated, 'hh:mm:ss a')}
                </span>
              </div>
            )}
            <button 
              type="button"
              onClick={fetchData} 
              disabled={loading}
              className="px-4 py-2 rounded-full bg-primary-light text-primary hover:bg-primary/15 transition text-sm font-bold flex items-center gap-2 disabled:opacity-60 shadow-sm"
              title="Refresh data from database"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button 
              type="button"
              onClick={handleLogout} 
              className="px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-hover transition text-ink-secondary hover:text-ink text-sm font-bold shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="app-content">
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-5 py-2 rounded-full font-bold transition text-sm ${activeTab === 'dashboard' ? 'bg-ink text-bg shadow-md' : 'bg-surface text-ink-secondary border border-border hover:bg-surface-hover hover:text-ink'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`px-5 py-2 rounded-full font-bold transition text-sm ${activeTab === 'history' ? 'bg-ink text-bg shadow-md' : 'bg-surface text-ink-secondary border border-border hover:bg-surface-hover hover:text-ink'}`}
          >
            History
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Leaves */}
          <div className="card">
            <h2 className="card-title text-success flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Today's Leaves
            </h2>
            <div className="space-y-3 mt-4">
              {todayLeaves.length === 0 ? <p className="text-sm text-ink-muted">Everyone is active today.</p> : todayLeaves.map(l => (
                <div key={l.id} className="p-3 rounded-lg border border-border bg-bg">
                  <p className="font-medium text-ink">{l.agent_name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Leaves */}
          <div className="card">
            <h2 className="card-title text-primary flex items-center gap-2">
              <Clock className="w-5 h-5" /> Upcoming Leaves
            </h2>
            <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
              {upcomingLeaves.length === 0 ? <p className="text-sm text-ink-muted">No scheduled time off.</p> : upcomingLeaves.map(l => (
                <div key={l.id} className="p-3 rounded-lg border border-border bg-bg">
                  <p className="font-medium text-ink">{l.agent_name}</p>
                  <p className="text-xs text-ink-secondary mt-1">
                    {formatDateRange(l.start_date, l.end_date)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Leave */}
          <div className="card">
            <h2 className="card-title text-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Assign Leave
            </h2>
            <form onSubmit={handleAssignLeave} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm mb-1 text-ink-secondary font-semibold">Agent</label>
                <div className="select-wrapper">
                  <select 
                    value={assignName} onChange={e => setAssignName(e.target.value)} required
                    className="month-select w-full">
                    <option value="">Select Agent</option>
                    {agents.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-ink-secondary font-semibold">Start Date</label>
                  <input type="date" required value={assignStart} min={format(todayDate, 'yyyy-MM-dd')} onChange={e => {
                    setAssignStart(e.target.value);
                    if (assignEnd && e.target.value > assignEnd) setAssignEnd(e.target.value);
                  }}
                    className="date-input" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-ink-secondary font-semibold">End Date</label>
                  <input type="date" required value={assignEnd} min={assignStart || format(todayDate, 'yyyy-MM-dd')} onChange={e => setAssignEnd(e.target.value)}
                    className="date-input" />
                </div>
              </div>
              <button disabled={assignSubmitting} type="submit" className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-full transition font-bold mt-2">
                {assignSubmitting ? 'Assigning...' : 'Assign Approved Leave'}
              </button>
            </form>
          </div>
        </div>

        {/* Pending Approvals */}
        <PendingRequestsTable 
          pendingLeaves={pendingLeaves} 
          setSelectedLeave={setSelectedLeave} 
          updateLeaveStatus={handleUpdateLeaveStatus} 
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Full Calendar View */}
        <div className="card mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="card-title">Full Calendar View</h2>
              <p className="text-xs text-ink-muted mt-0.5 font-medium">{format(calendarMonth, 'MMMM yyyy')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
                className="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-ink-secondary transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => setCalendarMonth(new Date())}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-surface-hover text-ink-secondary transition"
              >
                Today
              </button>
              <button 
                type="button"
                onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
                className="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-ink-secondary transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-2 text-center text-xs font-bold uppercase text-ink-muted bg-surface">{d}</div>
            ))}
            {eachDayOfInterval({ start: startOfWeek(startOfMonth(calendarMonth)), end: endOfWeek(endOfMonth(calendarMonth)) }).map((date, idx) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayLeaves = leaves.filter(l => l.status === 'approved' && l.start_date <= dateStr && l.end_date >= dateStr);
              const isToday = isSameDay(date, todayDate);
              const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
              return (
                <div key={idx} className={`min-h-[100px] p-2 ${isToday ? 'bg-primary-light/40' : isCurrentMonth ? 'bg-surface' : 'bg-bg opacity-50'}`}>
                  <span className={`text-sm font-bold ${isToday ? 'text-primary' : isCurrentMonth ? 'text-ink' : 'text-ink-muted'}`}>{format(date, 'd')}</span>
                  <div className="mt-1 space-y-1">
                    {dayLeaves.map(l => (
                      <div key={l.id} className="text-[10px] px-1.5 py-0.5 bg-success-light text-success font-bold rounded truncate" title={`${l.agent_name} (${l.reason || 'Leave'})`}>
                        {l.agent_name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </>
        ) : (
          <LeaveHistoryTable 
            leaves={leaves} 
            setLeaveToDelete={setLeaveToDelete} 
            setSelectedLeave={setSelectedLeave} 
            onRefresh={fetchData}
            loading={loading}
          />
        )}

      {selectedLeave && (
        <ReviewModal
          selectedLeave={selectedLeave}
          setSelectedLeave={setSelectedLeave}
          updateLeaveStatus={handleUpdateLeaveStatus}
        />
      )}

      {leaveToDelete && (
        <ConfirmDeleteModal
          leaveToDelete={leaveToDelete}
          setLeaveToDelete={setLeaveToDelete}
          handleDeleteLeave={handleDeleteLeave}
        />
      )} 
      </main>
    </div>
  );
}
