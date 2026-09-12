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
