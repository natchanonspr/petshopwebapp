package category

import "time"

type Category struct {
	CategoryID   int64     `gorm:"primaryKey;autoIncrement" json:"category_id"`
	CategoryName string    `gorm:"not null;unique" json:"category_name"`
	CreatedAt    time.Time `json:"created_at"`
}

type CategoryRequest struct {
	CategoryName string `json:"category_name"`
}
