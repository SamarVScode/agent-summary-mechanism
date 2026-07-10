import { useState } from "react";

const NAME_KEY = "wt_agent_name";
const ID_KEY = "wt_agent_id";
const RATE_KEY = "wt_agent_rate";

/**
 * useAgentName — persists the selected agent name, Casper ID, and Rate in localStorage.
 * Returns { agentName, casperId, rateAmount, setAgentInfo, clearAgentInfo }
 */
export function useAgentName() {
  const [agentName, setAgentNameState] = useState(
    () => localStorage.getItem(NAME_KEY) || ""
  );
  const [casperId, setCasperIdState] = useState(
    () => localStorage.getItem(ID_KEY) || ""
  );
  const [rateAmount, setRateAmountState] = useState(
    () => parseFloat(localStorage.getItem(RATE_KEY)) || 13
  );

  function setAgentInfo(name, id, rate) {
    const rateVal = parseFloat(rate) || 13;
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(ID_KEY, id);
    localStorage.setItem(RATE_KEY, rateVal.toString());
    setAgentNameState(name);
    setCasperIdState(id);
    setRateAmountState(rateVal);
  }

  function clearAgentInfo() {
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(ID_KEY);
    localStorage.removeItem(RATE_KEY);
    setAgentNameState("");
    setCasperIdState("");
    setRateAmountState(13);
  }

  return { agentName, casperId, rateAmount, setAgentInfo, clearAgentInfo };
}
