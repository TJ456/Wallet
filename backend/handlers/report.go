package handlers

import (
	"Wallet/backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ReportHandler handles scam report endpoints
type ReportHandler struct {
	db *gorm.DB
}

// NewReportHandler creates a new report handler
func NewReportHandler(db *gorm.DB) *ReportHandler {
	return &ReportHandler{
		db: db,
	}
}

// CreateReport creates a new scam report
func (h *ReportHandler) CreateReport(c *gin.Context) {
	var report models.Report
	if err := c.ShouldBindJSON(&report); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report format"})
		return
	}

	// Set default values
	report.CreatedAt = time.Now()
	report.Status = "pending"

	// Save report to database
	if err := h.db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save report"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id": report.ID,
		"message": "Report submitted successfully",
	})
}

// GetReports retrieves all reports or reports for a specific address
func (h *ReportHandler) GetReports(c *gin.Context) {
	address := c.Query("address")
	var reports []models.Report
	var result *gorm.DB

	if address != "" {
		result = h.db.Where("reported_address = ?", address).Find(&reports)
	} else {
		// Get all reports (for admin view)
		// In a real app, you would check for admin permission here
		result = h.db.Find(&reports)
	}

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reports"})
		return
	}

	c.JSON(http.StatusOK, reports)
}
