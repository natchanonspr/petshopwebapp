package user

import (
	"time"
)

type User struct {
	UserID     int64     `gorm:"primaryKey;autoIncrement" json:"user_id"`
	Username   string    `json:"username"`
	Password   string    `json:"password"`
	Email      string    `gorm:"unique" json:"email"`
	Phone      string    `gorm:"unique" json:"phone"`
	LineUserID *string   `gorm:"uniqueIndex" json:"line_user_id"`
	PictureURL string    `json:"picture_url"`
	Role       string    `gorm:"not null;default:'user'" json:"role"`
	CreatedAt  time.Time `json:"created_at"`
}

type LineLoginRequest struct {
	LineUserID  string `json:"line_user_id"`
	DisplayName string `json:"display_name"`
	PictureURL  string `json:"picture_url"`
}

type UserRegister struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type UserLogin struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}
