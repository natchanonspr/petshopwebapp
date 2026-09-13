package address

import "errors"

var ErrNotOwner = errors.New("ไม่ใช่ที่อยู่ของคุณ")

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
