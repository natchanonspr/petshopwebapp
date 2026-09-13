package order

import "time"

type Order struct {
	OrderID       int64     `gorm:"primaryKey;autoIncrement" json:"order_id"`
	UserID        int64     `gorm:"not null" json:"user_id"`
	OrderAddress  string    `gorm:"type:jsonb;not null" json:"address_snapshot"`
	TotalAmount   float64   `gorm:"type:numeric(10,2);not null" json:"total_amount"`
	OrderStatus   string    `gorm:"not null;default:'pending'" json:"order_status"`
	PaymentMethod string    `json:"payment_method"`
	PaymentStatus string    `gorm:"not null;default:'unpaid'" json:"payment_status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	Items []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
}

type OrderItem struct {
	OrderItemID   int64   `gorm:"primaryKey;autoIncrement" json:"order_item_id"`
	OrderID       int64   `gorm:"not null" json:"order_id"`
	ProductID     int64   `gorm:"not null" json:"product_id"`
	OrderQuantity int64   `gorm:"not null" json:"order_quantity"`
	OrderPrice    float64 `gorm:"type:numeric(10,2);not null" json:"order_price"`
}

type CreateOrderRequest struct {
	AddressID     int64  `json:"address_id"`
	PaymentMethod string `json:"payment_method"`
}
