
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  isConnected: boolean;
  address: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, isConnected, address }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection
      setTimeout(() => {
        const mockAddress = '0x742d35Cc6531C0532925a3b8D098d6';
        onConnect(mockAddress);
        setIsConnecting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsConnecting(false);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          Connected
        </Badge>
        <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <Wallet className="h-4 w-4 text-cyan-400" />
          <span className="text-white font-mono text-sm">{truncateAddress(address)}</span>
          <button 
            onClick={copyAddress}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button 
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
    >
      <Wallet className="h-4 w-4 mr-2" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletConnect;
