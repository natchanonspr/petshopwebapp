package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

const linePushMessageURL = "https://api.line.me/v2/bot/message/push"

type linePushRequest struct {
	To       string             `json:"to"`
	Messages []lineTextMessage  `json:"messages"`
}

type lineTextMessage struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func SendNotificationToLINEUsers(lineUserIDs []string, notification *Notification) error {
	if notification == nil || len(lineUserIDs) == 0 {
		return nil
	}

	token := strings.TrimSpace(os.Getenv("LINE_CHANNEL_ACCESS_TOKEN"))
	if token == "" {
		log.Println("LINE_CHANNEL_ACCESS_TOKEN is not configured; skip LINE notification")
		return nil
	}

	text := buildLINENotificationText(notification)

	client := &http.Client{Timeout: 15 * time.Second}

	for _, lineUserID := range lineUserIDs {
		lineUserID = strings.TrimSpace(lineUserID)
		if lineUserID == "" {
			continue
		}

		payload := linePushRequest{
			To: lineUserID,
			Messages: []lineTextMessage{
				{
					Type: "text",
					Text: text,
				},
			},
		}

		body, err := json.Marshal(payload)
		if err != nil {
			return err
		}

		req, err := http.NewRequest(
			http.MethodPost,
			linePushMessageURL,
			bytes.NewReader(body),
		)
		if err != nil {
			return err
		}

		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("LINE push request failed: %w", err)
		}

		resp.Body.Close()

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return fmt.Errorf("LINE push returned HTTP %d", resp.StatusCode)
		}
	}

	return nil
}

func buildLINENotificationText(notification *Notification) string {
	title := strings.TrimSpace(notification.Title)
	detail := strings.TrimSpace(notification.Detail)

	if title == "" {
		return detail
	}

	if detail == "" {
		return title
	}

	return title + "\n\n" + detail
}
