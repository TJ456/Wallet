import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Activity, AlertTriangle, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import contractService from '@/web3/contract';
import walletConnector from '@/web3/wallet';
import { shortenAddress } from '@/web3/utils';

interface ThreatMonitorProps {
  threatLevel: 'safe' | 'warning' | 'danger';
}

interface ScanResult {
  id: number;
  contract: string;
  name: string; 
  status: 'safe' | 'warning' | 'danger';
  timestamp: string;
  riskScore: number;
}

const ThreatMonitor: React.FC<ThreatMonitorProps> = ({ threatLevel }) => {
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Well-known contracts with their names (in a production app, this would come from a database or API)
  const knownContracts: Record<string, string> = {
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'Uniswap Token',
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'Tether USD',
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'Wrapped BTC',
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap Router',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI Stablecoin'
  };

  // Helper function to get contract names
  const getContractName = async (address: string): Promise<string> => {
    // Check if it's a known contract
    if (knownContracts[address.toLowerCase()]) {
      return knownContracts[address.toLowerCase()];
    }
    
    // In a production app, you would query a smart contract registry or API
    // For now, we'll check if it's a reported scam in our own contract
    try {
      const isScam = await contractService.isScamAddress(address);
      if (isScam) {
        return "Reported Scam Contract";
      }
    } catch (err) {
      console.error("Error checking scam status:", err);
    }
    
    return "Unknown Contract";
  };

  // Get risk score for an address
  const getRiskScore = async (address: string): Promise<number> => {
    try {
      // First check our own contract's scam score
      const contractScore = await contractService.getScamScore(address);
      if (contractScore > 0) {
        return contractScore;
      }
      
      // If no score in our contract, use heuristics based on address characteristics
      // (In a production app, you would use a real threat intelligence API)
      if (address.includes('DEAD') || address.includes('0000')) {
        return Math.floor(Math.random() * 20) + 60; // Higher risk for suspicious patterns
      }
      
      // Known trusted contracts get low scores
      if (knownContracts[address.toLowerCase()]) {
        return Math.floor(Math.random() * 10) + 1; // 1-10 risk score
      }
      
      // Default moderate risk for unknown contracts
      return Math.floor(Math.random() * 30) + 15;
    } catch (err) {
      console.error("Error getting risk score:", err);
      return 50; // Default to moderate risk on error
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialScans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In a production app, you would fetch real security scan results
        // from your backend or a blockchain security API
        
        // For now, we'll use a mix of real data and simulation:
        // 1. Get recent reports from our contract
        const reports = await contractService.getScamReports();
        const initialScans: ScanResult[] = [];
        
        // 2. Convert max 3 reports to scan results
        const reportsToUse = reports.slice(0, 3);
        for (let i = 0; i < reportsToUse.length; i++) {
          const report = reportsToUse[i];
          const score = await contractService.getScamScore(report.suspiciousAddress);
          
          initialScans.push({
            id: report.id,
            contract: report.suspiciousAddress,
            name: report.description || await getContractName(report.suspiciousAddress),
            status: score > 70 ? 'danger' : score > 30 ? 'warning' : 'safe',
            timestamp: new Date(report.timestamp).toLocaleString(),
            riskScore: score
          });
        }
        
        // 3. Add some known safe contracts to complete the list
        const safeContracts = [
          '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token
          '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
          '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'  // WBTC
        ];
        
        for (let j = 0; initialScans.length < 3 && j < safeContracts.length; j++) {
          const contractAddress = safeContracts[j];
          const name = await getContractName(contractAddress);
          const score = await getRiskScore(contractAddress);
          
          initialScans.push({
            id: Date.now() + j,
            contract: contractAddress,
            name,
            status: 'safe',
            timestamp: `${Math.floor(Math.random() * 10) + 1} min ago`,
            riskScore: score
          });
        }
        
        setRecentScans(initialScans);
      } catch (err: any) {
        console.error("Error loading threat monitor data:", err);
        setError(err.message || "Failed to load security data");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (walletConnector.address && walletConnector.provider) {
      loadInitialScans();
    } else {
      // Not connected, use simulation only
      setIsLoading(false);
    }
  }, [walletConnector.address]);
  
  // Simulate real-time scanning activity
  useEffect(() => {
    if (!walletConnector.address) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new scan
        const scanContract = async () => {
          try {
            setIsScanning(true);
          
            // Generate a random address or use a known one occasionally
            const useKnownContract = Math.random() > 0.8;
            let contractAddress = '';
            
            if (useKnownContract) {
              const knownAddresses = Object.keys(knownContracts);
              contractAddress = knownAddresses[Math.floor(Math.random() * knownAddresses.length)];
            } else {
              contractAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
            }
            
            // Get contract details
            const name = await getContractName(contractAddress);
            const riskScore = await getRiskScore(contractAddress);
            const status = riskScore > 70 ? 'danger' : riskScore > 30 ? 'warning' : 'safe';
            
            const newScan: ScanResult = {
              id: Date.now(),
              contract: contractAddress,
              name,
              status,
              timestamp: 'Just now',
              riskScore
            };

            setRecentScans(prev => [newScan, ...prev.slice(0, 4)]);
            
            setTimeout(() => setIsScanning(false), 2000);
          } catch (err) {
            console.error("Error in scan simulation:", err);
            setIsScanning(false);
          }
        };
        
        scanContract();
      }
    }, 12000); // Slightly longer interval for more realism

    return () => clearInterval(interval);
  }, [walletConnector.address]);

  // Add new scan when threat level changes to danger
  useEffect(() => {
    if (threatLevel === 'danger') {
      const scanDangerContract = async () => {
        try {
          // Generate a malicious-looking address
          const dangerAddress = '0xDEADBEEF01234567ABCDEF123456789MALICIOUS';
          
          // Get risk score (will be high due to our heuristics)
          const riskScore = await getRiskScore(dangerAddress);
          
          const dangerScan: ScanResult = {
            id: Date.now(),
            contract: dangerAddress,
            name: 'FakeAirdrop Contract',
            status: 'danger',
            timestamp: 'Just now',
            riskScore
          };

          setRecentScans(prev => [dangerScan, ...prev.slice(0, 4)]);
          setIsScanning(true);
          
          setTimeout(() => setIsScanning(false), 2000);
        } catch (err) {
          console.error("Error processing danger scan:", err);
        }
      };
      
      scanDangerContract();
    }
  }, [threatLevel]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'danger': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  // Enhanced scanning detection
  const startScanningAnimation = async (address: string) => {
    setIsScanning(true);
    
    // In a real implementation, this would be an actual scan
    // You could integrate with a third-party security API here
    
    setTimeout(() => setIsScanning(false), 2000);
    return true;
  };

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Shield className="h-5 w-5 text-cyan-400" />
          <span>Real-Time Threat Monitor</span>
          <div className="flex-1"></div>
          <Badge className={`${isScanning ? 'animate-pulse' : ''} bg-cyan-500/20 text-cyan-400 border-cyan-500/30`}>
            {isScanning ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Scanning...
              </>
            ) : (
              'AI Active'
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mr-2" />
            <p className="text-gray-400">Initializing security scanner...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-md">
            <p className="text-red-400">{error}</p>
          </div>
        ) : !walletConnector.address ? (
          <div className="text-center p-6">
            <p className="text-gray-400">Connect your wallet to activate real-time threat monitoring</p>
          </div>
        ) : recentScans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent scans</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentScans.map((scan) => (
              <div 
                key={scan.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  scan.status === 'danger' 
                    ? 'bg-red-500/10 border-red-500/30 animate-pulse' 
                    : scan.status === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(scan.status)}
                  <div>
                    <div className="text-white font-medium">{scan.name}</div>
                    <div className="text-sm text-gray-400 font-mono">
                      {shortenAddress(scan.contract)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{scan.timestamp}</div>
                    <div className={`text-xs ${scan.riskScore > 50 ? 'text-red-400' : scan.riskScore > 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                      Risk: {scan.riskScore}%
                    </div>
                  </div>
                  <Badge className={getStatusColor(scan.status)}>
                    {scan.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThreatMonitor;
