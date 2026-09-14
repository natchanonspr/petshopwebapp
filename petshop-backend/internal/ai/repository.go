package ai

import (
	"errors"

	"petshop-backend/internal/pet"
	"petshop-backend/internal/product"

	"gorm.io/gorm"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

func GetPetForUser(userID int64, petID int64) (*pet.Pet, error) {
	if db == nil {
		return nil, errors.New("ai database is not initialized")
	}

	var selectedPet pet.Pet

	result := db.
		Where("pet_id = ? AND user_id = ?", petID, userID).
		First(&selectedPet)

	if result.Error != nil {
		return nil, result.Error
	}

	return &selectedPet, nil
}

func GetProductsForRecommendation() ([]product.Product, error) {
	if db == nil {
		return nil, errors.New("ai database is not initialized")
	}

	var products []product.Product

	result := db.
		Where("product_status = ?", true).
		Where("product_stock > ?", 0).
		Order("created_at DESC").
		Find(&products)

	if result.Error != nil {
		return nil, result.Error
	}

	return products, nil
}
