import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday, isFuture, isPast } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle, XCircle, UserPlus, Clock } from 'lucide-react';
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

  // Assign Leave Form State
  const [assignName, setAssignName] = useState("");
  const [assignStart, setAssignStart] = useState("");
  const [assignEnd, setAssignEnd] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveToDelete, setLeaveToDelete] = useState(null);

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
  
  // Derived state
  const todayLeaves = leaves.filter(l => l.status === 'approved' && isSameDay(parseISO(l.start_date), todayDate) || (parseISO(l.start_date) <= todayDate && parseISO(l.end_date) >= todayDate));
  
  const upcomingLeaves = leaves.filter(l => l.status === 'approved' && parseISO(l.start_date) > todayDate);
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
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="header-title">AgentFlow Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="px-4 py-2 rounded-full bg-primary-light text-primary hover:bg-primary/10 transition text-sm font-bold">
              Refresh
            </button>
            <button onClick={handleLogout} className="px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-hover transition text-ink-secondary hover:text-ink text-sm font-bold shadow-sm">
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
        <PendingRequestsTable pendingLeaves={pendingLeaves} setSelectedLeave={setSelectedLeave} />

        {/* Full Calendar View */}
        <div className="card mt-8">
          <h2 className="card-title mb-4">Full Calendar View</h2>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-2 text-center text-xs font-bold uppercase text-ink-muted bg-surface">{d}</div>
            ))}
            {eachDayOfInterval({ start: startOfWeek(startOfMonth(todayDate)), end: endOfWeek(endOfMonth(todayDate)) }).map((date, idx) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayLeaves = leaves.filter(l => l.status === 'approved' && parseISO(l.start_date) <= date && parseISO(l.end_date) >= date);
              return (
                <div key={idx} className={`min-h-[100px] p-2 ${isSameDay(date, todayDate) ? 'bg-primary-light' : 'bg-bg'}`}>
                  <span className={`text-sm font-bold ${isSameDay(date, todayDate) ? 'text-primary' : 'text-ink-secondary'}`}>{format(date, 'd')}</span>
                  <div className="mt-1 space-y-1">
                    {dayLeaves.map(l => (
                      <div key={l.id} className="text-[10px] px-1.5 py-0.5 bg-success-light text-success font-bold rounded truncate">
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
          <LeaveHistoryTable leaves={leaves} setLeaveToDelete={setLeaveToDelete} />
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
