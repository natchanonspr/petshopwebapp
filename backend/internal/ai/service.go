package ai

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"sort"
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

const maxCandidateProducts = 20

func containsAny(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}

	return false
}

func getLifeStage(birthdate string, species string) string {
	born, err := time.Parse("2006-01-02", birthdate)
	if err != nil {
		return ""
	}

	now := time.Now()

	years := now.Year() - born.Year()

	if now.Month() < born.Month() ||
		(now.Month() == born.Month() && now.Day() < born.Day()) {
		years--
	}

	if years < 1 {
		return "young"
	}

	if years >= 7 {
		return "senior"
	}

	return "adult"
}

func getSizeGroup(weight float64, species string) string {
	switch species {
	case "สุนัข":
		switch {
		case weight <= 10:
			return "small"
		case weight <= 25:
			return "medium"
		default:
			return "large"
		}

	case "แมว":
		switch {
		case weight <= 4:
			return "small"
		case weight <= 6:
			return "medium"
		default:
			return "large"
		}
	}

	return ""
}

type nutritionRule struct {
	petKeywords     []string
	productKeywords []string
	score           int
}

var nutritionRules = []nutritionRule{
	{
		petKeywords: []string{
			"ควบคุมน้ำหนัก",
			"น้ำหนักเกิน",
			"น้ำหนักเยอะ",
			"อ้วน",
			"weight control",
			"weight management",
		},
		productKeywords: []string{
			"ควบคุมน้ำหนัก",
			"weight control",
			"weight management",
			"light",
		},
		score: 4,
	},
	{
		petKeywords: []string{
			"ย่อยอาหาร",
			"ระบบย่อย",
			"ท้องอ่อน",
			"ย่อยง่าย",
			"อาหารย่อยง่าย",
			"sensitive digestion",
			"digestive",
		},
		productKeywords: []string{
			"ย่อยอาหาร",
			"ย่อยง่าย",
			"digestive",
			"sensitive digestion",
		},
		score: 4,
	},
	{
		petKeywords: []string{
			"ผิวหนัง",
			"ขน",
			"ผิวแพ้ง่าย",
			"แพ้ง่าย",
			"sensitive skin",
		},
		productKeywords: []string{
			"ผิวหนัง",
			"บำรุงขน",
			"skin",
			"coat",
			"sensitive skin",
		},
		score: 3,
	},
	{
		petKeywords: []string{
			"ทำหมัน",
			"sterilized",
			"neutered",
		},
		productKeywords: []string{
			"ทำหมัน",
			"sterilized",
			"neutered",
		},
		score: 3,
	},
	{
		petKeywords: []string{
			"ทางเดินปัสสาวะ",
			"ปัสสาวะ",
			"urinary",
		},
		productKeywords: []string{
			"urinary",
			"ทางเดินปัสสาวะ",
			"ปัสสาวะ",
		},
		score: 3,
	},
}

func scoreNutritionMatch(petText string, productText string) int {
	score := 0

	for _, rule := range nutritionRules {
		if !containsAny(petText, rule.petKeywords) {
			continue
		}

		if containsAny(productText, rule.productKeywords) {
			score += rule.score
		}
	}

	return score
}

func filterProductsForPet(petData PetData, products []ProductData) []ProductData {
	var speciesKeywords []string
	var stageKeywords []string

	switch petData.PetSpecies {
	case "สุนัข":
		speciesKeywords = []string{
			"สุนัข",
			"หมา",
			"dog",
			"puppy",
		}

	case "แมว":
		speciesKeywords = []string{
			"แมว",
			"cat",
			"kitten",
		}

	default:
		return products
	}

	lifeStage := getLifeStage(
		petData.PetBirthdate,
		petData.PetSpecies,
	)

	switch lifeStage {
	case "young":
		if petData.PetSpecies == "สุนัข" {
			stageKeywords = []string{
				"puppy",
				"ลูกสุนัข",
				"ลูก",
				"junior",
			}
		} else {
			stageKeywords = []string{
				"kitten",
				"ลูกแมว",
				"ลูก",
				"junior",
			}
		}

	case "adult":
		stageKeywords = []string{
			"adult",
			"โต",
			"ผู้ใหญ่",
			"maintenance",
		}

	case "senior":
		stageKeywords = []string{
			"senior",
			"สูงวัย",
			"แก่",
		}
	}

	sizeGroup := getSizeGroup(
		petData.PetWeight,
		petData.PetSpecies,
	)

	sizeKeywords := map[string][]string{
		"small": {
			"small",
			"mini",
			"เล็ก",
		},
		"medium": {
			"medium",
			"กลาง",
		},
		"large": {
			"large",
			"maxi",
			"giant",
			"ใหญ่",
		},
	}

	type scoredProduct struct {
		product ProductData
		score   int
	}

	candidates := make([]scoredProduct, 0)

	breed := strings.ToLower(
		strings.TrimSpace(petData.PetBreed),
	)

	for _, item := range products {
		category := strings.ToLower(
			strings.TrimSpace(item.CategoryName),
		)
		name := strings.ToLower(
			strings.TrimSpace(item.ProductName),
		)
		description := strings.ToLower(
			strings.TrimSpace(item.Description),
		)
		petNutritionText := strings.ToLower(
			strings.Join(
				[]string{
					petData.PetDisease,
					petData.PetHealth,
					petData.Description,
				},
				" ",
			),
		)
		if petData.PetNeutered {
			petNutritionText += " ทำหมัน sterilized neutered"
		}

		text := category + " " + name + " " + description

		score := 0
		score += scoreNutritionMatch(
			petNutritionText,
			text,
		)

		// ต้องเกี่ยวข้องกับชนิดสัตว์ก่อน
		if containsAny(text, speciesKeywords) {
			score += 10
		} else if !containsAny(category, speciesKeywords) {
			continue
		}

		// ช่วงวัยใช้เป็น "คะแนน" ไม่ใช่ hard filter
		if len(stageKeywords) > 0 &&
			containsAny(text, stageKeywords) {
			score += 5
		}

		// ขนาด/น้ำหนักใช้เป็น "คะแนน"
		if keywords, ok := sizeKeywords[sizeGroup]; ok &&
			containsAny(text, keywords) {
			score += 3
		}

		// สายพันธุ์เป็นคะแนนเสริม
		if breed != "" &&
			breed != "ไม่แน่ใจ" &&
			strings.Contains(text, breed) {
			score += 4
		}

		candidates = append(candidates, scoredProduct{
			product: item,
			score:   score,
		})
	}

	if len(candidates) == 0 {
		return products
	}

	sort.SliceStable(candidates, func(i, j int) bool {
		return candidates[i].score > candidates[j].score
	})

	if len(candidates) > maxCandidateProducts {
		candidates = candidates[:maxCandidateProducts]
	}

	result := make([]ProductData, 0, len(candidates))

	for _, candidate := range candidates {
		result = append(result, candidate.product)
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
		1. เลือกสินค้าได้ไม่เกิน 3 รายการ
		2. เลือกเฉพาะ product_id ที่มีอยู่ในรายการสินค้าเท่านั้น
		3. ห้ามสร้าง product_id ใหม่
		4. พิจารณาประเภทสัตว์ สายพันธุ์ น้ำหนัก อายุ เพศ การทำหมัน โรค สุขภาพ และรายละเอียด
		5. พิจารณาความเหมาะสมของสินค้าและรายละเอียดสินค้า
		6. อย่าแนะนำสินค้าที่ไม่เกี่ยวข้องกับสัตว์เลี้ยง
		7. อย่าวินิจฉัยโรค
		8. ห้ามอ้างว่าสินค้ารักษาโรคได้
		9. ถ้าข้อมูลไม่เพียงพอ ให้ใช้ข้อมูลที่มีและเลือกเฉพาะสินค้าที่เหมาะสมจริง
		10. ถ้าไม่มีสินค้าที่เหมาะสม ให้คืน recommendations เป็น []
		11. reason ต้องสั้น อ่านง่าย ไม่เกิน 100 ตัวอักษร และอธิบายว่าเหตุใดสินค้านี้จึงเหมาะ
	ตอบ JSON เท่านั้น:{
  		"recommendations": [
		{
     		 "product_id": 1,
    		  "reason": "เหตุผล" 
		}
		]}`, string(petJSON), string(productsJSON))
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
			MaxOutputTokens:  2000,
			ResponseMimeType: "application/json",
		},
	}
	payload, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 60 * time.Second}

	const maxAttempts = 3

	var lastErr error

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		req, err := http.NewRequest(
			http.MethodPost,
			fmt.Sprintf(
				"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
				model,
				apiKey,
			),
			bytes.NewReader(payload),
		)
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/json")

		res, err := client.Do(req)
		if err != nil {
			lastErr = err
		} else {
			if res.StatusCode >= 200 && res.StatusCode < 300 {
				var response AIResponse

				err := json.NewDecoder(res.Body).Decode(&response)
				res.Body.Close()

				if err != nil {
					return nil, err
				}

				var text string

				for _, candidate := range response.Candidates {
					fmt.Printf("Gemini FinishReason: %s\n", candidate.FinishReason)

					for _, part := range candidate.Content.Parts {
						text += part.Text
					}
				}

				fmt.Printf("Gemini Raw Text: %q\n", text)

				text = strings.TrimSpace(text)
				text = strings.TrimPrefix(text, "```json")
				text = strings.TrimPrefix(text, "```")
				text = strings.TrimSuffix(text, "```")
				text = strings.TrimSpace(text)

				if text == "" {
					return nil, errors.New("AI returned empty response")
				}

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

			var body map[string]any

			_ = json.NewDecoder(res.Body).Decode(&body)
			res.Body.Close()

			data, _ := json.Marshal(body)

			lastErr = fmt.Errorf(
				"gemini api error: status=%d body=%s",
				res.StatusCode,
				string(data),
			)

			if res.StatusCode != http.StatusTooManyRequests &&
				res.StatusCode < 500 {
				return nil, lastErr
			}
		}

		if attempt < maxAttempts {
			wait := time.Duration(1<<uint(attempt-1)) * time.Second

			fmt.Printf(
				"Gemini request failed (attempt %d/%d), retrying in %s...\n",
				attempt,
				maxAttempts,
				wait,
			)

			time.Sleep(wait)
		}
	}

	return nil, fmt.Errorf(
		"Gemini unavailable after %d attempts: %w",
		maxAttempts,
		lastErr,
	)
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
	validProductIDs := make(map[int64]bool, len(candidateProducts))

	productByID := make(map[int64]ProductData, len(candidateProducts))

	for _, item := range candidateProducts {
		validProductIDs[item.ProductID] = true
		productByID[item.ProductID] = item
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

		item, ok := productByID[recommendation.ProductID]
		if !ok {
			continue
		}

		recommendation.Product = &item

		seen[recommendation.ProductID] = true

		filtered = append(filtered, recommendation)

		if len(filtered) >= 5 {
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
