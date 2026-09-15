package coupon

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

var (
	ErrRequiredFields    = errors.New("กรุณากรอกข้อมูลให้ครบถ้วน")
	ErrInvalidType       = errors.New("ประเภทส่วนลดไม่ถูกต้อง")
	ErrInvalidValue      = errors.New("จำนวนส่วนลดไม่ถูกต้อง")
	ErrInvalidDateTime   = errors.New("วันเวลาไม่ถูกต้อง")
	ErrExpireBeforeStart = errors.New("วันหมดอายุต้องอยู่หลังวันเริ่ม")
	ErrDuplicateCode     = errors.New("รหัสโปรโมชั่นนี้มีอยู่แล้ว")
)

const dateTimeLayout = "2006-0102T15:04"

func validCouponType(t string) bool {
	return t == TypeFixed || t == TypePercentage || t == TypeFreeShipping
}

func validdateAndBuild(req *CouponRequest) (*Coupon, error) {
	code := strings.ToUpper(strings.TrimSpace(req.CouponCode))
	title := strings.TrimSpace(req.CouponTitle)
	if code == "" || title == "" || req.StartAt.IsZero() || req.ExpireAt.IsZero() {
		return nil, ErrRequiredFields
	}

	if !validCouponType(req.CouponType) {
		return nil, ErrInvalidType
	}

	if req.CouponType == TypePercentage && (req.CouponValue <= 0 || req.CouponValue > 100) {
		return nil, ErrInvalidValue
	}

	if req.CouponType != TypeFreeShipping && req.CouponValue <= 0 {
		return nil, ErrInvalidValue
	}

	startAt := req.StartAt
	expireAt := req.ExpireAt

	if !expireAt.After(startAt) {
		return nil, ErrExpireBeforeStart
	}

	usageLimit := req.UsageLimit
	if usageLimit <= 0 {
		usageLimit = 1
	}

	perUserLimit := req.PerUserLimit
	if perUserLimit <= 0 {
		perUserLimit = 1
	}

	minOrder := req.MinOrder
	if minOrder < 0 {
		minOrder = 0
	}

	maxDiscount := req.MaxDiscount
	if maxDiscount < 0 {
		maxDiscount = 0
	}

	return &Coupon{
		CouponCode:   code,
		CouponTitle:  title,
		CouponType:   req.CouponType,
		CouponValue:  req.CouponValue,
		MinOrder:     minOrder,
		MaxDiscount:  maxDiscount,
		UsageLimit:   usageLimit,
		PerUserLimit: perUserLimit,
		StartAt:      startAt,
		ExpireAt:     expireAt,
		Active:       req.Active,
	}, nil
}

func CreateCouponService(req *CouponRequest) (*Coupon, error) {
	coupon, err := validdateAndBuild(req)
	if err != nil {
		return nil, err
	}

	if _, err := GetCouponByCode(coupon.CouponCode); err != nil {
		return nil, ErrDuplicateCode
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	coupon.UsedCount = 0
	if err := CreateCoupon(coupon); err != nil {
		return nil, err
	}

	return coupon, nil
}

func UpdateCouponService(couponID int64, req *CouponRequest) (*Coupon, error) {
	existing, err := GetCoupon(couponID)
	if err != nil {
		return nil, err
	}

	updated, err := validdateAndBuild(req)
	if err != nil {
		return nil, err
	}

	if updated.CouponCode != existing.CouponCode {
		if _, err := GetCouponByCode(updated.CouponCode); err != nil {
			return nil, ErrDuplicateCode
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	existing.CouponCode = updated.CouponCode
	existing.CouponTitle = updated.CouponTitle
	existing.CouponType = updated.CouponType
	existing.CouponValue = updated.CouponValue
	existing.MinOrder = updated.MinOrder
	existing.UsageLimit = updated.UsageLimit
	existing.PerUserLimit = updated.PerUserLimit
	existing.StartAt = updated.StartAt
	existing.ExpireAt = updated.ExpireAt
	existing.Active = updated.Active

	if err := UpdateCoupon(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func DeleteCouponService(couponID int64) error {
	if _, err := GetCoupon(couponID); err != nil {
		return err
	}
	return DeleteCoupon(couponID)
}

func GetAllCouponsService() ([]Coupon, error) {
	return GetAllCoupons()
}

func GetCouponService(couponID int64) (*Coupon, error) {
	return GetCoupon(couponID)
}
