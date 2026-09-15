package pet

import (
	"errors"
	"time"
)

var ErrPet = errors.New("ไม่ใช่สัตว์เลี้ยงของคุณ")

func parseBirthdate(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, errors.New("missing pet_birthdate")
	}
	return time.Parse("2006-01-02", s)
}

func CreatePetService(userID int64, req *PetRequest) (*Pet, error) {
	birthdate, err := parseBirthdate(req.PetBirthdate)
	if err != nil {
		return nil, err
	}

	pet := &Pet{
		UserID:       userID,
		PetName:      req.PetName,
		PetSpecies:   req.PetSpecies,
		PetBreed:     req.PetBreed,
		PetWeight:    req.PetWeight,
		PetGender:    req.PetGender,
		PetBirthdate: birthdate,
		PetNeutered:  req.PetNeutered,
		PetDisease:   req.PetDisease,
		PetHealth:      req.PetHealth,
		PetAppearance:  req.PetAppearance,
		PetPersonality: req.PetPersonality,
		Description:    req.Description,
		PetImage:       req.PetImage,
	}

	if err := CreatePet(pet); err != nil {
		return nil, err
	}
	return pet, nil
}

func ListPet(userID int64) ([]Pet, error) {
	pets, err := GetAllPets(userID)
	if err != nil {
		return nil, err
	}
	return pets, nil
}

func UpdatePetService(userID, petID int64, req *PetRequest) (*Pet, error) {
	pet, err := GetPet(petID)
	if err != nil {
		return nil, err
	}

	if pet.UserID != userID {
		return nil, ErrPet
	}

	birthdate, err := parseBirthdate(req.PetBirthdate)
	if err != nil {
		return nil, err
	}

	pet.PetName = req.PetName
	pet.PetSpecies = req.PetSpecies
	pet.PetBreed = req.PetBreed
	pet.PetWeight = req.PetWeight
	pet.PetGender = req.PetGender
	pet.PetBirthdate = birthdate
	pet.PetNeutered = req.PetNeutered
	pet.PetDisease = req.PetDisease
	pet.PetHealth = req.PetHealth
	pet.PetAppearance = req.PetAppearance
	pet.PetPersonality = req.PetPersonality
	pet.Description = req.Description
	pet.PetImage = req.PetImage

	if err := UpdatePet(pet); err != nil {
		return nil, err
	}

	return pet, nil
}

func DeletePetService(userID, petID int64) error {
	pet, err := GetPet(petID)
	if err != nil {
		return err
	}

	if pet.UserID != userID {
		return ErrPet
	}
	return DeletePet(petID)
}
