package ai

import (
	"sort"
	"strings"
	"time"
)

// จำกัดสินค้าที่จะส่งให้ gemini
const maxCandidateProducts = 20

// เช็คว่ามีคำตอบที่ต้องการไหม
func containsAny(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}

// หาช่วงวัย
func getLifeStage(birthdate string) string {
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

// แบ่งขนาด
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

// ตารางกฎ เช่น ถ้าสัตว์มีคำนี้ และสินค้าเป็นคำนี้ ให้คะแนนเท่านี้
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

// คำนวณคะแนน
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

// กรองสินค้า
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

	lifeStage := getLifeStage(petData.PetBirthdate)

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
