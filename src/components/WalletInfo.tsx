// WalletInfo Component
// Displays wallet address and balance information with clean, minimal UI

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Copy, ExternalLink, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import walletConnector from '@/web3/wallet';
import { shortenAddress, formatEth } from '@/web3/utils';

interface WalletInfoProps {
  className?: string;
  showFullAddress?: boolean;
  showNetworkInfo?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const WalletInfo: React.FC<WalletInfoProps> = ({
  className,
  showFullAddress = false,
  showNetworkInfo = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFullAddr, setShowFullAddr] = useState(showFullAddress);
  const [networkName, setNetworkName] = useState<string | null>(null);

  const { toast } = useToast();

  // Get wallet info
  const address = walletConnector.address;
  const isConnected = !!address;

  // Load balance
  const loadBalance = async () => {
    if (!isConnected) {
      setBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      const bal = await walletConnector.getBalance();
      setBalance(bal);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading balance:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet balance",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Load network info
  const loadNetworkInfo = () => {
    if (walletConnector.chainId) {
      setNetworkName(walletConnector.getNetworkName(walletConnector.chainId));
    }
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
        variant: "default"
      });
    } catch (error) {
      console.error('Error copying address:', error);
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive"
      });
    }
  };

  // Open address in block explorer
  const openInExplorer = () => {
    if (!address) return;
    
    // Default to Etherscan, but could be made configurable based on network
    const explorerUrl = `https://etherscan.io/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  // Format balance for display
  const formatBalance = (bal: string | null): string => {
    if (!bal) return '0.0000';
    const num = parseFloat(bal);
    if (num === 0) return '0.0000';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  };

  // Get balance color based on amount
  const getBalanceColor = (bal: string | null): string => {
    if (!bal) return 'text-gray-400';
    const num = parseFloat(bal);
    if (num === 0) return 'text-gray-400';
    if (num < 0.01) return 'text-yellow-400';
    if (num < 0.1) return 'text-blue-400';
    return 'text-green-400';
  };

  // Load data on mount and when wallet connects
  useEffect(() => {
    if (isConnected) {
      loadBalance();
      loadNetworkInfo();
    } else {
      setBalance(null);
      setNetworkName(null);
      setLastUpdated(null);
    }
  }, [isConnected, address]);

  // Auto-refresh balance
  useEffect(() => {
    if (!autoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      loadBalance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, refreshInterval]);

  // Listen for wallet events
  useEffect(() => {
    const handleAccountChanged = () => {
      loadBalance();
      loadNetworkInfo();
    };

    const handleDisconnected = () => {
      setBalance(null);
      setNetworkName(null);
      setLastUpdated(null);
    };

    window.addEventListener('wallet_accountChanged', handleAccountChanged);
    window.addEventListener('wallet_disconnected', handleDisconnected);

    return () => {
      window.removeEventListener('wallet_accountChanged', handleAccountChanged);
      window.removeEventListener('wallet_disconnected', handleDisconnected);
    };
  }, []);

  if (!isConnected) {
    return (
      <Card className={`bg-black/20 backdrop-blur-lg border-white/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No wallet connected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-black/20 backdrop-blur-lg border-white/10 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-cyan-400" />
            Wallet Info
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadBalance}
            disabled={isLoadingBalance}
            className="text-gray-400 hover:text-white"
          >
            {isLoadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Address</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullAddr(!showFullAddr)}
              className="text-gray-400 hover:text-white p-1"
            >
              {showFullAddr ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-white font-mono text-sm bg-gray-800/50 px-3 py-2 rounded border border-gray-600">
              {showFullAddr ? address : shortenAddress(address)}
            </code>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="text-gray-400 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={openInExplorer}
              className="text-gray-400 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <span className="text-sm text-gray-400">Balance</span>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
                {formatBalance(balance)}
              </span>
              <span className="text-gray-400">ETH</span>
            </div>
            
            {balance && parseFloat(balance) > 0 && (
              <Badge variant="outline" className="text-xs">
                ${(parseFloat(balance) * 2000).toFixed(2)} USD
              </Badge>
            )}
          </div>
        </div>

        {/* Network Info */}
        {showNetworkInfo && networkName && (
          <div className="space-y-2">
            <span className="text-sm text-gray-400">Network</span>
            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
              {networkName}
            </Badge>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Low Balance Warning */}
        {balance && parseFloat(balance) < 0.01 && parseFloat(balance) > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-400 text-sm">Low balance - consider adding funds</span>
            </div>
          </div>
        )}

        {/* Zero Balance Warning */}
        {balance && parseFloat(balance) === 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-400 text-sm">No ETH available for transactions</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletInfo;
