import { useState } from "react";
import { useAgentName } from "./hooks/useAgentName";
import LoginPage    from "./components/LoginPage";
import TrackerPage  from "./components/TrackerPage";
import Dashboard    from "./components/Dashboard";
import Header       from "./components/Header";
import { formatDate } from "./utils/dateUtils";

/**
 * App — root component.
 * Shows LoginPage on first visit (no name in localStorage),
 * then shows Dashboard or TrackerPage for all subsequent visits.
 * Navigation is handled via the Header hamburger menu.
 */
export default function App() {
  const { agentName, casperId, setAgentInfo, clearAgentInfo } = useAgentName();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const today = formatDate();

  if (!agentName || !casperId) {
    return <LoginPage onLogin={setAgentInfo} />;
  }

  return (
    <div className="page">
      <Header
        agentName={agentName}
        date={today}
        onLogout={clearAgentInfo}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <main className="page-main">
        {currentTab === "dashboard" ? (
          <Dashboard agentName={agentName} />
        ) : (
          <TrackerPage agentName={agentName} casperId={casperId} />
        )}
      </main>
    </div>
  );
}
