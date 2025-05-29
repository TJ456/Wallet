package routes

import (
	"Wallet/backend/handlers"
	"Wallet/backend/middleware"
	"Wallet/backend/services"
	"log"
	"net/http"
	"os"

	"gorm.io/gorm"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter configures all API routes
func SetupMainRouter(db *gorm.DB, telegramService *services.TelegramService) *gin.Engine {
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Wallet-Address", "X-Wallet-Signature", "X-Wallet-Message"},
		AllowCredentials: true,
	}))

	// Initialize services
	ethRpcUrl := os.Getenv("ETH_RPC_URL")
	if ethRpcUrl == "" {
		ethRpcUrl = "https://eth-sepolia.g.alchemy.com/v2/your-api-key" // Default value
	}
	
	analyticsService, err := services.NewWalletAnalyticsService(db, ethRpcUrl)
	if err != nil {
		log.Printf("Warning: Failed to initialize analytics service: %v", err)
		// Use a minimal analytics service if initialization fails
		analyticsService, _ = services.NewWalletAnalyticsService(db, "")
	}

	aiService := services.NewAIService(analyticsService)
	blockchainService, err := services.NewBlockchainService()
	if err != nil {
		log.Printf("Warning: Failed to initialize blockchain service: %v", err)
		// Create a mock blockchain service for development
		blockchainService = &services.BlockchainService{}
	}

	// Create handler instances with the database connection and services
	firewallHandler := handlers.NewFirewallHandler(db, aiService, telegramService)
	reportHandler := handlers.NewReportHandler(db, blockchainService, telegramService)
	daoHandler := handlers.NewDAOHandler(db, blockchainService)
	authHandler := handlers.NewAuthHandler(blockchainService)
	analyticsHandler := handlers.NewWalletAnalyticsHandler(analyticsService)
	
	// Apply rate limiting to all API routes
	r.Use(middleware.RateLimitMiddleware())
	
	// Public API routes
	api := r.Group("/api")
	{
		// Auth endpoints
		api.POST("/auth/verify", authHandler.VerifyWalletSignature)
		api.GET("/auth/nonce", authHandler.GetSignatureNonce)

		// Public firewall endpoints
		api.POST("/firewall/tx", firewallHandler.AnalyzeTransaction)
		api.GET("/firewall/stats", firewallHandler.GetStats)

		// Public DAO endpoints
		api.GET("/dao/proposals", daoHandler.GetProposals)

		// Wallet analytics endpoints
		api.GET("/analytics/wallet/:address", analyticsHandler.GetWalletAnalytics)
		api.GET("/analytics/risk/:address", analyticsHandler.GetWalletRiskScore)
		api.POST("/analytics/bulk", analyticsHandler.GetBulkWalletAnalytics)
		api.POST("/analytics/export", analyticsHandler.ExportMLDataset)
	}

	// Web3 authenticated routes (using wallet signature)
	web3Auth := r.Group("/api")
	web3Auth.Use(middleware.Web3AuthMiddleware(blockchainService))
	{
		// Report endpoints
		web3Auth.POST("/report", reportHandler.CreateReport)
		web3Auth.GET("/reports", reportHandler.GetReports)

		// Protected DAO endpoints
		web3Auth.POST("/dao/vote", daoHandler.CastVote)
		web3Auth.POST("/dao/proposals", daoHandler.CreateProposal)

		// Recovery endpoints
		web3Auth.POST("/recovery/initiate", reportHandler.InitiateRecovery)
		web3Auth.GET("/recovery/status/:txHash", reportHandler.CheckRecoveryStatus)

		// User profile and transaction history
		web3Auth.GET("/transactions", firewallHandler.GetTransactions)
		web3Auth.GET("/profile", authHandler.GetWalletProfile)
	}

	// Admin routes (JWT authenticated)
	admin := r.Group("/api/admin")
	admin.Use(middleware.JWTAuthMiddleware())
	{
		admin.GET("/reports", reportHandler.GetAllReports)
		admin.PUT("/reports/:id/verify", reportHandler.VerifyReport)
		admin.GET("/stats", firewallHandler.GetAdminStats)
	}

	// Telegram webhook endpoint
	// This doesn't need authentication as it's secured by the Telegram API
	r.POST("/telegram/webhook", telegramService.GetWebhookHandler())

	// Telegram account linking endpoint (requires Web3 auth)
	web3Auth.POST("/telegram/link", func(c *gin.Context) {
		var req struct {
			TelegramChatID string `json:"telegram_chat_id" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			return
		}

		// Get user wallet address from auth middleware
		address, exists := c.Get("address")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
			return
		}

		// Link Telegram chat to wallet
		telegramService.LinkWallet(req.TelegramChatID, address.(string))

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Telegram account successfully linked to wallet",
		})
	})

	return r
}
