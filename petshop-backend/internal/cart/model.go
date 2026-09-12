package cart

import "time"

type Cart struct {
	CartItemID   int64     `gorm:"primaryKey;autoIncrement" json:"cart_item_id"`
	UserID       int64     `gorm:"not null" json:"user_id"`
	ProductID    int64     `gorm:"not null" json:"product_id"`
	CartQuantity int64     `gorm:"not null" json:"cart_quantity"`
	CreatedAt    time.Time `json:"created_at"`
}

type AddItemRequest struct {
	ProductID    int64 `json:"product_id"`
	CartQuantity int64 `json:"cart_quantity"`
}

type UpdateItemRequest struct {
	CartQuantity int64 `json:"cart_quantity"`
}
