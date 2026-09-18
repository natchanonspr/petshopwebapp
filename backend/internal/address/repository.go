package address

import "gorm.io/gorm"

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

func GetAddresses(userID int64) ([]Address, error) {
	var addresses []Address
	err := db.Where("user_id = ?", userID).Order("is_default desc, created_at desc").Find(&addresses).Error
	return addresses, err
}

func GetAddressByID(id int64) (*Address, error) {
	var address Address
	if err := db.First(&address, id).Error; err != nil {
		return nil, err
	}
	return &address, nil
}

func CreateAddress(address *Address) error {
	return db.Create(address).Error
}

func UpdateAddress(address *Address) error {
	return db.Model(address).Updates(*address).Error
}

func DeleteAddress(id int64) error {
	return db.Delete(&Address{}, id).Error
}

func ClearDefaultForUser(userID int64) error {
	return db.Model(&Address{}).Where("user_id = ?", userID).Update("is_default", false).Error
}
