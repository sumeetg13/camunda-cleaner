import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for polling data at regular intervals
 */
export const usePolling = (callback, interval = 5000, enabled = true) => {
  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Start polling
  const startPolling = () => setIsPolling(true);

  // Stop polling
  const stopPolling = () => setIsPolling(false);

  // Toggle polling
  const togglePolling = () => setIsPolling(prev => !prev);

  // Effect to handle polling logic
  useEffect(() => {
    if (!isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Execute immediately
    callbackRef.current();

    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, interval]);

  return {
    isPolling,
    startPolling,
    stopPolling,
    togglePolling
  };
};
