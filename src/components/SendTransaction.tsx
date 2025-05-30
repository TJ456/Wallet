import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getSigner } from '@/web3/wallet';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TransactionInterceptor from './TransactionInterceptor';

interface SendTransactionProps {
  onSuccess?: (txHash: string) => void;
  onFraudDetected?: (fraudData: any) => void;
}

const SendTransaction: React.FC<SendTransactionProps> = ({ onSuccess, onFraudDetected }) => {
  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasPrice, setGasPrice] = useState('20'); // Default gas price
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // ML fraud detection state
  const [showFraudWarning, setShowFraudWarning] = useState(false);
  const [fraudData, setFraudData] = useState<any>(null);
  
  // Handle recipient address change
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
  };
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };
  // Check if transaction might be fraudulent using ML API
  const checkForFraud = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError("Checking transaction security with ML API... This may take a moment.");
      
      // Get the current wallet address
      const signer = await getSigner();
      if (!signer) throw new Error('No wallet connected');
      const fromAddress = await signer.getAddress();
      
      // Prepare transaction data for ML API
      const transactionData = {
        from_address: fromAddress,
        to_address: recipient,
        transaction_value: parseFloat(amount),
        gas_price: parseFloat(gasPrice),
        is_contract_interaction: false,
        acc_holder: fromAddress,
        features: new Array(18).fill(0) // Initialize with 18 zeros
      };
      
      // Set transaction value and gas price in features array
      transactionData.features[13] = transactionData.transaction_value;
      transactionData.features[14] = transactionData.gas_price;
      
      // Call our API endpoint that communicates with the ML API
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to check transaction risk');
      }
      
      const fraudResult = await response.json();
        // Handle timeout case
      if (fraudResult.timeout) {
        setError(`Warning: ML fraud detection timed out. You can still proceed but with caution.`);
        return false;
      }
      
      // If fraud is detected, show warning
      if (fraudResult.prediction === 'Fraud' || fraudResult.risk_score > 0.7) {
        setFraudData(fraudResult);
        setShowFraudWarning(true);
        if (onFraudDetected) {
          onFraudDetected(fraudResult);
        }
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error checking for fraud:', err);
      setError('Failed to check transaction risk: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle transaction submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Form validation
    if (!recipient || !ethers.isAddress(recipient)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      // First check for fraud
      const isFraudulent = await checkForFraud();
      if (isFraudulent) {
        // Fraud warning is shown, don't proceed automatically
        return;
      }
      
      // Now send the transaction
      await sendTransaction();
    } catch (err: any) {
      console.error('Error sending transaction:', err);
      setError(err.message);
    }
  };
  
  // Send the actual transaction
  const sendTransaction = async () => {
    setLoading(true);
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No wallet connected');
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);
      
      // Create transaction object
      const tx = {
        to: recipient,
        value: amountInWei
      };
      
      // Send transaction
      const transaction = await signer.sendTransaction(tx);
      
      // Wait for transaction to be mined
      setSuccess(`Transaction sent! Hash: ${transaction.hash}`);
      
      // Clear form
      setRecipient('');
      setAmount('');
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess(transaction.hash);
      }
    } catch (err: any) {
      console.error('Error sending transaction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle proceed anyway after fraud warning
  const handleProceedAnyway = () => {
    setShowFraudWarning(false);
    sendTransaction();
  };
  
  // Handle block transaction after fraud warning
  const handleBlockTransaction = () => {
    setShowFraudWarning(false);
    setError('Transaction cancelled due to high fraud risk');
  };
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Send Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={handleRecipientChange}
                required
              />
            </div>
            
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.0"
                value={amount}
                onChange={handleAmountChange}
                required
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Send Tokens
          </Button>
        </CardFooter>
      </Card>
      
      {/* Fraud warning modal */}
      {showFraudWarning && fraudData && (
        <TransactionInterceptor 
          onClose={handleProceedAnyway} 
          onBlock={handleBlockTransaction} 
        />
      )}
    </>
  );
};

export default SendTransaction;
