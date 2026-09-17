package ai

import "time"

type PetData struct {
	PetID        int64   `json:"pet_id"`
	UserID       int64   `json:"user_id"`
	PetName      string  `json:"pet_name"`
	PetSpecies   string  `json:"pet_species"`
	PetBreed     string  `json:"pet_breed"`
	PetWeight    float64 `json:"pet_weight"`
	PetGender    string  `json:"pet_gender"`
	PetBirthdate string  `json:"pet_birthdate"`
	PetAge       string  `json:"pet_age"`
	PetNeutered  bool    `json:"pet_neutered"`
	PetDisease   string  `json:"pet_disease"`
	PetHealth    string  `json:"pet_health"`
	Description  string  `json:"description"`
}

type ProductData struct {
	ProductID     int64   `json:"product_id"`
	CategoryID    int64   `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	ProductName   string  `json:"product_name"`
	ProductPrice  float64 `json:"product_price"`
	ProductStock  int64   `json:"product_stock"`
	ProductImage  string  `json:"product_image"`
	Description   string  `json:"description"`
	ProductStatus bool    `json:"product_status"`
}

type Recommendation struct {
	ProductID int64        `json:"product_id"`
	Reason    string       `json:"reason"`
	Product   *ProductData `json:"product"`
}

type RecommendationResponse struct {
	Pet             PetData          `json:"pet"`
	Recommendations []Recommendation `json:"recommendations"`
}

type AIRequest struct {
	Contents         []AIContent        `json:"contents"`
	GenerationConfig AIGenerationConfig `json:"generationConfig"`
}

type AIContent struct {
	Parts []AIPart `json:"parts"`
}

type AIPart struct {
	Text string `json:"text"`
}

type AIGenerationConfig struct {
	MaxOutputTokens  int    `json:"maxOutputTokens"`
	ResponseMimeType string `json:"responseMimeType,omitempty"`
}

type AIResponse struct {
	Candidates []AICandidate `json:"candidates"`
}

type AICandidate struct {
	Content      AIContent `json:"content"`
	FinishReason string    `json:"finishReason"`
}

type AIRecommendation struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int64     `json:"user_id"`
	PetID     int64     `json:"pet_id"`
	ProductID int64     `json:"product_id"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}

type AIRecommendationHistoryItem struct {
	ID           int64     `json:"id"`
	PetID        int64     `json:"pet_id"`
	PetName      string    `json:"pet_name"`
	ProductID    int64     `json:"product_id"`
	ProductName  string    `json:"product_name"`
	ProductImage string    `json:"product_image"`
	ProductPrice float64   `json:"product_price"`
	CategoryName string    `json:"category_name"`
	Reason       string    `json:"reason"`
	CreatedAt    time.Time `json:"created_at"`
}
