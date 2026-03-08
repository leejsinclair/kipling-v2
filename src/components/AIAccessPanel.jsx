import { useState } from 'react';

/**
 * AIAccessPanel – lets the user provide a session-only OpenAI API key.
 *
 * The key lives exclusively in React state (passed up via onEnable).
 * It is never persisted to localStorage, sessionStorage, cookies, or any
 * other storage mechanism.
 */
export default function AIAccessPanel({ aiEnabled, aiStatus, aiError, onEnable, onDisable }) {
  const [keyInput, setKeyInput] = useState('');

  const handleEnable = () => {
    if (keyInput.trim()) {
      onEnable(keyInput.trim());
      // Clear the local input so the key is not held in an extra variable
      setKeyInput('');
    }
  };

  const handleDisable = () => {
    setKeyInput('');
    onDisable();
  };

  const isValidating = aiStatus === 'validating';

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">AI Assistant</h3>
        {aiEnabled && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ Enabled – session only
          </span>
        )}
        {!aiEnabled && aiStatus !== 'validating' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Disabled
          </span>
        )}
      </div>

      {!aiEnabled ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            aria-label="OpenAI API key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnable()}
            placeholder="Paste your OpenAI API key (session only)"
            disabled={isValidating}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50"
          />
          <button
            onClick={handleEnable}
            disabled={!keyInput.trim() || isValidating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isValidating ? 'Validating…' : 'Enable AI'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleDisable}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Disable AI / Clear Key
        </button>
      )}

      {aiError && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          ⚠ {aiError}
        </p>
      )}

      {!aiEnabled && !aiError && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Key is kept in memory for this session only and is cleared on page refresh.
        </p>
      )}
    </div>
  );
}
