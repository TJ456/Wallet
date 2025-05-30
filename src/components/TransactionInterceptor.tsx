import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, X, ExternalLink, Zap, Brain, Heart } from 'lucide-react';
import { ethers } from 'ethers';

interface TransactionInterceptorProps {
  onClose: () => void;
  onBlock: () => void;
  toAddress: string;
  fromAddress: string;
  value: number;
  gasPrice: number;
}

interface MLResponse {
  prediction: number;
  risk_score: number;
  features: number[];
}

const isContractAddress = async (address: string): Promise<boolean> => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const code = await provider.getCode(address);
    // If address has code, it's a contract
    return code !== '0x';
  } catch {
    // If there's an error, assume it's not a contract
    return false;
  }
};

const TransactionInterceptor: React.FC<TransactionInterceptorProps> = ({ 
  onClose, 
  onBlock, 
  toAddress,
  fromAddress,
  value,
  gasPrice 
}) => {
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<string[]>(() => {
    const saved = localStorage.getItem('whitelisted-addresses');
    return saved ? JSON.parse(saved) : [];
  });

  const [mlResponse, setMlResponse] = useState<MLResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAddressWhitelisted = whitelistedAddresses.includes(toAddress);

  const addToWhitelist = () => {
    const newWhitelist = [...whitelistedAddresses, toAddress];
    setWhitelistedAddresses(newWhitelist);
    localStorage.setItem('whitelisted-addresses', JSON.stringify(newWhitelist));
    onClose();
  };
  useEffect(() => {
    const checkTransaction = async () => {
      try {
        // Prepare features array with real transaction data
        const features = [
          gasPrice,             // gas_price
          value,               // transaction_value
          isAddressWhitelisted ? 1 : 0, // trusted address
          await isContractAddress(toAddress) ? 1 : 0, // is_contract
          0,                   // remaining features, could be enhanced with historical data
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ];

        const transactionData = {
          from_address: fromAddress,
          to_address: toAddress,
          transaction_value: value,
          gas_price: gasPrice,
          is_contract_interaction: await isContractAddress(toAddress),
          acc_holder: fromAddress,
          features
        };        const response = await fetch('https://fraud-transaction-detection-uaxt.onrender.com/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionData)
        });

        // Handle different error cases specifically
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 503 || response.status === 504) {
            throw new Error('ML service is temporarily unavailable. Please try again in a few moments.');
          } else if (response.status === 400) {
            throw new Error('Invalid transaction data: ' + errorText);
          } else {
            throw new Error('ML service error: ' + errorText);
          }
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          throw new Error('Invalid response from ML service');
        }

        if (!data || data.risk_score === undefined) {
          throw new Error('Invalid response format from ML service');
        }

        setMlResponse(data);      } catch (err) {
        console.error('Transaction check error:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred while checking the transaction');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkTransaction();
  }, [fromAddress, toAddress, value, gasPrice]);

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

  // Get whitelisted addresses from local storage
  useEffect(() => {
    const loadWhitelist = () => {
      try {
        const whitelist = localStorage.getItem('whitelisted-addresses');
        if (whitelist) {
          setWhitelistedAddresses(JSON.parse(whitelist));
        }
      } catch (error) {
        console.error('Error loading whitelist:', error);
      }
    };
    loadWhitelist();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md bg-black/90 backdrop-blur-lg border-yellow-500/30 border-2">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Analyzing transaction with ML model...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md bg-black/90 backdrop-blur-lg border-red-500/30 border-2">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-white">Failed to analyze transaction: {error}</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskScore = mlResponse ? mlResponse.risk_score * 100 : 0;
  const riskLevel = riskScore > 75 ? 'High' : riskScore > 50 ? 'Medium' : 'Low';
  
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
              <span>🚨 RISK ASSESSMENT</span>
            </CardTitle>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-red-400 text-sm">
            Transaction analysis completed. Review the details below.
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {isAddressWhitelisted && (
            <div className="flex items-center p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
              <Heart className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <div className="text-green-400 font-semibold">Whitelisted Address</div>
                <div className="text-sm text-gray-400">This address is in your trusted contacts</div>
              </div>
            </div>
          )}

          {/* Risk Score */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-red-500" />
              <div>
                <div className="text-white font-semibold">ML Risk Assessment</div>
                <div className="text-sm text-gray-400">Transaction Risk Level</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-500">{riskScore.toFixed(1)}%</div>
              <Badge className={`bg-${riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'yellow' : 'green'}-500/20 text-${riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'yellow' : 'green'}-400`}>
                {riskLevel} RISK
              </Badge>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <span>Transaction Details</span>
            </h3>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-sm text-gray-400">To Address</div>
                  <div className="font-mono text-sm text-white bg-black/30 p-2 rounded break-all">
                    {toAddress}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Value</div>
                  <div className="text-white font-medium">{value} ETH</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Gas Price</div>
                  <div className="text-white font-medium">{gasPrice} Gwei</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {!isAddressWhitelisted && (
              <Button 
                variant="outline" 
                onClick={addToWhitelist}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Heart className="h-4 w-4 mr-2" />
                Trust this Address
              </Button>
            )}
            
            <div className="flex items-center space-x-3 ml-auto">
              <Button 
                variant="outline"
                onClick={onClose}
                className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
              >
                Sign Anyway
              </Button>
              {!isAddressWhitelisted && riskLevel === 'High' && (
                <Button 
                  onClick={onBlock}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  🛑 Block Transaction
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionInterceptor;
