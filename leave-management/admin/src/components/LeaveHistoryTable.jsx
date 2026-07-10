import React from 'react';
import { formatDateRange } from '../formatDateRange';

export default function LeaveHistoryTable({ leaves, setLeaveToDelete }) {
  return (
    <div className="card">
      <h2 className="card-title mb-4">Leave History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-ink-muted font-medium">Agent</th>
              <th className="pb-3 text-ink-muted font-medium">Dates</th>
              <th className="pb-3 text-ink-muted font-medium">Status</th>
              <th className="pb-3 text-ink-muted font-medium">Reason</th>
              <th className="pb-3 text-ink-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr><td colSpan="5" className="py-6 text-center text-ink-muted">No leave requests found.</td></tr>
            ) : leaves.map(l => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="py-4 font-medium text-ink">{l.agent_name}</td>
                <td className="py-4 text-ink-secondary">
                  {formatDateRange(l.start_date, l.end_date)}
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                    l.status === 'approved' ? 'bg-success-light text-success' : 
                    l.status === 'rejected' ? 'bg-error-light text-error' : 
                    'bg-primary-light text-primary'
                  }`}>
                    {l.status}
                  </span>
                </td>
                <td className="py-4 text-ink-muted max-w-xs truncate">{l.reason || '-'}</td>
                <td className="py-4">
                  <button onClick={() => setLeaveToDelete(l)} className="px-3 py-1.5 bg-error-light text-error hover:bg-[var(--error)] hover:text-white rounded-lg transition text-sm font-bold border border-error-light/50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
