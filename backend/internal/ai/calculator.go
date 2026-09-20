package ai

import "math"

func calculateFoodAmount(petData PetData, kcalPer100g float64) (float64, float64, float64, int) {
	if petData.PetWeight <= 0 || kcalPer100g <= 0 {
		return 0, 0, 0, 0
	}

	rer := 70 * math.Pow(petData.PetWeight, 0.75)

	factor := 1.4

	switch getLifeStage(petData.PetBirthdate) {
	case "young":
		factor = 2.0
	case "senior":
		factor = 1.2
	case "adult":
		if petData.PetNeutered {
			factor = 1.4
		} else {
			factor = 1.6
		}
	}

	dailyKcal := math.Round(rer * factor)

	kcalPerGram := kcalPer100g / 100
	dailyGrams := math.Round(dailyKcal / kcalPerGram)

	foodPerDay := 2
	gramsPerFood := math.Round(dailyGrams / float64(foodPerDay))

	return dailyKcal, dailyGrams, gramsPerFood, foodPerDay
}
