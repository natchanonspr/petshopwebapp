package coupon

import "time"

type Coupon struct {
	CouponID     int64     `gorm:"primaryKey;autoIncrement" json:"coupon_id"`
	CouponCode   string    `gorm:"not null;unique" json:"coupon_code"`
	CouponTitle  string    `gorm:"not null" json:"coupon_title"`
	CouponType   string    `gorm:"not null" json:"coupon_type"`
	CouponValue  float64   `gorm:"not null;default:0" json:"coupon_value"`
	MinOrder     float64   `gorm:"not null;default:0" json:"min_order"`
	MaxDiscount  float64   `gorm:"not null;default:0" json:"max_discount"`
	UsageLimit   int64     `gorm:"not null;default:1" json:"usage_limit"`
	PerUserLimit int64     `gorm:"not null;default:1" json:"per_user_limit"`
	UsedCount    int64     `gorm:"not null;default:0" json:"used_count"`
	StartAt      time.Time `gorm:"not null" json:"start_at"`
	ExpireAt     time.Time `gorm:"not null" json:"expire_at"`
	Active       bool      `gorm:"not null;default:true" json:"active"`
	CreatedAt    time.Time `gorm:"not null" json:"created_at"`
}

// CouponType
const (
	TypeFixed        = "ส่วนลดคงที่"
	TypePercentage   = "เปอร์เซ็นต์"
	TypeFreeShipping = "ค่าส่ง"
)

type CouponRequest struct {
	CouponCode   string    `json:"coupon_code"`
	CouponTitle  string    `json:"coupon_title"`
	CouponType   string    `json:"coupon_type"`
	CouponValue  float64   `json:"coupon_value"`
	MinOrder     float64   `json:"min_order"`
	MaxDiscount  float64   `json:"max_discount"`
	UsageLimit   int64     `json:"usage_limit"`
	PerUserLimit int64     `json:"per_user_limit"`
	StartAt      time.Time `json:"start_at"`
	ExpireAt     time.Time `json:"expire_at"`
	Active       bool      `json:"active"`
}

type ApplyRequest struct {
	CouponCode string  `json:"coupon_code"`
	Subtotal   float64 `json:"subtotal"`
}

type ApplyResult struct {
	OK           bool    `json:"ok"`
	Reason       string  `json:"reason,omitempty"`
	Code         string  `json:"code,omitempty"`
	Amount       float64 `json:"amount"`
	FreeShipping bool    `json:"free_shipping"`
	Min          float64 `json:"min"`
	MaxDiscount  float64 `json:"max_discount"`
	PerUser      int64   `json:"per_user"`
}
