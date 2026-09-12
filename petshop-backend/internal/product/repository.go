package product

import (
	"gorm.io/gorm"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

// เพิ่มสินค้า
func CreateProduct(product *Product) error {
	return db.Create(product).Error
}

// รายละเอียดสินค้าทั้งหมด
func GetAllProducts() ([]Product, error) {
	var products []Product
	err := db.Order("create_at desc").Find(&products).Error
	return products, err
}

func GetProduct(productID int64) (*Product, error) {
	var product Product
	err := db.First(&product, productID).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func UpdateProduct(product *Product) error {
	return db.Model(product).Updates(*product).Error
}

func DeleteProduct(productID int64) error {
	return db.Delete(&Product{}, productID).Error
}
