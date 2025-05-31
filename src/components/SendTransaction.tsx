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
  };  // Check if transaction might be fraudulent using ML API
  const checkForFraud = async (): Promise<boolean> => {
    try {
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
        is_contract_interaction: false, // We'll check this with isContractAddress in the interceptor
        acc_holder: fromAddress,
        features: new Array(18).fill(0) // Initialize with 18 zeros
      };

      // Set transaction value and gas price in features array
      transactionData.features[1] = parseFloat(gasPrice);  // gas_price
      transactionData.features[0] = parseFloat(amount);    // transaction_value
        try {
        console.log("Starting ML risk assessment using external API only");
        console.log("Transaction data being sent:", transactionData);

        // Use ONLY the external ML API endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn("ML API request timed out after 20 seconds");
        }, 20000); // 20 second timeout

        const response = await fetch('https://fraud-transaction-detection-uaxt.onrender.com/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("ML API error:", response.status, errorText);
          throw new Error(`ML API returned status ${response.status}: ${errorText}`);
        }

        const fraudResult = await response.json();
        console.log("ML API response received:", fraudResult);

        // Convert the API response to our expected format
        const normalizedResult = {
          prediction: fraudResult.prediction,
          risk_score: fraudResult.prediction === "Fraud" ? 0.8 : 0.2, // Convert string to numeric score
          risk_level: fraudResult.prediction === "Fraud" ? "HIGH" : "LOW",
          type: fraudResult.Type,
          explanation: `ML Assessment: ${fraudResult.Type}`
        };

        // Store the fraud data for the modal
        setFraudData({...normalizedResult, ...transactionData});

        // Check if fraud is detected based on prediction
        if (fraudResult.prediction === "Fraud") {
          console.log("Fraud detected by ML API:", fraudResult.prediction);
          setShowFraudWarning(true);
          if (onFraudDetected) {
            onFraudDetected({...normalizedResult, ...transactionData});
          }
          return true; // Fraud detected
        }

        // Transaction appears safe
        console.log("Transaction appears safe:", fraudResult.prediction);
        return false; // No fraud detected

      } catch (err: any) {
        console.error("ML API request failed:", err);

        if (err.name === 'AbortError') {
          throw new Error('ML risk assessment timed out');
        }

        throw new Error(`ML risk assessment failed: ${err.message}`);
      }
    } catch (err: any) {
      console.error('Error checking for fraud:', err);
      setError('Failed to check transaction risk: ' + err.message);
      return false;
    }
  };
  // Handle transaction submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

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
      setLoading(true);
      setError("Checking transaction security with ML API... This may take a moment.");

      // Update UI immediately to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create a promise that resolves when the risk assessment is complete
      // The checkForFraud function now has its own internal timeout handling
      const startTime = Date.now();
      console.log("Starting ML risk assessment process at", new Date().toISOString());
        // Master timeout to ensure we don't block for too long (25 seconds max)
      const masterTimeoutPromise = new Promise<boolean | 'TIMEOUT'>((resolve) => {
        setTimeout(() => {
          const duration = (Date.now() - startTime) / 1000;
          console.warn(`Master timeout reached after ${duration.toFixed(1)}s - BLOCKING transaction for security`);

          // Set error message for timeout
          setError("ML risk assessment process timed out. Transaction blocked for your protection.");

          // Log the timeout incident
          if (fraudData) {
            const cautionData = {...fraudData, timeout: true, riskLevel: "HIGH"};
            if (onFraudDetected) {
              onFraudDetected(cautionData);
            }
          }

          resolve('TIMEOUT'); // Return special timeout value to block transaction
        }, 25000); // 25 second master timeout as absolute maximum wait
      });

      // Wait for either the fraud check to complete or master timeout
      const assessmentResult = await Promise.race([checkForFraud(), masterTimeoutPromise]);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`ML risk assessment completed in ${duration.toFixed(1)}s, result: ${assessmentResult}`);

      // CRITICAL SECURITY CHECK: If ML assessment timed out, BLOCK transaction
      if (assessmentResult === 'TIMEOUT') {
        console.warn("ML assessment timed out - BLOCKING transaction for security");
        setLoading(false);
        setError("Security assessment failed. Transaction blocked for your protection. Please try again or contact support if this persists.");
        return; // STOP - Do not proceed with transaction
      }

      // If fraud detection shows a warning, stop here (the modal will be shown)
      if (assessmentResult === true) {
        console.log("Fraud detected, showing warning");
        setLoading(false); // Stop loading since we're not proceeding
        return; // Don't continue with transaction - modal will be shown
      }

      // Clear any non-critical errors
      setError(null);

      // Add small delay before transaction to ensure UI updates properly
      await new Promise(resolve => setTimeout(resolve, 200));

      // Now send the transaction - this happens ONLY after successful ML assessment
      await sendTransaction();
    } catch (err: any) {
      console.error('Error sending transaction:', err);
      setError(err.message);
      setLoading(false);
    }
  };
    // Send the actual transaction
  const sendTransaction = async () => {
    setLoading(true);
    try {
      console.log("Starting transaction submission process");
      const signer = await getSigner();
      if (!signer) throw new Error('No wallet connected');

      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);

      // Get signer's address
      const from = await signer.getAddress();
      console.log(`Preparing transaction from ${from} to ${recipient}`);

      // Create transaction object with gas estimation
      const tx = {
        to: recipient,
        value: amountInWei,
        // Let MetaMask handle gas estimation by default
      };

      console.log("Waiting for user to confirm transaction in wallet");

      // Send transaction - this will prompt the user in MetaMask
      // The ML assessment has already run by this point - we're just executing the transaction
      const transaction = await signer.sendTransaction(tx);

      console.log("Transaction confirmed by user and submitted:", transaction.hash);

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
      if (err.code === 4001) { // User rejected transaction in MetaMask
        setError('Transaction was rejected by the user');
      } else {
        setError(err.message);
      }
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
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/logs'}
            type="button"
          >
            View Transaction Logs
          </Button>
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
          toAddress={recipient}
          fromAddress={fraudData.from_address || ''}
          value={parseFloat(amount)}
          gasPrice={parseFloat(gasPrice)}
        />
      )}
    </>
  );
};

export default SendTransaction;
