import React from 'react';
import { formatDateRange } from '../formatDateRange';

export default function ConfirmDeleteModal({ leaveToDelete, setLeaveToDelete, handleDeleteLeave }) {
  if (!leaveToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold text-error">Confirm Deletion</h3>
        </div>
        <div className="p-6">
          <p className="text-ink">
            Are you sure you want to permanently delete the leave request for <strong>{leaveToDelete.agent_name}</strong>? 
          </p>
          <div className="mt-4 text-sm text-ink-secondary bg-bg p-3 rounded-lg border border-border">
            Dates: {formatDateRange(leaveToDelete.start_date, leaveToDelete.end_date)}
          </div>
          <p className="text-ink-muted text-sm mt-4">This action cannot be undone.</p>
        </div>
        <div className="p-6 bg-bg border-t border-border flex gap-3 justify-end">
          <button 
            onClick={() => setLeaveToDelete(null)}
            className="px-4 py-2 font-medium text-ink-muted hover:text-ink transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => handleDeleteLeave(leaveToDelete.id)}
            className="px-4 py-2 font-bold bg-error-light text-error border border-error-light/50 rounded-lg hover:bg-[var(--error)] hover:text-white transition shadow-sm"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}
