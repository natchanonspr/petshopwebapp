package notification

import (
	"gorm.io/gorm"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

func GetCustomerNotifications(userID int64) ([]NotificationRecipient, error) {
	var recipients []NotificationRecipient
	err := db.Preload("Notification").Where("user_id = ?", userID).Order("created_at DESC").Find(&recipients).Error
	return recipients, err
}

func GetUnreadCount(userID int64) (int64, error) {
	var count int64
	err := db.Model(&NotificationRecipient{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&count).Error
	return count, err
}

func MarkNotificationRead(notificationID int64, userID int64) error {
	result := db.Model(&NotificationRecipient{}).Where("notification_id = ? AND user_id = ?", notificationID, userID).Update("is_read", true)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func MarkAllNotificationsRead(userID int64) error {
	return db.Model(&NotificationRecipient{}).Where("user_id = ? AND is_read = ?", userID, false).Update("is_read", true).Error
}

func CreateNotification(notification *Notification, recipients []NotificationRecipient) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(notification).Error; err != nil {
			return err
		}

		for index := range recipients {
			recipients[index].NotificationID = notification.NotificationID
		}

		if len(recipients) > 0 {
			if err := tx.Create(&recipients).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func GetAllUsers() ([]int64, error) {
	var userIDs []int64
	err := db.Table("users").Where("user_role = ?", "user").Pluck("user_id", &userIDs).Error
	return userIDs, err
}

func GetAdminNotifications(adminUserID int64) ([]Notification, error) {
	var notifications []Notification
	err := db.Preload("Recipients").Where("created_by_user_id = ?", adminUserID).Order("created_at DESC").Find(&notifications).Error
	return notifications, err
}

func DeleteAdminNotifications(adminUserID int64) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var notifications []Notification
		if err := tx.Where("created_by_user_id = ?", adminUserID).Find(&notifications).Error; err != nil {
			return err
		}

		if len(notifications) == 0 {
			return nil
		}

		ids := make([]int64, 0, len(notifications))

		for _, notification := range notifications {
			ids = append(ids, notification.NotificationID)
		}

		if err := tx.Where("notification_id IN ?", ids).Delete(&NotificationRecipient{}).Error; err != nil {
			return err
		}

		if err := tx.Where("notification_id IN ?", ids).Delete(&Notification{}).Error; err != nil {
			return err
		}

		return nil
	})
}
