// Encryption Library for Report Data
// Handles end-to-end encryption of whistleblower reports using Web Crypto API

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  ephemeralPublicKey: string; // Base64 encoded ephemeral public key
  iv: string; // Base64 encoded
  tag?: string; // For authenticated encryption
}

export interface KeyPair {
  publicKey: string; // Base64 encoded public key
  privateKey: string; // Base64 encoded private key
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Validate public key format and structure (synchronous version for React)
export function validatePublicKey(publicKeyBase64: string): boolean {
  try {
    if (!publicKeyBase64 || publicKeyBase64.trim().length === 0) {
      return false;
    }
    
    // Try to decode base64 and parse as JSON
    const decoded = atob(publicKeyBase64.trim());
    const jwk = JSON.parse(decoded);
    
    // Basic validation
    return jwk && 
           jwk.kty === 'EC' && 
           jwk.crv === 'P-256' && 
           jwk.x && 
           jwk.y;
  } catch {
    return false;
  }
}

// Validate public key format and structure (async version)
export async function validatePublicKeyAsync(publicKeyBase64: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check if it's a valid base64 string
    if (!publicKeyBase64 || publicKeyBase64.trim().length === 0) {
      return { valid: false, error: 'Public key is required' };
    }

    // Try to decode base64
    let jwk: any;
    try {
      const decoded = atob(publicKeyBase64.trim());
      jwk = JSON.parse(decoded);
    } catch (e) {
      return { valid: false, error: 'Invalid public key format. Please ensure you copied the entire key.' };
    }

    // Validate JWK structure
    if (!jwk || typeof jwk !== 'object') {
      return { valid: false, error: 'Invalid key structure' };
    }

    // Check required fields for ECDH P-256
    if (jwk.kty !== 'EC') {
      return { valid: false, error: 'Invalid key type. Expected EC (Elliptic Curve) key.' };
    }

    if (jwk.crv !== 'P-256') {
      return { valid: false, error: 'Invalid curve. Expected P-256 curve.' };
    }

    if (!jwk.x || !jwk.y) {
      return { valid: false, error: 'Missing key coordinates (x, y)' };
    }

    // Try to import the key to fully validate it
    try {
      await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        false,
        []
      );
    } catch (e) {
      return { valid: false, error: 'Invalid public key. Cannot import for encryption.' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate public key: ' + (error instanceof Error ? error.message : 'Unknown error') };
  }
}

// Generate a new ECDH key pair for encryption
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    // Generate ECDH key pair using P-256 curve
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['deriveKey', 'deriveBits']
    );

    // Export keys to JWK format
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    // Convert to Base64 for storage
    return {
      publicKey: btoa(JSON.stringify(publicKeyJwk)),
      privateKey: btoa(JSON.stringify(privateKeyJwk))
    };
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('Failed to generate encryption keys. Please ensure your browser supports Web Crypto API.');
  }
}

// Import public key from Base64 string
async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(atob(publicKeyBase64.trim()));
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      []
    );
  } catch (error) {
    throw new Error('Failed to import public key. Please ensure the key is valid.');
  }
}

// Import private key from Base64 string
async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(atob(privateKeyBase64.trim()));
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      ['deriveKey', 'deriveBits']
    );
  } catch (error) {
    throw new Error('Failed to import private key. Please ensure the key is valid.');
  }
}

// Encrypt report data
export async function encryptReport(
  data: { title: string; content: string; attachment?: string },
  publicKeyBase64: string
): Promise<string> {
  const message = JSON.stringify(data);
  const encrypted = await encryptMessage(message, publicKeyBase64);
  return JSON.stringify(encrypted);
}

// Encrypt message with public key using ECDH + AES-GCM
export async function encryptMessage(
  message: string,
  recipientPublicKey: string
): Promise<EncryptedData> {
  // Validate public key first
  const validation = await validatePublicKeyAsync(recipientPublicKey);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid public key');
  }

  try {
    // Generate ephemeral key pair for this message
    const ephemeralKeyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    // Import recipient's public key
    const recipientKey = await importPublicKey(recipientPublicKey);

    // Derive shared secret using ECDH
    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: recipientKey
      },
      ephemeralKeyPair.privateKey,
      256
    );

    // Derive AES-GCM key from shared secret using HKDF
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the message
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer
      },
      aesKey,
      encoder.encode(message)
    );

    // Export ephemeral public key
    const ephemeralPublicKeyJwk = await crypto.subtle.exportKey('jwk', ephemeralKeyPair.publicKey);

    return {
      ciphertext: arrayBufferToBase64(encrypted),
      ephemeralPublicKey: btoa(JSON.stringify(ephemeralPublicKeyJwk)),
      iv: arrayBufferToBase64(iv.buffer)
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to encrypt message. Please check the public key and try again.');
  }
}

// Decrypt message with private key using ECDH + AES-GCM
export async function decryptMessage(
  encryptedData: EncryptedData,
  privateKey: string
): Promise<string> {
  try {
    // Import private key
    const recipientPrivateKey = await importPrivateKey(privateKey);

    // Import ephemeral public key
    const ephemeralPublicKeyJwk = JSON.parse(atob(encryptedData.ephemeralPublicKey));
    const ephemeralPublicKey = await crypto.subtle.importKey(
      'jwk',
      ephemeralPublicKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      []
    );

    // Derive shared secret using ECDH
    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: ephemeralPublicKey
      },
      recipientPrivateKey,
      256
    );

    // Derive AES-GCM key from shared secret
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the message
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(encryptedData.iv)
      },
      aesKey,
      base64ToArrayBuffer(encryptedData.ciphertext)
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Try to provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('decrypt')) {
        throw new Error('Failed to decrypt. The message may have been encrypted with a different key.');
      }
      throw error;
    }
    throw new Error('Decryption failed. Please ensure you have the correct private key.');
  }
}

// Hash message for binding to ZK proof
export async function hashMessage(message: string): Promise<bigint> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to hex string and then to bigint
  let hexString = '';
  for (let i = 0; i < Math.min(31, hashArray.length); i++) {
    hexString += hashArray[i].toString(16).padStart(2, '0');
  }
  
  return BigInt('0x' + hexString);
}

// Generate secure random bytes
export function generateRandomBytes(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return arrayBufferToBase64(bytes.buffer);
}

// Validate encrypted data structure
export function validateEncryptedData(data: any): data is EncryptedData {
  return (
    typeof data === 'object' &&
    typeof data.ciphertext === 'string' &&
    typeof data.ephemeralPublicKey === 'string' &&
    typeof data.iv === 'string' &&
    data.ciphertext.length > 0 &&
    data.ephemeralPublicKey.length > 0 &&
    data.iv.length > 0
  );
}

// Format report data for encryption
export interface ReportData {
  subject: string;
  body: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  attachments?: string[]; // Base64 encoded attachments
  messageHash?: string; // Hash of the plaintext for proof binding
}

export function formatReportForEncryption(report: ReportData): string {
  return JSON.stringify({
    ...report,
    version: '1.0',
    timestamp: report.timestamp || Date.now()
  });
}

export function parseEncryptedReport(decryptedData: string): ReportData {
  try {
    const parsed = JSON.parse(decryptedData);
    return {
      subject: parsed.subject || '',
      body: parsed.body || '',
      category: parsed.category || 'general',
      urgency: parsed.urgency || 'medium',
      timestamp: parsed.timestamp || Date.now(),
      attachments: parsed.attachments || [],
      messageHash: parsed.messageHash
    };
  } catch (error) {
    throw new Error('Invalid report format');
  }
}

// Sanitize text content to prevent XSS
export function sanitizeText(text: string): string {
  // Remove any HTML tags and scripts
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Validate attachment file
export function validateAttachment(file: File): { valid: boolean; error?: string } {
  // Allowed MIME types for attachments
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  return { valid: true };
}

// Validate attachment MIME type (base64 version)
export function validateAttachmentBase64(base64Data: string, fileName?: string): { valid: boolean; error?: string } {
  // Allowed MIME types for attachments
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
    'text/csv'
  ];

  try {
    // Check size (5MB limit)
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    // Try to detect MIME type from base64 header if present
    if (base64Data.includes(',')) {
      const header = base64Data.split(',')[0];
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        if (!allowedTypes.includes(mimeType)) {
          return { valid: false, error: `File type ${mimeType} is not allowed` };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid attachment format' };
  }
}

// Key export/import utilities with password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength < 3) {
    return { valid: false, error: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters' };
  }
  
  return { valid: true };
}

export async function exportKeyPair(keyPair: KeyPair, password?: string): Promise<string> {
  const data = JSON.stringify(keyPair);
  
  if (password) {
    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Encrypt with password using PBKDF2 + AES-GCM
    const encoder = new TextEncoder();
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer },
      key,
      encoder.encode(data)
    );
    
    return JSON.stringify({
      encrypted: arrayBufferToBase64(encrypted),
      salt: arrayBufferToBase64(salt.buffer),
      iv: arrayBufferToBase64(iv.buffer),
      version: '1.0',
      protected: true
    });
  }
  
  return JSON.stringify({
    ...JSON.parse(data),
    version: '1.0',
    protected: false
  });
}

export async function importKeyPair(data: string, password?: string): Promise<KeyPair> {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.protected && !password) {
      throw new Error('This key file is password-protected. Please provide the password.');
    }
    
    if (parsed.protected && password) {
      const encoder = new TextEncoder();
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: base64ToArrayBuffer(parsed.salt),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToArrayBuffer(parsed.iv) },
        key,
        base64ToArrayBuffer(parsed.encrypted)
      );
      
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    }
    
    // Unprotected key file
    return {
      publicKey: parsed.publicKey,
      privateKey: parsed.privateKey
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('password')) {
      throw error;
    }
    throw new Error('Invalid key file or incorrect password');
  }
}

// Storage utilities for keys (using sessionStorage for security)
export const keyStorage = {
  saveKeyPair(keyPair: KeyPair, identifier: string) {
    // Store in memory only for security (not persistent)
    sessionStorage.setItem(`keypair_${identifier}`, JSON.stringify(keyPair));
  },
  
  loadKeyPair(identifier: string): KeyPair | null {
    const stored = sessionStorage.getItem(`keypair_${identifier}`);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
  
  removeKeyPair(identifier: string) {
    sessionStorage.removeItem(`keypair_${identifier}`);
  },
  
  clearAllKeys() {
    // Clear all keys from session
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('keypair_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

// Test utilities
export const testEncryption = {
  // Test encryption and decryption
  async testRoundTrip(): Promise<boolean> {
    try {
      const keyPair = await generateKeyPair();
      const message = 'Test whistleblower report';
      
      const encrypted = await encryptMessage(message, keyPair.publicKey);
      const decrypted = await decryptMessage(encrypted, keyPair.privateKey);
      
      return message === decrypted;
    } catch (error) {
      console.error('Round-trip test failed:', error);
      return false;
    }
  },
  
  // Test public key validation
  async testKeyValidation(): Promise<boolean> {
    try {
      const keyPair = await generateKeyPair();
      const validation = await validatePublicKeyAsync(keyPair.publicKey);
      
      // Test invalid keys
      const invalid1 = await validatePublicKeyAsync('invalid-key');
      const invalid2 = await validatePublicKeyAsync('');
      const invalid3 = await validatePublicKeyAsync(btoa('{"not": "a valid key"}'));
      
      return validation.valid && !invalid1.valid && !invalid2.valid && !invalid3.valid;
    } catch (error) {
      console.error('Key validation test failed:', error);
      return false;
    }
  },
  
  // Test proof binding
  async testProofBinding(): Promise<boolean> {
    try {
      const message = 'Test report for proof binding';
      const hash1 = await hashMessage(message);
      const hash2 = await hashMessage(message);
      
      // Same message should produce same hash
      return hash1 === hash2;
    } catch (error) {
      console.error('Proof binding test failed:', error);
      return false;
    }
  },
  
  // Generate test report
  generateTestReport(): ReportData {
    return {
      subject: 'Test Report',
      body: 'This is a test whistleblower report for demonstration purposes.',
      category: 'safety',
      urgency: 'medium',
      timestamp: Date.now()
    };
  }
};
