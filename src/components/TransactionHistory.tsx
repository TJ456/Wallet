
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, ArrowUpRight, ArrowDownLeft, Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TransactionHistory = () => {
  const transactions = [
    {
      id: 1,
      type: 'send',
      amount: '0.5 ETH',
      to: '0x742d35Cc...8d098d6',
      status: 'safe',
      hash: '0x8f4b7c1a2d3e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e',
      timestamp: '10 min ago',
      gasUsed: '21,000'
    },
    {
      id: 2,
      type: 'receive',
      amount: '100 USDC',
      from: '0x1f9840a8...c4201F984',
      status: 'safe',
      hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
      timestamp: '1 hour ago',
      gasUsed: '45,000'
    },
    {
      id: 3,
      type: 'approve',
      amount: 'Unlimited SHIB',
      to: '0xDEADBEEF...MALICIOUS',
      status: 'blocked',
      hash: null,
      timestamp: '2 hours ago',
      gasUsed: 'N/A',
      reason: 'Detected unlimited approval to suspicious contract'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Shield className="h-4 w-4 text-green-500" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="h-4 w-4 text-orange-400" />;
      case 'receive': return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
      case 'approve': return <Shield className="h-4 w-4 text-blue-400" />;
      default: return <History className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'blocked': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <History className="h-5 w-5 text-cyan-400" />
          <span>Transaction History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(tx.type)}
                  {getStatusIcon(tx.status)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium capitalize">{tx.type}</span>
                    <span className="text-cyan-400 font-mono">{tx.amount}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {tx.type === 'send' || tx.type === 'approve' ? `To: ${tx.to}` : `From: ${tx.from}`}
                  </div>
                  {tx.reason && (
                    <div className="text-xs text-red-400 mt-1">{tx.reason}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm text-gray-400">{tx.timestamp}</div>
                  <div className="text-xs text-gray-500">Gas: {tx.gasUsed}</div>
                </div>
                <Badge className={getStatusColor(tx.status)}>
                  {tx.status === 'safe' ? '🟢' : tx.status === 'blocked' ? '🔴' : '🟠'} {tx.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
