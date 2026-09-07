import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export function useLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Auth State (stores Supabase JWT access token)
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('admin_token');
    return (saved && saved !== 'admin_authenticated') ? saved : null;
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const getAuthHeaders = useCallback(() => {
    return {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${token || SUPABASE_ANON_KEY}`,
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

      // If token expired (401), prompt user to re-login
      if (leavesRes.status === 401) {
        localStorage.removeItem('admin_token');
        setToken(null);
        setAuthError("Session expired. Please sign in again.");
        return;
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
    handleLogout,
    fetchData,
    updateLeaveStatus,
    assignLeave,
    deleteLeave
  };
}
