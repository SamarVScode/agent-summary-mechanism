import { useState, useEffect } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export function useLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Leaves
      const leavesRes = await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?select=*&order=start_date.desc`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`
        }
      });
      const leavesData = await leavesRes.json();
      setLeaves(Array.isArray(leavesData) ? leavesData : []);

      // Fetch Agents
      const agentsRes = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=name&order=name.asc`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`
        }
      });
      const agentsData = await agentsRes.json();
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      });
      fetchData();
      if (callback) callback();
    } catch (err) {
      console.error(err);
    }
  };

  const assignLeave = async ({ assignName, assignStart, assignEnd }, callback) => {
    if (!assignName || !assignStart || !assignEnd) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leave_requests`, {
        method: 'POST',
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
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
      fetchData();
      if (callback) callback();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLeave = async (id, callback) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`
        }
      });
      fetchData();
      if (callback) callback();
    } catch (err) {
      console.error(err);
    }
  };

  return {
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
  };
}
