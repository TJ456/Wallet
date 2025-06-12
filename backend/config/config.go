package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Config holds all configuration settings
type Config struct {
	ServerPort   string
	DatabaseURL  string
	MLModelURL   string
	JWTSecret    string
	Environment  string
	TelegramToken string
}

// LoadConfig loads configuration from .env file and environment variables
func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	// Special handling for Render which uses PORT instead of SERVER_PORT
	serverPort := os.Getenv("PORT")
	if serverPort == "" {
		serverPort = getEnv("SERVER_PORT", "8080")
	}

	cfg := &Config{
		ServerPort:    serverPort,
		DatabaseURL:   getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/wallet"),
		MLModelURL:    getEnv("ML_MODEL_URL", "http://localhost:5000/predict"),
		JWTSecret:     getEnv("JWT_SECRET", "your-secret-key"),
		Environment:   getEnv("ENVIRONMENT", "development"),
		TelegramToken: getEnv("TELEGRAM_TOKEN", ""),
	}

	return cfg, nil
}

// InitDB initializes the database connection
func InitDB(cfg *Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// TODO: Apply migrations here
	// db.AutoMigrate(&models.Transaction{}, &models.Report{}, &models.DAOVote{})

	return db, nil
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
