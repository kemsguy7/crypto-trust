import React, { useState, useEffect } from 'react';
import { syncManager } from '../lib/sync-provider';
import { contractManager } from '../lib/contract-adapter';

export default function SettingsPage() {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [contractEnabled, setContractEnabled] = useState(true); // Default to true

  useEffect(() => {
    // Load current settings
    const loadSettings = async () => {
      // Load sync enabled state from localStorage first
      const storedSyncEnabled = localStorage.getItem('sync_enabled');
      
      // If we have a stored preference, use it
      if (storedSyncEnabled !== null) {
        const isEnabled = storedSyncEnabled === 'true';
        setSyncEnabled(isEnabled);
        
        // If sync should be enabled but provider isn't HTTP, switch it
        if (isEnabled) {
          const provider = syncManager.getProvider();
          const isHttp = provider.constructor.name === 'HttpSyncProvider';
          if (!isHttp) {
            const savedUrl = localStorage.getItem('sync_base_url') || '';
            const savedKey = localStorage.getItem('sync_api_key') || '';
            await syncManager.switchProvider('http', savedUrl || undefined, savedKey || undefined);
          }
        }
      } else {
        // No stored preference, check current provider
        const provider = syncManager.getProvider();
        const isHttp = provider.constructor.name === 'HttpSyncProvider';
        setSyncEnabled(isHttp);
        // Store the current state
        localStorage.setItem('sync_enabled', isHttp ? 'true' : 'false');
      }
      
      // Load URL and API key from localStorage
      const savedUrl = localStorage.getItem('sync_base_url') || '';
      const savedKey = localStorage.getItem('sync_api_key') || '';
      setSyncUrl(savedUrl);
      setApiKey(savedKey);
      
      // Check if contract mode is enabled
      const isContractEnabled = contractManager.isUsingContract();
      setContractEnabled(isContractEnabled);
      
      // Check connection if sync is enabled
      const storedEnabled = localStorage.getItem('sync_enabled') === 'true';
      if (storedEnabled) {
        const effectiveUrl = savedUrl || window.location.origin;
        checkConnection(effectiveUrl, savedKey);
      }
    };
    
    loadSettings();
  }, []);

  const checkConnection = async (url: string, key: string) => {
    setIsChecking(true);
    try {
      // Use the provided URL or fall back to current origin
      const effectiveUrl = url || window.location.origin;
      const response = await fetch(`${effectiveUrl}/api/reports`, {
        method: 'GET',
        headers: key ? { 'x-api-key': key } : {}
      });
      
      if (response.ok) {
        setSyncStatus('connected');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setSyncStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSyncToggle = async () => {
    // Just toggle the UI state - actual switch happens on Save
    setSyncEnabled(!syncEnabled);
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    
    try {
      // Save settings to localStorage
      localStorage.setItem('sync_enabled', syncEnabled ? 'true' : 'false');
      if (syncUrl) {
        localStorage.setItem('sync_base_url', syncUrl);
      } else {
        localStorage.removeItem('sync_base_url'); // Use default (same-origin)
      }
      if (apiKey) {
        localStorage.setItem('sync_api_key', apiKey);
      } else {
        localStorage.removeItem('sync_api_key');
      }
      
      if (syncEnabled) {
        // Switch to HTTP provider with new settings
        await syncManager.switchProvider('http', syncUrl || undefined, apiKey || undefined);
        const effectiveUrl = syncUrl || window.location.origin;
        await checkConnection(effectiveUrl, apiKey);
      } else {
        // Switch to local storage provider
        await syncManager.switchProvider('local');
        setSyncStatus('disconnected');
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleTestConnection = () => {
    const effectiveUrl = syncUrl || window.location.origin;
    checkConnection(effectiveUrl, apiKey);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your application preferences and sync options
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Smart Contract Settings */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Smart Contract Integration</h2>
            
            {/* Contract Toggle */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="contract-toggle" className="text-sm font-medium text-gray-900">
                  Smart Contract Mode
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Enabled by default. Anchors reports on-chain with mock transactions, enforces nullifier uniqueness, and emits contract events.
                </p>
              </div>
              <button
                id="contract-toggle"
                type="button"
                onClick={async () => {
                  const newState = !contractEnabled;
                  setContractEnabled(newState);
                  await contractManager.switchAdapter(newState);
                  setSaveStatus('saved');
                  setTimeout(() => setSaveStatus('idle'), 2000);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  contractEnabled ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={contractEnabled}
              >
                <span className="sr-only">Enable smart contract mode</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    contractEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {contractEnabled ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-800">
                    Smart contract mode active - Reports are anchored on-chain with mock transactions
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm text-yellow-800">
                    Smart contract mode disabled - Using local storage only (for testing)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sync Settings Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Data Synchronization</h2>
            
            {/* Sync Toggle */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="sync-toggle" className="text-sm font-medium text-gray-900">
                  Enable Cloud Sync
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Sync reports across devices using Vercel KV storage
                </p>
              </div>
              <button
                id="sync-toggle"
                type="button"
                onClick={handleSyncToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  syncEnabled ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={syncEnabled}
              >
                <span className="sr-only">Enable cloud sync</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    syncEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Connection Status */}
            {syncEnabled && (
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  {isChecking ? (
                    <span className="text-sm text-gray-500">Checking...</span>
                  ) : (
                    <span className={`text-sm font-medium ${
                      syncStatus === 'connected' ? 'text-green-600' : 
                      syncStatus === 'error' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {syncStatus === 'connected' ? '● Connected' :
                       syncStatus === 'error' ? '● Connection Failed' :
                       '● Disconnected'}
                    </span>
                  )}
                  {!syncUrl && syncEnabled && (
                    <span className="text-xs text-gray-500">(using current site)</span>
                  )}
                </div>
              </div>
            )}

            {/* Sync Configuration */}
            {syncEnabled && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="sync-url" className="block text-sm font-medium text-gray-700 mb-1">
                    Sync Server URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="sync-url"
                    value={syncUrl}
                    onChange={(e) => setSyncUrl(e.target.value)}
                    placeholder="Leave empty to use current site"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use this site's API. Only specify a URL for cross-origin sync or during local development.
                  </p>
                </div>

                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key (Optional)
                  </label>
                  <input
                    type="password"
                    id="api-key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Optional API key for authentication"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty if not using API key authentication
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saveStatus === 'saving' ? 'Saving...' : 
                     saveStatus === 'saved' ? 'Saved ✓' :
                     saveStatus === 'error' ? 'Error' :
                     'Save Settings'}
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={isChecking}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Privacy Notice</h3>
            <p className="text-sm text-gray-600">
              When cloud sync is disabled, all data remains stored locally in your browser's IndexedDB. 
              No information is transmitted to external servers.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              When cloud sync is enabled, encrypted report data is transmitted to your configured Vercel 
              deployment. The zero-knowledge proofs ensure your identity remains anonymous even when 
              using cloud sync.
            </p>
          </div>

          {/* Local Storage Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Local Storage</h3>
            <p className="text-sm text-blue-700">
              Your browser currently stores all reports locally. This data persists even when cloud 
              sync is enabled, providing a backup and offline access capability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
