package ai

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"petshop-backend/internal/pet"
	"petshop-backend/internal/product"
)

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

func convertProductData(input []product.Product) []ProductData {
	result := make([]ProductData, 0, len(input))
	for _, item := range input {
		result = append(result, ProductData{
			ProductID:     item.ProductID,
			CategoryID:    item.CategoryID,
			CategoryName:  item.CategoryName,
			ProductName:   item.ProductName,
			ProductPrice:  item.ProductPrice,
			ProductStock:  item.ProductStock,
			ProductImage:  item.ProductImage,
			Description:   item.Description,
			ProductStatus: item.ProductStatus,
		})
	}

	return result
}

// MaxFieldLen จำกัดความของข้อความก่อนส่งให้ AI เพื่อลดการใช้ Token
const maxFieldLen = 200

func truncate(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max]) + "..."
}

// ข้อมูลฟิลย่อยที่ให้ AI ตัดสินใจ
type promptPet struct {
	Species     string  `json:"species"`
	Breed       string  `json:"breed"`
	Weight      float64 `json:"weight_kg"`
	Gender      string  `json:"gender"`
	Age         string  `json:"age"`
	Neutered    bool    `json:"neutered"`
	Disease     string  `json:"disease,omitempty"`
	Health      string  `json:"health,omitempty"`
	Description string  `json:"note,omitempty"`
}

type promptProduct struct {
	ProductID   int64  `json:"id"`
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"desc,omitempty"`
}

func buildPrompt(petData PetData, products []ProductData) string {
	pet := promptPet{
		Species:     petData.PetSpecies,
		Breed:       petData.PetBreed,
		Weight:      petData.PetWeight,
		Gender:      petData.PetGender,
		Age:         petData.PetAge,
		Neutered:    petData.PetNeutered,
		Disease:     truncate(petData.PetDisease, maxFieldLen),
		Health:      truncate(petData.PetHealth, maxFieldLen),
		Description: truncate(petData.Description, maxFieldLen),
	}

	items := make([]promptProduct, 0, len(products))
	for _, item := range products {
		items = append(items, promptProduct{
			ProductID:   item.ProductID,
			Category:    item.CategoryName,
			Name:        item.ProductName,
			Description: truncate(item.Description, maxFieldLen),
		})
	}

	petJSON, _ := json.Marshal(pet)
	productsJSON, _ := json.Marshal(items)

	return fmt.Sprintf(`คุณเป็น AI ผู้ช่วยแนะนำสินค้าในร้าน Pet Shop
	หน้าที่: วิเคราะห์ข้อมูลสัตว์เลี้ยงและเลือกสินค้าที่เหมาะสมที่สุดจากรายการสินค้าที่ให้เท่านั้น
	ข้อมูลสัตว์เลี้ยง:%s
	รายการสินค้า:%s
	กติกา:
		1. เลือกสินค้าได้ไม่เกิน 5 รายการ
		2. เลือกเฉพาะ product_id ที่มีอยู่ในรายการสินค้าเท่านั้น
		3. ห้ามสร้าง product_id ใหม่
		4. พิจารณาประเภทสัตว์ สายพันธุ์ น้ำหนัก อายุ เพศ การทำหมัน โรค สุขภาพ และรายละเอียด
		5. พิจารณาความเหมาะสมของสินค้าและรายละเอียดสินค้า
		6. อย่าแนะนำสินค้าที่ไม่เกี่ยวข้องกับสัตว์เลี้ยง
		7. อย่าวินิจฉัยโรค
		8. ห้ามอ้างว่าสินค้ารักษาโรคได้
		9. ถ้าข้อมูลไม่เพียงพอ ให้ใช้ข้อมูลที่มีและเลือกเฉพาะสินค้าที่เหมาะสมจริง
		10. ถ้าไม่มีสินค้าที่เหมาะสม ให้คืน recommendations เป็น []
		11. reason ต้องสั้น อ่านง่าย และอธิบายว่าเหตุใดสินค้านี้จึงเหมาะ
	ตอบ JSON เท่านั้น:{
  		"recommendations": [{
     		 "product_id": 1,
    		  "reason": "เหตุผล" 
	}]}`, string(petJSON), string(productsJSON))
}

func callAI(prompt string) ([]Recommendation, error) {
	apiKey := strings.TrimSpace(os.Getenv("AI_API_KEY"))
	if apiKey == "" {
		return nil, errors.New("AI_API_KEY is not configured")
	}

	model := strings.TrimSpace(os.Getenv("AI_MODEL"))

	if model == "" {
		return nil, errors.New("AI_MODEL is not configured")
	}

	requestBody := AIRequest{
		Contents: []AIContent{
			{
				Parts: []AIPart{
					{
						Text: prompt,
					},
				},
			},
		},
		GenerationConfig: AIGenerationConfig{
			MaxOutputTokens: 500,
		},
	}
	payload, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		model,
		apiKey,
	), bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		var body map[string]any

		_ = json.NewDecoder(res.Body).Decode(&body)

		data, _ := json.Marshal(body)

		return nil, fmt.Errorf("gemini api error: status=%d body=%s", res.StatusCode, string(data))
	}

	var response AIResponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}

	var text string

	for _, candidate := range response.Candidates {
		for _, part := range candidate.Content.Parts {
			text += part.Text
		}
	}

	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	var result struct {
		Recommendations []Recommendation `json:"recommendations"`
	}

	if err := json.Unmarshal([]byte(text), &result); err != nil {
		return nil, fmt.Errorf(
			"invalid AI JSON response: %w",
			err,
		)
	}

	return result.Recommendations, nil
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
		return &RecommendationResponse{Pet: petData, Recommendations: []Recommendation{}}, nil
	}

	prompt := buildPrompt(petData, productData)

	recommendations, err := callAI(prompt)
	if err != nil {
		return nil, err
	}

	// ตรวจสอบ product_id จาก AI อีกครั้ง
	validProductIDs := make(map[int64]bool, len(products))

	for _, item := range products {
		validProductIDs[item.ProductID] = true
	}

	filtered := make([]Recommendation, 0, len(recommendations))
	seen := make(map[int64]bool)

	for _, recommendation := range recommendations {
		if !validProductIDs[recommendation.ProductID] {
			continue
		}

		if seen[recommendation.ProductID] {
			continue
		}

		seen[recommendation.ProductID] = true

		filtered = append(filtered, recommendation)

		if len(filtered) >= 5 {
			break
		}
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
