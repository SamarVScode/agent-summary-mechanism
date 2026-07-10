import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";
import TeamOverlapModal from "./TeamOverlapModal";
import LeaveDurationModal from "./LeaveDurationModal";
import { formatDateRange } from "../utils/date/formatDateRange";

export default function LeavePage({ agentName }) {
  const [leaves, setLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [overlapModalData, setOverlapModalData] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [duration, setDuration] = useState(1);
  const [editingLeaveId, setEditingLeaveId] = useState(null);


  const fetchLeaves = async () => {
    setLoading(true);
    try {
      if (!SUPABASE_URL || SUPABASE_URL.includes("PASTE_YOUR")) {
        setLeaves([]);
        setTeamLeaves([]);
        setLoading(false);
        return;
      }
      
      const [agentRes, teamRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/leave_requests?agent_name=eq.${encodeURIComponent(agentName)}&order=start_date.desc`, {
          method: "GET",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/leave_requests?status=eq.approved`, {
          method: "GET",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          }
        })
      ]);
      
      if (!agentRes.ok || !teamRes.ok) throw new Error("Failed to fetch leaves");
      const data = await agentRes.json();
      const tData = await teamRes.json();
      setLeaves(data || []);
      setTeamLeaves(tData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [agentName]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateApprovedForMe = (dateObj) => {
    if (!dateObj) return false;
    const dateStr = [
      dateObj.getFullYear(),
      String(dateObj.getMonth() + 1).padStart(2, '0'),
      String(dateObj.getDate()).padStart(2, '0')
    ].join('-');
    return leaves.some(l => l.status === "approved" && dateStr >= l.start_date && dateStr <= l.end_date);
  };

  const getApprovedAgentsForDate = (dateObj) => {
    if (!dateObj) return [];
    const dateStr = [
      dateObj.getFullYear(),
      String(dateObj.getMonth() + 1).padStart(2, '0'),
      String(dateObj.getDate()).padStart(2, '0')
    ].join('-');
    
    const agents = new Set();
    teamLeaves.forEach(l => {
      if (dateStr >= l.start_date && dateStr <= l.end_date) {
        agents.add(l.agent_name);
      }
    });
    return Array.from(agents);
  };

  const handleDayClick = (dateObj) => {
    if (!dateObj) return;
    const dateStr = [
      dateObj.getFullYear(),
      String(dateObj.getMonth() + 1).padStart(2, '0'),
      String(dateObj.getDate()).padStart(2, '0')
    ].join('-');
    setStartDate(dateStr);
    setSelectedDate(dateObj);
    setDuration(1);
    setReason("");
    setEditingLeaveId(null);
    setShowDurationModal(true);
  };

  const handleEditLeave = (leave) => {
    setStartDate(leave.start_date);
    
    // Calculate duration
    const sp = leave.start_date.split('-').map(Number);
    const ep = leave.end_date.split('-').map(Number);
    const start = new Date(sp[0], sp[1] - 1, sp[2]);
    const end = new Date(ep[0], ep[1] - 1, ep[2]);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    setDuration(diffDays);
    setReason(leave.reason || "");
    setEditingLeaveId(leave.id);
    
    const parts = leave.start_date.split('-');
    setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
    setShowDurationModal(true);
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!res.ok) throw new Error("Failed to cancel leave request");
      fetchLeaves();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const submitLeaveRequest = async (start, end, rsn) => {
    const s = start || startDate;
    const e = end || endDate;
    const r = rsn !== undefined ? rsn : reason;
    
    setOverlapModalData(null);
    setSubmitting(true);
    setError(null);
    try {
      const isEdit = !!editingLeaveId;
      const url = isEdit 
        ? `${SUPABASE_URL}/rest/v1/leave_requests?id=eq.${editingLeaveId}` 
        : `${SUPABASE_URL}/rest/v1/leave_requests`;
        
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          agent_name: agentName,
          start_date: s,
          end_date: e,
          reason: r,
          status: "pending",
          is_read: false
        })
      });
        
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to submit leave request");
      }
      
      setStartDate("");
      setEndDate("");
      setReason("");
      setEditingLeaveId(null);
      fetchLeaves();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDurationSubmit = async () => {
    if (!startDate || duration < 1) {
      setError("Invalid dates or duration.");
      return;
    }
    
    const parts = startDate.split('-').map(Number);
    const endObj = new Date(parts[0], parts[1] - 1, parts[2] + (duration - 1));
    const computedEndDateStr = [
      endObj.getFullYear(),
      String(endObj.getMonth() + 1).padStart(2, '0'),
      String(endObj.getDate()).padStart(2, '0')
    ].join('-');
    
    setEndDate(computedEndDateStr);
    setShowDurationModal(false);
    
    setIsChecking(true);
    setError(null);
    try {
      // Check for overlapping approved leaves from other agents
      let overlapUrl = `${SUPABASE_URL}/rest/v1/leave_requests?status=eq.approved&agent_name=neq.${encodeURIComponent(agentName)}&start_date=lte.${computedEndDateStr}&end_date=gte.${startDate}`;
      
      const overlapRes = await fetch(overlapUrl, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      });
      
      if (overlapRes.ok) {
        const overlappingLeaves = await overlapRes.json();
        if (overlappingLeaves && overlappingLeaves.length > 0) {
          const agentsOnLeave = [...new Set(overlappingLeaves.map(l => l.agent_name))];
          setIsChecking(false);
          setOverlapModalData(agentsOnLeave);
          return;
        }
      }

      setIsChecking(false);
      submitLeaveRequest(startDate, computedEndDateStr, reason);
    } catch (err) {
      setError(err.message);
      setIsChecking(false);
    }
  };

  return (
    <div className="tracker-container">
      {isChecking && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ marginTop: '16px', fontWeight: 700, color: 'var(--ink)' }}>Checking team schedule...</div>
        </div>
      )}

      <div className="history-header">
        <div className="history-title-group">
          <h2 className="history-title">Leave Management</h2>
          <p className="history-subtitle">Request and view your leaves</p>
        </div>
      </div>
      
      {error && (
        <div className="card" style={{ border: '1px solid var(--error)', backgroundColor: 'var(--error-light)', padding: '12px 16px' }}>
          <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{error}</p>
        </div>
      )}
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title" style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Select Leave Date</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--ink)' }}
            >&lt;</button>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--ink)' }}
            >&gt;</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {generateCalendarDays().map((dateObj, idx) => {
            if (!dateObj) return <div key={idx} style={{ padding: '8px' }} />;
            const approvedAgents = getApprovedAgentsForDate(dateObj);
            const isFullyBooked = approvedAgents.length >= 2;
            const hasLeaves = approvedAgents.length > 0;
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);
            const isPastOrToday = dateObj <= todayMidnight;
            const isAlreadyApprovedForMe = isDateApprovedForMe(dateObj);
            const isDisabled = isFullyBooked || isPastOrToday || isAlreadyApprovedForMe;
            
            return (
              <button 
                key={idx}
                disabled={isDisabled}
                onClick={() => handleDayClick(dateObj)}
                style={{
                  background: isAlreadyApprovedForMe ? 'var(--success-light)' : isDisabled ? 'var(--surface)' : 'var(--bg)',
                  border: `1px solid ${isAlreadyApprovedForMe ? 'var(--success-light)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  padding: '12px 4px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minHeight: '50px',
                  opacity: isDisabled ? 0.6 : 1
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: isDisabled ? 'var(--ink-muted)' : 'var(--ink)' }}>
                  {dateObj.getDate()}
                </span>
                {isAlreadyApprovedForMe ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="7" r="7" fill="var(--success)"/>
                    <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : hasLeaves && !isDisabled && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--error)' }}></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>Leave History</h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-muted)", fontSize: "var(--text-sm)", fontWeight: 600 }}>Loading...</div>
        ) : leaves.length === 0 ? (
          <div className="empty-state-card" style={{ border: 'none', boxShadow: 'none', padding: '32px 0' }}>
            <div className="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                <path d="M12 12v9"></path>
                <path d="m8 17 4 4 4-4"></path>
              </svg>
            </div>
            <h3>No leaves yet</h3>
            <p>You haven't requested any time off. When you do, it will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaves.map(leave => (
              <div key={leave.id} className="submission-item-card">
                <div className="submission-card-top">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--ink)' }}>
                      {formatDateRange(leave.start_date, leave.end_date)}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginTop: '4px' }}>{leave.reason || "No reason provided"}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ 
                      padding: "4px 10px", 
                      borderRadius: "var(--radius-sm)", 
                      fontSize: "9px", 
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      background: leave.status === "approved" ? "var(--success-light)" : leave.status === "rejected" ? "var(--error-light)" : "var(--primary-light)",
                      color: leave.status === "approved" ? "var(--success)" : leave.status === "rejected" ? "var(--error)" : "var(--primary)",
                      border: `1px solid ${leave.status === "approved" ? "var(--success-light)" : leave.status === "rejected" ? "var(--error-light)" : "var(--primary-light)"}`
                    }}>
                      {leave.status}
                    </div>
                    {leave.status === "pending" && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEditLeave(leave)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleCancelLeave(leave.id)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--error-light)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--error)',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TeamOverlapModal overlapModalData={overlapModalData} setOverlapModalData={setOverlapModalData} submitLeaveRequest={submitLeaveRequest} submitting={submitting} />
      <LeaveDurationModal showDurationModal={showDurationModal} setShowDurationModal={setShowDurationModal} selectedDate={selectedDate} startDate={startDate} duration={duration} setDuration={setDuration} reason={reason} setReason={setReason} handleDurationSubmit={handleDurationSubmit} isChecking={isChecking} />
    </div>
  );
}
