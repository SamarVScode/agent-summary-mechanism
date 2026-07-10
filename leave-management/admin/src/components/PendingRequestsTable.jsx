import React from 'react';
import { formatDateRange } from '../formatDateRange';

export default function PendingRequestsTable({ pendingLeaves, setSelectedLeave }) {
  return (
    <div className="card mt-8">
      <h2 className="card-title mb-4">Pending Requests ({pendingLeaves.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-ink-muted font-medium">Agent</th>
              <th className="pb-3 text-ink-muted font-medium">Dates</th>
              <th className="pb-3 text-ink-muted font-medium">Reason</th>
              <th className="pb-3 text-ink-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingLeaves.length === 0 ? (
              <tr><td colSpan="4" className="py-6 text-center text-ink-muted">All caught up! No pending requests.</td></tr>
            ) : pendingLeaves.map(l => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="py-4 font-medium text-ink">{l.agent_name}</td>
                <td className="py-4 text-ink-secondary">
                  {formatDateRange(l.start_date, l.end_date)}
                </td>
                <td className="py-4 text-ink-muted max-w-xs truncate">{l.reason || '-'}</td>
                <td className="py-4 flex gap-2">
                  <button onClick={() => setSelectedLeave(l)} className="px-3 py-1.5 bg-primary-light text-primary hover:bg-primary hover:text-white rounded-lg transition text-sm font-bold border border-primary/20">
                    Review
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
