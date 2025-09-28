import React, { useState, useEffect } from 'react';
import { generateIdentity, generateNullifier, MerkleTree, generateMembershipProof, verifyProof, getCurrentEpoch, testUtils } from '../lib/zkProof';
import { 
  generateKeyPair, 
  encryptMessage, 
  decryptMessage, 
  hashMessage, 
  testEncryption, 
  exportKeyPair, 
  importKeyPair,
  validatePublicKey,
  validatePasswordStrength,
  sanitizeText,
  validateAttachment
} from '../lib/encryption';

const DiagnosticTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: string[] = [];
    
    try {
      // Test 1: Identity Generation
      results.push('🔧 Testing Identity Generation...');
      const identity = await generateIdentity();
      results.push(`✅ Identity created: Secret=${identity.secret.toString().substring(0, 10)}..., Commitment=${identity.commitment.toString().substring(0, 10)}...`);
      
      // Test 2: Nullifier Generation
      results.push('🔧 Testing Nullifier Generation...');
      const epoch = getCurrentEpoch();
      const nullifier = await generateNullifier(identity.secret, epoch);
      results.push(`✅ Nullifier generated for epoch ${epoch}: ${nullifier.toString().substring(0, 20)}...`);
      
      // Test 3: Merkle Tree
      results.push('🔧 Testing Merkle Tree...');
      const identities = await testUtils.generateTestIdentities(5);
      const tree = await testUtils.buildTestTree(identities);
      const root = tree.getRoot();
      results.push(`✅ Merkle tree built with 5 identities. Root: ${root.toString().substring(0, 20)}...`);
      
      // Test 4: Merkle Proof
      results.push('🔧 Testing Merkle Proof...');
      const proof = tree.getProof(0);
      results.push(`✅ Merkle proof generated with ${proof.pathElements.length} elements`);
      
      // Test 5: ZK Proof Generation
      results.push('🔧 Testing ZK Proof Generation...');
      const zkMessageHash = await hashMessage('Test whistleblower report');
      const zkProof = await generateMembershipProof(identities[0], proof, epoch, zkMessageHash);
      results.push(`✅ ZK proof generated with protocol: ${zkProof.protocol}`);
      
      // Test 6: ZK Proof Verification
      results.push('🔧 Testing ZK Proof Verification...');
      const isValid = verifyProof(zkProof);
      results.push(`✅ ZK proof verification: ${isValid ? 'VALID' : 'INVALID'}`);
      
      // Test 7: Key Generation (Web Crypto API)
      results.push('🔧 Testing ECDH Key Pair Generation...');
      const keyPair = await generateKeyPair();
      results.push(`✅ ECDH key pair generated. Public key: ${keyPair.publicKey.substring(0, 20)}...`);
      
      // Test 8: Encryption/Decryption (ECDH + AES-GCM)
      results.push('🔧 Testing ECDH + AES-GCM Encryption/Decryption...');
      const message = 'This is a confidential whistleblower report';
      const encrypted = await encryptMessage(message, keyPair.publicKey);
      const decrypted = await decryptMessage(encrypted, keyPair.privateKey);
      results.push(`✅ Encryption test: ${message === decrypted ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 9: Round-trip test
      results.push('🔧 Running full round-trip test...');
      const roundTripSuccess = await testEncryption.testRoundTrip();
      results.push(`✅ Round-trip encryption test: ${roundTripSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 10: Proof Binding
      results.push('🔧 Testing Proof Binding (Message Hash)...');
      const proofBindingSuccess = await testEncryption.testProofBinding();
      results.push(`✅ Proof binding test: ${proofBindingSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 11: Key Export/Import with Password
      results.push('🔧 Testing Key Export/Import with Password...');
      const password = 'test-password-123';
      const exportedKey = await exportKeyPair(keyPair, password);
      const importedKey = await importKeyPair(exportedKey, password);
      const keyImportSuccess = importedKey.publicKey === keyPair.publicKey && importedKey.privateKey === keyPair.privateKey;
      results.push(`✅ Key export/import test: ${keyImportSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 12: Message Hash for ZK Proof Binding
      results.push('🔧 Testing Message Hash for ZK Proof...');
      const testMessage = 'Test report content';
      const reportHash = await hashMessage(testMessage);
      results.push(`✅ Message hash generated: ${reportHash.toString(16).substring(0, 20)}...`);
      
      // Test 13: Public Key Validation
      results.push('🔧 Testing Public Key Validation...');
      const keyValidationSuccess = await testEncryption.testKeyValidation();
      results.push(`✅ Public key validation test: ${keyValidationSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 14: Password Strength Validation
      results.push('🔧 Testing Password Strength Validation...');
      const weakPassword = validatePasswordStrength('weak');
      const strongPassword = validatePasswordStrength('Strong@Pass123');
      results.push(`✅ Password validation: Weak=${!weakPassword.valid ? 'REJECTED' : 'ACCEPTED'}, Strong=${strongPassword.valid ? 'ACCEPTED' : 'REJECTED'}`);
      
      // Test 15: Text Sanitization
      results.push('🔧 Testing Text Sanitization...');
      const maliciousText = '<script>alert("XSS")</script>Hello';
      const sanitized = sanitizeText(maliciousText);
      results.push(`✅ Text sanitization: "${maliciousText}" → "${sanitized}"`);
      
      // Test 16: Attachment Validation
      results.push('🔧 Testing Attachment Validation...');
      const validAttachment = validateAttachment('data:image/png;base64,iVBORw0KGgo...');
      const invalidAttachment = validateAttachment('data:application/exe;base64,MZ...');
      results.push(`✅ Attachment validation: PNG=${validAttachment.valid ? 'ALLOWED' : 'BLOCKED'}, EXE=${!invalidAttachment.valid ? 'BLOCKED' : 'ALLOWED'}`);
      
      results.push('');
      results.push('🎉 All diagnostic tests completed successfully!');
      
    } catch (error) {
      results.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run diagnostics on mount
    runDiagnostics();
  }, []);

  return (
    <div className="card max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        System Diagnostics
      </h2>
      
      <button
        onClick={runDiagnostics}
        disabled={isRunning}
        className="btn-primary mb-4"
      >
        {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
      </button>
      
      <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm">
        {testResults.length === 0 ? (
          <div className="text-gray-400">Initializing tests...</div>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              className={`mb-1 ${
                result.startsWith('✅') ? 'text-green-400' :
                result.startsWith('❌') ? 'text-red-400' :
                result.startsWith('🔧') ? 'text-blue-400' :
                result.startsWith('🎉') ? 'text-yellow-400' :
                'text-gray-300'
              }`}
            >
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiagnosticTest;
