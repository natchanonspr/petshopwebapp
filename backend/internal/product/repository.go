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
	err := db.
		Table("products").
		Select("products.*, categories.category_name").
		Joins("LEFT JOIN categories ON categories.category_id = products.category_id").
		Order("products.created_at desc").
		Find(&products).Error
	return products, err
}

func GetProduct(productID int64) (*Product, error) {
	var p Product
	err := db.
		Table("products").
		Select("products.*, categories.category_name").
		Joins("LEFT JOIN categories ON categories.category_id = products.category_id").
		Where("products.product_id = ?", productID).
		First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func UpdateProduct(product *Product) error {
	return db.Model(product).Updates(*product).Error
}

func DeleteProduct(productID int64) error {
	return db.Delete(&Product{}, productID).Error
}
