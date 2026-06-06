import Header from "./Header";
import BottomNav from "./BottomNav";

export default function Layout({ children, agentName, date, onLogout, currentTab, onTabChange }) {
  return (
    <div className="app-shell">
      <Header
        agentName={agentName}
        date={date}
        onLogout={onLogout}
      />
      
      <main className="app-content">
        {children}
      </main>

      <BottomNav 
        currentTab={currentTab} 
        onTabChange={onTabChange} 
      />
    </div>
  );
}
