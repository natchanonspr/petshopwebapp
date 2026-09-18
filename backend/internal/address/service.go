package address

import (
	"errors"
	"regexp"
	"strings"
)

var (
	ErrNotOwner           = errors.New("ไม่ใช่ที่อยู่ของคุณ")
	ErrInvalidAddressData = errors.New("ข้อมูลที่อยู่ไม่ถูกต้อง")
	ErrEmptyRecipientName = errors.New("กรุณากรอกชื่อผู้รับ")
	ErrInvalidPhone       = errors.New("เบอร์โทรศัพท์ไม่ถูกต้อง")
	ErrEmptyAddressLine   = errors.New("กรุณากรอกที่อยู่")
	ErrEmptySubdistrict   = errors.New("กรุณากรอกตำบล / แขวง")
	ErrEmptyDistrict      = errors.New("กรุณากรอกอำเภอ / เขต")
	ErrEmptyProvince      = errors.New("กรุณากรอกจังหวัด")
	ErrInvalidPostalCode  = errors.New("รหัสไปรษณีย์ไม่ถูกต้อง")
)

func validateAddressRequest(req *AddressRequest) error {
	if req == nil {
		return ErrInvalidAddressData
	}

	req.RecipientName = strings.TrimSpace(req.RecipientName)
	req.Phone = strings.TrimSpace(req.Phone)
	req.AddressLine = strings.TrimSpace(req.AddressLine)
	req.Subdistrict = strings.TrimSpace(req.Subdistrict)
	req.District = strings.TrimSpace(req.District)
	req.Province = strings.TrimSpace(req.Province)
	req.PostalCode = strings.TrimSpace(req.PostalCode)

	if req.RecipientName == "" {
		return ErrEmptyRecipientName
	}

	if req.AddressLine == "" {
		return ErrEmptyAddressLine
	}

	if req.Subdistrict == "" {
		return ErrEmptySubdistrict
	}

	if req.District == "" {
		return ErrEmptyDistrict
	}

	if req.Province == "" {
		return ErrEmptyProvince
	}

	// เบอร์โทรศัพท์ไทย 10 หลัก
	phoneRegex := regexp.MustCompile(`^0[0-9]{9}$`)
	if !phoneRegex.MatchString(req.Phone) {
		return ErrInvalidPhone
	}

	// รหัสไปรษณีย์ 5 หลัก
	postalRegex := regexp.MustCompile(`^[0-9]{5}$`)
	if !postalRegex.MatchString(req.PostalCode) {
		return ErrInvalidPostalCode
	}

	return nil
}

func CreateAddressService(userID int64, req *AddressRequest) (*Address, error) {
	address := &Address{
		UserID:        userID,
		RecipientName: req.RecipientName,
		Phone:         req.Phone,
		AddressLine:   req.AddressLine,
		Subdistrict:   req.Subdistrict,
		District:      req.District,
		Province:      req.Province,
		PostalCode:    req.PostalCode,
		IsDefault:     req.IsDefault,
	}

	if req.IsDefault {
		if err := ClearDefaultForUser(userID); err != nil {
			return nil, err
		}
	}

	if err := CreateAddress(address); err != nil {
		return nil, err
	}
	return address, nil
}

func UpdateAddressService(userID, addressID int64, req *AddressRequest) (*Address, error) {
	address, err := GetAddressByID(addressID)
	if err != nil {
		return nil, err
	}
	if address.UserID != userID {
		return nil, ErrNotOwner
	}

	if err := validateAddressRequest(req); err != nil {
		return nil, err
	}

	if req.IsDefault {
		if err := ClearDefaultForUser(userID); err != nil {
			return nil, err
		}
	}

	address.RecipientName = req.RecipientName
	address.Phone = req.Phone
	address.AddressLine = req.AddressLine
	address.Subdistrict = req.Subdistrict
	address.District = req.District
	address.Province = req.Province
	address.PostalCode = req.PostalCode
	address.IsDefault = req.IsDefault

	if err := UpdateAddress(address); err != nil {
		return nil, err
	}
	return address, nil
}

func DeleteAddressService(userID, addressID int64) error {
	address, err := GetAddressByID(addressID)
	if err != nil {
		return err
	}

	if address.UserID != userID {
		return ErrNotOwner
	}

	return DeleteAddress(addressID)
}

func GetAddressesService(userID int64) ([]Address, error) {
	return GetAddresses(userID)
}
