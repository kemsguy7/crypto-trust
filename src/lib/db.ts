// IndexedDB persistence layer for whistleblower reports
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { EncryptedData } from './encryption';

// Database schema
interface WhistleblowerDB extends DBSchema {
  reports: {
    key: string;
    value: {
      id: string;
      timestamp: number;
      encrypted: EncryptedData;
      proof: any; // ZK proof object
      nullifier: string;
      epoch: number;
      messageHash: string;
      status: 'pending' | 'reviewed' | 'archived';
      submittedAt: Date;
      reviewedAt?: Date;
    };
    indexes: {
      'by-epoch': number;
      'by-status': string;
      'by-timestamp': number;
      'by-nullifier': string;
    };
  };
  
  nullifiers: {
    key: string; // epoch:nullifier
    value: {
      id: string; // epoch:nullifier
      epoch: number;
      nullifier: string;
      usedAt: Date;
    };
    indexes: {
      'by-epoch': number;
    };
  };
  
  settings: {
    key: string;
    value: any;
  };
}

class WhistleblowerDatabase {
  private db: IDBPDatabase<WhistleblowerDB> | null = null;
  private readonly DB_NAME = 'whistleblower-inbox';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<WhistleblowerDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create reports store
        if (!db.objectStoreNames.contains('reports')) {
          const reportStore = db.createObjectStore('reports', { keyPath: 'id' });
          reportStore.createIndex('by-epoch', 'epoch');
          reportStore.createIndex('by-status', 'status');
          reportStore.createIndex('by-timestamp', 'timestamp');
          reportStore.createIndex('by-nullifier', 'nullifier');
        }

        // Create nullifiers store for RLN tracking
        if (!db.objectStoreNames.contains('nullifiers')) {
          const nullifierStore = db.createObjectStore('nullifiers', { keyPath: 'id' });
          nullifierStore.createIndex('by-epoch', 'epoch');
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Report management
  async saveReport(report: Omit<WhistleblowerDB['reports']['value'], 'submittedAt'>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(['reports', 'nullifiers'], 'readwrite');
    
    // Save report
    await tx.objectStore('reports').add({
      ...report,
      submittedAt: new Date(),
    });

    // Record nullifier usage
    const nullifierKey = `${report.epoch}:${report.nullifier}`;
    await tx.objectStore('nullifiers').add({
      id: nullifierKey,
      epoch: report.epoch,
      nullifier: report.nullifier,
      usedAt: new Date(),
    });

    await tx.done;
  }

  async getReport(id: string): Promise<WhistleblowerDB['reports']['value'] | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.db.get('reports', id);
  }

  async listReports(filter?: {
    status?: 'pending' | 'reviewed' | 'archived';
    epoch?: number;
    limit?: number;
  }): Promise<WhistleblowerDB['reports']['value'][]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    let reports: WhistleblowerDB['reports']['value'][] = [];

    if (filter?.status) {
      reports = await this.db.getAllFromIndex('reports', 'by-status', filter.status);
    } else if (filter?.epoch !== undefined) {
      reports = await this.db.getAllFromIndex('reports', 'by-epoch', filter.epoch);
    } else {
      reports = await this.db.getAll('reports');
    }

    // Sort by timestamp descending
    reports.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit if specified
    if (filter?.limit) {
      reports = reports.slice(0, filter.limit);
    }

    return reports;
  }

  async updateReportStatus(
    id: string, 
    status: 'pending' | 'reviewed' | 'archived'
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const report = await this.db.get('reports', id);
    if (!report) throw new Error('Report not found');

    report.status = status;
    if (status === 'reviewed') {
      report.reviewedAt = new Date();
    }

    await this.db.put('reports', report);
  }

  // RLN (Rate Limiting Nullifier) checks
  async checkNullifierUsed(epoch: number, nullifier: string): Promise<boolean> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const nullifierKey = `${epoch}:${nullifier}`;
    const existing = await this.db.get('nullifiers', nullifierKey);
    return !!existing;
  }

  async getNullifiersForEpoch(epoch: number): Promise<string[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const nullifiers = await this.db.getAllFromIndex('nullifiers', 'by-epoch', epoch);
    return nullifiers.map(n => n.nullifier);
  }

  // Data retention and cleanup
  async purgeOlderThan(days: number): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const reports = await this.db.getAllFromIndex('reports', 'by-timestamp', IDBKeyRange.upperBound(cutoffTime));
    
    const tx = this.db.transaction(['reports', 'nullifiers'], 'readwrite');
    
    for (const report of reports) {
      await tx.objectStore('reports').delete(report.id);
      
      // Also delete associated nullifier
      const nullifierKey = `${report.epoch}:${report.nullifier}`;
      await tx.objectStore('nullifiers').delete(nullifierKey);
    }
    
    await tx.done;
    return reports.length;
  }

  async purgeAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(['reports', 'nullifiers'], 'readwrite');
    await tx.objectStore('reports').clear();
    await tx.objectStore('nullifiers').clear();
    await tx.done;
  }

  // Statistics
  async getStats(): Promise<{
    totalReports: number;
    pendingReports: number;
    reviewedReports: number;
    archivedReports: number;
    reportsPerEpoch: Map<number, number>;
    nullifiersPerEpoch: Map<number, number>;
  }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const allReports = await this.db.getAll('reports');
    const allNullifiers = await this.db.getAll('nullifiers');

    const reportsPerEpoch = new Map<number, number>();
    const nullifiersPerEpoch = new Map<number, number>();

    let pendingReports = 0;
    let reviewedReports = 0;
    let archivedReports = 0;

    for (const report of allReports) {
      // Count by status
      switch (report.status) {
        case 'pending':
          pendingReports++;
          break;
        case 'reviewed':
          reviewedReports++;
          break;
        case 'archived':
          archivedReports++;
          break;
      }

      // Count by epoch
      const epochCount = reportsPerEpoch.get(report.epoch) || 0;
      reportsPerEpoch.set(report.epoch, epochCount + 1);
    }

    for (const nullifier of allNullifiers) {
      const epochCount = nullifiersPerEpoch.get(nullifier.epoch) || 0;
      nullifiersPerEpoch.set(nullifier.epoch, epochCount + 1);
    }

    return {
      totalReports: allReports.length,
      pendingReports,
      reviewedReports,
      archivedReports,
      reportsPerEpoch,
      nullifiersPerEpoch,
    };
  }

  // Settings management
  async getSetting(key: string): Promise<any> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const setting = await this.db.get('settings', key);
    return setting?.value;
  }

  async setSetting(key: string, value: any): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('settings', { key, value });
  }

  // Export/Import for backup
  async exportData(): Promise<{
    reports: WhistleblowerDB['reports']['value'][];
    nullifiers: WhistleblowerDB['nullifiers']['value'][];
    settings: Array<{ key: string; value: any }>;
    exportedAt: Date;
  }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const reports = await this.db.getAll('reports');
    const nullifiers = await this.db.getAll('nullifiers');
    const settings = await this.db.getAll('settings');

    return {
      reports,
      nullifiers,
      settings,
      exportedAt: new Date(),
    };
  }

  async importData(data: {
    reports: WhistleblowerDB['reports']['value'][];
    nullifiers: WhistleblowerDB['nullifiers']['value'][];
    settings?: Array<{ key: string; value: any }>;
  }): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(['reports', 'nullifiers', 'settings'], 'readwrite');

    // Import reports
    for (const report of data.reports) {
      await tx.objectStore('reports').put(report);
    }

    // Import nullifiers
    for (const nullifier of data.nullifiers) {
      await tx.objectStore('nullifiers').put(nullifier);
    }

    // Import settings if provided
    if (data.settings) {
      for (const setting of data.settings) {
        await tx.objectStore('settings').put(setting);
      }
    }

    await tx.done;
  }
}

// Singleton instance
export const db = new WhistleblowerDatabase();

// Helper function to clear all data (for testing/demo)
export async function clearAllData(): Promise<void> {
  await db.purgeAll();
}

// Helper function to get database size estimate
export async function getDatabaseSize(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { usage: 0, quota: 0 };
}
