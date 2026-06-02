import { useAgentName } from "./hooks/useAgentName";
import AgentPicker  from "./components/AgentPicker";
import TrackerPage  from "./components/TrackerPage";

/**
 * App — root component.
 * Shows AgentPicker on first visit (no name in localStorage),
 * then shows TrackerPage for all subsequent visits.
 */
export default function App() {
  const { agentName, setAgentName, clearAgentName } = useAgentName();

  if (!agentName) {
    return <AgentPicker onSelect={setAgentName} />;
  }

  return (
    <TrackerPage
      agentName={agentName}
      onChangeName={clearAgentName}
    />
  );
}
