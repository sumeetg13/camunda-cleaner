import { useState, useCallback } from 'react';
import { camundaApi } from '../utils/api';

/**
 * Custom hook for managing Camunda API interactions
 */
export const useCamundaApi = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch process definitions and instances
   */
  const fetchProcessDefinitions = useCallback(async (processKey) => {
    if (!processKey) {
      setError('Process key is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await camundaApi.getProcessDefinitions(processKey);
      if (result.success) {
        setData(result);
        return result;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      const errorMessage = `Failed to fetch process definitions: ${err.message}`;
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a single process instance with optimistic update
   */
  const deleteInstance = useCallback(async (instanceId, deploymentId) => {
    // Optimistic update - remove from local state immediately
    setData(prevData => {
      if (!prevData) return prevData;

      const newDeployments = { ...prevData.deployments };
      if (newDeployments[deploymentId]) {
        newDeployments[deploymentId] = {
          ...newDeployments[deploymentId],
          processDefinitions: newDeployments[deploymentId].processDefinitions.map(pd => ({
            ...pd,
            instances: pd.instances.filter(inst => inst.id !== instanceId)
          }))
        };
      }

      return {
        ...prevData,
        deployments: newDeployments
      };
    });

    try {
      const result = await camundaApi.deleteInstance(instanceId);
      if (!result.success) {
        // Rollback on failure
        await fetchProcessDefinitions(prevData.process_key);
        setError(result.message);
        return false;
      }
      return true;
    } catch (err) {
      // Rollback on failure
      if (data?.process_key) {
        await fetchProcessDefinitions(data.process_key);
      }
      setError(`Failed to delete instance: ${err.message}`);
      return false;
    }
  }, [data, fetchProcessDefinitions]);

  /**
   * Delete all instances for a deployment with optimistic update
   */
  const deleteDeploymentInstances = useCallback(async (deploymentId) => {
    // Optimistic update - clear instances for deployment
    const previousData = data;
    setData(prevData => {
      if (!prevData) return prevData;

      const newDeployments = { ...prevData.deployments };
      if (newDeployments[deploymentId]) {
        newDeployments[deploymentId] = {
          ...newDeployments[deploymentId],
          processDefinitions: newDeployments[deploymentId].processDefinitions.map(pd => ({
            ...pd,
            instances: []
          }))
        };
      }

      return {
        ...prevData,
        deployments: newDeployments
      };
    });

    try {
      const result = await camundaApi.deleteDeploymentInstances(deploymentId);
      if (!result.success) {
        // Rollback on failure
        setData(previousData);
        setError(result.message);
        return false;
      }
      return true;
    } catch (err) {
      // Rollback on failure
      setData(previousData);
      setError(`Failed to delete deployment instances: ${err.message}`);
      return false;
    }
  }, [data]);

  /**
   * Delete all deployments with optimistic update
   */
  const deleteAllDeployments = useCallback(async () => {
    const previousData = data;

    // Optimistic update - clear all data
    setData(null);

    try {
      const result = await camundaApi.deleteAllDeployments(previousData?.process_key);
      if (!result.success) {
        // Rollback on failure
        setData(previousData);
        setError(result.message);
        return false;
      }
      return true;
    } catch (err) {
      // Rollback on failure
      setData(previousData);
      setError(`Failed to delete all deployments: ${err.message}`);
      return false;
    }
  }, [data]);

  /**
   * Delete multiple selected instances
   */
  const deleteBulkInstances = useCallback(async (instanceIds) => {
    // Optimistic update - remove all selected instances
    const previousData = data;
    setData(prevData => {
      if (!prevData) return prevData;

      const newDeployments = { ...prevData.deployments };
      Object.keys(newDeployments).forEach(depId => {
        newDeployments[depId] = {
          ...newDeployments[depId],
          processDefinitions: newDeployments[depId].processDefinitions.map(pd => ({
            ...pd,
            instances: pd.instances.filter(inst => !instanceIds.includes(inst.id))
          }))
        };
      });

      return {
        ...prevData,
        deployments: newDeployments
      };
    });

    try {
      // Delete all instances
      const results = await Promise.allSettled(
        instanceIds.map(id => camundaApi.deleteInstance(id))
      );

      const failures = results.filter(r => r.status === 'rejected' || !r.value.success);
      if (failures.length > 0) {
        // Rollback and refresh
        await fetchProcessDefinitions(previousData.process_key);
        setError(`Failed to delete ${failures.length} instances`);
        return false;
      }
      return true;
    } catch (err) {
      // Rollback on failure
      setData(previousData);
      setError(`Failed to delete instances: ${err.message}`);
      return false;
    }
  }, [data, fetchProcessDefinitions]);

  return {
    data,
    loading,
    error,
    fetchProcessDefinitions,
    deleteInstance,
    deleteDeploymentInstances,
    deleteAllDeployments,
    deleteBulkInstances,
    clearError: () => setError(null)
  };
};
