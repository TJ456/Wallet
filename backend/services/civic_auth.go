package services

import (
	"Wallet/backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
	"github.com/civic/civic-pass-api/pkg/gateway"
	"gorm.io/gorm"
)

type CivicAuthService struct {
	db            *gorm.DB
	gatewayClient *gateway.Client
	config        *CivicConfig
}

type CivicConfig struct {
	GatekeeperNetwork string
	ChainId           int64
	ApiKey            string
	Stage             string // "prod" or "preprod"
}

func NewCivicAuthService(db *gorm.DB, config *CivicConfig) *CivicAuthService {
	client := gateway.NewClient(config.ApiKey, config.Stage == "prod")
	return &CivicAuthService{
		db:            db,
		gatewayClient: client,
		config:        config,
	}
}

// InitiateAuth starts the Civic authentication process
func (s *CivicAuthService) InitiateAuth(userAddress string, deviceInfo string) (*models.CivicAuthSession, error) {
	// Check for existing valid session
	var existingSession models.CivicAuthSession
	if err := s.db.Where("user_address = ? AND token_expiry > ?", userAddress, time.Now()).First(&existingSession).Error; err == nil {
		return &existingSession, nil
	}

	// Create new gatepass token
	token, err := s.gatewayClient.CreateToken(context.Background(), &gateway.CreateTokenRequest{
		GatekeeperNetwork: s.config.GatekeeperNetwork,
		ChainId:           s.config.ChainId,
		WalletAddress:     userAddress,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Civic token: %v", err)
	}

	// Create new session with enhanced security
	session := &models.CivicAuthSession{
		UserAddress:       userAddress,
		GatekeeperNetwork: s.config.GatekeeperNetwork,
		TokenExpiry:       time.Now().Add(24 * time.Hour),
		Status:           "pending",
		GatePass:         token.Token,
		SecurityLevel:    1,
		DeviceHash:      generateDeviceHash(deviceInfo),
		RiskScore:       0.0,
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, fmt.Errorf("failed to create auth session: %v", err)
	}

	// Log the verification attempt
	s.logVerificationAttempt(userAddress, "initial", true, deviceInfo)

	return session, nil
}

// VerifyGatepass validates the Civic gatepass and implements additional security measures
func (s *CivicAuthService) VerifyGatepass(userAddress, gatepass string, deviceInfo string) (*models.CivicAuthSession, error) {
	var session models.CivicAuthSession
	if err := s.db.Where("user_address = ? AND gate_pass = ?", userAddress, gatepass).First(&session).Error; err != nil {
		return nil, errors.New("invalid session")
	}

	// Verify with Civic gateway
	verified, err := s.gatewayClient.VerifyToken(context.Background(), gatepass)
	if err != nil || !verified {
		s.logVerificationAttempt(userAddress, "verification", false, deviceInfo)
		return nil, errors.New("civic verification failed")
	}

	// Enhanced Security Checks
	riskFactors := s.performSecurityChecks(userAddress, deviceInfo)
	if len(riskFactors) > 0 {
		session.Flags = riskFactors
		session.RiskScore = calculateRiskScore(riskFactors)
		
		// If risk is too high, require additional verification
		if session.RiskScore > 0.7 {
			session.SecurityLevel = 3
			session.Status = "needs_additional_verification"
			s.db.Save(&session)
			return nil, errors.New("additional verification required due to high risk score")
		}
	}

	// Update session status
	session.Status = "verified"
	session.LastVerified = time.Now()
	if err := s.db.Save(&session).Error; err != nil {
		return nil, err
	}

	s.logVerificationAttempt(userAddress, "verification", true, deviceInfo)
	return &session, nil
}

// PerformSecurityChecks implements advanced security measures
func (s *CivicAuthService) performSecurityChecks(userAddress, deviceInfo string) []string {
	var flags []string
	
	// Check for multiple devices
	var deviceCount int64
	s.db.Model(&models.CivicAuthSession{}).
		Where("user_address = ? AND device_hash != ?", userAddress, generateDeviceHash(deviceInfo)).
		Count(&deviceCount)
	
	if deviceCount > 2 {
		flags = append(flags, "multiple_devices_detected")
	}

	// Check for rapid verification attempts
	var recentAttempts int64
	s.db.Model(&models.CivicVerificationLog{}).
		Where("user_address = ? AND created_at > ?", userAddress, time.Now().Add(-5*time.Minute)).
		Count(&recentAttempts)
	
	if recentAttempts > 5 {
		flags = append(flags, "rapid_verification_attempts")
	}

	// Geographic anomaly detection
	if geoLocation := extractGeoLocation(deviceInfo); geoLocation != "" {
		var lastLocation string
		s.db.Model(&models.CivicVerificationLog{}).
			Where("user_address = ? AND geo_location != ''", userAddress).
			Order("created_at desc").
			Limit(1).
			Pluck("geo_location", &lastLocation)

		if lastLocation != "" && lastLocation != geoLocation {
			flags = append(flags, "location_change_detected")
		}
	}

	return flags
}

// LogVerificationAttempt records authentication attempts for security analysis
func (s *CivicAuthService) logVerificationAttempt(userAddress, verificationType string, success bool, deviceInfo string) {
	log := &models.CivicVerificationLog{
		UserAddress:      userAddress,
		VerificationType: verificationType,
		Success:         success,
		DeviceInfo:      deviceInfo,
		GeoLocation:     extractGeoLocation(deviceInfo),
		IPAddress:       extractIPAddress(deviceInfo),
	}
	s.db.Create(log)
}

// Helper functions
func generateDeviceHash(deviceInfo string) string {
	// Implement device fingerprinting logic
	return "hash_" + deviceInfo // Replace with actual hashing
}

func calculateRiskScore(flags []string) float64 {
	score := 0.0
	for _, flag := range flags {
		switch flag {
		case "multiple_devices_detected":
			score += 0.3
		case "rapid_verification_attempts":
			score += 0.4
		case "location_change_detected":
			score += 0.2
		}
	}
	return score
}

func extractGeoLocation(deviceInfo string) string {
	// Implement geo-location extraction
	return "US" // Replace with actual implementation
}

func extractIPAddress(deviceInfo string) string {
	// Implement IP extraction
	return "127.0.0.1" // Replace with actual implementation
}
