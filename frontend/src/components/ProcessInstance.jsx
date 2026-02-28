import React, { useState } from 'react';

/**
 * Process instance item component with delete functionality
 */
export const ProcessInstance = ({
  instance,
  deploymentId,
  onDelete,
  isSelected,
  onToggleSelect,
  isDeleting
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (showConfirm) {
      const success = await onDelete(instance.id, deploymentId);
      if (success) {
        setShowConfirm(false);
      }
    } else {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${isDeleting ? 'animate-fade-out' : 'animate-slide-in'}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(instance.id)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono text-gray-900 truncate" title={instance.id}>
            {instance.id}
          </p>
          {instance.businessKey && (
            <p className="text-xs text-gray-500 truncate" title={instance.businessKey}>
              Key: {instance.businessKey}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          showConfirm
            ? 'bg-red-700 hover:bg-red-800 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={showConfirm ? 'Click to confirm deletion' : 'Delete instance'}
      >
        {showConfirm ? (
          <>
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Confirm
          </>
        ) : (
          <>
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </>
        )}
      </button>
    </div>
  );
};
