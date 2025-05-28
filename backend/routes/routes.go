package routes

import (
	"Wallet/backend/handlers"
	"Wallet/backend/middleware"
	"Wallet/backend/services"
	"log"
	"gorm.io/gorm"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter configures all API routes
func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Wallet-Address", "X-Wallet-Signature", "X-Wallet-Message"},
		AllowCredentials: true,
	}))

	// Initialize services
	aiService := services.NewAIService()
	blockchainService, err := services.NewBlockchainService()
	if err != nil {
		log.Fatalf("Failed to initialize blockchain service: %v", err)
	}

	// Create handler instances with the database connection and services
	firewallHandler := handlers.NewFirewallHandler(db, aiService)
	reportHandler := handlers.NewReportHandler(db, blockchainService)
	daoHandler := handlers.NewDAOHandler(db, blockchainService)
	authHandler := handlers.NewAuthHandler(blockchainService)
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

	return r
}
