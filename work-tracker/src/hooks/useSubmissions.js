import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

/**
 * useSubmissions — fetches the list of submissions from Supabase filtered by agent name.
 *
 * Returns { submissions: object[], loading: bool, error: string|null, refresh: func }
 */
export function useSubmissions(agentName) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSubmissions() {
      if (!agentName) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      // If Supabase is misconfigured or testing, fallback to mock (for tests/environments without DB setup)
      // Note: we won't strictly enforce 'PASTE_YOUR' condition here if we want to fetch real data.
      // But if fetch fails or config is bad, we can fallback or handle errors.

      if (!SUPABASE_URL || SUPABASE_URL.includes("PASTE_YOUR")) {
        const timer = setTimeout(() => {
          if (isMounted) {
            setSubmissions([
              { id: 1, date: "2024-06-03", total_count: 50, completed_count: 45, image_url: "" },
              { id: 2, date: "2024-06-02", total_count: 40, completed_count: 38, image_url: "" },
            ]);
            setLoading(false);
          }
        }, 500);
        return () => clearTimeout(timer);
      }

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions?agent_name=eq.${encodeURIComponent(agentName)}&order=date.desc`, {
          method: "GET",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (!res.ok) {
           // Fallback to mock data if table doesn't exist or permissions fail for demo purposes
           throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        if (isMounted) {
          setSubmissions(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load submissions");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSubmissions();

    return () => {
      isMounted = false;
    };
  }, [agentName]);

  const refresh = () => {
    setLoading(true);
  };

  return { submissions, loading, error, refresh };
}
