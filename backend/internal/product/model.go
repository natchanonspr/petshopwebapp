package product

import "time"

type Product struct {
	ProductID          int64     `gorm:"primaryKey;autoIncrement" json:"product_id"`
	CategoryID         int64     `gorm:"not null" json:"category_id"`
	CategoryName       string    `gorm:"->" json:"category_name"`
	ProductName        string    `gorm:"not null" json:"product_name"`
	ProductPrice       float64   `gorm:"not null" json:"product_price"`
	ProductKcalPer100g float64   `json:"product_kcal_per_100g"`
	ProductStock       int64     `gorm:"not null" json:"product_stock"`
	ProductImage       string    `json:"product_image"`
	Description        string    `json:"description"`
	ProductStatus      bool      `gorm:"not null;default:true" json:"product_status"`
	CreatedAt          time.Time `json:"created_at"`
}

type ProductRequest struct {
	CategoryID         int64   `json:"category_id"`
	ProductName        string  `json:"product_name"`
	ProductPrice       float64 `json:"product_price"`
	ProductKcalPer100g float64 `json:"product_kcal_per_100g"`
	ProductStock       int64   `json:"product_stock"`
	ProductImage       string  `json:"product_image"`
	Description        string  `json:"description"`
}
