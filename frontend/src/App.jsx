import React, { useState, useEffect, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { DeploymentCard } from './components/DeploymentCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorAlert } from './components/ErrorAlert';
import { useCamundaApi } from './hooks/useCamundaApi';
import { usePolling } from './hooks/usePolling';
import './styles/index.css';

/**
 * Main application component
 */
function App() {
  const [processKey, setProcessKey] = useState('');
  const [pollingInterval, setPollingInterval] = useState(5000);
  const [selectedInstances, setSelectedInstances] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const {
    data,
    loading,
    error,
    fetchProcessDefinitions,
    deleteInstance,
    deleteDeploymentInstances,
    deleteAllDeployments,
    deleteBulkInstances,
    clearError
  } = useCamundaApi();

  // Handle search
  const handleSearch = useCallback(async (key) => {
    setProcessKey(key);
    setSelectedInstances(new Set()); // Clear selections when searching
    const result = await fetchProcessDefinitions(key);
    return result;
  }, [fetchProcessDefinitions]);

  // Handle clear
  const handleClear = useCallback(() => {
    setProcessKey('');
    setSelectedInstances(new Set());
  }, []);

  // Handle polling
  const pollData = useCallback(async () => {
    if (processKey && !loading) {
      await fetchProcessDefinitions(processKey);
    }
  }, [processKey, loading, fetchProcessDefinitions]);

  const { isPolling, togglePolling } = usePolling(pollData, pollingInterval, false);

  // Handle instance selection toggle
  const handleToggleInstance = useCallback((instanceId) => {
    setSelectedInstances(prev => {
      const newSet = new Set(prev);
      if (instanceId === null) {
        // Force re-render
        return new Set(newSet);
      }
      if (newSet.has(instanceId)) {
        newSet.delete(instanceId);
      } else {
        newSet.add(instanceId);
      }
      return newSet;
    });
  }, []);

  // Handle single instance deletion
  const handleDeleteInstance = useCallback(async (instanceId, deploymentId) => {
    const success = await deleteInstance(instanceId, deploymentId);
    if (success) {
      // Remove from selected if it was selected
      if (selectedInstances.has(instanceId)) {
        setSelectedInstances(prev => {
          const newSet = new Set(prev);
          newSet.delete(instanceId);
          return newSet;
        });
      }
    }
    return success;
  }, [deleteInstance, selectedInstances]);

  // Handle deployment instances deletion
  const handleDeleteDeploymentInstances = useCallback(async (deploymentId) => {
    return await deleteDeploymentInstances(deploymentId);
  }, [deleteDeploymentInstances]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedInstances.size === 0) return;

    const instanceIds = Array.from(selectedInstances);
    const success = await deleteBulkInstances(instanceIds);
    if (success) {
      setSelectedInstances(new Set());
      setShowBulkDeleteConfirm(false);
    }
    return success;
  }, [selectedInstances, deleteBulkInstances]);

  // Handle delete all deployments
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAllDeployments = useCallback(async () => {
    if (!showDeleteAllConfirm) {
      setShowDeleteAllConfirm(true);
      setTimeout(() => setShowDeleteAllConfirm(false), 3000);
      return;
    }

    setIsDeletingAll(true);
    try {
      const success = await deleteAllDeployments();
      if (success) {
        setProcessKey('');
        setSelectedInstances(new Set());
        setShowDeleteAllConfirm(false);
      }
    } finally {
      setIsDeletingAll(false);
    }
  }, [showDeleteAllConfirm, deleteAllDeployments]);

  // Calculate statistics
  const deploymentCount = Object.keys(data?.deployments || {}).length;
  const totalInstances = Object.values(data?.deployments || {}).reduce(
    (sum, dep) => sum + dep.processDefinitions.reduce(
      (pdSum, pd) => pdSum + (pd.instances?.length || 0),
      0
    ),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Camunda Process Cleaner
              </h1>
              <p className="text-gray-600">
                Manage and clean up Camunda process instances and deployments
              </p>
            </div>
            <div className="hidden sm:block">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <SearchBar
          processKey={processKey}
          onSearch={handleSearch}
          onClear={handleClear}
          loading={loading}
          isPolling={isPolling}
          pollingInterval={pollingInterval}
          onPollingToggle={togglePolling}
          onIntervalChange={setPollingInterval}
          showPollingControls={!!processKey}
        />

        {/* Error Alert */}
        <ErrorAlert error={error} onDismiss={clearError} />

        {/* Main Content */}
        {loading && !data && (
          <LoadingSpinner message="Fetching process definitions..." />
        )}

        {!loading && !data && !error && (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Enter a Process Definition Key
            </h3>
            <p className="text-gray-600">
              Search for process definitions to manage their instances and deployments
            </p>
          </div>
        )}

        {data && data.deployments && Object.keys(data.deployments).length > 0 && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-600">{deploymentCount}</div>
                <div className="text-sm text-gray-600">Deployments</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">{totalInstances}</div>
                <div className="text-sm text-gray-600">Total Instances</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-purple-600">{selectedInstances.size}</div>
                <div className="text-sm text-gray-600">Selected</div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedInstances.size > 0 && (
              <div className="card mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-900">
                      {selectedInstances.size} instance{selectedInstances.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedInstances(new Set())}
                      className="btn-secondary text-sm"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={() => {
                        if (showBulkDeleteConfirm) {
                          handleBulkDelete();
                        } else {
                          setShowBulkDeleteConfirm(true);
                          setTimeout(() => setShowBulkDeleteConfirm(false), 3000);
                        }
                      }}
                      className={`btn-danger text-sm ${
                        showBulkDeleteConfirm ? 'bg-red-700 hover:bg-red-800' : ''
                      }`}
                    >
                      {showBulkDeleteConfirm ? (
                        <>
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Confirm Delete
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Selected
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete All Deployments Button */}
            <div className="mb-6">
              <button
                onClick={handleDeleteAllDeployments}
                disabled={isDeletingAll}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  showDeleteAllConfirm
                    ? 'bg-red-700 hover:bg-red-800 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } ${isDeletingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {showDeleteAllConfirm ? (
                  <>
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Confirm: Delete ALL Deployments for "{data.process_key}"
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete All Deployments
                  </>
                )}
              </button>
            </div>

            {/* Deployment Cards */}
            <div className="space-y-4">
              {Object.entries(data.deployments).map(([deploymentId, deploymentData]) => (
                <DeploymentCard
                  key={deploymentId}
                  deploymentId={deploymentId}
                  processDefinitions={deploymentData.processDefinitions}
                  onDeleteInstances={handleDeleteDeploymentInstances}
                  selectedInstances={selectedInstances}
                  onToggleInstance={handleToggleInstance}
                  onDeleteInstance={handleDeleteInstance}
                />
              ))}
            </div>
          </>
        )}

        {data && data.deployments && Object.keys(data.deployments).length === 0 && (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Deployments Found
            </h3>
            <p className="text-gray-600">
              No process definitions found for key "{processKey}"
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Camunda Process Cleaner - Built with React, Vite & Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
