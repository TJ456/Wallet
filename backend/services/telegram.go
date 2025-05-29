package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"Wallet/backend/models"
)

// TelegramService manages interactions with the Telegram Bot API
type TelegramService struct {
	Token       string
	BaseURL     string
	UserMapping map[string]string // Maps Telegram Chat IDs to wallet addresses
}

// TelegramUpdate represents an update from Telegram
type TelegramUpdate struct {
	UpdateID int             `json:"update_id"`
	Message  *TelegramMessage `json:"message,omitempty"`
}

// TelegramMessage represents a message in a Telegram update
type TelegramMessage struct {
	MessageID int                `json:"message_id"`
	From      *TelegramUser      `json:"from"`
	Chat      *TelegramChat      `json:"chat"`
	Text      string             `json:"text"`
	Date      int64              `json:"date"`
}

// TelegramUser represents a Telegram user
type TelegramUser struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	Username  string `json:"username,omitempty"`
}

// TelegramChat represents a Telegram chat
type TelegramChat struct {
	ID        int64  `json:"id"`
	Type      string `json:"type"`
	Title     string `json:"title,omitempty"`
	Username  string `json:"username,omitempty"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
}

// NewTelegramService creates a new Telegram service instance
func NewTelegramService(token string) *TelegramService {
	if token == "" {
		log.Println("Warning: Telegram bot token is not set")
	}
	
	return &TelegramService{
		Token:       token,
		BaseURL:     fmt.Sprintf("https://api.telegram.org/bot%s", token),
		UserMapping: make(map[string]string),
	}
}

// SendMessage sends a message to a specific Telegram chat
func (ts *TelegramService) SendMessage(chatID int64, text string) error {
	if ts.Token == "" {
		return fmt.Errorf("telegram token not configured")
	}
	
	url := fmt.Sprintf("%s/sendMessage", ts.BaseURL)
	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	}
	
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal telegram payload: %w", err)
	}
	
	resp, err := http.Post(url, "application/json", strings.NewReader(string(jsonPayload)))
	if err != nil {
		return fmt.Errorf("failed to send telegram message: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned non-OK status: %d", resp.StatusCode)
	}
	
	return nil
}

// NotifySecurityAlert sends a security alert to the user's telegram if they have linked their account
func (ts *TelegramService) NotifySecurityAlert(walletAddress string, alert *models.SecurityAlert) error {
	chatID, exists := ts.UserMapping[walletAddress]
	if !exists {
		return fmt.Errorf("no telegram chat linked to wallet %s", walletAddress)
	}
	
	chatIDInt := int64(0)
	fmt.Sscanf(chatID, "%d", &chatIDInt)
	
	message := fmt.Sprintf("⚠️ <b>SECURITY ALERT</b> ⚠️\n\n" +
		"<b>Type:</b> %s\n" +
		"<b>Severity:</b> %s\n" +
		"<b>Details:</b> %s\n\n" +
		"<b>Time:</b> %s\n\n" +
		"Use the /block command to immediately block this transaction.",
		alert.Type, 
		alert.Severity,
		alert.Details,
		time.Unix(alert.Timestamp, 0).Format(time.RFC1123),
	)
	
	return ts.SendMessage(chatIDInt, message)
}

// NotifyScamReport sends a notification when a scam has been reported
func (ts *TelegramService) NotifyScamReport(walletAddress string, report *models.Report) error {
	chatID, exists := ts.UserMapping[walletAddress]
	if !exists {
		return fmt.Errorf("no telegram chat linked to wallet %s", walletAddress)
	}
	
	chatIDInt := int64(0)
	fmt.Sscanf(chatID, "%d", &chatIDInt)
		message := fmt.Sprintf("🚨 <b>SCAM REPORTED</b> 🚨\n\n" +
		"<b>Scam Address:</b> %s\n" +
		"<b>Category:</b> %s\n" +
		"<b>Description:</b> %s\n\n" +
		"<b>Time:</b> %s\n\n" +
		"Your report has been added to the blockchain.",
		report.ReportedAddress,
		report.Category,
		report.Description,
		report.CreatedAt.Format(time.RFC1123),
	)
	
	return ts.SendMessage(chatIDInt, message)
}

// LinkWallet associates a Telegram chat ID with a wallet address
func (ts *TelegramService) LinkWallet(chatID string, walletAddress string) {
	ts.UserMapping[walletAddress] = chatID
	// In a real implementation, this would be saved to a database
}

// GetWebhookHandler returns a Gin handler for Telegram webhooks
func (ts *TelegramService) GetWebhookHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var update TelegramUpdate
		if err := c.ShouldBindJSON(&update); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}
		
		// Process update
		if update.Message != nil {
			ts.processMessage(update.Message)
		}
		
		c.Status(http.StatusOK)
	}
}

// processMessage handles incoming Telegram messages
func (ts *TelegramService) processMessage(message *TelegramMessage) {
	// Process commands
	if strings.HasPrefix(message.Text, "/") {
		cmd := strings.Split(message.Text, " ")
		switch cmd[0] {
		case "/start":
			welcomeMessage := "Welcome to UnhackableWallet Telegram Companion! 🔒\n\n" +
				"I'll help you protect your crypto assets by providing:\n" +
				"• Real-time security alerts\n" +
				"• Transaction notifications\n" +
				"• Quick actions to block suspicious activity\n\n" +
				"Use /link YOUR_WALLET_ADDRESS to connect your wallet."
			
			ts.SendMessage(message.Chat.ID, welcomeMessage)
			
		case "/link":
			if len(cmd) < 2 {
				ts.SendMessage(message.Chat.ID, "Please provide your wallet address: /link YOUR_WALLET_ADDRESS")
				return
			}
			
			walletAddr := cmd[1]
			chatID := fmt.Sprintf("%d", message.Chat.ID)
			ts.LinkWallet(chatID, walletAddr)
			
			successMsg := fmt.Sprintf("✅ Successfully linked your Telegram account to wallet %s!\n\n" +
				"You will now receive security alerts and notifications for this wallet.", 
				walletAddr)
			ts.SendMessage(message.Chat.ID, successMsg)
			
		case "/help":
			helpMessage := "📚 <b>Available Commands</b>\n\n" +
				"/start - Welcome message and bot introduction\n" +
				"/link YOUR_WALLET_ADDRESS - Connect your wallet to receive notifications\n" +
				"/status - Check your current security status\n" +
				"/block ID - Block a suspicious transaction\n" +
				"/report ADDRESS - Report a scam address\n" +
				"/help - Show this help message"
			
			ts.SendMessage(message.Chat.ID, helpMessage)
			
		case "/status":
			// In a real implementation, this would fetch actual status
			statusMessage := "🛡️ <b>Security Status</b>: Strong\n\n" +
				"✅ No suspicious activities detected\n" +
				"✅ AI scam detection active\n" +
				"✅ Real-time monitoring enabled\n\n" +
				"Your wallet is currently protected by UnhackableWallet security features."
			
			ts.SendMessage(message.Chat.ID, statusMessage)
		}
	}
}

// SetWebhook configures the webhook URL for the Telegram bot
func (ts *TelegramService) SetWebhook(webhookURL string) error {
	if ts.Token == "" {
		return fmt.Errorf("telegram token not configured")
	}
	
	url := fmt.Sprintf("%s/setWebhook?url=%s", ts.BaseURL, webhookURL)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to set webhook: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned non-OK status: %d", resp.StatusCode)
	}
	
	log.Printf("Successfully set webhook to %s", webhookURL)
	return nil
}
