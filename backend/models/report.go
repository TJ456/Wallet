package models

import (
	"time"
)

// Report represents a user-submitted report of a scam or phishing attempt
type Report struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	ReportedAddress string    `json:"reportedAddress" gorm:"index"`
	ReporterAddress string    `json:"reporterAddress" gorm:"index"`
	TxHash          string    `json:"txHash"`
	Category        string    `json:"category"` // "phishing", "scam", "fraud", "other"
	Description     string    `json:"description"`
	Evidence        string    `json:"evidence"`
	CreatedAt       time.Time `json:"createdAt"`
	Status          string    `json:"status"` // "pending", "verified", "rejected"
	Severity        int       `json:"severity" gorm:"default:0"` // 1-5 rating
}
