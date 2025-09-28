import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { generateKeyPair, decryptMessage, exportKeyPair, importKeyPair, keyStorage, validateEncryptedData, validatePasswordStrength } from '../lib/encryption';
import { verifyProof, ZKProof } from '../lib/midnight-stub';
import { cn, copyToClipboard, formatRelativeTime } from '../lib/utils';
import { syncManager } from '../lib/sync-provider';

interface Report {
  id: number | string;
  encryptedData: string;
  proof: ZKProof;
  timestamp: number;
  status: 'pending' | 'reviewed' | 'archived';
}

interface DecryptedReport {
  title: string;
  content: string;
  attachment?: string;
}

const ModeratorPage: React.FC = () => {
  const [keyPair, setKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<DecryptedReport | null>(null);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordError, setExportPasswordError] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showManualInputDialog, setShowManualInputDialog] = useState(false);
  const [manualPublicKey, setManualPublicKey] = useState('');
  const [manualPrivateKey, setManualPrivateKey] = useState('');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'danger' | 'info' | 'warning'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<'public' | 'private' | false>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    archived: 0
  });

  // Load keys from session storage on mount
  useEffect(() => {
    const storedKeys = keyStorage.loadKeyPair('moderator');
    if (storedKeys) {
      setKeyPair(storedKeys);
    }
    loadReports();
  }, []);

  // Clear decrypted content when keys are cleared
  useEffect(() => {
    if (!keyPair) {
      // Clear all decrypted content when keys are removed
      setDecryptedContent(null);
      setSelectedReport(null);
    }
  }, [keyPair]);

  // Update statistics when reports change
  useEffect(() => {
    setStats({
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      reviewed: reports.filter(r => r.status === 'reviewed').length,
      archived: reports.filter(r => r.status === 'archived').length
    });
  }, [reports]);

  const loadReports = async () => {
    setIsRefreshing(true);
    try {
      const provider = syncManager.getProvider();
      const syncedReports = await provider.listReports();
      
      // Convert synced reports to the expected format and sort by timestamp
      const formattedReports: Report[] = syncedReports.map(r => ({
        id: r.id || Date.now(),  // Keep string IDs as-is, don't parse
        encryptedData: r.encryptedData,
        proof: r.proof,
        timestamp: r.timestamp,
        status: r.status
      })).sort((a, b) => b.timestamp - a.timestamp);
      
      setReports(formattedReports);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to load reports:', error);
      // Fallback to direct IndexedDB access
      try {
        const db = await openDB();
        const tx = db.transaction(['reports'], 'readonly');
        const store = tx.objectStore('reports');
        const allReports = await new Promise<Report[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        setReports(allReports.sort((a, b) => b.timestamp - a.timestamp));
        setLastUpdated(Date.now());
      } catch (dbError) {
        console.error('Failed to load from IndexedDB:', dbError);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WhistleblowerDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const handleGenerateKeys = async () => {
    setIsGeneratingKeys(true);
    try {
      const newKeyPair = await generateKeyPair();
      setKeyPair(newKeyPair);
      keyStorage.saveKeyPair(newKeyPair, 'moderator');
      setAlertMessage({ type: 'success', message: 'Key pair generated successfully!' });
    } catch (error) {
      setAlertMessage({ type: 'danger', message: 'Failed to generate keys. Please try again.' });
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  const handleCopyPublicKey = async () => {
    if (keyPair) {
      const success = await copyToClipboard(keyPair.publicKey);
      if (success) {
        setCopiedKey('public');
        setTimeout(() => setCopiedKey(false), 2000);
      }
    }
  };

  const handleCopyPrivateKey = async () => {
    if (keyPair) {
      const success = await copyToClipboard(keyPair.privateKey);
      if (success) {
        setCopiedKey('private');
        setTimeout(() => setCopiedKey(false), 2000);
      }
    }
  };

  const handleExportKeys = async () => {
    if (!keyPair) return;
    
    // Validate password strength if password is provided
    if (exportPassword) {
      const validation = validatePasswordStrength(exportPassword);
      if (!validation.valid) {
        setExportPasswordError(validation.error || 'Invalid password');
        return;
      }
    }
    
    try {
      const exportedData = await exportKeyPair(keyPair, exportPassword || undefined);
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moderator-keys-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
      setExportPassword('');
      setExportPasswordError('');
      setAlertMessage({ type: 'success', message: 'Keys exported successfully!' });
    } catch (error) {
      // Handle password validation errors from exportKeyPair
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      if (errorMessage.includes('Password must')) {
        setExportPasswordError(errorMessage);
      } else {
        setAlertMessage({ type: 'danger', message: errorMessage });
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportFileContent(content);
      setImportError(null);
      
      // Check if the file is password-protected
      try {
        const parsed = JSON.parse(content);
        setNeedsPassword(parsed.protected === true);
      } catch {
        // If we can't parse it, assume it's not a valid key file
        setImportError('Invalid key file format');
        setNeedsPassword(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImportKeys = async () => {
    if (!importFileContent) return;
    
    // If file needs password but none provided
    if (needsPassword && !importPassword) {
      setImportError('Password is required for this encrypted key file');
      return;
    }
    
    try {
      const imported = await importKeyPair(importFileContent, importPassword || undefined);
      setKeyPair(imported);
      keyStorage.saveKeyPair(imported, 'moderator');
      setShowImportDialog(false);
      setImportPassword('');
      setImportFileContent(null);
      setImportFileName(null);
      setNeedsPassword(false);
      setImportError(null);
      setAlertMessage({ type: 'success', message: 'Keys imported successfully!' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      if (message.includes('password')) {
        setImportError('Incorrect password');
      } else {
        setImportError(message);
      }
    }
  };

  const handleDecryptReport = async (report: Report) => {
    if (!keyPair) {
      setAlertMessage({ type: 'danger', message: 'Please generate or import keys first' });
      return;
    }

    setIsDecrypting(true);
    setSelectedReport(report);
    
    try {
      // Parse encrypted data
      const encryptedData = JSON.parse(report.encryptedData);
      
      // Validate encrypted data structure
      if (!validateEncryptedData(encryptedData)) {
        throw new Error('Invalid encrypted data format');
      }

      // Verify proof
      const isProofValid = await verifyProof(report.proof);
      if (!isProofValid) {
        setAlertMessage({ type: 'warning', message: 'Warning: Proof verification failed' });
      }

      // Decrypt the report
      const decrypted = await decryptMessage(encryptedData, keyPair.privateKey);
      const reportData = JSON.parse(decrypted);
      
      setDecryptedContent(reportData);
      
      // Update report status
      await updateReportStatus(report.id, 'reviewed');
      await loadReports();
    } catch (error) {
      console.error('Decryption error:', error);
      setAlertMessage({ type: 'danger', message: 'Failed to decrypt report. Please check your keys.' });
      setDecryptedContent(null);
    } finally {
      setIsDecrypting(false);
    }
  };

  const updateReportStatus = async (id: number | string, status: 'pending' | 'reviewed' | 'archived') => {
    try {
      const provider = syncManager.getProvider();
      await provider.updateStatus(id, status);
    } catch (error) {
      console.error('Failed to update report status:', error);
      // Fallback to direct IndexedDB update
      try {
        const db = await openDB();
        const tx = db.transaction(['reports'], 'readwrite');
        const store = tx.objectStore('reports');
        const report = await new Promise<Report>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (report) {
          report.status = status;
          store.put(report);
        }
      } catch (dbError) {
        console.error('Failed to update in IndexedDB:', dbError);
      }
    }
  };

  const handleArchiveReport = async (id: number | string) => {
    await updateReportStatus(id, 'archived');
    await loadReports();
    setSelectedReport(null);
    setDecryptedContent(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <section className="text-center py-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Moderator Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Decrypt and manage anonymous reports securely
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {alertMessage && (
          <Alert
            variant={alertMessage.type === 'danger' ? 'danger' : alertMessage.type === 'success' ? 'success' : alertMessage.type === 'warning' ? 'info' : 'info'}
            onClose={() => setAlertMessage(null)}
            className="mb-6"
          >
            {alertMessage.message}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Key Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* Key Management Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Key Management
              </h3>
              <p className="text-sm text-gray-600 mb-4">Manage your encryption keys</p>
              <div className="space-y-4">
                {!keyPair ? (
                  <>
                    <button
                      onClick={handleGenerateKeys}
                      disabled={isGeneratingKeys}
                      className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isGeneratingKeys ? 'Generating...' : 'Generate New Key Pair'}
                    </button>
                    
                    <div className="flex items-center">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="px-3 text-xs text-gray-500">OR</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    
                    <button
                      onClick={() => setShowImportDialog(true)}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Import Keys from File
                    </button>
                    
                    <button
                      onClick={() => setShowManualInputDialog(true)}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Enter Keys Manually
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            Public Key
                          </span>
                          <button
                            onClick={handleCopyPublicKey}
                            className="text-xs text-gray-600 hover:text-gray-900 transition-colors duration-200"
                          >
                            {copiedKey === 'public' ? (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </span>
                            )}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-gray-700 break-all">
                          {keyPair.publicKey.substring(0, 50)}...
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            Private Key
                          </span>
                          <button
                            onClick={handleCopyPrivateKey}
                            className="text-xs text-gray-600 hover:text-gray-900 transition-colors duration-200"
                          >
                            {copiedKey === 'private' ? (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </span>
                            )}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-gray-700 break-all">
                          {keyPair.privateKey.substring(0, 50)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowExportDialog(true)}
                      >
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          keyStorage.removeKeyPair('moderator');
                          setKeyPair(null);
                          setAlertMessage({ type: 'info', message: 'Keys cleared from session' });
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Statistics Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <div className="text-xs text-gray-600">
                    Total Reports
                  </div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {stats.pending}
                  </div>
                  <div className="text-xs text-yellow-600">
                    Pending
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {stats.reviewed}
                  </div>
                  <div className="text-xs text-green-600">
                    Reviewed
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-100 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {stats.archived}
                  </div>
                  <div className="text-xs text-gray-600">
                    Archived
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Reports */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Encrypted Reports
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadReports}
                    disabled={isRefreshing}
                    aria-label="Refresh reports"
                    title="Refresh reports"
                  >
                    {isRefreshing ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    <span className="sr-only">{isRefreshing ? 'Refreshing reports' : 'Refresh reports'}</span>
                  </Button>
                </CardTitle>
                <CardDescription>
                  Click on a report to decrypt and view its contents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No reports yet</p>
                    <p className="text-sm mt-2">Reports will appear here when submitted through the reporter interface</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={cn(
                          'p-4 rounded-lg border transition-all cursor-pointer',
                          selectedReport?.id === report.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        )}
                        onClick={() => handleDecryptReport(report)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge
                                variant={
                                  report.status === 'pending' ? 'secondary' :
                                  report.status === 'reviewed' ? 'primary' : 'default'
                                }
                              >
                                {report.status}
                              </Badge>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatRelativeTime(new Date(report.timestamp))}
                              </span>
                            </div>
                            
                            {selectedReport?.id === report.id && decryptedContent ? (
                              <div className="mt-3 space-y-3">
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {decryptedContent.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {decryptedContent.content}
                                  </p>
                                </div>
                                
                                {decryptedContent.attachment && (
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                      </svg>
                                      <span className="text-sm text-gray-600">
                                        Attachment
                                      </span>
                                    </div>
                                    {(() => {
                                      const attachment = decryptedContent.attachment;
                                      // Check if it's an image
                                      if (attachment.startsWith('data:image/')) {
                                        return (
                                          <div className="mt-2">
                                            <img 
                                              src={attachment} 
                                              alt="Attachment preview" 
                                              className="max-w-full h-auto rounded-lg border border-gray-200 max-h-64 object-contain"
                                            />
                                            <a 
                                              href={attachment} 
                                              download="attachment"
                                              className="inline-flex items-center mt-2 text-sm text-gray-600 hover:text-gray-900"
                                            >
                                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                              </svg>
                                              Download Image
                                            </a>
                                          </div>
                                        );
                                      }
                                      // Check if it's a PDF
                                      else if (attachment.startsWith('data:application/pdf')) {
                                        return (
                                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6Z" />
                                              </svg>
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">PDF Document</p>
                                                <a 
                                                  href={attachment} 
                                                  download="document.pdf"
                                                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                                                >
                                                  Download PDF
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }
                                      // For text files or other documents
                                      else {
                                        const fileType = attachment.split(':')[1]?.split(';')[0] || 'Unknown';
                                        const isText = attachment.startsWith('data:text/') || 
                                                      attachment.startsWith('data:application/json');
                                        
                                        if (isText) {
                                          // Try to decode and show text content
                                          try {
                                            const base64Content = attachment.split(',')[1];
                                            const textContent = atob(base64Content);
                                            return (
                                              <div className="mt-2">
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                                                    {textContent.substring(0, 500)}
                                                    {textContent.length > 500 && '...'}
                                                  </pre>
                                                </div>
                                                <a 
                                                  href={attachment} 
                                                  download="attachment.txt"
                                                  className="inline-flex items-center mt-2 text-sm text-gray-600 hover:text-gray-900"
                                                >
                                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                  </svg>
                                                  Download Full Text
                                                </a>
                                              </div>
                                            );
                                          } catch (e) {
                                            // If decoding fails, show generic download
                                          }
                                        }
                                        
                                        // Generic file download
                                        return (
                                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">File Attachment</p>
                                                <p className="text-xs text-gray-500">{fileType}</p>
                                                <a 
                                                  href={attachment} 
                                                  download="attachment"
                                                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                                                >
                                                  Download File
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                )}
                                
                                <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveReport(report.id);
                                    }}
                                  >
                                    Archive
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Encrypted Report #{report.id}</span>
                              </div>
                            )}
                          </div>
                          
                          {selectedReport?.id === report.id && isDecrypting && (
                            <div className="ml-3">
                              <svg className="animate-spin h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Export Keys</CardTitle>
                <CardDescription>
                  Optionally protect your keys with a password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="password"
                  label="Password (optional)"
                  placeholder="Enter password to encrypt keys"
                  value={exportPassword}
                  onChange={(e) => {
                    setExportPassword(e.target.value);
                    // Clear error when user starts typing
                    if (exportPasswordError) {
                      setExportPasswordError('');
                    }
                  }}
                  error={exportPasswordError}
                  helperText={!exportPasswordError ? "Leave empty for unencrypted export" : undefined}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleExportKeys();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowExportDialog(false);
                      setExportPassword('');
                      setExportPasswordError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleExportKeys}
                  >
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manual Input Dialog */}
        {showManualInputDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Enter Keys Manually</CardTitle>
                <CardDescription>
                  Paste your public and private keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Public Key
                  </label>
                  <textarea
                    value={manualPublicKey}
                    onChange={(e) => setManualPublicKey(e.target.value)}
                    placeholder="Paste your public key here"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Private Key
                  </label>
                  <textarea
                    value={manualPrivateKey}
                    onChange={(e) => setManualPrivateKey(e.target.value)}
                    placeholder="Paste your private key here"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowManualInputDialog(false);
                      setManualPublicKey('');
                      setManualPrivateKey('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (manualPublicKey && manualPrivateKey) {
                        const newKeyPair = {
                          publicKey: manualPublicKey.trim(),
                          privateKey: manualPrivateKey.trim()
                        };
                        setKeyPair(newKeyPair);
                        keyStorage.saveKeyPair(newKeyPair, 'moderator');
                        setShowManualInputDialog(false);
                        setManualPublicKey('');
                        setManualPrivateKey('');
                        setAlertMessage({ type: 'success', message: 'Keys added successfully!' });
                      } else {
                        setAlertMessage({ type: 'danger', message: 'Both keys are required' });
                      }
                    }}
                    disabled={!manualPublicKey || !manualPrivateKey}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Save Keys
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Import Keys</CardTitle>
                <CardDescription>
                  Select a key file to import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-700 
                      file:mr-3 file:py-2 file:px-4 
                      file:rounded-lg file:border file:border-gray-300
                      file:text-sm file:font-medium
                      file:bg-white file:text-gray-700
                      file:cursor-pointer
                      hover:file:bg-gray-50
                      file:transition-all file:duration-200"
                  />
                  {importFileName && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {importFileName}
                    </p>
                  )}
                </div>
                
                {needsPassword && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      This key file is password-protected. Please enter the password to import.
                    </p>
                  </div>
                )}
                
                <Input
                  type="password"
                  label="Password (if protected)"
                  placeholder="Enter password if keys are encrypted"
                  value={importPassword}
                  onChange={(e) => {
                    setImportPassword(e.target.value);
                    // Clear error when user starts typing
                    if (importError) {
                      setImportError(null);
                    }
                  }}
                  error={importError || undefined}
                  required={needsPassword}
                />
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowImportDialog(false);
                      setImportPassword('');
                      setImportFileContent(null);
                      setImportFileName(null);
                      setNeedsPassword(false);
                      setImportError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleImportKeys}
                    disabled={!importFileContent || (needsPassword && !importPassword)}
                  >
                    Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
};

export default ModeratorPage;
