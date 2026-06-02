import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

/**
 * useAgentList — fetches the list of agent names from Supabase agents table.
 *
 * Returns { agents: string[], loading: bool, error: string|null }
 */
export function useAgentList() {
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    // Only fetch if a real endpoint is configured
    if (!SUPABASE_URL || SUPABASE_URL.includes("PASTE_YOUR")) {
      const timer = setTimeout(() => {
        setAgents(["Demo Agent A", "Demo Agent B", "Demo Agent C"]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    fetch(`${SUPABASE_URL}/rest/v1/agents?select=name&order=name.asc`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const names = (data || []).map((item) => item.name).filter(Boolean);
        setAgents(names);
      })
      .catch((err) => {
        setError(err.message || "Failed to load agents");
      })
      .finally(() => setLoading(false));
  }, []);

  return { agents, loading, error };
}
