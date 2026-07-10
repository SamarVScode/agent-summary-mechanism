import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAgentName } from "./hooks/useAgentName";
import { useSubmissions } from "./hooks/useSubmissions";
import { useLeaveNotifications } from "./hooks/useLeaveNotifications";
import LoginPage    from "./components/LoginPage";
import TrackerPage  from "./components/TrackerPage";
import Dashboard    from "./components/Dashboard";
import ProfilePage  from "./components/ProfilePage";
import LeavePage    from "./components/LeavePage";
import Layout       from "./components/Layout";
import { formatDate } from "./utils/dateUtils";

/**
 * Protected Route wrapper — redirects to login if not authenticated.
 */
function ProtectedRoute({ agentName, casperId, children }) {
  if (!agentName || !casperId) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * App — root component with React Router.
 */
export default function App() {
  const { agentName, casperId, rateAmount, setAgentInfo, clearAgentInfo } = useAgentName();
  const today = formatDate();

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // Lift submissions state to App level to persist across tab switches
  const { submissions, loading, error, refresh } = useSubmissions(agentName);
  const hasUnreadLeaves = useLeaveNotifications(agentName);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={
            agentName && casperId ? (
              <Navigate to="/upload" replace />
            ) : (
              <div className="app-shell">
                <LoginPage onLogin={setAgentInfo} />
              </div>
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute agentName={agentName} casperId={casperId}>
              <Layout
                agentName={agentName}
                date={today}
                onLogout={clearAgentInfo}
                hasUnreadLeaves={hasUnreadLeaves}
              >
                <Routes>
                  <Route
                    path="/upload"
                    element={
                      <TrackerPage
                        agentName={agentName}
                        casperId={casperId}
                        onSubmissionSuccess={refresh}
                      />
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <Dashboard
                        agentName={agentName}
                        rateAmount={rateAmount}
                        submissions={submissions}
                        loading={loading}
                        error={error}
                      />
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProfilePage
                        agentName={agentName}
                        casperId={casperId}
                        rateAmount={rateAmount}
                        submissions={submissions}
                        onLogout={clearAgentInfo}
                        theme={theme}
                        onThemeToggle={toggleTheme}
                      />
                    }
                  />
                  <Route
                    path="/leave"
                    element={<LeavePage agentName={agentName} />}
                  />
                  {/* Default redirect */}
                  <Route path="*" element={<Navigate to="/upload" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
