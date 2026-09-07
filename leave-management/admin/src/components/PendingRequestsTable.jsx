import React from 'react';
import { formatDateRange } from '../formatDateRange';
import { Check, Eye, AlertCircle, RotateCw } from 'lucide-react';

export default function PendingRequestsTable({ pendingLeaves, setSelectedLeave, updateLeaveStatus, onRefresh, loading }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const getDurationDays = (start, end) => {
    if (!start || !end) return '';
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  return (
    <div className="card mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="card-title">Pending Requests ({pendingLeaves.length})</h2>
          <p className="text-xs text-ink-muted mt-0.5">Review and take action on incoming agent leave requests</p>
        </div>
        {onRefresh && (
          <button 
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-ink-secondary hover:text-ink transition flex items-center gap-1.5 text-xs font-semibold shadow-sm disabled:opacity-60"
            title="Refresh Pending Requests"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Agent</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Dates & Duration</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Reason</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Timeline</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && pendingLeaves.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-ink-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCw className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs">Fetching leave requests...</span>
                  </div>
                </td>
              </tr>
            ) : pendingLeaves.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-ink-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-8 h-8 text-success opacity-80" />
                    <span>All caught up! No pending leave requests to review.</span>
                  </div>
                </td>
              </tr>
            ) : pendingLeaves.map(l => {
              const isPast = l.end_date < todayStr;
              const isToday = l.start_date <= todayStr && l.end_date >= todayStr;

              return (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                        {l.agent_name ? l.agent_name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <span className="font-semibold text-ink">{l.agent_name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-ink text-sm">
                        {formatDateRange(l.start_date, l.end_date)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-muted bg-bg px-2 py-0.5 rounded border border-border">
                          {getDurationDays(l.start_date, l.end_date)}
                        </span>
                        {isToday && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-success-light text-success font-bold uppercase tracking-wider">
                            Today
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 inline" /> Past Date
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-ink-secondary text-sm max-w-sm whitespace-pre-wrap break-words">
                      {l.reason || <span className="text-ink-muted italic">No reason provided</span>}
                    </p>
                  </td>
                  <td className="py-4 text-xs text-ink-muted">
                    {l.created_at ? new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      {updateLeaveStatus && (
                        <button 
                          onClick={() => updateLeaveStatus(l.id, 'approved')} 
                          className="px-3 py-1.5 bg-success-light text-success hover:bg-success hover:text-white rounded-lg transition text-xs font-bold border border-success-light/50 shadow-sm flex items-center gap-1.5"
                          title="Instantly Approve"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedLeave(l)} 
                        className="px-3 py-1.5 bg-surface text-ink-secondary hover:text-ink hover:bg-surface-hover rounded-lg transition text-xs font-bold border border-border shadow-sm flex items-center gap-1.5"
                        title="Inspect Reason / Reject"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
