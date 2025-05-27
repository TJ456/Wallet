
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Activity, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [recentScans, setRecentScans] = useState<ScanResult[]>([
    {
      id: 1,
      contract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      name: 'Uniswap Token',
      status: 'safe',
      timestamp: '2 min ago',
      riskScore: 5
    },
    {
      id: 2,
      contract: '0xA0b86a33E6417aF9B4a0d6F6aC4E4B6F9D6E2345',
      name: 'Unknown Contract',
      status: 'danger',
      timestamp: '5 min ago',
      riskScore: 95
    },
    {
      id: 3,
      contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      name: 'Tether USD',
      status: 'safe',
      timestamp: '8 min ago',
      riskScore: 2
    }
  ]);

  const [isScanning, setIsScanning] = useState(false);

  // Simulate real-time scanning activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new scan
        const newScan: ScanResult = {
          id: Date.now(),
          contract: `0x${Math.random().toString(16).substring(2, 42)}`,
          name: ['SafeToken', 'DEX Router', 'NFT Contract', 'Staking Pool', 'Bridge Contract'][Math.floor(Math.random() * 5)],
          status: Math.random() > 0.8 ? 'warning' : 'safe',
          timestamp: 'Just now',
          riskScore: Math.floor(Math.random() * 20) + (Math.random() > 0.9 ? 70 : 0)
        };

        setRecentScans(prev => [newScan, ...prev.slice(0, 4)]);
        setIsScanning(true);
        
        setTimeout(() => setIsScanning(false), 2000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Add new scan when threat level changes to danger
  useEffect(() => {
    if (threatLevel === 'danger') {
      const dangerScan: ScanResult = {
        id: Date.now(),
        contract: '0xSCAM1234567890ABCDEF1234567890ABCDEF1234',
        name: 'FakeAirdrop Contract',
        status: 'danger',
        timestamp: 'Just now',
        riskScore: 95
      };

      setRecentScans(prev => [dangerScan, ...prev.slice(0, 4)]);
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
                    {scan.contract.slice(0, 10)}...{scan.contract.slice(-8)}
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
        
        {recentScans.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent scans</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThreatMonitor;
