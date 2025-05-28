package routes

import (
	"Wallet/backend/handlers"
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
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Create handler instances with the database connection
	firewallHandler := handlers.NewFirewallHandler(db)
	reportHandler := handlers.NewReportHandler(db)
	daoHandler := handlers.NewDAOHandler(db)

	// API routes
	api := r.Group("/api")
	{
		// Firewall endpoints
		api.POST("/firewall/tx", firewallHandler.AnalyzeTransaction)
		api.GET("/firewall/stats", firewallHandler.GetStats)
		
		// Report endpoints
		api.POST("/report", reportHandler.CreateReport)
		api.GET("/reports", reportHandler.GetReports)
		
		// DAO endpoints
		api.POST("/dao/vote", daoHandler.CastVote)
		api.GET("/dao/proposals", daoHandler.GetProposals)
		api.POST("/dao/proposals", daoHandler.CreateProposal)
		
		// Transaction history
		api.GET("/transactions", firewallHandler.GetTransactions)
	}

	return r
}
