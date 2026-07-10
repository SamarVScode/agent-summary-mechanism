import React, { useState } from 'react';
import { formatDateRange } from '../formatDateRange';

export default function ReviewModal({ selectedLeave, setSelectedLeave, updateLeaveStatus }) {
  const [rejectReason, setRejectReason] = useState("");

  if (!selectedLeave) return null;

  const handleReject = () => {
    let finalReason = selectedLeave.reason || "";
    if (rejectReason.trim()) {
      finalReason = finalReason + "\n\n[Admin Rejection Reason]: " + rejectReason.trim();
    }
    updateLeaveStatus(selectedLeave.id, 'rejected', finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold text-ink">Review Leave Request</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Agent</label>
            <div className="text-ink font-semibold">{selectedLeave.agent_name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Dates</label>
            <div className="text-ink">
              {formatDateRange(selectedLeave.start_date, selectedLeave.end_date, 'MMMM d, yyyy')}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Reason</label>
            <div className="text-ink bg-bg p-3 rounded-lg border border-border whitespace-pre-wrap">
              {selectedLeave.reason || 'No reason provided.'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1">Rejection Reason (Optional)</label>
            <textarea
              className="w-full p-3 rounded-lg border border-border bg-bg text-ink min-h-[80px]"
              placeholder="If rejecting, you can provide a reason here..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </div>
        <div className="p-6 bg-bg border-t border-border flex gap-3 justify-end">
          <button 
            onClick={() => setSelectedLeave(null)}
            className="px-4 py-2 font-medium text-ink-muted hover:text-ink transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleReject}
            className="px-4 py-2 font-bold bg-error-light text-error border border-error-light/50 rounded-lg hover:bg-[var(--error)] hover:text-white transition shadow-sm"
          >
            Reject
          </button>
          <button 
            onClick={() => updateLeaveStatus(selectedLeave.id, 'approved')}
            className="px-4 py-2 font-bold bg-success-light text-success border border-success-light/50 rounded-lg hover:bg-[var(--success)] hover:text-white transition shadow-sm"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
