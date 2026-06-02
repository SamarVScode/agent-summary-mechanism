import { useState } from "react";

const STORAGE_KEY = "wt_agent_name";

/**
 * useAgentName — persists the selected agent name in localStorage.
 * Returns { agentName, setAgentName, clearAgentName }
 */
export function useAgentName() {
  const [agentName, setAgentNameState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );

  function setAgentName(name) {
    localStorage.setItem(STORAGE_KEY, name);
    setAgentNameState(name);
  }

  function clearAgentName() {
    localStorage.removeItem(STORAGE_KEY);
    setAgentNameState("");
  }

  return { agentName, setAgentName, clearAgentName };
}
