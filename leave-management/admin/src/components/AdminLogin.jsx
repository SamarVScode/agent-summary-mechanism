import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function AdminLogin({ email, password, setEmail, setPassword, authError, isLoggingIn, handleLogin }) {
  return (
    <div className="agent-picker-overlay">
      <div className="agent-picker-card">
        <div className="agent-picker-header">
          <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="agent-picker-title">Admin Login</h1>
          <p className="text-ink-muted mt-2 text-sm">Enter your credentials to access the leave management dashboard.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {authError && (
            <div className="p-3 rounded-lg bg-error-light border border-error-light text-error text-sm">
              {authError}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-2 text-ink-secondary">Email</label>
            <input 
              type="email" 
              className="date-input w-full"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-ink-secondary">Password</label>
            <input 
              type="password" 
              className="date-input w-full"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full mt-4 bg-primary text-white font-bold py-3 px-4 rounded-full hover:bg-primary-hover transition opacity-100 disabled:opacity-70"
          >
            {isLoggingIn ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
