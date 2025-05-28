package handlers

import (
	"Wallet/backend/models"
	"Wallet/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// FirewallHandler handles transaction firewall endpoints
type FirewallHandler struct {
	db *gorm.DB
	aiService *services.AIService
}

// NewFirewallHandler creates a new firewall handler
func NewFirewallHandler(db *gorm.DB) *FirewallHandler {
	return &FirewallHandler{
		db: db,
		aiService: services.NewAIService(),
	}
}

// AnalyzeTransaction analyzes a transaction for potential threats
func (h *FirewallHandler) AnalyzeTransaction(c *gin.Context) {
	var tx models.Transaction
	if err := c.ShouldBindJSON(&tx); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Call AI service to analyze transaction
	risk, err := h.aiService.AnalyzeTransaction(tx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to analyze transaction"})
		return
	}

	// Determine status based on risk score
	status := "safe"
	if risk > 0.7 {
		status = "blocked"
	} else if risk > 0.3 {
		status = "suspicious"
	}

	// Save transaction to database
	tx.Risk = risk
	tx.Status = status
	if err := h.db.Create(&tx).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": status,
		"risk": risk,
	})
}

// GetStats returns transaction security statistics
func (h *FirewallHandler) GetStats(c *gin.Context) {
	var safeCount, suspiciousCount, blockedCount int64
	
	h.db.Model(&models.Transaction{}).Where("status = ?", "safe").Count(&safeCount)
	h.db.Model(&models.Transaction{}).Where("status = ?", "suspicious").Count(&suspiciousCount)
	h.db.Model(&models.Transaction{}).Where("status = ?", "blocked").Count(&blockedCount)

	c.JSON(http.StatusOK, gin.H{
		"safe": safeCount,
		"suspicious": suspiciousCount,
		"blocked": blockedCount,
		"total": safeCount + suspiciousCount + blockedCount,
	})
}

// GetTransactions returns transaction history for a wallet address
func (h *FirewallHandler) GetTransactions(c *gin.Context) {
	walletAddress := c.Query("address")
	if walletAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet address is required"})
		return
	}

	var transactions []models.Transaction
	result := h.db.Where("from_address = ? OR to_address = ?", walletAddress, walletAddress).
		Order("created_at DESC").
		Limit(50).
		Find(&transactions)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}

	c.JSON(http.StatusOK, transactions)
}
