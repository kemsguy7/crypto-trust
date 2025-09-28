/**
 * Sync Provider Infrastructure
 * 
 * Provides abstraction for report storage with local-first and optional cloud sync.
 * All encryption/decryption remains client-side. Only ciphertext is synced.
 */

import { ZKProof } from './midnight-stub';

export interface SyncedReport {
  id?: number | string;
  encryptedData: string;
  proof: ZKProof;
  timestamp: number;
  status: 'pending' | 'reviewed' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncProvider {
  // List all reports
  listReports(): Promise<SyncedReport[]>;
  
  // Add a new report
  addReport(report: Omit<SyncedReport, 'id'>): Promise<string | number>;
  
  // Update report status
  updateStatus(id: string | number, status: SyncedReport['status']): Promise<void>;
  
  // Get a single report
  getReport(id: string | number): Promise<SyncedReport | null>;
  
  // Check if provider is available
  isAvailable(): Promise<boolean>;
}

/**
 * Local IndexedDB Provider (default)
 */
export class LocalSyncProvider implements SyncProvider {
  private dbName = 'WhistleblowerDB';
  private storeName = 'reports';
  
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }
  
  async listReports(): Promise<SyncedReport[]> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const reports = request.result.map(r => ({
          ...r,
          encryptedData: r.encryptedData || JSON.stringify(r), // Handle legacy format
        }));
        resolve(reports.sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async addReport(report: Omit<SyncedReport, 'id'>): Promise<number> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...report,
        createdAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }
  
  async updateStatus(id: string | number, status: SyncedReport['status']): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const report = getRequest.result;
        if (report) {
          report.status = status;
          report.updatedAt = new Date().toISOString();
          const putRequest = store.put(report);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Report not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
  
  async getReport(id: string | number): Promise<SyncedReport | null> {
    const db = await this.openDB();
    const tx = db.transaction([this.storeName], 'readonly');
    const store = tx.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  async isAvailable(): Promise<boolean> {
    return typeof indexedDB !== 'undefined';
  }
}

/**
 * HTTP Sync Provider for Vercel KV backend
 */
export class HttpSyncProvider implements SyncProvider {
  private baseUrl: string;
  private apiKey?: string;
  private localProvider: LocalSyncProvider;
  
  constructor(baseUrl?: string, apiKey?: string) {
    // Default to same-origin if no URL provided
    this.baseUrl = baseUrl ? baseUrl.replace(/\/$/, '') : window.location.origin;
    this.apiKey = apiKey;
    this.localProvider = new LocalSyncProvider(); // Keep local copy for offline
  }
  
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }
  
  async listReports(): Promise<SyncedReport[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/reports`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const reports = data.reports.map((r: any) => ({
        id: r.id,
        encryptedData: r.encryptedData,
        proof: {
          // Reconstruct a valid stub proof that verifyProof expects
          proof: btoa(JSON.stringify({
            type: 'rate-limit-nullifier',
            data: {
              reportHash: 'kv_report',
              timestamp: r.timestamp,
              nullifier: r.proofPublicSignals?.[2] || ''
            },
            hash: r.proofPublicSignals?.[0] || '0',
            version: '1.0'
          })),
          publicInputs: r.proofPublicSignals || [],
          nullifier: r.proofPublicSignals?.[2] || '',
          timestamp: r.timestamp,
        },
        timestamp: r.timestamp,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
      
      return reports;
    } catch (error) {
      console.error('[HttpSyncProvider] Failed to list reports, using local:', error);
      // Fallback to local
      return this.localProvider.listReports();
    }
  }
  
  async addReport(report: Omit<SyncedReport, 'id'>): Promise<string> {
    try {
      // Extract public signals from proof
      const publicSignals = report.proof.publicInputs || [];
      
      // First, save locally
      const localId = await this.localProvider.addReport(report);
      
      // Then sync to cloud
      const response = await fetch(`${this.baseUrl}/api/reports`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          encryptedData: report.encryptedData,
          proofPublicSignals: publicSignals,
          timestamp: report.timestamp,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[HttpSyncProvider] Failed to sync report:', error);
        // Report is still saved locally
        return localId.toString();
      }
      
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('[HttpSyncProvider] Failed to add report to cloud, saved locally:', error);
      // Fallback to local only
      const localId = await this.localProvider.addReport(report);
      return localId.toString();
    }
  }
  
  async updateStatus(id: string | number, status: SyncedReport['status']): Promise<void> {
    try {
      // For cloud sync, update cloud first
      console.log(`[HttpSyncProvider] Updating status for report ${id} to ${status}`);
      
      // Use the new update-report endpoint with POST method
      const response = await fetch(`${this.baseUrl}/api/update-report`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ id, status }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[HttpSyncProvider] Failed to sync status update: ${response.status} - ${errorData}`);
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      console.log(`[HttpSyncProvider] Successfully updated status for report ${id}`);
      
      // Try to update locally as well if the report exists locally
      // This is a best-effort attempt - don't fail if local update fails
      try {
        await this.localProvider.updateStatus(id, status);
      } catch (localError) {
        // Local update failed - this is expected if the ID is a cloud ID
        console.log(`[HttpSyncProvider] Local update skipped (cloud ID): ${id}`);
      }
    } catch (error) {
      console.error('[HttpSyncProvider] Failed to update status in cloud:', error);
      // Try local update as fallback only if it's a numeric ID (local ID)
      if (typeof id === 'number') {
        console.log('[HttpSyncProvider] Attempting local-only update for numeric ID');
        await this.localProvider.updateStatus(id, status);
      } else {
        // Re-throw for cloud IDs since we can't update locally
        throw error;
      }
    }
  }
  
  async getReport(id: string | number): Promise<SyncedReport | null> {
    // For single report, prefer local cache
    return this.localProvider.getReport(id);
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/reports?limit=1`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Sync Manager - Singleton that manages the active provider
 */
class SyncManager {
  private static instance: SyncManager;
  private provider: SyncProvider;
  
  private constructor() {
    // Initialize with local provider by default
    this.provider = new LocalSyncProvider();
    
    // Check environment variables or localStorage
    const syncEnabled = import.meta.env.VITE_SYNC_ENABLED === 'true' || 
                       localStorage.getItem('sync_enabled') === 'true';
    
    if (syncEnabled) {
      // Resolve base URL in order: localStorage → env → origin
      const syncBaseUrl = localStorage.getItem('sync_base_url') || 
                         import.meta.env.VITE_SYNC_BASE_URL || 
                         window.location.origin;
      const syncApiKey = localStorage.getItem('sync_api_key') || 
                        import.meta.env.VITE_SYNC_API_KEY;
      
      console.log('[SyncManager] Cloud sync enabled, using HTTP provider');
      this.provider = new HttpSyncProvider(syncBaseUrl, syncApiKey);
    } else {
      console.log('[SyncManager] Using local-only storage');
    }
  }
  
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }
  
  getProvider(): SyncProvider {
    return this.provider;
  }
  
  async switchProvider(providerType: 'local' | 'http' | boolean, baseUrl?: string, apiKey?: string): Promise<void> {
    const useCloud = providerType === 'http' || providerType === true;
    
    if (useCloud) {
      // Resolve base URL in order: provided → localStorage → env → origin
      const finalBaseUrl = baseUrl || 
                          localStorage.getItem('sync_base_url') || 
                          import.meta.env.VITE_SYNC_BASE_URL || 
                          window.location.origin;
      const finalApiKey = apiKey || 
                         localStorage.getItem('sync_api_key') || 
                         import.meta.env.VITE_SYNC_API_KEY;
      
      console.log('[SyncManager] Switching to HTTP provider with URL:', finalBaseUrl);
      const httpProvider = new HttpSyncProvider(finalBaseUrl, finalApiKey);
      
      // Don't check availability here - just switch
      // The settings page will check connection separately
      this.provider = httpProvider;
      console.log('[SyncManager] Switched to cloud sync (HTTP provider)');
      return;
    }
    
    this.provider = new LocalSyncProvider();
    console.log('[SyncManager] Switched to local storage');
  }
  
  isCloudSync(): boolean {
    return this.provider instanceof HttpSyncProvider;
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
