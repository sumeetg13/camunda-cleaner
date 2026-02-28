import React, { useState } from 'react';

/**
 * Search bar component with polling controls
 */
export const SearchBar = ({
  processKey,
  onSearch,
  onClear,
  loading,
  isPolling,
  pollingInterval,
  onPollingToggle,
  onIntervalChange,
  showPollingControls = false
}) => {
  const [inputValue, setInputValue] = useState(processKey || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleClear = () => {
    setInputValue('');
    onClear();
  };

  return (
    <div className="card mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="process-key" className="block text-sm font-medium text-gray-700 mb-2">
              Process Definition Key
            </label>
            <input
              id="process-key"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter process definition key (e.g., invoice-process)"
              className="input-field w-full"
              disabled={loading}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : 'Fetch'}
            </button>
            {processKey && (
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {showPollingControls && processKey && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPolling}
                    onChange={onPollingToggle}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${isPolling ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${isPolling ? 'translate-x-5' : 'translate-x-0'}`} style={{ marginTop: '2px' }}></div>
                  </div>
                </div>
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>

              <select
                value={pollingInterval}
                onChange={(e) => onIntervalChange(Number(e.target.value))}
                className="input-field text-sm py-1 px-2"
                disabled={!isPolling || loading}
              >
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            </div>

            {isPolling && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live updates enabled</span>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
