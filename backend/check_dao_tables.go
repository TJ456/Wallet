package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DAOProposal represents a governance proposal in the DAO
type DAOProposal struct {
	ID             uint   `gorm:"primaryKey"`
	Title          string
	Description    string
	CreatorAddress string `gorm:"column:proposer_address"`
	Status         string
	VotesFor       int
	VotesAgainst   int
}

// DAOVote represents a vote cast by a user for a DAO proposal
type DAOVote struct {
	ID           uint   `gorm:"primaryKey"`
	ProposalID   uint
	VoterAddress string
	VoteType     string
	VotePower    float64
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Check if dao_proposals table exists
	if db.Migrator().HasTable(&DAOProposal{}) {
		fmt.Println("✅ dao_proposals table exists")
		
		// Count proposals
		var proposalCount int64
		db.Model(&DAOProposal{}).Count(&proposalCount)
		fmt.Printf("Found %d DAO proposals\n", proposalCount)
		
		// Get sample proposals
		var proposals []DAOProposal
		result := db.Limit(5).Find(&proposals)
		if result.Error != nil {
			fmt.Printf("Error querying proposals: %v\n", result.Error)
		} else {
			fmt.Println("\nSample DAO Proposals:")
			for _, p := range proposals {
				fmt.Printf("ID: %d, Title: %s, Status: %s, Votes For: %d, Votes Against: %d\n", 
					p.ID, p.Title, p.Status, p.VotesFor, p.VotesAgainst)
			}
		}
	} else {
		fmt.Println("❌ dao_proposals table does not exist")
	}

	// Check if dao_votes table exists
	if db.Migrator().HasTable(&DAOVote{}) {
		fmt.Println("\n✅ dao_votes table exists")
		
		// Count votes
		var voteCount int64
		db.Model(&DAOVote{}).Count(&voteCount)
		fmt.Printf("Found %d DAO votes\n", voteCount)
		
		// Get sample votes
		var votes []DAOVote
		result := db.Limit(5).Find(&votes)
		if result.Error != nil {
			fmt.Printf("Error querying votes: %v\n", result.Error)
		} else {
			fmt.Println("\nSample DAO Votes:")
			for _, v := range votes {
				fmt.Printf("ID: %d, Proposal ID: %d, Voter: %s, Vote Type: %s, Power: %.2f\n", 
					v.ID, v.ProposalID, v.VoterAddress, v.VoteType, v.VotePower)
			}
		}
	} else {
		fmt.Println("❌ dao_votes table does not exist")
	}
}
