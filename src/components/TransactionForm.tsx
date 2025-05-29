// TransactionForm Component with Integrated Scam Detection
// Handles secure transaction input, validation, and submission with real-time scam checking

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, AlertTriangle, Shield, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import walletConnector from '@/web3/wallet';
import contractService from '@/web3/contract';
import { isValidAddress, shortenAddress, formatEth } from '@/web3/utils';
import { parseUnits } from 'ethers';
import ApiErrorHandler from '@/components/ApiErrorHandler';
import { useApiGet, useApiPost } from '@/hooks/use-api';
import { debounce } from '@/utils/validation';

interface ScamCheckResult {
  address: string;
  scam_score: number;
  risk_level: string;
  is_confirmed_scammer: boolean;
  report_count: number;
}

interface TransactionFormProps {
  onTransactionComplete?: (txHash: string) => void;
  className?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onTransactionComplete,
  className
}) => {
  // Form state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Validation state
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Scam detection state
  const [isCheckingScam, setIsCheckingScam] = useState(false);
  const [scamResult, setScamResult] = useState<ScamCheckResult | null>(null);
  const [userConfirmedRisk, setUserConfirmedRisk] = useState(false);

  const { toast } = useToast();

  // Check if form is valid
  const isFormValid = recipientAddress &&
                     amount &&
                     !addressError &&
                     !amountError &&
                     !isCheckingScam &&
                     walletConnector.address;

  // Check if transaction is high risk and needs confirmation
  const isHighRisk = scamResult && (
    scamResult.scam_score > 70 ||
    scamResult.is_confirmed_scammer ||
    scamResult.risk_level === 'high'
  );

  const canSubmit = isFormValid && (!isHighRisk || userConfirmedRisk);

  // Validate Ethereum address
  useEffect(() => {
    if (!recipientAddress) {
      setAddressError(null);
      setScamResult(null);
      return;
    }

    if (!isValidAddress(recipientAddress)) {
      setAddressError('Invalid Ethereum address format');
      setScamResult(null);
      return;
    }

    if (recipientAddress.toLowerCase() === walletConnector.address?.toLowerCase()) {
      setAddressError('Cannot send to your own address');
      setScamResult(null);
      return;
    }

    setAddressError(null);

    // Check for scam if address is valid
    checkAddressForScam(recipientAddress);
  }, [recipientAddress]);

  // Validate amount
  useEffect(() => {
    if (!amount) {
      setAmountError(null);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Amount must be a positive number');
      return;
    }

    if (numAmount > 1000) {
      setAmountError('Amount seems unusually large. Please verify.');
      return;
    }

    setAmountError(null);
  }, [amount]);

  // Check address against scam database and AI firewall
  const checkAddressForScam = async (address: string) => {
    setIsCheckingScam(true);
    setUserConfirmedRisk(false);

    try {
      // Parallel checks: contract reports and AI firewall
      const [contractReports, aiFirewallResult] = await Promise.allSettled([
        // Check our contract for scam reports
        contractService.getScamReports(),
        // Check AI firewall for additional risk factors
        fetch('/api/firewall/check-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        }).then(res => res.ok ? res.json() : null)
      ]);

      // Process contract reports
      let contractScore = 0;
      let reportCount = 0;
      if (contractReports.status === 'fulfilled') {
        const addressReports = contractReports.value.filter(
          report => report.reportedAddress.toLowerCase() === address.toLowerCase()
        );
        reportCount = addressReports.length;
        contractScore = Math.min(reportCount * 20, 100); // 20 points per report, max 100
      }

      // Process AI firewall results
      let aiScore = 0;
      let aiRiskFactors: string[] = [];
      if (aiFirewallResult.status === 'fulfilled' && aiFirewallResult.value) {
        const aiData = aiFirewallResult.value;
        aiScore = aiData.risk_score || 0;
        aiRiskFactors = aiData.risk_factors || [];
      }

      // Combine scores (weighted average: 60% contract, 40% AI)
      const combinedScore = Math.round((contractScore * 0.6) + (aiScore * 0.4));
      const finalScore = Math.min(combinedScore, 100);

      // Determine risk level based on combined score
      let riskLevel = 'low';
      if (finalScore >= 70) riskLevel = 'high';
      else if (finalScore >= 30) riskLevel = 'medium';

      const isConfirmedScammer = contractScore >= 80 || finalScore >= 90;

      const result: ScamCheckResult = {
        address,
        scam_score: finalScore,
        risk_level: riskLevel,
        is_confirmed_scammer: isConfirmedScammer,
        report_count: reportCount
      };

      setScamResult(result);

      // Show appropriate warnings
      if (isConfirmedScammer) {
        toast({
          title: "🚨 High Risk Address Detected!",
          description: `This address has been flagged by our security systems. Score: ${finalScore}/100`,
          variant: "destructive"
        });
      } else if (finalScore >= 30) {
        toast({
          title: "⚠️ Suspicious Address",
          description: `Security check shows elevated risk. Score: ${finalScore}/100`,
          variant: "destructive"
        });
      }

      // Log the check for AI learning
      if (aiFirewallResult.status === 'fulfilled') {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'address_check',
            address,
            contract_score: contractScore,
            ai_score: aiScore,
            final_score: finalScore,
            risk_factors: aiRiskFactors
          })
        }).catch(console.error); // Silent fail for analytics
      }

    } catch (error) {
      console.error('Error checking address for scam:', error);
      // Fallback to basic validation
      setScamResult({
        address,
        scam_score: 0,
        risk_level: 'unknown',
        is_confirmed_scammer: false,
        report_count: 0
      });
    } finally {
      setIsCheckingScam(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    // Show confirmation for high-risk transactions
    if (isHighRisk && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!walletConnector.signer) {
        throw new Error('Wallet not connected');
      }

      // Pre-transaction AI firewall check
      const transactionData = {
        from: walletConnector.address,
        to: recipientAddress,
        value: amount,
        timestamp: Date.now()
      };

      // Call AI firewall for transaction analysis
      try {
        const firewallResponse = await fetch('/api/firewall/tx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        });

        if (firewallResponse.ok) {
          const firewallResult = await firewallResponse.json();

          // Check if AI firewall blocks the transaction
          if (firewallResult.blocked) {
            toast({
              title: "🛡️ Transaction Blocked",
              description: `AI Firewall: ${firewallResult.reason}`,
              variant: "destructive"
            });
            return;
          }

          // Show additional warnings if AI detects risks
          if (firewallResult.risk_score > 50) {
            toast({
              title: "⚠️ AI Risk Detection",
              description: `Additional risk factors detected. Proceed with caution.`,
              variant: "destructive"
            });
          }
        }
      } catch (firewallError) {
        console.warn('AI Firewall check failed, proceeding with transaction:', firewallError);
        // Continue with transaction if firewall is unavailable
      }

      // Convert amount to wei
      const amountWei = parseUnits(amount, 18);

      // Use secure transfer if available, otherwise fallback to regular transfer
      let tx;
      try {
        // Try using the secure transfer function from contract
        tx = await contractService.secureSendETH(recipientAddress, amount);
      } catch (contractError) {
        console.warn('Secure transfer failed, using regular transfer:', contractError);
        // Fallback to regular transfer
        tx = await walletConnector.signer.sendTransaction({
          to: recipientAddress,
          value: amountWei
        });
      }

      setTxHash(tx.hash);

      toast({
        title: "🚀 Transaction Sent!",
        description: `Transaction hash: ${tx.hash.slice(0, 10)}...`,
        variant: "default"
      });

      // Log transaction attempt for AI learning
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'transaction_sent',
          tx_hash: tx.hash,
          from: walletConnector.address,
          to: recipientAddress,
          amount,
          risk_score: scamResult?.scam_score || 0,
          user_confirmed_risk: userConfirmedRisk
        })
      }).catch(console.error); // Silent fail for analytics

      // Wait for confirmation
      await tx.wait();

      toast({
        title: "✅ Transaction Confirmed!",
        description: "Your transaction has been confirmed on the blockchain.",
        variant: "default"
      });

      // Log successful transaction
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'transaction_confirmed',
          tx_hash: tx.hash,
          from: walletConnector.address,
          to: recipientAddress,
          amount
        })
      }).catch(console.error);

      // Reset form
      setRecipientAddress('');
      setAmount('');
      setScamResult(null);
      setUserConfirmedRisk(false);
      setShowConfirmation(false);

      // Callback for parent component
      if (onTransactionComplete) {
        onTransactionComplete(tx.hash);
      }

    } catch (error: any) {
      console.error('Transaction error:', error);

      // Log failed transaction for analysis
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'transaction_failed',
          from: walletConnector.address,
          to: recipientAddress,
          amount,
          error: error.message,
          risk_score: scamResult?.scam_score || 0
        })
      }).catch(console.error);

      toast({
        title: "❌ Transaction Failed",
        description: error.message || "Transaction was rejected or failed",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get risk color for UI based on score (0-30: green, 31-70: yellow, 71-100: red)
  const getRiskColor = (score: number) => {
    if (score >= 71) return 'text-red-500 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-950 dark:border-red-800';
    if (score >= 31) return 'text-yellow-600 bg-yellow-100 border-yellow-300 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800';
    if (score >= 0) return 'text-green-600 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-950 dark:border-green-800';
    return 'text-gray-600 bg-gray-100 border-gray-300 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600';
  };

  // Get risk level text based on score
  const getRiskLevel = (score: number) => {
    if (score >= 71) return 'HIGH RISK';
    if (score >= 31) return 'MEDIUM RISK';
    if (score >= 0) return 'LOW RISK';
    return 'UNKNOWN';
  };

  // Get risk icon
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`bg-black/20 backdrop-blur-lg border-white/10 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Send className="mr-2 h-5 w-5 text-cyan-400" />
          Send Transaction
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Address Input */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-gray-300">
              Recipient Address
            </Label>
            <div className="relative">
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="bg-gray-800/50 border-gray-600 text-white"
                disabled={isSubmitting}
              />
              {isCheckingScam && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                </div>
              )}
            </div>

            {addressError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{addressError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Scam Detection Results */}
          {scamResult && !addressError && (
            <div className={`p-3 rounded-lg border ${getRiskColor(scamResult.scam_score)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getRiskIcon(scamResult.risk_level)}
                  <span className="font-medium">
                    Security Check: {getRiskLevel(scamResult.scam_score)}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Score: {scamResult.scam_score}/100
                </Badge>
              </div>

              {/* Risk Level Description */}
              <div className="mt-2 text-sm">
                {scamResult.scam_score >= 71 && (
                  <p className="font-medium">
                    🚨 High risk detected - This address shows multiple warning signs
                  </p>
                )}
                {scamResult.scam_score >= 31 && scamResult.scam_score < 71 && (
                  <p>
                    ⚠️ Medium risk - Exercise caution when sending to this address
                  </p>
                )}
                {scamResult.scam_score < 31 && (
                  <p>
                    ✅ Low risk - This address appears safe based on current data
                  </p>
                )}
              </div>

              {scamResult.report_count > 0 && (
                <p className="text-sm mt-2">
                  📊 Community reports: {scamResult.report_count} scam report(s)
                </p>
              )}

              {scamResult.is_confirmed_scammer && (
                <p className="text-sm mt-2 font-medium">
                  🛡️ DAO-confirmed scammer - Strongly recommend avoiding this address
                </p>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-300">
              Amount (ETH)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800/50 border-gray-600 text-white"
              disabled={isSubmitting}
            />

            {amountError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{amountError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* High Risk Confirmation */}
          {isHighRisk && !userConfirmedRisk && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>This transaction is high risk. Please confirm you want to proceed.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUserConfirmedRisk(true)}
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    I understand the risks and want to proceed
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Transaction...
              </>
            ) : showConfirmation ? (
              'Confirm High-Risk Transaction'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Transaction
              </>
            )}
          </Button>

          {/* Transaction Hash Display */}
          {txHash && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Transaction sent successfully!</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono">{shortenAddress(txHash)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
