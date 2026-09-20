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
)

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
		Disease:     petData.PetDisease,
		Health:      petData.PetHealth,
		Description: petData.Description,
	}

	items := make([]promptProduct, 0, len(products))
	for _, item := range products {
		items = append(items, promptProduct{
			ProductID:   item.ProductID,
			Category:    item.CategoryName,
			Name:        item.ProductName,
			Description: item.Description,
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
					for _, part := range candidate.Content.Parts {
						text += part.Text
					}
				}

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
