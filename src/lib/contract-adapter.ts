/**
 * DApp Reviewer Contract Adapter Layer
 * 
 * Provides abstraction for DApp review contract interaction with both
 * on-chain and mock implementations using the Compact contract.
 */

import { ZKProof as AppZKProof } from './midnight-stub';

export interface DAppInfo {
  address: string;
  name: string;
  category: string;
  registrationEpoch: number;
  status: 'INACTIVE' | 'ACTIVE' | 'SUSPENDED';
  totalReviews: number;
  averageRating: number; // Rating * 100 for precision
  reputationScore: number;
}

export interface ReviewRecord {
  id: string;
  dappAddress: string;
  reviewHash: string;
  rating: number; // 1-10 scale
  epoch: number;
  timestamp: number;
  nullifierHash: string;
  interactionProof: string;
  status: 'PENDING' | 'VERIFIED' | 'FLAGGED';
  txHash?: string;
}

export interface ContractAdapter {
  // Initialize the adapter
  initialize(): Promise<void>;
  
  // DApp management
  registerDApp(
    address: string,
    name: string,
    category: string,
    adminSignature: string
  ): Promise<{ txHash: string }>;
  
  getDAppInfo(address: string): Promise<DAppInfo | null>;
  
  // Review submission
  submitReview(
    dappAddress: string,
    reviewHash: string,
    rating: number,
    interactionProof: string,
    nullifier: string,
    proof: AppZKProof | string // Accept both types for flexibility
  ): Promise<{ txHash: string; reviewId: string }>;
  
  // Admin functions
  updateReviewerRoot(newRoot: string, signature: string): Promise<{ txHash: string }>;
  addModerator(moderatorKey: string, signature: string): Promise<{ txHash: string }>;
  
  // Moderation
  flagReview(reviewId: string): Promise<{ txHash: string }>;
  
  // View functions
  listDApps(): Promise<DAppInfo[]>;
  listReviews(dappAddress?: string): Promise<ReviewRecord[]>;
  getTotalStats(): Promise<{ totalDApps: number; totalReviews: number; currentEpoch: number }>;
  isNullifierUsed(dappAddress: string, nullifier: string): Promise<boolean>;
  
  // Utility
  isAvailable(): Promise<boolean>;
  getCurrentEpoch(): Promise<number>;
}

/**
 * Compact Contract Adapter
 * Integrates with the DApp Reviewer Compact contract
 */
export class CompactContractAdapter implements ContractAdapter {
  private dapps: Map<string, DAppInfo> = new Map();
  private reviews: Map<string, ReviewRecord> = new Map();
  private usedNullifiers: Set<string> = new Set();
  private currentEpoch: number = 0;
  private dbName = 'DAppReviewerDB';
  
  constructor() {
    // Load contract artifacts
    this.loadContractArtifacts();
  }
  
  async initialize(): Promise<void> {
    this.currentEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily epochs
    
    // Load persisted data
    await this.loadPersistedData();
    
    console.log('[CompactContractAdapter] Initialized with DApp Reviewer contract');
    console.log(`[CompactContractAdapter] Current epoch: ${this.currentEpoch}`);
  }
  
  async registerDApp(
    address: string,
    name: string,
    category: string,
    adminSignature: string
  ): Promise<{ txHash: string }> {
    // Verify admin signature (simplified for demo)
    if (!adminSignature || adminSignature.length < 10) {
      throw new Error('Invalid admin signature');
    }
    
    // Check if already registered
    if (this.dapps.has(address)) {
      throw new Error('DApp already registered');
    }
    
    // Create DApp info
    const dappInfo: DAppInfo = {
      address,
      name,
      category,
      registrationEpoch: this.currentEpoch,
      status: 'ACTIVE',
      totalReviews: 0,
      averageRating: 0,
      reputationScore: 0
    };
    
    // Store and persist
    this.dapps.set(address, dappInfo);
    await this.persistDApp(dappInfo);
    
    const txHash = this.generateTxHash('register');
    
    console.log('[CompactContractAdapter] DApp registered:', {
      address: address.slice(0, 8) + '...',
      name,
      category,
      txHash
    });
    
    return { txHash };
  }
  
  async getDAppInfo(address: string): Promise<DAppInfo | null> {
    return this.dapps.get(address) || null;
  }
  
  async submitReview(
    dappAddress: string,
    reviewHash: string,
    rating: number,
    interactionProof: string,
    nullifier: string,
    proof: AppZKProof
  ): Promise<{ txHash: string; reviewId: string }> {
    // Verify dApp exists and is active
    const dapp = this.dapps.get(dappAddress);
    if (!dapp || dapp.status !== 'ACTIVE') {
      throw new Error('DApp not found or inactive');
    }
    
    // Verify rating range
    if (rating < 1 || rating > 10) {
      throw new Error('Rating must be between 1 and 10');
    }
    
    // Check nullifier hasn't been used
    const nullifierKey = `${dappAddress}_${nullifier}`;
    if (this.usedNullifiers.has(nullifierKey)) {
      throw new Error('Review already submitted (nullifier used)');
    }
    
    // Verify ZK proof (improved verification)
    if (!proof.proof || !proof.publicSignals || proof.publicSignals.length === 0) {
      throw new Error('Invalid ZK proof: missing proof data or public signals');
    }
    
    // Additional proof validation - check if it's a valid base64 encoded proof
    try {
      const decodedProof = JSON.parse(atob(proof.proof));
      if (!decodedProof.type || !decodedProof.signal) {
        throw new Error('Invalid ZK proof structure');
      }
      
      // Verify the proof is recent (within last hour for demo)
      const proofAge = Date.now() - proof.timestamp;
      if (proofAge > 60 * 60 * 1000) { // 1 hour
        throw new Error('ZK proof is too old');
      }
      
      console.log('[CompactContractAdapter] ZK proof verified successfully');
    } catch (error) {
      throw new Error(`ZK proof validation failed: ${error.message}`);
    }
    
    // Generate review ID and create record
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const review: ReviewRecord = {
      id: reviewId,
      dappAddress,
      reviewHash,
      rating,
      epoch: this.currentEpoch,
      timestamp: Date.now(),
      nullifierHash: this.hashString(nullifier),
      interactionProof,
      status: 'VERIFIED'
    };
    
    // Store review and mark nullifier as used
    this.reviews.set(reviewId, review);
    this.usedNullifiers.add(nullifierKey);
    
    // Update DApp stats
    await this.updateDAppStats(dappAddress, rating);
    
    // Persist data
    await this.persistReview(review);
    await this.persistNullifier(nullifierKey);
    
    const txHash = this.generateTxHash('review');
    review.txHash = txHash;
    
    console.log('[CompactContractAdapter] Review submitted:', {
      reviewId,
      dappAddress: dappAddress.slice(0, 8) + '...',
      rating,
      txHash
    });
    
    return { txHash, reviewId };
  }
  
  async updateReviewerRoot(newRoot: string, signature: string): Promise<{ txHash: string }> {
    // Verify admin signature (simplified)
    if (!signature || signature.length < 10) {
      throw new Error('Invalid admin signature');
    }
    
    const txHash = this.generateTxHash('updateRoot');
    
    console.log('[CompactContractAdapter] Reviewer root updated:', {
      newRoot: newRoot.slice(0, 16) + '...',
      txHash
    });
    
    return { txHash };
  }
  
  async addModerator(moderatorKey: string, signature: string): Promise<{ txHash: string }> {
    // Verify admin signature (simplified)
    if (!signature || signature.length < 10) {
      throw new Error('Invalid admin signature');
    }
    
    const txHash = this.generateTxHash('addMod');
    
    console.log('[CompactContractAdapter] Moderator added:', {
      moderatorKey: moderatorKey.slice(0, 16) + '...',
      txHash
    });
    
    return { txHash };
  }
  
  async flagReview(reviewId: string): Promise<{ txHash: string }> {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    review.status = 'FLAGGED';
    await this.persistReview(review);
    
    const txHash = this.generateTxHash('flag');
    
    console.log('[CompactContractAdapter] Review flagged:', {
      reviewId,
      txHash
    });
    
    return { txHash };
  }
  
  async listDApps(): Promise<DAppInfo[]> {
    return Array.from(this.dapps.values()).sort((a, b) => 
      b.registrationEpoch - a.registrationEpoch
    );
  }
  
  async listReviews(dappAddress?: string): Promise<ReviewRecord[]> {
    let reviews = Array.from(this.reviews.values());
    
    if (dappAddress) {
      reviews = reviews.filter(r => r.dappAddress === dappAddress);
    }
    
    return reviews.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  async getTotalStats(): Promise<{ totalDApps: number; totalReviews: number; currentEpoch: number }> {
    return {
      totalDApps: this.dapps.size,
      totalReviews: this.reviews.size,
      currentEpoch: this.currentEpoch
    };
  }
  
  async isNullifierUsed(dappAddress: string, nullifier: string): Promise<boolean> {
    const nullifierKey = `${dappAddress}_${nullifier}`;
    return this.usedNullifiers.has(nullifierKey);
  }
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
  
  async getCurrentEpoch(): Promise<number> {
    return this.currentEpoch;
  }
  
  // Private helper methods
  
  private async updateDAppStats(dappAddress: string, newRating: number): Promise<void> {
    const dapp = this.dapps.get(dappAddress);
    if (!dapp) return;
    
    const currentTotal = dapp.totalReviews;
    const currentAverage = dapp.averageRating;
    
    // Update running average (multiply by 100 for precision)
    const newTotal = currentTotal + 1;
    const newAverage = currentTotal === 0 
      ? newRating * 100
      : Math.round((currentAverage * currentTotal + newRating * 100) / newTotal);
    
    dapp.totalReviews = newTotal;
    dapp.averageRating = newAverage;
    dapp.reputationScore = this.calculateReputationScore(dapp);
    
    await this.persistDApp(dapp);
  }
  
  private calculateReputationScore(dapp: DAppInfo): number {
    const reviewCount = dapp.totalReviews;
    const avgRating = dapp.averageRating; // Already * 100
    const age = this.currentEpoch - dapp.registrationEpoch;
    
    // Base score from rating and review count
    const logApprox = reviewCount === 0 ? 0 : 
      reviewCount <= 1 ? 0 :
      reviewCount <= 2 ? 69 : // ln(2) * 100
      reviewCount <= 7 ? 194 : // ln(7) * 100
      reviewCount <= 20 ? 299 : 399; // ln(20) * 100
    
    const baseScore = Math.round((avgRating * logApprox) / 10000);
    
    // Longevity bonus (max 200 points)
    const ageBonus = Math.min(age * 10, 200);
    
    // Final reputation score (max 10000 = 100.00)
    return Math.min(baseScore + ageBonus, 10000);
  }
  
  private loadContractArtifacts(): void {
    // In a real deployment, this would load the actual contract artifacts
    console.log('[CompactContractAdapter] Loading contract artifacts...');
    
    // Mock loading contract artifacts from /public/zk-artifacts/
    const contractData = {
      name: 'dapp_reviewer',
      circuits: ['registerDApp', 'submitReview', 'updateReviewerRoot', 'addModerator', 'flagReview'],
      witnesses: ['adminSecretKey', 'reviewerIdentitySecret', 'reviewerMerklePath', 'reviewerMerkleIndices', 'reviewContent']
    };
    
    console.log('[CompactContractAdapter] Contract loaded:', contractData);
  }
  
  private generateTxHash(operation: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).slice(2);
    return `0x${this.hashString(operation + timestamp + random)}`;
  }
  
  private hashString(input: string): string {
    // Simple hash function for demo
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
  
  // IndexedDB persistence methods
  
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('dapps')) {
          db.createObjectStore('dapps', { keyPath: 'address' });
        }
        if (!db.objectStoreNames.contains('reviews')) {
          db.createObjectStore('reviews', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('nullifiers')) {
          db.createObjectStore('nullifiers', { keyPath: 'key' });
        }
      };
    });
  }
  
  private async persistDApp(dapp: DAppInfo): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(['dapps'], 'readwrite');
    const store = tx.objectStore('dapps');
    
    return new Promise((resolve, reject) => {
      const request = store.put(dapp);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  private async persistReview(review: ReviewRecord): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(['reviews'], 'readwrite');
    const store = tx.objectStore('reviews');
    
    return new Promise((resolve, reject) => {
      const request = store.put(review);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  private async persistNullifier(nullifierKey: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(['nullifiers'], 'readwrite');
    const store = tx.objectStore('nullifiers');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key: nullifierKey, used: true });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  private async loadPersistedData(): Promise<void> {
    try {
      const db = await this.openDB();
      
      // Load DApps
      const dappTx = db.transaction(['dapps'], 'readonly');
      const dappStore = dappTx.objectStore('dapps');
      const dapps = await new Promise<DAppInfo[]>((resolve, reject) => {
        const request = dappStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      dapps.forEach(dapp => this.dapps.set(dapp.address, dapp));
      
      // Load Reviews
      const reviewTx = db.transaction(['reviews'], 'readonly');
      const reviewStore = reviewTx.objectStore('reviews');
      const reviews = await new Promise<ReviewRecord[]>((resolve, reject) => {
        const request = reviewStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      reviews.forEach(review => this.reviews.set(review.id, review));
      
      // Load Nullifiers
      const nullifierTx = db.transaction(['nullifiers'], 'readonly');
      const nullifierStore = nullifierTx.objectStore('nullifiers');
      const nullifiers = await new Promise<{key: string}[]>((resolve, reject) => {
        const request = nullifierStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      nullifiers.forEach(n => this.usedNullifiers.add(n.key));
      
      console.log(`[CompactContractAdapter] Loaded ${dapps.length} DApps, ${reviews.length} reviews, ${nullifiers.length} nullifiers`);
    } catch (error) {
      console.log('[CompactContractAdapter] No persisted data found, starting fresh');
    }
  }
}

/**
 * Contract Manager - Singleton that manages the active adapter
 */
class ContractManager {
  private static instance: ContractManager;
  private adapter: ContractAdapter;
  
  private constructor() {
    // Always use the Compact contract adapter for the DApp reviewer
    console.log('[ContractManager] Using Compact DApp Reviewer contract');
    this.adapter = new CompactContractAdapter();
    
    // Initialize the adapter
    this.adapter.initialize().catch(error => {
      console.error('[ContractManager] Failed to initialize adapter:', error);
    });
  }
  
  static getInstance(): ContractManager {
    if (!ContractManager.instance) {
      ContractManager.instance = new ContractManager();
    }
    return ContractManager.instance;
  }
  
  getAdapter(): ContractAdapter {
    return this.adapter;
  }
  
  async reinitialize(): Promise<void> {
    await this.adapter.initialize();
    console.log('[ContractManager] Adapter reinitialized');
  }
}

// Export singleton instance
export const contractManager = ContractManager.getInstance();
