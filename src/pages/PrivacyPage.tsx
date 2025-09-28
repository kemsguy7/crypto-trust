import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Privacy Practices
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          How we protect your identity and data in the Anonymous Whistleblower Platform
        </p>
      </section>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              What We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">By Default: Nothing</p>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• No IP address logging</li>
                <li>• No browser fingerprinting</li>
                <li>• No cookies or tracking pixels</li>
                <li>• No analytics or telemetry</li>
                <li>• No user accounts or registration</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              This is a client-side application. All processing happens in your browser. 
              We don't have servers that log your activity or collect metadata about your usage.
            </p>
          </CardContent>
        </Card>

        {/* Encryption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              End-to-End Encryption
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How Reports Are Encrypted</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <strong>ECDH Key Exchange:</strong> We use Elliptic Curve Diffie-Hellman (P-256) to establish 
                  a shared secret between you and the moderator without transmitting the secret itself.
                </li>
                <li>
                  <strong>AES-GCM Encryption:</strong> Your report content is encrypted using AES-256-GCM with 
                  the derived shared secret, providing both confidentiality and authenticity.
                </li>
                <li>
                  <strong>Ephemeral Keys:</strong> Each report uses a new ephemeral key pair, ensuring forward 
                  secrecy - even if a key is compromised, past reports remain secure.
                </li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Technical Details:</strong> Encryption uses the Web Crypto API with ECDH-P256 for key 
                agreement and AES-256-GCM for symmetric encryption. Keys are generated using 
                cryptographically secure random number generators.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Zero-Knowledge Proofs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Zero-Knowledge Proofs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Anonymity Guarantees</h4>
              <p className="text-sm text-gray-600 mb-3">
                Zero-knowledge proofs allow you to prove statements without revealing the underlying information:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <strong>Membership Proof:</strong> Prove you belong to an authorized organization without 
                  revealing which member you are.
                </li>
                <li>
                  <strong>Rate-Limit Nullifiers (RLN):</strong> Prevent spam by limiting reports to one per 
                  identity per epoch (24 hours) without revealing your identity.
                </li>
                <li>
                  <strong>Groth16 Protocol:</strong> Industry-standard SNARK construction providing succinct, 
                  non-interactive proofs that are quick to verify.
                </li>
              </ul>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-800">
                <strong>Privacy Guarantee:</strong> Even if all other parties collude, they cannot determine 
                your identity from the zero-knowledge proof. The proof only reveals that you're authorized 
                to submit reports.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Data Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Local Storage (Default)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All data stored in your browser's IndexedDB</li>
                <li>• Data never leaves your device unless you enable sync</li>
                <li>• Persists between sessions but can be cleared anytime</li>
                <li>• No external servers or databases involved</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Optional Cloud Sync</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Only activated if explicitly enabled in Settings</li>
                <li>• Reports remain encrypted - only ciphertext is transmitted</li>
                <li>• Zero-knowledge proofs preserve anonymity even with sync</li>
                <li>• Uses Vercel KV for cross-device synchronization</li>
                <li>• Can be disabled at any time, reverting to local-only storage</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Smart Contract Mode:</strong> When enabled (default), report commitments and nullifiers 
                are anchored on-chain using mock transactions. Only hashes are stored, never the actual content.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Your Data Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">You Can Always:</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <strong>Export Keys:</strong> Download your encryption keys with optional password protection 
                  from the Moderator page.
                </li>
                <li>
                  <strong>Clear Keys:</strong> Remove keys from session storage at any time. Once cleared, 
                  encrypted reports cannot be decrypted without re-importing the keys.
                </li>
                <li>
                  <strong>Delete Local Data:</strong> Clear your browser's data to remove all stored reports 
                  and settings.
                </li>
                <li>
                  <strong>Disable Features:</strong> Turn off Smart Contract Mode or Cloud Sync in Settings 
                  to limit functionality.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Security Considerations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Security Considerations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Important Limitations</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <strong>Client Device Trust:</strong> Security depends on your device being free from malware. 
                  Use a trusted, updated device and browser.
                </li>
                <li>
                  <strong>Key Distribution:</strong> The moderator's public key must be shared securely. 
                  Verify keys through a trusted channel.
                </li>
                <li>
                  <strong>Password Strength:</strong> When exporting keys with a password, use a strong password 
                  with uppercase, lowercase, numbers, and special characters.
                </li>
                <li>
                  <strong>Browser Security:</strong> Keep your browser updated and avoid installing untrusted 
                  extensions that could access page content.
                </li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>Disclaimer:</strong> While we implement strong cryptographic protections, no system is 
                100% secure. For highly sensitive information, consider additional operational security measures.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Open Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Open Source & Transparency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This platform is open source. You can review the code, verify the cryptographic implementations, 
              and even run your own instance. Transparency is a key component of trust in privacy-critical applications.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/depapp/midnight-whistleblower" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Questions?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              For questions about privacy practices or to report security issues, please refer to the project's 
              GitHub repository. Remember that this is a demonstration platform built for the Midnight Network 
              challenge - always conduct your own security assessment before using any system for sensitive information.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Back to Home */}
      <div className="text-center pb-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default PrivacyPage;
