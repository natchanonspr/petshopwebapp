package coupon

import (
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

// สร้างคูปอง
func CreateCoupon(coupon *Coupon) error {
	return db.Create(coupon).Error
}

// ดูคูปองทั้งหมด
func GetAllCoupons() ([]Coupon, error) {
	var coupons []Coupon
	err := db.Order("created_at desc").Find(&coupons).Error
	return coupons, err
}

// ดูคูปองอันเดียว
func GetCoupon(couponID int64) (*Coupon, error) {
	var coupon Coupon
	err := db.First(&coupon, couponID).Error
	if err != nil {
		return nil, err
	}

	return &coupon, nil
}

// ดูคูปองด้วย code ใช้สำหรับเช็คโค้ดที่ซ้ำกัน
func GetCouponByCode(code string) (*Coupon, error) {
	var coupon Coupon
	err := db.Where("coupon_code = ?", code).First(&coupon).Error
	if err != nil {
		return nil, err
	}

	return &coupon, nil
}

func UpdateCoupon(coupon *Coupon) error {
	return db.Model(coupon).Updates(map[string]interface{}{
		"coupon_code":    coupon.CouponCode,
		"coupon_title":   coupon.CouponTitle,
		"coupon_type":    coupon.CouponType,
		"coupon_value":   coupon.CouponValue,
		"min_order":      coupon.MinOrder,
		"max_discount":   coupon.MaxDiscount,
		"usage_limit":    coupon.UsageLimit,
		"per_user_limit": coupon.PerUserLimit,
		"start_at":       coupon.StartAt,
		"expire_at":      coupon.ExpireAt,
		"active":         coupon.Active,
	}).Error
}

func DeleteCoupon(couponID int64) error {
	return db.Delete(&Coupon{}, couponID).Error
}

func GetActiveCoupons() ([]Coupon, error) {
	var coupons []Coupon
	err := db.Where("active = ?", true).Find(&coupons).Error
	return coupons, err
}

func IncrementUsedCount(tx *gorm.DB, couponID int64) error {
	result := tx.Model(&Coupon{}).
		Where(
			"coupon_id = ? AND (usage_limit = 0 OR used_count < usage_limit)",
			couponID,
		).
		UpdateColumn(
			"used_count",
			gorm.Expr("used_count + 1"),
		)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("โปรโมชั่นนี้ถูกใช้ครบจำนวนแล้ว")
	}

	return nil
}

func CountUserCouponUsage(userID, couponID int64) (int64, error) {
	var count int64

	err := db.
		Table("orders").
		Where("user_id = ?", userID).
		Where("coupon_id = ?", couponID).
		Where("order_status <> ?", "cancelled").
		Count(&count).Error

	return count, err
}

func ConsumeCoupon(tx *gorm.DB, couponID, userID int64, couponCode string) error {
	if tx == nil {
		return errors.New("transaction ไม่ถูกต้อง")
	}

	// Lock coupon row เพื่อป้องกันการใช้พร้อมกันหลาย request
	var c Coupon

	if err := tx.
		Clauses(clause.Locking{Strength: "UPDATE"}).
		First(&c, couponID).
		Error; err != nil {
		return err
	}

	if !c.Active {
		return errors.New("โปรโมชั่นนี้ปิดการใช้งานอยู่")
	}

	now := time.Now()
	if now.Before(c.StartAt) {
		return errors.New("โปรโมชั่นนี้ยังไม่เริ่ม")
	}
	if now.After(c.ExpireAt) {
		return errors.New("โปรโมชั่นนี้หมดอายุแล้ว")
	}

	// ตรวจ UsageLimit อีกครั้งภายใน Transaction
	if c.UsageLimit > 0 && c.UsedCount >= c.UsageLimit {
		return errors.New("โปรโมชั่นนี้ถูกใช้ครบจำนวนแล้ว")
	}

	// ตรวจ PerUserLimit อีกครั้งภายใน Transaction
	if c.PerUserLimit > 0 {
		var count int64

		if err := tx.
			Table("orders").
			Where("user_id = ?", userID).
			Where("coupon_code = ?", couponCode).
			Where("order_status <> ?", "cancelled").
			Count(&count).
			Error; err != nil {
			return err
		}

		if count >= c.PerUserLimit {
			return errors.New("คุณใช้โปรโมชั่นนี้ครบจำนวนครั้งแล้ว")
		}
	}

	// เพิ่มจำนวนการใช้
	result := tx.Model(&Coupon{}).Where("coupon_id = ?", couponID).UpdateColumn("used_count", gorm.Expr("used_count + 1"))

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("ไม่สามารถบันทึกการใช้โปรโมชั่นได้")
	}

	return nil
}

func DecrementUsedCount(tx *gorm.DB, couponID int64) error {
	if tx == nil || couponID == 0 {
		return nil
	}

	result := tx.Model(&Coupon{}).Where("coupon_id = ? AND used_count > 0", couponID).UpdateColumn("used_count", gorm.Expr("used_count - 1"))

	if result.Error != nil {
		return result.Error
	}

	return nil
}
