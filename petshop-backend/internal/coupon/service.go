package coupon

import (
	"errors"
	"fmt"
	"strings"
	"time"

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

	if req.CouponType == TypePercentage && (req.CouponValue < 0 || req.CouponValue > 100) {
		return nil, ErrInvalidValue
	}

	if req.CouponType != TypeFreeShipping && req.CouponValue < 0 {
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

	if _, err := GetCouponByCode(coupon.CouponCode); err == nil {
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
		_, err := GetCouponByCode(updated.CouponCode)

		if err == nil {
			return nil, ErrDuplicateCode
		}

		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	existing.CouponCode = updated.CouponCode
	existing.CouponTitle = updated.CouponTitle
	existing.CouponType = updated.CouponType
	existing.CouponValue = updated.CouponValue
	existing.MinOrder = updated.MinOrder
	existing.MaxDiscount = updated.MaxDiscount
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

func GetActiveCouponsService() ([]Coupon, error) {
	return GetActiveCoupons()
}

// ตรวจสอบเงื่อนไข + คำนวณส่วนลด (ไม่ได้บันทึกการใช้งาน/used_count ในรอบนี้)
func ApplyCouponService(userID int64, code string, subtotal float64) *ApplyResult {
	normalized := strings.ToUpper(strings.TrimSpace(code))
	if normalized == "" {
		return &ApplyResult{OK: false, Reason: "กรุณากรอกรหัสโปรโมชั่น"}
	}

	c, err := GetCouponByCode(normalized)
	if err != nil {
		return &ApplyResult{OK: false, Reason: "ไม่พบโค้ดส่วนลดนี้"}
	}

	if !c.Active {
		return &ApplyResult{OK: false, Reason: "โปรโมชั่นนี้ปิดใช้งานอยู่"}
	}

	now := time.Now()
	if now.Before(c.StartAt) {
		return &ApplyResult{OK: false, Reason: "โปรโมชั่นนี้ยังไม่เริ่ม"}
	}
	if now.After(c.ExpireAt) {
		return &ApplyResult{OK: false, Reason: "โปรโมชั่นนี้หมดอายุแล้ว"}
	}
	if c.UsageLimit > 0 && c.UsedCount >= c.UsageLimit {
		return &ApplyResult{OK: false, Reason: "สิทธิ์โปรโมชั่นถูกใช้ครบแล้ว"}
	}
	if c.PerUserLimit > 0 {
		usedCount, err := CountUserCouponUsage(userID, normalized)
		if err != nil {
			return &ApplyResult{OK: false, Reason: "ไม่สามารถตรวจสอบการใช้โปรโมชั่นได้"}
		}

		if usedCount >= c.PerUserLimit {
			return &ApplyResult{OK: false, Reason: "คุณใช้โปรโมชั่นนี้ครบจำนวนครั้งแล้ว"}
		}
	}
	if subtotal < c.MinOrder {
		return &ApplyResult{OK: false, Reason: fmt.Sprintf("ยอดสั่งซื้อขั้นต่ำ %.0f บาท สำหรับโค้ด %s", c.MinOrder, normalized)}
	}

	var amount float64

	if c.CouponType == TypePercentage {
		amount = subtotal * c.CouponValue / 100
		if c.MaxDiscount > 0 && amount > c.MaxDiscount {
			amount = c.MaxDiscount
		}
	} else if c.CouponType == TypeFixed {
		amount = c.CouponValue
	} else if c.CouponType == TypeFreeShipping {
		amount = 0
	}
	if amount > subtotal {
		amount = subtotal
	}

	return &ApplyResult{
		OK:           true,
		Code:         normalized,
		CouponID:     c.CouponID,
		Amount:       amount,
		FreeShipping: c.CouponType == TypeFreeShipping,
		Min:          c.MinOrder,
		MaxDiscount:  c.MaxDiscount,
		PerUser:      c.PerUserLimit,
	}
}
