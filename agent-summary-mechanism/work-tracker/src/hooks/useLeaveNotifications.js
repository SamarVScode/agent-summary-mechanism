import { useState, useEffect } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export function useLeaveNotifications(agentName, currentTab) {
  const [hasUnreadLeaves, setHasUnreadLeaves] = useState(false);

  const markAsRead = async (unreadIds) => {
    if (!unreadIds || unreadIds.length === 0) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?id=in.(${unreadIds.join(',')})`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ is_read: true })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaveStatus = async () => {
    if (!agentName || !SUPABASE_URL || SUPABASE_URL.includes("PASTE_YOUR")) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/leave_requests?agent_name=eq.${encodeURIComponent(agentName)}&is_read=is.false`, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        const unreadIds = data.map(l => l.id);
        const hasNew = unreadIds.length > 0;
        
        if (currentTab === 'leave') {
          if (hasNew) {
            await markAsRead(unreadIds);
          }
          setHasUnreadLeaves(false);
        } else {
          setHasUnreadLeaves(hasNew);
        }
      }
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  };

  useEffect(() => {
    fetchLeaveStatus();
    const intervalId = setInterval(fetchLeaveStatus, 10000);
    return () => clearInterval(intervalId);
  }, [agentName, currentTab]);

  return hasUnreadLeaves;
}
