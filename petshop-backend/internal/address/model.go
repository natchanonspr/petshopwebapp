package address

import "time"

type Address struct {
	AddressID     int64     `gorm:"primaryKey;autoIncrement" json:"address_id"`
	UserID        int64     `gorm:"not null" json:"user_id"`
	RecipientName string    `gorm:"not null" json:"recipient_name"`
	Phone         string    `gorm:"not null" json:"phone"`
	AddressLine   string    `gorm:"not null" json:"address_line"`
	Subdistrict   string    `gorm:"not null" json:"subdistrict"`
	District      string    `gorm:"not null" json:"district"`
	Province      string    `gorm:"not null" json:"province"`
	PostalCode    string    `gorm:"not null" json:"postal_code"`
	IsDefault     bool      `gorm:"not null;default:false" json:"is_default"`
	CreatedAt     time.Time `json:"created_at"`
}

type AddressRequest struct {
	RecipientName string `json:"recipient_name"`
	Phone         string `json:"phone"`
	AddressLine   string `json:"address_line"`
	Subdistrict   string `json:"subdistrict"`
	District      string `json:"district"`
	Province      string `json:"province"`
	PostalCode    string `json:"postal_code"`
	IsDefault     bool   `json:"is_default"`
}
