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
		Table("products").
		Select("products.*, categories.category_name").
		Joins("LEFT JOIN categories ON categories.category_id = products.category_id").
		Where("products.product_status = ?", true).
		Where("products.product_stock > ?", 0).
		Order("products.created_at DESC").
		Find(&products)

	if result.Error != nil {
		return nil, result.Error
	}

	return products, nil
}

func SaveAIRecommendations(
	userID int64,
	petID int64,
	recommendations []Recommendation,
) error {
	if db == nil {
		return errors.New("ai database is not initialized")
	}

	if len(recommendations) == 0 {
		return nil
	}

	items := make([]AIRecommendation, 0, len(recommendations))

	for _, recommendation := range recommendations {
		items = append(items, AIRecommendation{
			UserID:    userID,
			PetID:     petID,
			ProductID: recommendation.ProductID,
			Reason:    recommendation.Reason,
		})
	}

	return db.Create(&items).Error
}

func GetAIRecommendationHistory(userID int64, petID *int64) ([]AIRecommendationHistoryItem, error) {
	if db == nil {
		return nil, errors.New("ai database is not initialized")
	}

	var history []AIRecommendationHistoryItem

	query := db.
		Table("ai_recommendations AS ar").
		Select(`
			ar.id,
			ar.pet_id,
			pets.pet_name,
			ar.product_id,
			products.product_name,
			products.product_image,
			products.product_price,
			categories.category_name,
			ar.reason,
			ar.created_at
		`).
		Joins("LEFT JOIN pets ON pets.pet_id = ar.pet_id").
		Joins("LEFT JOIN products ON products.product_id = ar.product_id").
		Joins("LEFT JOIN categories ON categories.category_id = products.category_id").
		Where("ar.user_id = ?", userID).
		Order("ar.created_at DESC")

	if petID != nil {
		query = query.Where("ar.pet_id = ?", *petID)
	}

	if err := query.Find(&history).Error; err != nil {
		return nil, err
	}

	return history, nil
}
