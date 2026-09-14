package user

import (
	"gorm.io/gorm"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

func CreateUser(user *User) error {
	return db.Create(user).Error
}

func GetUserByID(userID int64) (*User, error) {
	var user User

	if err := db.First(&user, userID).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func UpdateUser(user *User) error {
	return db.Model(user).Updates(map[string]interface{}{
		"username":         user.Username,
		"user_email":       user.UserEmail,
		"user_phone":       user.UserPhone,
		"user_picture_url": user.UserPictureURL,
	}).Error
}

func DeleteUser(userID int64) error {
	return db.Delete(&User{}, userID).Error
}
