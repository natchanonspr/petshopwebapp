package notification

import "time"

type Notification struct {
	NotificationID  int64     `gorm:"primaryKey;autoIncrement" json:"notification_id"`
	CreatedByUserID int64     `gorm:"not null;index" json:"created_by_user_id"`
	Type            string    `gorm:"not null" json:"type"`
	Title           string    `gorm:"not null" json:"title"`
	Detail          string    `gorm:"type:text;not null" json:"detail"`
	Icon            string    `json:"icon"`
	OrderID         *int64    `json:"order_id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	Recipients []NotificationRecipient `gorm:"foreignKey:NotificationID" json:"recipients,omitempty"`
}

type NotificationRecipient struct {
	NotificationRecipientID int64      `gorm:"primaryKey;autoIncrement" json:"notification_recipient_id"`
	NotificationID          int64      `gorm:"not null;index" json:"notification_id"`
	UserID                  int64      `gorm:"not null;index" json:"user_id"`
	IsRead                  bool       `gorm:"not null;default:false" json:"is_read"`
	ReadAt                  *time.Time `json:"read_at"`
	CreatedAt               time.Time  `json:"created_at"`

	Notification Notification `gorm:"foreignKey:NotificationID;references:NotificationID" json:"notification"`
}

type CreateNotificationRequest struct {
	Audience string `json:"audience"`
	UserID   *int64 `json:"user_id"`
	Type     string `json:"type"`
	Title    string `json:"title"`
	Detail   string `json:"detail"`
	Icon     string `json:"icon"`
	OrderID  *int64 `json:"order_id"`
}

type NotificationResponse struct {
	NotificationID int64     `json:"notification_id"`
	Type           string    `json:"type"`
	Title          string    `json:"title"`
	Detail         string    `json:"detail"`
	Icon           string    `json:"icon"`
	OrderID        *int64    `json:"order_id"`
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
}

type AdminNotificationResponse struct {
	NotificationID int64     `json:"notification_id"`
	Type           string    `json:"type"`
	Title          string    `json:"title"`
	Detail         string    `json:"detail"`
	Icon           string    `json:"icon"`
	OrderID        *int64    `json:"order_id"`
	RecipientCount int       `json:"recipient_count"`
	CreatedAt      time.Time `json:"created_at"`
}
