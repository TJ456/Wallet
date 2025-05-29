package main

import (
	"Wallet/backend/config"
	"Wallet/backend/routes"
	"Wallet/backend/services"
	"fmt"
	"log"
)

func main() {
	log.Println("Starting Wallet Backend Service...")

	// Load configuration
	log.Println("Loading configuration...")
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	log.Println("Connecting to database...")
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Run database migrations and setup
	log.Println("Setting up database schema...")
	if err := InitializeDatabase(db); err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}

	// Initialize Telegram service
	log.Println("Initializing Telegram bot service...")
	telegramService := services.NewTelegramService(cfg.TelegramToken)

	// Set Telegram webhook URL if in production
	if cfg.Environment == "production" {
		webhookURL := "https://api.unhackablewallet.com/telegram/webhook"
		if err := telegramService.SetWebhook(webhookURL); err != nil {
			log.Printf("Warning: Failed to set Telegram webhook: %v", err)
		}
	} else {
		log.Println("Telegram webhooks not set in development mode. Use a tunnel like ngrok for local testing.")
	}
	// Setup router with services
	log.Println("Setting up API routes...")
	r := routes.SetupMainRouter(db, telegramService)

	// Print startup banner
	fmt.Println(`
    __        __    _ _      _            _____
    \ \      / /_ _| | | ___| |_   ___   |  ___|_ _ ___ ___
     \ \ /\ / / _' | | |/ _ \ __| / _ \  | |_ / _' / __/ _ \
      \ V  V / (_| | | |  __/ |_ |  __/  |  _| (_| \__ \  __/
       \_/\_/ \__,_|_|_|\___|\__| \___|  |_|  \__,_|___/\___|

    Wallet Firewall API Server | Secure Transactions`)
	fmt.Printf("    Version 1.0.0 | Environment: %s\n\n", cfg.Environment)

	// Start server
	log.Printf("Server listening on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
