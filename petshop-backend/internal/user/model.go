package user

import (
	"time"
)

type User struct {
	UserID         int64     `gorm:"primaryKey;autoIncrement" json:"user_id"`
	Username       string    `json:"username"`
	UserPassword   string    `json:"-"`
	UserEmail      string    `gorm:"unique" json:"email"`
	UserPhone      string    `gorm:"unique" json:"phone"`
	UserLineID     *string   `gorm:"uniqueIndex" json:"line_user_id"`
	UserPictureURL string    `json:"picture_url"`
	UserRole       string    `gorm:"not null;default:'user'" json:"role"`
	CreatedAt      time.Time `json:"created_at"`
}

type LineLoginRequest struct {
	UserLineID      string `json:"line_user_id"`
	DisplayUserName string `json:"display_name"`
	UserPictureURL  string `json:"picture_url"`
}

type UserRegister struct {
	Username     string `json:"username"`
	UserEmail    string `json:"email"`
	UserPhone    string `json:"phone"`
	UserPassword string `json:"password"`
}

type UserLogin struct {
	UserPhone    string `json:"phone"`
	UserPassword string `json:"password"`
}
