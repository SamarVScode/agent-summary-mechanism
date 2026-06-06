import { useState } from "react";
import { useAgentName } from "./hooks/useAgentName";
import { useSubmissions } from "./hooks/useSubmissions";
import LoginPage    from "./components/LoginPage";
import TrackerPage  from "./components/TrackerPage";
import Dashboard    from "./components/Dashboard";
import Layout       from "./components/Layout";
import { formatDate } from "./utils/dateUtils";

/**
 * App — root component.
 */
export default function App() {
  const { agentName, casperId, rateAmount, setAgentInfo, clearAgentInfo } = useAgentName();
  const [currentTab, setCurrentTab] = useState("upload");
  const today = formatDate();

  // Lift submissions state to App level to persist across tab switches
  const { submissions, loading, error, refresh } = useSubmissions(agentName);

  if (!agentName || !casperId) {
    return <LoginPage onLogin={setAgentInfo} />;
  }

  return (
    <Layout
      agentName={agentName}
      date={today}
      onLogout={clearAgentInfo}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
    >
      <div style={{ display: currentTab === "dashboard" ? "block" : "none" }}>
        <Dashboard 
          agentName={agentName} 
          rateAmount={rateAmount}
          submissions={submissions}
          loading={loading}
          error={error}
        />
      </div>
      
      <div style={{ display: currentTab === "upload" ? "block" : "none" }}>
        <TrackerPage 
          agentName={agentName} 
          casperId={casperId} 
          onSubmissionSuccess={refresh}
        />
      </div>

      <div style={{ display: currentTab === "profile" ? "block" : "none" }}>
        <div className="card profile-card">
          <h2 className="card-title">Profile</h2>
          <div className="profile-info">
            <div className="profile-item">
              <label>Agent Name</label>
              <span>{agentName}</span>
            </div>
            <div className="profile-item">
              <label>Casper ID</label>
              <span>{casperId}</span>
            </div>
            <div className="profile-item">
              <label>Current Rate</label>
              <span>₹{rateAmount}</span>
            </div>
          </div>
          <button className="btn-ghost logout-item" onClick={clearAgentInfo} style={{ marginTop: '24px', width: '100%', color: 'var(--error)' }}>
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}
