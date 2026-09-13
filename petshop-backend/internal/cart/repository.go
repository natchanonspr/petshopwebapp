package cart

import (
	"gorm.io/gorm"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

func GetCart(userID int64) ([]Cart, error) {
	var cart []Cart
	err := db.Where("user_id = ?", userID).Order("created_at asc").Find(&cart).Error
	return cart, err
}

func GetCartByProduct(userID, productID int64) (*Cart, error) {
	var cart Cart
	err := db.Where("user_id = ? AND product_id = ?", userID, productID).First(&cart).Error
	if err != nil {
		return nil, err
	}
	return &cart, nil
}

func GetCartByID(cartID int64) (*Cart, error) {
	var cart Cart
	if err := db.First(&cart, cartID).Error; err != nil {
		return nil, err
	}

	return &cart, nil
}

func CreateCart(cart *Cart) error {
	return db.Create(cart).Error
}

func UpdateCart(cart *Cart) error {
	return db.Model(cart).Updates(*cart).Error
}

func DeleteCart(cartID int64) error {
	return db.Delete(&Cart{}, cartID).Error
}

// ล้างสินค้าทั้งหมดในตะกร้า
func ClearCart(tx *gorm.DB, userID int64) error {
	return tx.Where("userID = ?", userID).Delete(&Cart{}).Error
}
