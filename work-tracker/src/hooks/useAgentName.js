import { useState } from "react";

const NAME_KEY = "wt_agent_name";
const ID_KEY = "wt_agent_id";

/**
 * useAgentName — persists the selected agent name and Casper ID in localStorage.
 * Returns { agentName, casperId, setAgentInfo, clearAgentInfo }
 */
export function useAgentName() {
  const [agentName, setAgentNameState] = useState(
    () => localStorage.getItem(NAME_KEY) || ""
  );
  const [casperId, setCasperIdState] = useState(
    () => localStorage.getItem(ID_KEY) || ""
  );

  function setAgentInfo(name, id) {
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(ID_KEY, id);
    setAgentNameState(name);
    setCasperIdState(id);
  }

  function clearAgentInfo() {
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(ID_KEY);
    setAgentNameState("");
    setCasperIdState("");
  }

  return { agentName, casperId, setAgentInfo, clearAgentInfo };
}
