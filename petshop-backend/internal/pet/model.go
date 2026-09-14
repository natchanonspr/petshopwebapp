package pet

import "time"

type Pet struct {
	PetID        int64     `gorm:"primaryKey;autoIncrement" json:"pet_id"`
	UserID       int64     `gorm:"not null" json:"user_id"`
	PetName      string    `gorm:"not null" json:"pet_name"`
	PetSpecies   string    `gorm:"not null" json:"pet_species"`
	PetBreed     string    `gorm:"not null" json:"pet_breed"`
	PetWeight    float64   `gorm:"not null" json:"pet_weight"`
	PetGender    string    `gorm:"not null" json:"pet_gender"`
	PetBirthdate time.Time `gorm:"type:date;not null" json:"pet_birthdate"`
	PetNeutered  bool      `gorm:"not null" json:"pet_neutered"`
	PetDisease   string    `json:"pet_disease"`
	PetHealth      string    `json:"pet_health"`
	PetAppearance  string    `json:"pet_appearance"`
	PetPersonality string    `json:"pet_personality"`
	Description    string    `json:"description"`
	PetImage       string    `json:"image"`
	CreatedAt    time.Time `json:"created_at"`
}

type PetRequest struct {
	PetName      string  `json:"pet_name"`
	PetSpecies   string  `json:"pet_species"`
	PetBreed     string  `json:"pet_breed"`
	PetWeight    float64 `json:"pet_weight"`
	PetGender    string  `json:"pet_gender"`
	PetBirthdate string  `json:"pet_birthdate"`
	PetNeutered  bool    `json:"pet_neutered"`
	PetDisease   string  `json:"pet_disease"`
	PetHealth      string  `json:"pet_health"`
	PetAppearance  string  `json:"pet_appearance"`
	PetPersonality string  `json:"pet_personality"`
	Description    string  `json:"description"`
	PetImage       string  `json:"image"`
}
