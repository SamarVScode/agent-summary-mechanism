import { useState } from "react";
import { useAgentName } from "./hooks/useAgentName";
import AgentPicker  from "./components/AgentPicker";
import TrackerPage  from "./components/TrackerPage";
import Dashboard    from "./components/Dashboard";
import Header       from "./components/Header";
import { formatDate } from "./utils/dateUtils";

/**
 * App — root component.
 * Shows AgentPicker on first visit (no name in localStorage),
 * then shows Dashboard or TrackerPage for all subsequent visits.
 */
export default function App() {
  const { agentName, setAgentName, clearAgentName } = useAgentName();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const today = formatDate();

  if (!agentName) {
    return <AgentPicker onSelect={setAgentName} />;
  }

  return (
    <div className="page">
      <Header
        agentName={agentName}
        date={today}
        onChangeName={clearAgentName}
      />

      <div style={{ padding: "0 24px" }}>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentTab === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${currentTab === "upload" ? "active" : ""}`}
            onClick={() => setCurrentTab("upload")}
          >
            Upload Summary
          </button>
        </div>
      </div>

      <main className="page-main">
        {currentTab === "dashboard" ? (
          <Dashboard agentName={agentName} />
        ) : (
          <TrackerPage agentName={agentName} />
        )}
      </main>
    </div>
  );
}
