import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { contractManager } from '../lib/contract-adapter';
import { syncManager } from '../lib/sync-provider';

const PublicStatsPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalReports: 0,
    currentEpoch: 0,
    pendingReports: 0,
    reviewedReports: 0,
    archivedReports: 0,
    reportsToday: 0,
    contractMode: false
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      // Get contract state if available
      const contractAdapter = contractManager.getAdapter();
      const contractState = await contractAdapter.getContractState();
      const contractReports = await contractAdapter.listReports();
      
      // Get sync provider reports for additional data
      const syncProvider = syncManager.getProvider();
      const syncReports = await syncProvider.listReports();
      
      // Use contract reports if available, otherwise sync reports
      const reports = contractReports.length > 0 ? contractReports : syncReports;
      
      // Calculate statistics
      const currentEpoch = contractState.currentEpoch || Math.floor(Date.now() / 1000 / 86400);
      const todayReports = reports.filter(r => {
        const reportEpoch = 'epoch' in r ? r.epoch : Math.floor(r.timestamp / 1000 / 86400);
        return reportEpoch === currentEpoch;
      });
      
      const pending = reports.filter(r => r.status === 'pending').length;
      const reviewed = reports.filter(r => r.status === 'reviewed').length;
      const archived = reports.filter(r => r.status === 'archived').length;
      
      setStats({
        totalReports: reports.length,
        currentEpoch,
        pendingReports: pending,
        reviewedReports: reviewed,
        archivedReports: archived,
        reportsToday: todayReports.length,
        contractMode: contractManager.isUsingContract()
      });
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate time remaining in epoch (24 hours)
  const getTimeRemaining = () => {
    const now = Date.now();
    const epochStart = Math.floor(now / 1000 / 86400) * 86400 * 1000;
    const epochEnd = epochStart + 86400 * 1000;
    const remaining = epochEnd - now;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  // Calculate percentages for progress bars
  const getStatusPercentages = () => {
    const total = stats.totalReports || 1; // Avoid division by zero
    return {
      pending: Math.round((stats.pendingReports / total) * 100),
      reviewed: Math.round((stats.reviewedReports / total) * 100),
      archived: Math.round((stats.archivedReports / total) * 100)
    };
  };

  const percentages = getStatusPercentages();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <section className="text-center py-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Public Statistics
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Privacy-preserving insights into system usage
        </p>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </section>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Reports" 
            value={stats.totalReports.toString()} 
            change={stats.contractMode ? "On-chain" : "Local"} 
          />
          <StatCard 
            title="Current Epoch" 
            value={stats.currentEpoch.toString()} 
            change={getTimeRemaining()} 
          />
          <StatCard 
            title="Pending Review" 
            value={stats.pendingReports.toString()} 
            change={`${percentages.pending}% of total`} 
          />
          <StatCard 
            title="Reports Today" 
            value={stats.reportsToday.toString()} 
            change="Rate limited" 
          />
        </div>
        
        {/* Main Stats Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Privacy-Preserving Statistics
          </h2>
          <p className="text-gray-600 mb-6">
            All statistics are aggregated and anonymized. No individual report details or reporter identities are exposed.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Report Status</h3>
              <div className="space-y-3">
                <ProgressBar label="Pending" percentage={percentages.pending} color="yellow" />
                <ProgressBar label="Reviewed" percentage={percentages.reviewed} color="green" />
                <ProgressBar label="Archived" percentage={percentages.archived} color="gray" />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Total: {stats.totalReports} reports
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Smart Contract Mode</span>
                  <span className={`text-sm font-medium ${stats.contractMode ? 'text-green-600' : 'text-gray-500'}`}>
                    {stats.contractMode ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Epoch Duration</span>
                  <span className="text-sm font-medium text-gray-900">24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rate Limit</span>
                  <span className="text-sm font-medium text-gray-900">1 per identity/epoch</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Privacy Level</span>
                  <span className="text-sm font-medium text-green-600">Maximum</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Info Cards */}
        <div className="space-y-4">
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">About These Statistics</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.contractMode 
                    ? "Statistics are derived from smart contract events and on-chain data. All reports are anchored with mock transactions."
                    : "Statistics are derived from local storage. Enable Smart Contract Mode in Settings for on-chain anchoring."}
                  {" "}The system ensures complete anonymity while providing transparency about overall system usage.
                </p>
              </div>
            </div>
          </Card>

          {/* Refresh button */}
          <div className="flex justify-center">
            <button
              onClick={loadStats}
              disabled={isRefreshing}
              aria-busy={isRefreshing}
              aria-label="Refresh statistics"
              title="Refresh statistics"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              <svg 
                className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isRefreshing ? (
                  <>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                )}
              </svg>
              {isRefreshing ? 'Refreshing...' : 'Refresh Statistics'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change }) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{change}</p>
    </Card>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  label: string;
  percentage: number;
  color?: 'gray' | 'green' | 'yellow' | 'orange' | 'red';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, percentage, color = 'gray' }) => {
  const colorClasses = {
    gray: 'bg-gray-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600'
  };
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default PublicStatsPage;
