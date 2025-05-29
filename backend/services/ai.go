package services

import (
	"Wallet/backend/models"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// AIService provides machine learning model access for transaction analysis
type AIService struct {
	modelURL         string
	analyticsService *WalletAnalyticsService
}

// NewAIService creates a new AI service instance
func NewAIService(analyticsService *WalletAnalyticsService) *AIService {
	// Get the model URL from environment
	modelURL := os.Getenv("ML_MODEL_URL")
	if modelURL == "" {
		modelURL = "http://localhost:5000/predict" // default value
	}

	return &AIService{
		modelURL:         modelURL,
		analyticsService: analyticsService,
	}
}

// AIModelRequest represents the request structure for AI model prediction
type AIModelRequest struct {
	FromAddress string                 `json:"from_address"`
	ToAddress   string                 `json:"to_address"`
	Value       float64                `json:"value"`
	Network     string                 `json:"network"`
	Timestamp   int64                  `json:"timestamp,omitempty"`
	Features    map[string]interface{} `json:"features,omitempty"`
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
	// Get wallet analytics data for sender and recipient
	senderAnalytics, err := s.analyticsService.GetWalletAnalytics(tx.FromAddress)
	if err != nil {
		// Log the error but continue with limited data
		fmt.Printf("Failed to get sender analytics: %v\n", err)
	}

	recipientAnalytics, err := s.analyticsService.GetWalletAnalytics(tx.ToAddress)
	if err != nil {
		// Log the error but continue with limited data
		fmt.Printf("Failed to get recipient analytics: %v\n", err)
	}

	// Prepare request payload
	request := AIModelRequest{
		FromAddress: tx.FromAddress,
		ToAddress:   tx.ToAddress,
		Value:       tx.Value,
		Network:     tx.Network,
		Features:    make(map[string]interface{}),
	}

	// Add analytics features for ML model
	if senderAnalytics != nil {
		// Add sender metrics with "sender_" prefix
		senderFeatures := s.analyticsService.GetRiskPredictionInput(senderAnalytics)
		for k, v := range senderFeatures {
			request.Features["sender_"+k] = v
		}
	}

	if recipientAnalytics != nil {
		// Add recipient metrics with "recipient_" prefix
		recipientFeatures := s.analyticsService.GetRiskPredictionInput(recipientAnalytics)
		for k, v := range recipientFeatures {
			request.Features["recipient_"+k] = v
		}
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
	var modelResponse AIModelResponse
	if err := json.NewDecoder(resp.Body).Decode(&modelResponse); err != nil {
		return 0, fmt.Errorf("error decoding model response: %w", err)
	}

	// In development mode, we might want to simulate the model if it's not available
	if modelResponse.Risk == 0 && os.Getenv("ENVIRONMENT") == "development" {
		// Simple heuristics for demo purposes
		if tx.Value > 10.0 {
			return 0.7, nil // High value transactions are considered risky
		}
		return 0.1, nil // Default low risk
	}

	return modelResponse.Risk, nil
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
