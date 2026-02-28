import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7171';

/**
 * API client for Camunda Cleaner backend
 */
export const camundaApi = {
  /**
   * Fetch process definitions and instances for a given key
   */
  getProcessDefinitions: async (key) => {
    const response = await fetch(`${API_BASE}/api/process-definitions?key=${encodeURIComponent(key)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Delete a single process instance
   */
  deleteInstance: async (instanceId) => {
    const response = await fetch(`${API_BASE}/delete-instance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance_id: instanceId })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Delete all instances for a specific deployment
   */
  deleteDeploymentInstances: async (deploymentId) => {
    const response = await fetch(`${API_BASE}/delete-deployment-instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deployment_id: deploymentId })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Delete all deployments for a process key
   */
  deleteAllDeployments: async (processKey) => {
    const response = await fetch(`${API_BASE}/delete-all-deployments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ process_key: processKey })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Health check endpoint
   */
  healthCheck: async () => {
    const response = await fetch(`${API_BASE}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

/**
 * Hook wrapper for API calls with loading and error states
 * Note: This hook requires React to be imported in the consuming component
 */
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
};
