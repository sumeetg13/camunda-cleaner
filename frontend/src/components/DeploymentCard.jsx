import React, { useState } from 'react';
import { ProcessInstance } from './ProcessInstance';

/**
 * Deployment card component showing process definitions and instances
 */
export const DeploymentCard = ({
  deploymentId,
  processDefinitions,
  onDeleteInstances,
  selectedInstances,
  onToggleInstance,
  onDeleteInstance
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Calculate total instances across all process definitions
  const totalInstances = processDefinitions.reduce(
    (sum, pd) => sum + (pd.instances?.length || 0),
    0
  );

  // Get all instance IDs for this deployment
  const deploymentInstanceIds = processDefinitions.flatMap(pd =>
    pd.instances?.map(inst => inst.id) || []
  );

  // Check if all instances in this deployment are selected
  const allSelected = deploymentInstanceIds.length > 0 &&
    deploymentInstanceIds.every(id => selectedInstances.has(id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      // Deselect all instances in this deployment
      deploymentInstanceIds.forEach(id => selectedInstances.delete(id));
    } else {
      // Select all instances in this deployment
      deploymentInstanceIds.forEach(id => selectedInstances.add(id));
    }
    // Force re-render
    onToggleInstance(null);
  };

  const handleDeleteAllInstances = async () => {
    if (showConfirmDeleteAll) {
      setIsDeletingAll(true);
      try {
        await onDeleteInstances(deploymentId);
        setShowConfirmDeleteAll(false);
      } finally {
        setIsDeletingAll(false);
      }
    } else {
      setShowConfirmDeleteAll(true);
      setTimeout(() => setShowConfirmDeleteAll(false), 3000);
    }
  };

  return (
    <div className="card mb-4 animate-slide-in">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Deployment: {deploymentId}
            </h3>
            <p className="text-sm text-gray-600">
              {totalInstances} {totalInstances === 1 ? 'instance' : 'instances'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalInstances > 0 && (
            <>
              <button
                onClick={handleToggleSelectAll}
                className="btn-secondary text-sm"
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleDeleteAllInstances}
                disabled={isDeletingAll}
                className={`btn-danger text-sm ${
                  showConfirmDeleteAll ? 'bg-red-700 hover:bg-red-800' : ''
                }`}
                title={showConfirmDeleteAll ? 'Click to confirm' : 'Delete all instances'}
              >
                {showConfirmDeleteAll ? (
                  <>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Confirm Delete All
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete All Instances
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {processDefinitions.map((pd) => (
            <div key={pd.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{pd.key}</h4>
                  <p className="text-sm text-gray-600">Version {pd.version}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {pd.instances?.length || 0} instances
                </span>
              </div>

              {pd.instances && pd.instances.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {pd.instances.map((instance) => (
                    <ProcessInstance
                      key={instance.id}
                      instance={instance}
                      deploymentId={deploymentId}
                      onDelete={onDeleteInstance}
                      isSelected={selectedInstances.has(instance.id)}
                      onToggleSelect={onToggleInstance}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic py-2">No running instances</p>
              )}
            </div>
          ))}

          {totalInstances === 0 && (
            <p className="text-sm text-gray-500 italic text-center py-4">
              No running instances for this deployment
            </p>
          )}
        </div>
      )}
    </div>
  );
};
