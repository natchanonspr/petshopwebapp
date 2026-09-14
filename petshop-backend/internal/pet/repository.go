package pet

import (
	"gorm.io/gorm"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

// เพิ่มสัตว์
func CreatePet(pet *Pet) error {
	return db.Create(pet).Error
}

// รายละเอียดสัตว์เลี้ยงทั้งหมด
func GetAllPets(userID int64) ([]Pet, error) {
	var pets []Pet
	err := db.Where("user_id = ?", userID).Order("created_at desc").Find(&pets).Error
	return pets, err
}

// รายละเอียดสัตว์เลี้ยงตัวเดียว
func GetPet(petID int64) (*Pet, error) {
	var pet Pet
	err := db.First(&pet, petID).Error
	if err != nil {
		return nil, err
	}
	return &pet, nil
}

func UpdatePet(pet *Pet) error {
	return db.Save(pet).Error
}

func DeletePet(petID int64) error {
	return db.Delete(&Pet{}, petID).Error
}
