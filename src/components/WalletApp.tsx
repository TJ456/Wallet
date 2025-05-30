// WalletApp Component - Main UI for Web3 Functionality
// Handles wallet connection, transfers, and security features

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import walletConnector from '@/web3/wallet';
import contractService from '@/web3/contract';
import { shortenAddress, isValidAddress, formatEth } from '@/web3/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reportScam, voteOnProposal, sendTransaction } from '@/web3/contract';

interface WalletAppProps {
  onAddressChanged?: (address: string | null) => void;
}

const WalletApp: React.FC<WalletAppProps> = ({ onAddressChanged }) => {
  // State for wallet connection
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for transfers
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // State for security checks
  const [isSafe, setIsSafe] = useState<boolean>(true);
  const [scamScore, setScamScore] = useState<number>(0);
  
  // State for scam reporting
  const [scamAddress, setScamAddress] = useState<string>('');
  const [scamReason, setScamReason] = useState<string>('');
  const [isReporting, setIsReporting] = useState<boolean>(false);
  
  // State for voting
  const [proposalId, setProposalId] = useState<string>('');
  const [voteSupport, setVoteSupport] = useState<boolean>(true);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  
  // Connect wallet on component mount if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (walletConnector.isMetaMaskInstalled() && walletConnector.address) {
        try {
          setIsConnecting(true);
          await walletConnector.connect();
          setAddress(walletConnector.address);
          await updateBalance();
          if (onAddressChanged) onAddressChanged(walletConnector.address);
        } catch (err: any) {
          console.error("Connection error:", err);
          setError(err.message);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    checkConnection();
    
    // Listen for wallet events
    window.addEventListener('wallet_disconnected', handleDisconnect);
    window.addEventListener('wallet_accountChanged', handleAccountChange);
    
    return () => {
      window.removeEventListener('wallet_disconnected', handleDisconnect);
      window.removeEventListener('wallet_accountChanged', handleAccountChange);
    };
  }, [onAddressChanged]);
  
  // Handle wallet connect button click
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const connectedAddress = await walletConnector.connect();
      setAddress(connectedAddress);
      await updateBalance();
      
      if (onAddressChanged) onAddressChanged(connectedAddress);
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle wallet disconnect
  const handleDisconnect = () => {
    walletConnector.disconnect();
    setAddress(null);
    setBalance('0');
    if (onAddressChanged) onAddressChanged(null);
  };
  
  // Handle account change event
  const handleAccountChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    const newAddress = customEvent.detail?.address;
    setAddress(newAddress);
    updateBalance();
    if (onAddressChanged) onAddressChanged(newAddress);
  };
  
  // Update ETH balance
  const updateBalance = async () => {
    if (walletConnector.address) {
      try {
        const newBalance = await walletConnector.getBalance();
        setBalance(newBalance);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    }
  };
  
  // Check if recipient address is safe (not reported as scam)
  const checkRecipientSafety = async (address: string) => {
    if (isValidAddress(address)) {
      try {
        const isScam = await contractService.isScamAddress(address);
        const score = await contractService.getScamScore(address);
        
        setIsSafe(!isScam);
        setScamScore(score);
      } catch (err) {
        console.error("Error checking address safety:", err);
        // Default to safe if can't check
        setIsSafe(true);
        setScamScore(0);
      }
    } else {
      // Invalid address format, no need to check
      setIsSafe(true);
      setScamScore(0);
    }
  };
  
  // Handle recipient input change
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRecipient = e.target.value;
    setRecipient(newRecipient);
    
    // Check safety if address looks valid
    if (newRecipient.length > 30) {
      checkRecipientSafety(newRecipient);
    } else {
      setIsSafe(true);
      setScamScore(0);
    }
  };
  
  // Handle send transaction
  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !isValidAddress(recipient) || !amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid recipient address and amount");
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      
      // Check recipient safety one more time before sending
      await checkRecipientSafety(recipient);
      
      if (!isSafe && scamScore > 50) {
        if (!window.confirm(`WARNING: This address has been reported as potentially unsafe (Scam score: ${scamScore}/100). Do you still want to proceed?`)) {
          setIsSending(false);
          return;
        }
      }
        // Check if user has enough balance before sending
      const hasBalance = await contractService.hasEnoughBalance(amount);
      if (!hasBalance) {
        throw new Error("Insufficient balance for this transaction (including gas)");
      }
      
      // Use the standalone function for secure transfer
      const hash = await sendTransaction(recipient, amount);
      setTxHash(hash);
      
      // Clear form and update balance
      setRecipient('');
      setAmount('');
      
      // Set a timeout to clear the transaction hash display after a few seconds
      setTimeout(() => setTxHash(null), 5000);
      
      await updateBalance();
    } catch (err: any) {      console.error("Transaction error:", err);
      if (err.code === 4001 || err.message?.includes('user rejected')) {
        setError('Transaction cancelled');
        toast({
          title: "Transaction Cancelled",
          description: "The transaction was cancelled",
          variant: "default"
        });
      } else {
        setError(err.message);
      }
    } finally {
      setIsSending(false);
    }
  };
    // Handle report scam submission
  const handleReportScam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !isValidAddress(scamAddress) || !scamReason) {
      setError("Please enter a valid address and reason");
      return;
    }
    
    try {
      setIsReporting(true);
      setError(null);
      
      // First verify contract is valid
      const isContractValid = await contractService.verifyContract();
      if (!isContractValid) {
        throw new Error("Cannot connect to the contract. Please check your network connection.");
      }
      
      const hash = await reportScam(scamAddress, scamReason);
      setTxHash(hash);
      
      // Clear form
      setScamAddress('');
      setScamReason('');
      
      // Set success message
      setTimeout(() => setTxHash(null), 5000);
    } catch (err: any) {
      console.error("Report error:", err);
      setError(err.message);
    } finally {
      setIsReporting(false);
    }
  };
    // Handle vote submission
  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !proposalId) {
      setError("Please enter a valid proposal ID");
      return;
    }
    
    try {
      setIsVoting(true);
      setError(null);
      
      // First verify contract is valid
      const isContractValid = await contractService.verifyContract();
      if (!isContractValid) {
        throw new Error("Cannot connect to the contract. Please check your network connection.");
      }
      
      // Show confirmation dialog
      if (!window.confirm(`Are you sure you want to vote ${voteSupport ? 'IN SUPPORT OF' : 'AGAINST'} proposal ${proposalId}?`)) {
        setIsVoting(false);
        return;
      }
      
      const hash = await voteOnProposal(proposalId, voteSupport);
      setTxHash(hash);
      
      // Clear form
      setProposalId('');
      
      // Set success message
      setTimeout(() => setTxHash(null), 5000);
    } catch (err: any) {
      console.error("Vote error:", err);
      setError(err.message);
    } finally {
      setIsVoting(false);
    }
  };

  // Render safety warning badge
  const renderSafetyBadge = () => {
    if (!recipient || recipient.length < 30) return null;
    
    if (!isValidAddress(recipient)) {
      return <Badge variant="outline" className="bg-yellow-100">Invalid Address</Badge>;
    }
    
    if (!isSafe) {
      return <Badge variant="destructive">Reported as Unsafe!</Badge>;
    }
    
    if (scamScore > 30) {
      return <Badge variant="secondary" className="bg-yellow-100">Caution: Score {scamScore}/100</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100">Address Looks Safe</Badge>;
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Unhackable Wallet</CardTitle>
        <CardDescription>Secure Ethereum transactions with scam protection</CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!address ? (
          <Button 
            onClick={handleConnect} 
            className="w-full" 
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 p-3 bg-secondary rounded-lg">
              <div>
                <p className="text-sm font-medium">Connected Address</p>
                <p className="font-mono">{shortenAddress(address)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Balance</p>
                <p>{parseFloat(balance).toFixed(4)} ETH</p>
              </div>
            </div>
            
            <Tabs defaultValue="send" className="mt-4">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="send">Send</TabsTrigger>
                <TabsTrigger value="report">Report</TabsTrigger>
                <TabsTrigger value="vote">Vote</TabsTrigger>
              </TabsList>
              
              <TabsContent value="send">
                <form onSubmit={handleSendTransaction}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient Address</Label>
                      <Input
                        id="recipient"
                        placeholder="0x..."
                        value={recipient}
                        onChange={handleRecipientChange}
                        required
                      />
                      <div className="h-6">{renderSafetyBadge()}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (ETH)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSending}
                    >
                      {isSending ? "Sending..." : "Send Transaction"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="report">
                <form onSubmit={handleReportScam}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scamAddress">Scammer Address</Label>
                      <Input
                        id="scamAddress"
                        placeholder="0x..."
                        value={scamAddress}
                        onChange={(e) => setScamAddress(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="scamReason">Reason</Label>
                      <Input
                        id="scamReason"
                        placeholder="Describe the scam..."
                        value={scamReason}
                        onChange={(e) => setScamReason(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isReporting}
                    >
                      {isReporting ? "Reporting..." : "Report Scammer"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="vote">
                <form onSubmit={handleVote}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="proposalId">Proposal ID</Label>
                      <Input
                        id="proposalId"
                        placeholder="Proposal ID or Hash"
                        value={proposalId}
                        onChange={(e) => setProposalId(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Button 
                        type="button" 
                        variant={voteSupport ? "default" : "outline"}
                        onClick={() => setVoteSupport(true)}
                        className="flex-1"
                      >
                        Support
                      </Button>
                      <Button 
                        type="button" 
                        variant={!voteSupport ? "default" : "outline"}
                        onClick={() => setVoteSupport(false)}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isVoting}
                    >
                      {isVoting ? "Voting..." : "Submit Vote"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
            
            {txHash && (
              <p className="text-sm text-center mt-4">
                Transaction submitted: {shortenAddress(txHash, 6)}
              </p>
            )}
          </>
        )}
      </CardContent>
      
      {address && (
        <CardFooter className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default WalletApp;
