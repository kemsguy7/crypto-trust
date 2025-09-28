import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Textarea } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { encryptReport, validatePublicKey, sanitizeText, validateAttachment, importKeyPair } from '../lib/encryption';
import { generateProof } from '../lib/midnight-stub';
import { cn } from '../lib/utils';
import { syncManager } from '../lib/sync-provider';
import { contractManager } from '../lib/contract-adapter';

interface StepProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepProps> = ({ currentStep, totalSteps }) => {
  const steps = ['Public Key', 'Report Details', 'Review & Submit'];
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                    isActive && 'bg-gray-900 text-white shadow-sm',
                    isCompleted && 'bg-green-600 text-white',
                    !isActive && !isCompleted && 'bg-gray-100 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className={cn(
                  'mt-2 text-xs font-medium',
                  isActive && 'text-gray-900',
                  !isActive && 'text-gray-500'
                )}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-all duration-200',
                    stepNumber < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const ReporterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form data
  const [publicKey, setPublicKey] = useState('');
  const [publicKeyError, setPublicKeyError] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [importFileName, setImportFileName] = useState('');

  // Validate public key on change
  useEffect(() => {
    if (publicKey && !validatePublicKey(publicKey)) {
      setPublicKeyError('Invalid public key format. Please check and try again.');
    } else {
      setPublicKeyError('');
    }
  }, [publicKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateAttachment(file);
      if (!validation.valid) {
        setAttachmentError(validation.error || 'Invalid file');
        setAttachment(null);
      } else {
        setAttachmentError('');
        setAttachment(file);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!publicKey) {
        setPublicKeyError('Public key is required');
        return;
      }
      if (publicKeyError) return;
    }
    
    if (currentStep === 2) {
      if (!reportTitle.trim() || !reportContent.trim()) {
        setErrorMessage('Please fill in all required fields');
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
    setErrorMessage('');
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');
      setErrorMessage('');

      // Sanitize inputs
      const sanitizedTitle = sanitizeText(reportTitle);
      const sanitizedContent = sanitizeText(reportContent);

      // Generate proof and nullifier
      const timestamp = Date.now();
      const epoch = Math.floor(timestamp / 1000 / 86400); // Daily epochs
      const nullifier = Math.random().toString(36).substring(7);
      const reportHash = `${timestamp}_${nullifier}`;
      
      const proof = await generateProof({
        reportHash,
        timestamp,
        nullifier
      });

      // Encrypt report
      const encryptedData = await encryptReport(
        { 
          title: sanitizedTitle, 
          content: sanitizedContent,
          attachment: attachment ? await fileToBase64(attachment) : undefined
        },
        publicKey
      );

      // Create commitment (hash of encrypted data for on-chain storage)
      const commitment = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(encryptedData)
      ).then(hash => 
        Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      );

      // Submit to smart contract
      const contractAdapter = contractManager.getAdapter();
      const contractResult = await contractAdapter.submitReport(
        commitment,
        nullifier,
        epoch,
        proof,
        encryptedData
      );

      console.log('[ReporterPage] Contract submission:', {
        txHash: contractResult.txHash,
        reportId: contractResult.reportId,
        epoch,
        nullifier: nullifier.slice(0, 8) + '...'
      });

      // Store full encrypted data using sync provider (for retrieval)
      const provider = syncManager.getProvider();
      await provider.addReport({
        encryptedData,
        proof,
        timestamp,
        status: 'pending'
      });

      setTxHash(contractResult.txHash);
      setSubmitStatus('success');
      
      // Reset form after delay
      setTimeout(() => {
        setCurrentStep(1);
        setPublicKey('');
        setReportTitle('');
        setReportContent('');
        setAttachment(null);
        setSubmitStatus('idle');
      }, 5000);
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      
      // Provide more detailed error message
      let errorMsg = 'Failed to submit report. ';
      if (error.message) {
        if (error.message.includes('Contract error')) {
          errorMsg += error.message;
        } else if (error.message.includes('nullifier')) {
          errorMsg += 'Rate limit reached. You can only submit one report per day.';
        } else if (error.message.includes('proof')) {
          errorMsg += 'Failed to generate zero-knowledge proof. Please try again.';
        } else if (error.message.includes('encrypt')) {
          errorMsg += 'Failed to encrypt report. Please check the public key.';
        } else {
          errorMsg += error.message;
        }
      } else {
        errorMsg += 'Please try again.';
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <section className="text-center py-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Submit Anonymous Report
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your identity is protected through zero-knowledge proofs and end-to-end encryption
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
            <StepIndicator currentStep={currentStep} totalSteps={3} />

            {/* Step 1: Public Key */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Alert variant="info" title="Encryption Key Required">
                  Enter or import the moderator's public key to encrypt your report. Only they will be able to decrypt it.
                </Alert>
                
                <div className="space-y-4">
                  <Input
                    label="Moderator Public Key"
                    placeholder="Enter or paste the public key provided by the moderator"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    error={publicKeyError}
                    helperText="This ensures only the intended recipient can read your report"
                  />
                  
                  <div className="flex items-center">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="px-3 text-sm text-gray-500">OR</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Import from File
                      </label>
                      <input
                        type="file"
                        accept=".txt,.json,.key"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImportFileName(file.name);
                            const text = await file.text();
                            setImportFileContent(text);
                            
                            // Try to parse JSON first
                            try {
                              const json = JSON.parse(text);
                              
                              // Check if it's an encrypted key file (check for 'protected' field as per encryption.ts)
                              if (json.protected === true && json.encrypted) {
                                // This is an encrypted key file, need password
                                setNeedsPassword(true);
                                setPublicKey(''); // Clear any existing key
                                setPublicKeyError('');
                                // Don't set the key yet, wait for password
                              } else if (json.publicKey) {
                                // Plain JSON with publicKey field
                                setPublicKey(json.publicKey);
                                setNeedsPassword(false);
                                setImportPassword('');
                                setImportFileContent('');
                                setImportFileName('');
                              } else {
                                // Unknown JSON format, try as plain text
                                setPublicKey(text.trim());
                                setNeedsPassword(false);
                                setImportPassword('');
                                setImportFileContent('');
                                setImportFileName('');
                              }
                            } catch {
                              // Not JSON, use as plain text public key
                              setPublicKey(text.trim());
                              setNeedsPassword(false);
                              setImportPassword('');
                              setImportFileContent('');
                              setImportFileName('');
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors duration-200"
                      />
                      <p className="mt-1 text-xs text-gray-500">Accepts .txt, .json, or .key files</p>
                    </div>

                    {/* Show password field when encrypted file is detected */}
                    {needsPassword && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-2 mb-3">
                          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800">Password Protected File</p>
                            <p className="text-xs text-yellow-700 mt-0.5">
                              {importFileName ? `File "${importFileName}" is encrypted.` : 'This file is encrypted.'} Enter the password to decrypt it.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Input
                            type="password"
                            label="Password"
                            placeholder="Enter the password used to encrypt the keys"
                            value={importPassword}
                            onChange={(e) => setImportPassword(e.target.value)}
                            onKeyPress={async (e) => {
                              if (e.key === 'Enter' && importPassword) {
                                try {
                                  const keyPair = await importKeyPair(importFileContent, importPassword);
                                  setPublicKey(keyPair.publicKey);
                                  setNeedsPassword(false);
                                  setImportPassword('');
                                  setImportFileContent('');
                                  setImportFileName('');
                                  setPublicKeyError('');
                                } catch (error) {
                                  setPublicKeyError(error instanceof Error ? error.message : 'Failed to decrypt key file');
                                }
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              if (importPassword) {
                                try {
                                  const keyPair = await importKeyPair(importFileContent, importPassword);
                                  setPublicKey(keyPair.publicKey);
                                  setNeedsPassword(false);
                                  setImportPassword('');
                                  setImportFileContent('');
                                  setImportFileName('');
                                  setPublicKeyError('');
                                } catch (error) {
                                  setPublicKeyError(error instanceof Error ? error.message : 'Failed to decrypt key file');
                                }
                              }
                            }}
                            disabled={!importPassword}
                            className="w-full px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Decrypt and Use Public Key
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNextStep}
                    disabled={!publicKey || !!publicKeyError}
                    className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next Step
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Report Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Input
                  label="Report Title"
                  placeholder="Brief description of the issue"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                />

                <Textarea
                  label="Report Details"
                  placeholder="Provide detailed information about the issue..."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  rows={8}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Attachment (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors duration-200"
                  />
                  {attachmentError && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">{attachmentError}</p>
                  )}
                  {attachment && (
                    <Badge variant="secondary" className="mt-2">
                      {attachment.name} ({(attachment.size / 1024).toFixed(2)} KB)
                    </Badge>
                  )}
                </div>

                {errorMessage && (
                  <Alert variant="default" onClose={() => setErrorMessage('')}>
                    {errorMessage}
                  </Alert>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={handlePreviousStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    <svg className="mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Next Step
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {submitStatus === 'success' ? (
                  <Alert variant="success" title="Report Submitted Successfully!">
                    <div className="space-y-2">
                      <p>Your anonymous report has been encrypted and submitted to the smart contract.</p>
                      {txHash && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <p className="text-xs text-gray-600">Transaction Hash:</p>
                          <p className="text-xs font-mono text-gray-800 break-all">{txHash}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-2">The moderator will review it soon.</p>
                    </div>
                  </Alert>
                ) : (
                  <>
                    <Alert variant="info">
                      Please review your report before submitting. Once submitted, it cannot be edited.
                    </Alert>

                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Title</h3>
                        <p className="mt-1 text-sm text-gray-900">{reportTitle}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Details</h3>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{reportContent}</p>
                      </div>
                      
                      {attachment && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Attachment</h3>
                          <Badge variant="default" className="mt-1">
                            {attachment.name}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Your report will be encrypted end-to-end</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Zero-knowledge proof ensures your anonymity</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Report will be anchored on-chain with mock transaction</span>
                    </div>

                    {errorMessage && (
                      <Alert variant="default" onClose={() => setErrorMessage('')}>
                        {errorMessage}
                      </Alert>
                    )}

                    <div className="flex justify-between">
                      <button
                        onClick={handlePreviousStep}
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <svg className="mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
        </Card>
      </div>

      {/* Privacy Notice */}
      <div className="text-center text-sm text-gray-500 pb-8">
        <p>
          This platform uses advanced cryptography to protect your identity.
          Learn more about our <Link to="/privacy" className="text-gray-700 hover:text-gray-900 underline transition-colors duration-200">privacy practices</Link>.
        </p>
      </div>
    </div>
  );
};

export default ReporterPage;
