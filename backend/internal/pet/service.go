package pet

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrPet             = errors.New("ไม่ใช่สัตว์เลี้ยงของคุณ")
	ErrInvalidPetData  = errors.New("ข้อมูลสัตว์เลี้ยงไม่ถูกต้อง")
	ErrEmptyPetName    = errors.New("กรุณากรอกชื่อสัตว์เลี้ยง")
	ErrEmptyPetBreed   = errors.New("กรุณากรอกสายพันธุ์")
	ErrInvalidSpecies  = errors.New("ประเภทสัตว์ไม่ถูกต้อง")
	ErrInvalidGender   = errors.New("เพศสัตว์ไม่ถูกต้อง")
	ErrInvalidWeight   = errors.New("น้ำหนักต้องมากกว่า 0")
	ErrFutureBirthdate = errors.New("วันเกิดห้ามเป็นวันที่ในอนาคต")
)

func parseBirthdate(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, errors.New("กรุณาระบุวันเกิด")
	}

	birthdate, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}, errors.New("รูปแบบวันเกิดไม่ถูกต้อง")
	}

	if birthdate.After(time.Now().UTC()) {
		return time.Time{}, ErrFutureBirthdate
	}

	return birthdate, nil
}

func validatePetRequest(req *PetRequest) (time.Time, error) {
	if req == nil {
		return time.Time{}, ErrInvalidPetData
	}

	if strings.TrimSpace(req.PetName) == "" {
		return time.Time{}, ErrEmptyPetName
	}

	if strings.TrimSpace(req.PetBreed) == "" {
		return time.Time{}, ErrEmptyPetBreed
	}

	switch strings.TrimSpace(req.PetSpecies) {
	case "สุนัข", "แมว":
	default:
		return time.Time{}, ErrInvalidSpecies
	}

	switch strings.TrimSpace(req.PetGender) {
	case "ตัวผู้", "ตัวเมีย":
	default:
		return time.Time{}, ErrInvalidGender
	}

	if req.PetWeight <= 0 {
		return time.Time{}, ErrInvalidWeight
	}

	birthdate, err := parseBirthdate(req.PetBirthdate)
	if err != nil {
		return time.Time{}, err
	}

	return birthdate, nil
}

func CreatePetService(userID int64, req *PetRequest) (*Pet, error) {
	birthdate, err := parseBirthdate(req.PetBirthdate)
	if err != nil {
		return nil, err
	}

	pet := &Pet{
		UserID:       userID,
		PetName:      strings.TrimSpace(req.PetName),
		PetSpecies:   strings.TrimSpace(req.PetSpecies),
		PetBreed:     strings.TrimSpace(req.PetBreed),
		PetWeight:    req.PetWeight,
		PetGender:    strings.TrimSpace(req.PetGender),
		PetBirthdate: birthdate,
		PetNeutered:  req.PetNeutered,
		PetDisease:   strings.TrimSpace(req.PetDisease),
		PetHealth:    strings.TrimSpace(req.PetHealth),
		Description:  strings.TrimSpace(req.Description),
		PetImage:     strings.TrimSpace(req.PetImage),
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

func GetPetService(userID, petID int64) (*Pet, error) {
	pet, err := GetPet(petID)
	if err != nil {
		return nil, err
	}

	if pet.UserID != userID {
		return nil, ErrPet
	}

	return pet, nil
}

func UpdatePetService(userID, petID int64, req *PetRequest) (*Pet, error) {
	pet, err := GetPet(petID)
	if err != nil {
		return nil, err
	}

	if pet.UserID != userID {
		return nil, ErrPet
	}

	birthdate, err := validatePetRequest(req)
	if err != nil {
		return nil, err
	}

	pet.PetName = strings.TrimSpace(req.PetName)
	pet.PetSpecies = strings.TrimSpace(req.PetSpecies)
	pet.PetBreed = strings.TrimSpace(req.PetBreed)
	pet.PetWeight = req.PetWeight
	pet.PetGender = strings.TrimSpace(req.PetGender)
	pet.PetBirthdate = birthdate
	pet.PetNeutered = req.PetNeutered
	pet.PetDisease = strings.TrimSpace(req.PetDisease)
	pet.PetHealth = strings.TrimSpace(req.PetHealth)
	pet.Description = strings.TrimSpace(req.Description)
	pet.PetImage = strings.TrimSpace(req.PetImage)

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
