package category

import (
	"gorm.io/gorm"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

// เพิ่มประเภทสินค้า
func CreateCategory(category *Category) error {
	return db.Create(category).Error
}

// รายละเอียดประเภทสินค้า
func GetAllCategories() ([]Category, error) {
	var categories []Category
	err := db.Order("category_name asc").Find(&categories).Error
	return categories, err
}

// รายละเอียดสินค้าอันเดียว
func GetCategory(categoryID int64) (*Category, error) {
	var category Category
	err := db.First(&category, categoryID).Error
	if err != nil {
		return nil, err
	}

	return &category, nil
}

func UpdateCategory(category *Category) error {
	return db.Model(category).Updates(*category).Error
}

func DeleteCategory(categoryID int64) error {
	return db.Delete(&Category{}, categoryID).Error
}
