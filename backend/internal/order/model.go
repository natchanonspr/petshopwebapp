package order

import (
	"time"

	"petshop-backend/internal/user"
)

const (
	PaymentUnpaid      = "unpaid"
	PaymentWaitingSlip = "waiting_slip"
	PaymentReviewing   = "reviewing"
	PaymentPaid        = "paid"
	PaymentRejected    = "rejected"
)

const (
	OrderPending   = "pending"
	OrderConfirmed = "confirmed"
	OrderShipped   = "shipped"
	OrderDelivered = "delivered"
	OrderCancelled = "cancelled"
)

type Order struct {
	OrderID        int64   `gorm:"primaryKey;autoIncrement" json:"order_id"`
	UserID         int64   `gorm:"not null" json:"user_id"`
	OrderAddress   string  `gorm:"type:jsonb;not null" json:"address_snapshot"`
	TotalAmount    float64 `gorm:"type:numeric(10,2);not null" json:"total_amount"`
	SubtotalAmount float64 `gorm:"type:numeric(10,2);not null;default:0" json:"subtotal_amount"`
	DiscountAmount float64 `gorm:"type:numeric(10,2);not null;default:0" json:"discount_amount"`
	ShippingAmount float64 `gorm:"type:numeric(10,2);not null;default:0" json:"shipping_amount"`
	TaxAmount      float64 `gorm:"type:numeric(10,2);not null;default:0" json:"tax_amount"`
	CouponCode     string  `json:"coupon_code"`
	OrderStatus    string  `gorm:"not null;default:'pending'" json:"order_status"`
	PaymentMethod  string  `json:"payment_method"`
	PaymentStatus  string  `gorm:"not null;default:'unpaid'" json:"payment_status"`

	PaymentSlip            []byte     `gorm:"type:bytea" json:"-"`
	PaymentSlipContentType string     `json:"payment_slip_content_type"`
	PaymentSubmittedAt     *time.Time `json:"payment_submitted_at"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Items []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
	User  user.User   `gorm:"foreignKey:UserID;references:UserID" json:"user"`
}

type OrderItem struct {
	OrderItemID   int64   `gorm:"primaryKey;autoIncrement" json:"order_item_id"`
	OrderID       int64   `gorm:"not null" json:"order_id"`
	ProductID     int64   `gorm:"not null" json:"product_id"`
	ProductName   string  `gorm:"not null" json:"product_name"`
	ProductImage  string  `json:"product_image"`
	OrderQuantity int64   `gorm:"not null" json:"order_quantity"`
	OrderPrice    float64 `gorm:"type:numeric(10,2);not null" json:"order_price"`
}

type CreateOrderRequest struct {
	AddressID     int64  `json:"address_id"`
	PaymentMethod string `json:"payment_method"`
	CouponCode    string `json:"coupon_code"`
}
