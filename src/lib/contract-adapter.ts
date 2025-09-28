/**
 * Contract Adapter Layer
 * 
 * Provides abstraction for smart contract interaction with both
 * on-chain and mock implementations to satisfy the DApp requirements
 * while maintaining privacy and using only mocked transactions.
 */

import { WhistleblowerInbox, Field, PublicKey, ZKProof, EncryptedReport } from '../../contracts/WhistleblowerInbox';
import { ZKProof as AppZKProof } from './midnight-stub';

export interface ContractReport {
  id: string;
  commitment: string;
  nullifier: string;
  epoch: number;
  timestamp: number;
  status: 'pending' | 'reviewed' | 'archived';
  txHash?: string;
}

export interface ContractAdapter {
  // Initialize the adapter
  initialize(): Promise<void>;
  
  // Submit a report to the contract
  submitReport(
    commitment: string,
    nullifier: string,
    epoch: number,
    proof: AppZKProof,
    encryptedData: string
  ): Promise<{ txHash: string; reportId: string }>;
  
  // Update report status
  updateStatus(reportId: string, status: ContractReport['status']): Promise<{ txHash: string }>;
  
  // List all reports (from events or storage)
  listReports(): Promise<ContractReport[]>;
  
  // Get a single report
  getReport(reportId: string): Promise<ContractReport | null>;
  
  // Check if adapter is available
  isAvailable(): Promise<boolean>;
  
  // Get contract state
  getContractState(): Promise<{
    reportCount: number;
    currentEpoch: number;
    merkleRoot: string;
  }>;
}

/**
 * Mock On-Chain Adapter
 * Simulates smart contract interaction using in-memory state
 * and IndexedDB for persistence. This satisfies the "integrate smart contracts"
 * requirement while keeping all transactions mocked.
 */
export class MockOnChainAdapter implements ContractAdapter {
  private contract: WhistleblowerInbox;
  private reports: Map<string, ContractReport>;
  private dbName = 'MockContractDB';
  private storeName = 'contractReports';
  
  constructor() {
    this.contract = new WhistleblowerInbox();
    this.reports = new Map();
  }
  
  async initialize(): Promise<void> {
    // Initialize the mock contract with default values
    const initialRoot = this.createField(12345); // Mock merkle root
    const moderatorKey: PublicKey = {
      x: this.createField(111),
      y: this.createField(222)
    };
    const epochDuration = this.createField(86400); // 24 hours
    
    this.contract.init(initialRoot, moderatorKey, epochDuration);
    
    // Load persisted reports from IndexedDB
    await this.loadPersistedReports();
    
    console.log('[MockOnChainAdapter] Initialized with mock contract');
  }
  
  async submitReport(
    commitment: string,
    nullifier: string,
    epoch: number,
    proof: AppZKProof,
    encryptedData: string
  ): Promise<{ txHash: string; reportId: string }> {
    try {
      // Convert nullifier string to a numeric value for the contract
      // Use a hash function to convert the string to a number
      const nullifierHash = this.stringToNumericHash(nullifier);
      const commitmentHash = this.stringToNumericHash(commitment);
      
      // Convert app proof to contract proof format
      const contractProof = new ZKProof(
        proof.proof ? [proof.proof] : [],
        [[]],
        [],
        'groth16'
      );
      
      // Submit to mock contract
      const success = this.contract.submitReport(
        encryptedData,
        this.createField(epoch),
        this.createField(nullifierHash),
        this.createField(commitmentHash),
        contractProof
      );
      
      if (success) {
        // Generate mock transaction hash
        const txHash = `0x${this.generateMockTxHash()}`;
        const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store report
        const report: ContractReport = {
          id: reportId,
          commitment,
          nullifier,
          epoch,
          timestamp: Date.now(),
          status: 'pending',
          txHash
        };
        
        this.reports.set(reportId, report);
        await this.persistReport(report);
        
        // Emit mock event
        console.log('[MockOnChainAdapter] Report submitted:', {
          reportId,
          txHash,
          nullifier: nullifier.slice(0, 8) + '...',
          epoch
        });
        
        return { txHash, reportId };
      }
      
      throw new Error('Contract submission failed');
    } catch (error: any) {
      console.error('[MockOnChainAdapter] Submit failed:', error);
      throw new Error(`Contract error: ${error.message}`);
    }
  }
  
  async updateStatus(reportId: string, status: ContractReport['status']): Promise<{ txHash: string }> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    
    report.status = status;
    const txHash = `0x${this.generateMockTxHash()}`;
    
    await this.persistReport(report);
    
    console.log('[MockOnChainAdapter] Status updated:', {
      reportId,
      status,
      txHash
    });
    
    return { txHash };
  }
  
  async listReports(): Promise<ContractReport[]> {
    return Array.from(this.reports.values()).sort((a, b) => b.timestamp - a.timestamp);
  }
  
  async getReport(reportId: string): Promise<ContractReport | null> {
    return this.reports.get(reportId) || null;
  }
  
  async isAvailable(): Promise<boolean> {
    // Mock contract is always available
    return true;
  }
  
  async getContractState(): Promise<{
    reportCount: number;
    currentEpoch: number;
    merkleRoot: string;
  }> {
    return {
      reportCount: Number(this.contract.getReportCount().value),
      currentEpoch: Number(this.contract.getCurrentEpoch().value),
      merkleRoot: this.contract.getMerkleRoot().value.toString()
    };
  }
  
  // Helper methods
  
  private createField(value: number): Field {
    return {
      value: BigInt(value),
      add: function(other: Field) { return { value: this.value + other.value } as Field; },
      div: function(other: Field) { return { value: this.value / other.value } as Field; },
      mod: function(other: Field) { return { value: this.value % other.value } as Field; },
      pow: function(exp: number) { return { value: this.value ** BigInt(exp) } as Field; },
      equals: function(other: Field) { return this.value === other.value; },
      assertEquals: function(other: Field, msg: string) { if (!this.equals(other)) throw new Error(msg); }
    } as Field;
  }
  
  private stringToNumericHash(str: string): number {
    // Convert string to a numeric hash suitable for the contract
    // Use a simple hash function that produces a positive integer
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private generateMockTxHash(): string {
    return Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }
  
  private async persistReport(report: ContractReport): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(report);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  private async loadPersistedReports(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const reports = request.result as ContractReport[];
          reports.forEach(report => {
            this.reports.set(report.id, report);
          });
          console.log(`[MockOnChainAdapter] Loaded ${reports.length} persisted reports`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.log('[MockOnChainAdapter] No persisted reports found');
    }
  }
}

/**
 * Fallback Adapter
 * Uses existing sync provider infrastructure when contract is not available
 */
export class FallbackAdapter implements ContractAdapter {
  private reports: Map<string, ContractReport> = new Map();
  
  async initialize(): Promise<void> {
    console.log('[FallbackAdapter] Initialized (no contract)');
  }
  
  async submitReport(
    commitment: string,
    nullifier: string,
    epoch: number,
    proof: AppZKProof,
    encryptedData: string
  ): Promise<{ txHash: string; reportId: string }> {
    // Generate IDs
    const txHash = `0xfallback_${Date.now()}`;
    const reportId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store locally
    const report: ContractReport = {
      id: reportId,
      commitment,
      nullifier,
      epoch,
      timestamp: Date.now(),
      status: 'pending',
      txHash
    };
    
    this.reports.set(reportId, report);
    
    console.log('[FallbackAdapter] Report stored locally:', reportId);
    
    return { txHash, reportId };
  }
  
  async updateStatus(reportId: string, status: ContractReport['status']): Promise<{ txHash: string }> {
    const report = this.reports.get(reportId);
    if (report) {
      report.status = status;
    }
    
    const txHash = `0xfallback_status_${Date.now()}`;
    return { txHash };
  }
  
  async listReports(): Promise<ContractReport[]> {
    return Array.from(this.reports.values());
  }
  
  async getReport(reportId: string): Promise<ContractReport | null> {
    return this.reports.get(reportId) || null;
  }
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
  
  async getContractState(): Promise<{
    reportCount: number;
    currentEpoch: number;
    merkleRoot: string;
  }> {
    return {
      reportCount: this.reports.size,
      currentEpoch: Math.floor(Date.now() / 1000 / 86400),
      merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
  }
}

/**
 * Contract Manager - Singleton that manages the active adapter
 */
class ContractManager {
  private static instance: ContractManager;
  private adapter: ContractAdapter;
  
  private constructor() {
    // Check configuration to determine which adapter to use
    // Default to true (contract mode enabled) if not explicitly set
    const storedSetting = localStorage.getItem('use_contract');
    const envSetting = import.meta.env.VITE_USE_CONTRACT;
    
    // Enable contract mode by default
    let useContract = true;
    
    // Check if there's an explicit setting
    if (storedSetting !== null) {
      useContract = storedSetting === 'true';
    } else if (envSetting !== undefined) {
      useContract = envSetting === 'true' || envSetting === true;
    } else {
      // No explicit setting, use default (true) and save it
      localStorage.setItem('use_contract', 'true');
    }
    
    if (useContract) {
      console.log('[ContractManager] Using mock on-chain adapter (Smart Contract Mode enabled by default)');
      this.adapter = new MockOnChainAdapter();
    } else {
      console.log('[ContractManager] Using fallback adapter (Smart Contract Mode disabled)');
      this.adapter = new FallbackAdapter();
    }
    
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
  
  async switchAdapter(useContract: boolean): Promise<void> {
    if (useContract) {
      this.adapter = new MockOnChainAdapter();
    } else {
      this.adapter = new FallbackAdapter();
    }
    
    await this.adapter.initialize();
    localStorage.setItem('use_contract', useContract.toString());
    
    console.log(`[ContractManager] Switched to ${useContract ? 'contract' : 'fallback'} adapter`);
  }
  
  isUsingContract(): boolean {
    return this.adapter instanceof MockOnChainAdapter;
  }
}

// Export singleton instance
export const contractManager = ContractManager.getInstance();
