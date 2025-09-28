# Midnight Whistleblower: System Architecture

## Overview

The Midnight Whistleblower application is a privacy-first DApp that leverages zero-knowledge proofs and end-to-end encryption to enable anonymous, secure reporting. The architecture follows a local-first approach with optional cloud synchronization, ensuring that sensitive data never leaves the client unencrypted.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │   Reporter   │     │  Moderator   │     │   Public     │                     │
│  │     Page     │     │   Dashboard  │     │    Stats     │                     │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                     │
│         │                    │                    │                             │
│  ┌──────▼────────────────────▼────────────────────▼───────┐                     │
│  │                   React Application                    │                     │
│  │  ┌───────────────────────────────────────────────────┐ │                     │
│  │  │              UI Components (src/components)       │ │                     │
│  │  └───────────────────────────────────────────────────┘ │                     │
│  └────────────────────────────┬───────────────────────────┘                     │
│                               │                                                 │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│                         PRIVACY LAYER                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │
│  │   Encryption     │  │  ZK Proof Engine │  │  Rate Limiter    │               │
│  │   (Web Crypto)   │  │   (MidnightJS)   │  │      (RLN)       │               │
│  │                  │  │                  │  │                  │               │
│  │ • ECDH Key Gen   │  │ • Groth16 Proofs │  │ • Epoch-based    │               │
│  │ • AES-GCM        │  │ • Membership     │  │ • Nullifiers     │               │ 
│  │ • Key Management │  │ • Circuit Load   │  │ • Anti-spam      │               │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘               │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐                │
│  │              Midnight Compact Circuit                       │                │
│  │         circuits/membership_rln.compact                     │                │
│  │  ┌──────────────────────────────────────────────────────┐   │                │
│  │  │  Compiled Artifacts (public/zk-artifacts/)           │   │                │
│  │  │  • proving_key.json  • verification_key.json         │   │                │
│  │  │  • metadata.json     • wasm.json                     │   │                │
│  │  └──────────────────────────────────────────────────────┘   │                │
│  └─────────────────────────────────────────────────────────────┘                │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐              │
│  │  Sync Provider   │  │ Contract Adapter  │  │   Local Storage  │              │
│  │   Interface      │  │    (Mocked)       │  │   (IndexedDB)    │              │
│  │                  │  │                   │  │                  │              │
│  │ • LocalProvider  │  │ • MockOnChain     │  │ • Reports DB     │              │
│  │ • HttpProvider   │  │ • Fallback        │  │ • Keys (session) │              │
│  └────────┬─────────┘  └─────────┬─────────┘  └────────┬─────────┘              │
│           │                      │                     │                        │
│           └──────────────────────┼─────────────────────┘                        │
│                                  │                                              │
└──────────────────────────────────┼──────────────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   OPTIONAL CLOUD SYNC       │
                    │      (Vercel KV)            │
                    │                             │
                    │  • Encrypted Data Only      │
                    │  • Proof Metadata           │
                    │  • Status Updates           │
                    │  • No Plaintext             │
                    └─────────────────────────────┘
```

## Component Breakdown

### 1. Client Layer

#### Pages (src/pages/)
- **HomePage**: Entry point with role-based navigation
- **ReporterPage**: 3-step anonymous submission flow
- **ModeratorPage**: Key management and report decryption
- **MetricsPage**: Private analytics dashboard
- **PublicStatsPage**: Aggregate statistics (privacy-safe)
- **SettingsPage**: Configuration for sync and contract modes
- **PrivacyPage**: Transparency about data handling

#### UI Components (src/components/)
- Reusable UI elements (Button, Card, Input, Alert, Badge)
- Theme provider for consistent styling
- Accessibility-first design patterns

### 2. Privacy Layer

#### Encryption Module (src/lib/encryption.ts)
```typescript
// Key operations
- generateKeyPair(): ECDH key generation
- encryptMessage(): AES-GCM encryption
- decryptMessage(): Local decryption
- exportKeyPair(): Password-protected export
- importKeyPair(): Secure key import
```

#### ZK Proof System (src/lib/)
```typescript
// MidnightJS Integration
- midnightjs.ts: Artifact loader, proof generator/verifier
- midnight-stub.ts: Abstraction layer with fallback
- zkProof.ts: Helper utilities for Merkle trees and nullifiers
```

#### Rate Limiting (RLN)
- Epoch-based nullifiers (24-hour periods)
- Prevents spam without breaking anonymity
- Nullifier = Hash(identitySecret, epoch)

### 3. Data Layer

#### Sync Provider Pattern (src/lib/sync-provider.ts)
```typescript
interface SyncProvider {
  addReport(report: Report): Promise<void>
  listReports(): Promise<Report[]>
  updateStatus(id: string, status: Status): Promise<void>
}

// Implementations:
- LocalSyncProvider: IndexedDB only
- HttpSyncProvider: Cloud sync via API
```

#### Contract Adapter (src/lib/contract-adapter.ts)
```typescript
interface ContractAdapter {
  submitReport(commitment, nullifier, epoch, proof, data): Promise<{txHash, reportId}>
  updateStatus(reportId, status): Promise<{txHash}>
}

// Implementations:
- MockOnChainAdapter: Simulates blockchain with IndexedDB
- FallbackAdapter: Direct storage when contract disabled
```

### 4. Storage Architecture

#### Local Storage (Primary)
- **IndexedDB**: 
  - Reports database (encrypted data + proofs)
  - Mock contract state
- **SessionStorage**: 
  - Moderator keys (session-scoped)
- **LocalStorage**: 
  - Settings and preferences

#### Cloud Storage (Optional)
- **Vercel KV (Upstash Redis)**:
  - Encrypted reports only
  - Proof metadata
  - Status updates
  - No plaintext ever stored

## Data Flow

### Report Submission Flow
```
1. Reporter enters data
   ↓
2. Client sanitizes input
   ↓
3. Generate ZK membership proof (MidnightJS)
   ↓
4. Encrypt report (Web Crypto API)
   ↓
5. Create commitment hash
   ↓
6. Submit to contract adapter (mock tx)
   ↓
7. Store locally (IndexedDB)
   ↓
8. Optional: Sync ciphertext to cloud
```

### Moderation Flow
```
1. Moderator loads encrypted reports
   ↓
2. Select report to review
   ↓
3. Verify ZK proof client-side
   ↓
4. Decrypt with private key (local only)
   ↓
5. Update status (reviewed/archived)
   ↓
6. Sync status change
```

## Security Model

### Privacy Guarantees
1. **Identity Protection**: ZK proofs prove membership without revealing identity
2. **Content Protection**: E2E encryption, only moderator can decrypt
3. **Metadata Protection**: Minimal metadata, no correlation possible
4. **Rate Limiting**: RLN prevents spam without breaking anonymity

### Trust Assumptions
1. **Client Security**: Browser environment is trusted
2. **Key Management**: Users protect their private keys
3. **Circuit Integrity**: Compiled artifacts are not tampered
4. **Optional Cloud**: If used, cloud provider doesn't correlate metadata

### Attack Mitigation
- **Spam**: RLN nullifiers prevent multiple submissions per epoch
- **Replay**: Epoch-based nullifiers expire
- **Correlation**: No identity linkage across epochs
- **Server Compromise**: Only ciphertext exposed, no plaintext
- **Key Loss**: Export/import with password protection

## Development Architecture

### Build Pipeline
```
Source Code → TypeScript Compilation → Vite Bundle → Production Build
     ↓
Circuit Code → Compile Script → ZK Artifacts → Public Assets
```

### Environment Configuration
```typescript
// Development modes
VITE_USE_REAL_MIDNIGHT: true/false  // Real vs stub proofs
VITE_USE_CONTRACT: true/false       // Contract adapter on/off
VITE_SYNC_ENABLED: true/false       // Cloud sync toggle
VITE_SYNC_BASE_URL: string          // API endpoint
VITE_SYNC_API_KEY: string           // Optional auth
```

### API Architecture (Vercel Functions)
```
/api/reports/
  ├── index.ts       // GET (list), POST (create), PATCH (update)
  └── [id].ts        // GET (single), PATCH (update) - backup

/api/update-report.ts // POST workaround for Vercel routing
```

## Deployment Architecture

### Local Development
```
Vite Dev Server → Hot Module Reload → Local Storage Only
```

### Production (Vercel)
```
GitHub → Vercel Build → Edge Functions → KV Storage
   ↓        ↓              ↓              ↓
Deploy   Optimize      API Routes    Encrypted Data
```

### Infrastructure Requirements
- **Compute**: Minimal (static site + edge functions)
- **Storage**: KV for ciphertext, no heavy DB needed
- **Bandwidth**: Low (only encrypted payloads)
- **Security**: HTTPS enforced, API key optional

## Performance Considerations

### Client-Side
- **Proof Generation**: ~1-3 seconds (WASM execution)
- **Encryption**: <100ms (native Web Crypto)
- **IndexedDB**: Instant for typical volumes

### Network
- **API Calls**: Minimal, only for sync
- **Payload Size**: Small (encrypted text + proof)
- **Caching**: Artifacts cached after first load

### Scalability
- **Horizontal**: Stateless API, easy to scale
- **Storage**: KV handles high throughput
- **Proof Verification**: Client-side, no server load

## Future Architecture Extensions

### 1. Real Blockchain Integration
```
Replace MockOnChainAdapter with:
- EVM adapter using ethers.js
- Solidity contract for nullifier enforcement
- IPFS for encrypted data, on-chain hash
```

### 2. Multi-Role System
```
Add roles:
- Auditor: Read-only aggregate access
- Admin: Key rotation, epoch management
- Reviewer: Intermediate verification step
```

### 3. Federation
```
Multi-organization support:
- Separate Merkle trees per org
- Cross-org proof verification
- Federated moderator keys
```

### 4. Advanced Privacy
```
Enhanced features:
- Homomorphic encryption for stats
- MPC for multi-party decryption
- Differential privacy for public stats
```

## Conclusion

The Midnight Whistleblower architecture prioritizes privacy and security at every layer while maintaining usability. The local-first approach with optional cloud sync ensures data sovereignty, while zero-knowledge proofs and end-to-end encryption provide mathematical guarantees of privacy. The modular design allows for easy extension and adaptation to different use cases while maintaining the core privacy guarantees.
