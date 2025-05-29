# Testing Guide for Transaction System with Scam Detection

## 🚀 **Quick Start Testing**

### **1. Access the Application**
1. Open your browser and go to: http://localhost:5173
2. The development server should be running (if not, run `npm run dev`)

### **2. Connect Your Wallet**
1. Click "Connect Wallet" in the top-right corner
2. Approve the MetaMask connection
3. Ensure you're on a testnet (recommended: Goerli, Sepolia, or local network)

### **3. Navigate to Send Transaction**
1. Click on "Send Transaction" in the left sidebar
2. You should see the new transaction interface with:
   - Wallet Info panel (left side)
   - Transaction Form (right side)

## 🧪 **Test Scenarios**

### **Scenario 1: Valid Transaction**
**Purpose**: Test normal transaction flow

1. **Enter a valid address**: Use a friend's address or create a test address
2. **Enter amount**: Try 0.001 ETH (small amount for testing)
3. **Observe**: Should show "Low Risk" or "Security Check: LOW Risk"
4. **Submit**: Click "Send Transaction"
5. **Expected**: Transaction should process normally

### **Scenario 2: Invalid Address Testing**
**Purpose**: Test address validation

1. **Enter invalid address**: Type "0x123" (too short)
2. **Expected**: Should show "Invalid Ethereum address format" error
3. **Enter your own address**: Copy your wallet address
4. **Expected**: Should show "Cannot send to your own address" error

### **Scenario 3: Amount Validation**
**Purpose**: Test amount validation

1. **Enter negative amount**: Type "-1"
2. **Expected**: Should show "Amount must be a positive number"
3. **Enter very large amount**: Type "1000000"
4. **Expected**: Should show "Amount seems unusually large. Please verify."

### **Scenario 4: Scam Detection (Simulated)**
**Purpose**: Test scam detection system

Since we don't have real scammer addresses in the test database, the system will show "Low Risk" for most addresses. To test the UI:

1. **Check the code**: The scam detection logic is in place
2. **Mock data**: The system calculates risk based on community reports
3. **UI elements**: You can see the risk display components working

### **Scenario 5: Wallet Info Testing**
**Purpose**: Test wallet information display

1. **Check address display**: Should show your wallet address (shortened by default)
2. **Toggle full address**: Click the eye icon to show/hide full address
3. **Copy address**: Click the copy icon to copy address to clipboard
4. **Check balance**: Should display your current ETH balance
5. **Refresh balance**: Click the refresh icon to update balance

### **Scenario 6: Network Information**
**Purpose**: Test network detection

1. **Check network badge**: Should show current network name
2. **Switch networks**: Try switching networks in MetaMask
3. **Expected**: Page should reload and show new network

## 🔍 **API Error Testing**

### **Test API Error Handling**
1. **Navigate to "API Testing" tab**
2. **Test different endpoints**:
   - Try `/firewall/stats` (should work or show connection error)
   - Try `/nonexistent` (should show 404 error)
   - Try `/auth/protected` (should show auth error)

### **Expected Behavior**
- **Connection errors**: Should show network error with retry option
- **404 errors**: Should show "endpoint not found" type error
- **Auth errors**: Should show authorization error
- **Retry functionality**: Should allow retrying failed requests

## 🎯 **Key Features to Verify**

### **TransactionForm Component**
- ✅ Address validation (format, checksum, self-send prevention)
- ✅ Amount validation (positive numbers, reasonable limits)
- ✅ Scam detection integration (risk scoring, warnings)
- ✅ Loading states (during scam checks, transaction submission)
- ✅ Error handling (network errors, transaction failures)
- ✅ Success feedback (transaction hash display, confirmation)

### **WalletInfo Component**
- ✅ Address display (shortened/full toggle)
- ✅ Balance display (formatted, color-coded)
- ✅ Copy functionality (address to clipboard)
- ✅ External links (block explorer integration)
- ✅ Auto-refresh (balance updates every 30 seconds)
- ✅ Network information (current network display)
- ✅ Status indicators (low balance warnings)

### **Integration Features**
- ✅ Navigation (Send Transaction tab)
- ✅ Layout (responsive design, proper spacing)
- ✅ Styling (consistent with app theme)
- ✅ Toast notifications (success/error messages)
- ✅ Real-time updates (balance, transaction status)

## 🐛 **Common Issues & Solutions**

### **Issue: "Wallet not connected" error**
**Solution**: 
1. Refresh the page
2. Reconnect MetaMask
3. Check if MetaMask is unlocked

### **Issue: "Network connection failed" in API testing**
**Solution**: 
- This is expected if backend is not running
- The error handling system should show appropriate error messages
- Try the retry functionality

### **Issue: Balance not loading**
**Solution**:
1. Check MetaMask connection
2. Ensure you're on a supported network
3. Try the refresh button in WalletInfo component

### **Issue: Transaction fails**
**Solution**:
1. Check you have sufficient ETH for gas fees
2. Verify the recipient address is valid
3. Ensure MetaMask is unlocked and connected

## 📊 **Expected Test Results**

### **Successful Test Indicators**
- ✅ All form validations work correctly
- ✅ Scam detection system shows risk levels
- ✅ Wallet info displays correctly
- ✅ Balance updates automatically
- ✅ Copy/external link functions work
- ✅ Error messages are user-friendly
- ✅ Loading states are visible
- ✅ Toast notifications appear
- ✅ Responsive design works on different screen sizes

### **Performance Expectations**
- ⚡ Address validation: Instant
- ⚡ Scam checking: < 2 seconds
- ⚡ Balance loading: < 3 seconds
- ⚡ Transaction submission: Depends on network

## 🔧 **Developer Testing**

### **Console Logs**
Check browser console for:
- Scam detection results
- Transaction progress
- Error messages
- API call responses

### **Network Tab**
Monitor network requests:
- API calls to scam detection endpoints
- Web3 RPC calls
- Error responses and retries

### **React DevTools**
Inspect component state:
- Form validation states
- Loading indicators
- Error handling
- Props and state updates

## ✅ **Test Completion Checklist**

- [ ] Wallet connection works
- [ ] Send Transaction tab loads correctly
- [ ] WalletInfo component displays wallet data
- [ ] TransactionForm validates inputs
- [ ] Scam detection system activates
- [ ] Error handling works for invalid inputs
- [ ] API error testing shows proper error messages
- [ ] Toast notifications appear for actions
- [ ] Responsive design works on mobile
- [ ] All buttons and links function correctly

## 🎉 **Ready for Production**

Once all tests pass, the transaction system with scam detection is ready for production use! The system provides comprehensive protection against scams while maintaining a smooth user experience.

**Happy Testing!** 🚀
