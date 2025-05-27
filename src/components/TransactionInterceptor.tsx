
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, X, ExternalLink, Zap, Brain } from 'lucide-react';

interface TransactionInterceptorProps {
  onClose: () => void;
  onBlock: () => void;
}

const TransactionInterceptor: React.FC<TransactionInterceptorProps> = ({ onClose, onBlock }) => {
  const threatDetails = {
    contract: '0xSCAM1234567890ABCDEF1234567890ABCDEF1234',
    contractName: 'FakeAirdrop Contract',
    riskScore: 95,
    category: 'Token Drainer',
    anomalies: [
      'Contract not verified on Etherscan',
      'Unlimited token approval requested',
      'Signature matches known scam pattern',
      'Recent reports of fund drainage',
      'Contract deployed less than 24 hours ago'
    ],
    aiAnalysis: 'High confidence prediction: This contract exhibits multiple red flags consistent with known drainer patterns. The AI model detected similarities to 847 previously confirmed malicious contracts.'
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-2xl bg-black/90 backdrop-blur-lg border-red-500/30 border-2 animate-scale-in">
        <CardHeader className="border-b border-red-500/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-white">
              <div className="relative">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <span>🚨 THREAT DETECTED</span>
            </CardTitle>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-red-400 text-sm">
            Our AI has detected a high-risk transaction. Review the details below.
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Risk Score */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-red-500" />
              <div>
                <div className="text-white font-semibold">AI Risk Assessment</div>
                <div className="text-sm text-gray-400">Machine Learning Confidence</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-500">{threatDetails.riskScore}%</div>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                EXTREMELY HIGH RISK
              </Badge>
            </div>
          </div>

          {/* Contract Details */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <span>Contract Information</span>
            </h3>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Contract Name</div>
                  <div className="text-white font-medium">{threatDetails.contractName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Category</div>
                  <Badge className="bg-red-500/20 text-red-400">{threatDetails.category}</Badge>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-1">Address</div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-white bg-black/30 p-2 rounded flex-1 break-all">
                    {threatDetails.contract}
                  </span>
                  <Button size="sm" variant="outline" className="border-white/20 shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Anomalies */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>Detected Anomalies</span>
            </h3>
            
            <div className="space-y-2">
              {threatDetails.anomalies.map((anomaly, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-white text-sm">{anomaly}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span>AI Analysis</span>
            </h3>
            
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-white text-sm leading-relaxed">{threatDetails.aiAnalysis}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Viewing full report...');
                // Could open a detailed report modal
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Shield className="h-4 w-4 mr-2" />
              View Full Report
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                onClick={onClose}
                className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
              >
                Sign Anyway
              </Button>
              <Button 
                onClick={onBlock}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                🛑 Block Transaction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionInterceptor;
