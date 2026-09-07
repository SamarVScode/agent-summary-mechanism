import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export function useLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Auth State (accepts Supabase JWT or 'admin_authenticated' session)
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || 'admin_authenticated');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const getAuthHeaders = useCallback(() => {
    // If token is a true JWT (not our bypass indicator), use it; otherwise use SUPABASE_ANON_KEY
    const useAnon = !token || token === 'admin_authenticated';
    const authBearer = useAnon ? SUPABASE_ANON_KEY : token;
    return {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${authBearer}`,
      "Content-Type": "application/json"
    };
  }, [token]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Leaves
      let leavesRes = await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?select=*&order=start_date.desc`, {
        headers: getAuthHeaders()
      });

      // If token expired (401), automatically fallback to anon key and clear dead token
      if (leavesRes.status === 401) {
        localStorage.removeItem('admin_token');
        setToken('admin_authenticated');
        leavesRes = await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?select=*&order=start_date.desc`, {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          }
        });
      }

      const leavesData = await leavesRes.json();
      setLeaves(Array.isArray(leavesData) ? leavesData : []);

      // Fetch Agents for the assignment dropdown
      let agentsRes = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=name&order=name.asc`, {
        headers: getAuthHeaders()
      });
      if (agentsRes.status === 401) {
        agentsRes = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=name&order=name.asc`, {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
          }
        });
      }
      const agentsData = await agentsRes.json();
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch leaves or agents:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');
      
      setToken(data.access_token);
      localStorage.setItem('admin_token', data.access_token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBypassLogin = () => {
    setToken('admin_authenticated');
    localStorage.setItem('admin_token', 'admin_authenticated');
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
    setLeaves([]);
  };

  const updateLeaveStatus = async (id, status, callback, newReason = null) => {
    try {
      const payload = { status, is_read: false };
      if (newReason !== null) {
        payload.reason = newReason;
      }

      await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      });
      await fetchData();
      if (callback) callback();
    } catch (err) {
      console.error("Failed to update leave status:", err);
    }
  };

  const assignLeave = async ({ assignName, assignStart, assignEnd }, callback) => {
    if (!assignName || !assignStart || !assignEnd) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leave_requests`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          agent_name: assignName,
          start_date: assignStart,
          end_date: assignEnd,
          status: 'approved',
          reason: 'Assigned by Admin'
        })
      });
      await fetchData();
      if (callback) callback();
    } catch (err) {
      console.error("Failed to assign leave:", err);
    }
  };

  const deleteLeave = async (id, callback) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?id=eq.${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await fetchData();
      if (callback) callback();
    } catch (err) {
      console.error("Failed to delete leave:", err);
    }
  };

  return {
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
    handleBypassLogin,
    handleLogout,
    fetchData,
    updateLeaveStatus,
    assignLeave,
    deleteLeave
  };
}
