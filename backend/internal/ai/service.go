package ai

import (
	"fmt"
	"time"

	"petshop-backend/internal/pet"
	"petshop-backend/internal/product"
)

// แปลงข้อมูล pet ไปให้ AI
func convertPetData(input *pet.Pet) PetData {
	return PetData{
		PetID:        input.PetID,
		UserID:       input.UserID,
		PetName:      input.PetName,
		PetSpecies:   input.PetSpecies,
		PetBreed:     input.PetBreed,
		PetWeight:    input.PetWeight,
		PetGender:    input.PetGender,
		PetBirthdate: input.PetBirthdate.Format("2006-01-02"),
		PetAge:       calculateAge(input.PetBirthdate),
		PetNeutered:  input.PetNeutered,
		PetDisease:   input.PetDisease,
		PetHealth:    input.PetHealth,
		Description:  input.Description,
	}
}

// แปลงข้อมูล product ไปให้ AI
func convertProductData(input []product.Product) []ProductData {
	result := make([]ProductData, 0, len(input))
	for _, item := range input {
		result = append(result, ProductData{
			ProductID:          item.ProductID,
			CategoryID:         item.CategoryID,
			CategoryName:       item.CategoryName,
			ProductName:        item.ProductName,
			ProductPrice:       item.ProductPrice,
			ProductKcalPer100g: item.ProductKcalPer100g,
			ProductStock:       item.ProductStock,
			ProductImage:       item.ProductImage,
			Description:        item.Description,
			ProductStatus:      item.ProductStatus,
		})
	}

	return result
}

func GetRecommendationsService(userID int64, petID int64) (*RecommendationResponse, error) {
	selectedPet, err := GetPetForUser(userID, petID)
	if err != nil {
		return nil, err
	}

	products, err := GetProductsForRecommendation()
	if err != nil {
		return nil, err
	}

	petData := convertPetData(selectedPet)
	productData := convertProductData(products)

	if len(productData) == 0 {
		return &RecommendationResponse{
			Pet:             petData,
			Recommendations: []Recommendation{},
		}, nil
	}

	candidateProducts := filterProductsForPet(petData, productData)

	if len(candidateProducts) == 0 {
		return &RecommendationResponse{
			Pet:             petData,
			Recommendations: []Recommendation{},
		}, nil
	}

	fmt.Printf(
		"AI pre-filter: %d products -> %d candidates\n",
		len(productData),
		len(candidateProducts),
	)

	prompt := buildPrompt(petData, candidateProducts)

	recommendations, err := callAI(prompt)
	if err != nil {
		return nil, err
	}

	// ตรวจสอบ product_id จาก AI อีกครั้ง
	productByID := make(map[int64]ProductData, len(candidateProducts))

	for _, item := range candidateProducts {
		productByID[item.ProductID] = item
	}

	filtered := make([]Recommendation, 0, len(recommendations))
	seen := make(map[int64]bool)

	for _, recommendation := range recommendations {
		item, ok := productByID[recommendation.ProductID]
		if !ok {
			continue
		}

		if seen[recommendation.ProductID] {
			continue
		}

		recommendation.Product = &item
		dailyKcal, dailyGrams, gramsPerFood, foodPerDay :=
			calculateFoodAmount(
				petData,
				item.ProductKcalPer100g,
			)

		recommendation.DailyKcal = dailyKcal
		recommendation.DailyGrams = dailyGrams
		recommendation.GramsPerFood = gramsPerFood
		recommendation.FoodPerDay = foodPerDay

		seen[recommendation.ProductID] = true

		filtered = append(filtered, recommendation)

		if len(filtered) >= 3 {
			break
		}
	}

	if err := SaveAIRecommendations(userID, petID, filtered); err != nil {
		return nil, err
	}

	return &RecommendationResponse{Pet: petData, Recommendations: filtered}, nil
}

func calculateAge(birthdate time.Time) string {
	now := time.Now()

	if birthdate.After(now) {
		return "ไม่ทราบอายุ"
	}

	years := now.Year() - birthdate.Year()
	months := int(now.Month()) - int(birthdate.Month())

	if now.Day() < birthdate.Day() {
		months--
	}

	if months < 0 {
		years--
		months += 12
	}

	if years > 0 {
		if months == 0 {
			return fmt.Sprintf("%d ปี", years)
		}
		return fmt.Sprintf("%d ปี %d เดือน", years, months)
	}

	return fmt.Sprintf("%d เดือน", months)
}
