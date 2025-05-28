package main

import (
	"Wallet/backend/config"
	"Wallet/backend/routes"
	"log"
	"fmt"
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

	// Setup router
	log.Println("Setting up API routes...")
	r := routes.SetupRouter(db)
	
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
