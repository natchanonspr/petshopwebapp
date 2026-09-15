package coupon

import "gorm.io/gorm"

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
	return db.Model(coupon).Updates(*coupon).Error
}

func DeleteCoupon(couponID int64) error {
	return db.Delete(&Coupon{}, couponID).Error
}
