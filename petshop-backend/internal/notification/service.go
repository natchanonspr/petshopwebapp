package notification

import (
	"errors"
	"strings"
)

func CreateNotificationService(adminUserID int64, req *CreateNotificationRequest) error {
	if req == nil {
		return errors.New("invalid notification request")
	}

	req.Type = strings.TrimSpace(req.Type)
	req.Title = strings.TrimSpace(req.Title)
	req.Detail = strings.TrimSpace(req.Detail)
	req.Audience = strings.TrimSpace(req.Audience)

	if req.Type == "" {
		return errors.New("notification type is required")
	}

	if req.Title == "" {
		return errors.New("notification title is required")
	}

	if req.Detail == "" {
		return errors.New("notification detail is required")
	}

	if req.Audience == "" {
		req.Audience = "all"
	}

	notification := &Notification{
		CreatedByUserID: adminUserID,
		Type:            req.Type,
		Title:           req.Title,
		Detail:          req.Detail,
		Icon:            req.Icon,
		OrderID:         req.OrderID,
	}

	var userIDs []int64

	switch req.Audience {
	case "all":
		ids, err := GetAllUsers()
		if err != nil {
			return err
		}
		userIDs = ids

	case "user":
		if req.UserID == nil || *req.UserID <= 0 {
			return errors.New("user_id is required")
		}
		userIDs = []int64{*req.UserID}

	default:
		return errors.New("invalid notification audience")
	}

	recipients := make([]NotificationRecipient, 0, len(userIDs))
	for _, userID := range userIDs {
		recipients = append(recipients, NotificationRecipient{UserID: userID, IsRead: false})
	}

	return CreateNotification(notification, recipients)
}

func GetCustomerNotificationsService(userID int64) ([]NotificationResponse, error) {
	recipients, err := GetCustomerNotifications(userID)
	if err != nil {
		return nil, err
	}

	result := make([]NotificationResponse, 0, len(recipients))
	for _, recipient := range recipients {
		result = append(result, NotificationResponse{
			NotificationID: recipient.Notification.NotificationID,
			Type:           recipient.Notification.Type,
			Title:          recipient.Notification.Title,
			Detail:         recipient.Notification.Detail,
			Icon:           recipient.Notification.Icon,
			OrderID:        recipient.Notification.OrderID,
			IsRead:         recipient.IsRead,
			CreatedAt:      recipient.Notification.CreatedAt,
		})
	}

	return result, nil
}

func GetUnreadCountService(userID int64) (int64, error) {
	return GetUnreadCount(userID)
}

func MarkNotificationReadService(notificationID int64, userID int64) error {
	return MarkNotificationRead(notificationID, userID)
}

func MarkAllNotificationsReadService(userID int64) error {
	return MarkAllNotificationsRead(userID)
}

func GetAdminNotificationsService(adminUserID int64) ([]AdminNotificationResponse, error) {
	notifications, err := GetAdminNotifications(adminUserID)
	if err != nil {
		return nil, err
	}

	result := make([]AdminNotificationResponse, 0, len(notifications))
	for _, notification := range notifications {
		result = append(result, AdminNotificationResponse{
			NotificationID: notification.NotificationID,
			Type:           notification.Type,
			Title:          notification.Title,
			Detail:         notification.Detail,
			Icon:           notification.Icon,
			OrderID:        notification.OrderID,
			RecipientCount: len(notification.Recipients),
			CreatedAt:      notification.CreatedAt,
		},
		)
	}

	return result, nil
}

func DeleteAdminNotificationsService(adminUserID int64) error {
	return DeleteAdminNotifications(adminUserID)
}
