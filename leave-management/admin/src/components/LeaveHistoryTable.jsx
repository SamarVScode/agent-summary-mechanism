import React, { useState, useMemo } from 'react';
import { formatDateRange } from '../formatDateRange';
import { Search, Trash2, Eye, RotateCw } from 'lucide-react';

export default function LeaveHistoryTable({ leaves, setLeaveToDelete, setSelectedLeave, onRefresh, loading }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    return {
      all: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length
    };
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery = !query || 
        (l.agent_name && l.agent_name.toLowerCase().includes(query)) ||
        (l.reason && l.reason.toLowerCase().includes(query));
      return matchStatus && matchQuery;
    });
  }, [leaves, filterStatus, searchQuery]);

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="card-title">Leave History</h2>
          <p className="text-xs text-ink-muted mt-0.5">Comprehensive audit log of all leave requests</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by agent or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full border border-border bg-bg text-ink focus:outline-none focus:border-primary"
            />
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover text-ink-secondary hover:text-ink transition flex items-center gap-1.5 text-xs font-semibold shadow-sm disabled:opacity-60"
              title="Refresh History"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 pb-2 border-b border-border">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 text-xs font-bold rounded-full transition ${filterStatus === 'all' ? 'bg-ink text-bg' : 'bg-surface text-ink-secondary border border-border hover:bg-surface-hover'}`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1 text-xs font-bold rounded-full transition ${filterStatus === 'pending' ? 'bg-primary text-white' : 'bg-surface text-ink-secondary border border-border hover:bg-surface-hover'}`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-3 py-1 text-xs font-bold rounded-full transition ${filterStatus === 'approved' ? 'bg-success text-white' : 'bg-surface text-ink-secondary border border-border hover:bg-surface-hover'}`}
        >
          Approved ({counts.approved})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-3 py-1 text-xs font-bold rounded-full transition ${filterStatus === 'rejected' ? 'bg-error text-white' : 'bg-surface text-ink-secondary border border-border hover:bg-surface-hover'}`}
        >
          Rejected ({counts.rejected})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Agent</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Dates</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Reason</th>
              <th className="pb-3 text-ink-muted font-medium text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-ink-muted">
                  No leave requests found matching the current filters.
                </td>
              </tr>
            ) : filteredLeaves.map(l => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition">
                <td className="py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                      {l.agent_name ? l.agent_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <span className="font-semibold text-ink text-sm">{l.agent_name}</span>
                  </div>
                </td>
                <td className="py-4 text-ink-secondary text-sm">
                  {formatDateRange(l.start_date, l.end_date)}
                </td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded tracking-wider ${
                    l.status === 'approved' ? 'bg-success-light text-success' : 
                    l.status === 'rejected' ? 'bg-error-light text-error' : 
                    'bg-primary-light text-primary'
                  }`}>
                    {l.status}
                  </span>
                </td>
                <td className="py-4 text-ink-secondary text-sm max-w-xs truncate" title={l.reason}>
                  {l.reason || <span className="text-ink-muted italic">-</span>}
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-2">
                    {l.status === 'pending' && setSelectedLeave && (
                      <button 
                        onClick={() => setSelectedLeave(l)} 
                        className="px-2.5 py-1.5 bg-primary-light text-primary hover:bg-primary hover:text-white rounded-lg transition text-xs font-bold border border-primary/20 shadow-sm flex items-center gap-1"
                        title="Review Pending Request"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    )}
                    <button 
                      onClick={() => setLeaveToDelete(l)} 
                      className="px-2.5 py-1.5 bg-error-light text-error hover:bg-error hover:text-white rounded-lg transition text-xs font-bold border border-error-light/50 shadow-sm flex items-center gap-1"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
