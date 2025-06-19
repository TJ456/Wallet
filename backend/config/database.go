package config

import (
	"Wallet/backend/models"
	"log"

	"gorm.io/gorm"
)

// InitializeDatabase sets up the database schema and creates any required tables
func InitializeDatabase(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Check if tables exist first
	if err := db.Migrator().DropTable("transactions"); err != nil {
		// Ignore error if table doesn't exist
		log.Printf("Note: Could not drop transactions table (might not exist): %v", err)
	}

	// Auto migrate all models
	err := db.AutoMigrate(
		&models.Transaction{},
		&models.Report{},
		&models.DAOProposal{},
		&models.DAOVote{},
		&models.Recovery{},
		&models.TelegramMapping{},
		&models.Config{},
	)

	if err != nil {
		log.Printf("Database migration failed: %v", err)
		return err
	}

	// Ensure indexes are created properly
	if err := db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS "uni_transactions_tx_hash" ON "transactions"("tx_hash")`).Error; err != nil {
		log.Printf("Warning: Failed to create transaction hash index: %v", err)
		// Don't return error since AutoMigrate should have handled this
	}

	log.Println("Database migrations completed successfully")

	// Add seed data if needed (for development)
	if err := seedDevelopmentData(db); err != nil {
		log.Printf("Warning: Failed to seed development data: %v", err)
	}

	return nil
}

// seedDevelopmentData populates some initial data for development environments
func seedDevelopmentData(db *gorm.DB) error {
	// Only seed if we're in development mode and the tables are empty
	var count int64
	db.Model(&models.DAOProposal{}).Count(&count)

	if count > 0 {
		log.Println("Development data already exists, skipping seeding")
		return nil
	}

	log.Println("Seeding development data...")

	// Set up initial admin Telegram chat
	if err := db.Create(&models.Config{
		Key:   "telegram_admin_chat",
		Value: "-1001234567890", // Replace with actual admin chat ID
	}).Error; err != nil {
		return err
	}

	return nil
}
