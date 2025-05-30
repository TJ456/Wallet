package services

import (
	"Wallet/backend/models"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// AIService provides machine learning model access for transaction analysis
type AIService struct {
	modelURL         string
	analyticsService *WalletAnalyticsService
}

// NewAIService creates a new AI service instance
func NewAIService(analyticsService *WalletAnalyticsService) *AIService {
	// Always use the external ML API
	modelURL := "https://fraud-transaction-detection-uaxt.onrender.com/predict"

	return &AIService{
		modelURL:         modelURL,
		analyticsService: analyticsService,
	}
}

// AIModelRequest represents the request structure for AI model prediction
type AIModelRequest struct {
	FromAddress           string    `json:"from_address"`
	ToAddress             string    `json:"to_address"`
	TransactionValue      float64   `json:"transaction_value"`
	GasPrice              float64   `json:"gas_price"`
	IsContractInteraction bool      `json:"is_contract_interaction"`
	AccHolder             string    `json:"acc_holder"`
	Features              []float64 `json:"features"`
}

// AIModelResponse represents the prediction response from the AI model
type AIModelResponse struct {
	Risk        float64            `json:"risk_score"`
	Explanation string             `json:"explanation"`
	Confidence  float64            `json:"confidence"`
	Features    map[string]float64 `json:"feature_importance"`
}

// AnalyzeTransaction calls the ML model to analyze transaction risk
func (s *AIService) AnalyzeTransaction(tx models.Transaction) (float64, error) {
	// Create a fixed array of 18 features as required by external ML API
	features := make([]float64, 18)
	
	// Set transaction value in the features array (position 13 based on test script)
	features[13] = tx.Value
	
	// Set gas price in the features array (position 14 based on test script)
	gasPrice := 20.0 // Default gas price
	features[14] = gasPrice
	
	// Determine if this is a contract interaction
	isContract := false
	
	// Prepare request payload for external ML API
	request := AIModelRequest{
		FromAddress:           tx.FromAddress,
		ToAddress:             tx.ToAddress,
		TransactionValue:      tx.Value,
		GasPrice:              gasPrice,
		IsContractInteraction: isContract,
		AccHolder:             tx.FromAddress,
		Features:              features,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return 0, fmt.Errorf("error marshaling request: %w", err)
	}

	// Make HTTP request to ML model
	resp, err := http.Post(s.modelURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, fmt.Errorf("error calling ML model: %w", err)
	}
	defer resp.Body.Close()

	// Check if response is successful
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("ML model returned non-OK status: %d", resp.StatusCode)
	}
	// Parse response
	var externalResponse struct {
		Prediction string `json:"prediction"`
		Type       string `json:"Type"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&externalResponse); err != nil {
		return 0, fmt.Errorf("error decoding model response: %w", err)
	}

	// Convert external API response to our risk score format
	var riskScore float64
	if externalResponse.Prediction == "Fraud" {
		riskScore = 0.85 // High risk
	} else if externalResponse.Prediction == "Suspicious" {
		riskScore = 0.5 // Medium risk
	} else {
		riskScore = 0.1 // Low risk
	}

	return riskScore, nil
}

// GetRiskExplanation provides a human-readable explanation for a risk score
func (s *AIService) GetRiskExplanation(risk float64, tx models.Transaction) string {
	if risk > 0.7 {
		return "High risk transaction detected: This address has been associated with suspicious activity."
	} else if risk > 0.3 {
		return "Medium risk transaction: Exercise caution with this transaction."
	}
	return "Low risk transaction: No significant risk factors detected."
}

// IsAddressBlacklisted checks if an address is in the known scammer list
func (s *AIService) IsAddressBlacklisted(address string) (bool, error) {
	// TODO: Implement blacklist checking against a database or external API
	// For now, we'll just return a hardcoded value for demonstration
	knownScamAddresses := map[string]bool{
		"0x1234567890abcdef1234567890abcdef12345678": true,
		"0x0987654321fedcba0987654321fedcba09876543": true,
	}

	return knownScamAddresses[address], nil
}
