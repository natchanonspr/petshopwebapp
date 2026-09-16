package order

import (
	"encoding/json"
	"errors"
	"time"

	"petshop-backend/internal/address"
	"petshop-backend/internal/cart"
	"petshop-backend/internal/coupon"
	"petshop-backend/internal/notification"
	"petshop-backend/internal/product"

	"gorm.io/gorm"
)

var (
	ErrAddressNotFound = errors.New("ไม่พบที่อยู่")
	ErrNotOwner        = errors.New("ไม่ใช่ข้อมูลของคุณ")
	ErrEmptyCart       = errors.New("ตะกร้าว่าง")
	ErrOutOfStock      = errors.New("สินค้าในสต็อกไม่พอ")
	ErrInvalidQuantity = errors.New("จำนวนสินค้าต้องมากกว่า 0")
	ErrCannotCancel    = errors.New("ไม่สามารถยกเลิกคำสั่งซื้อนี้ได้")
)

func CreateOrderService(userID int64, req *CreateOrderRequest) (*Order, error) {

	// ตรวจสอบ Address
	address, err := address.GetAddressByID(req.AddressID)
	if err != nil {
		return nil, err
	}

	if address.UserID != userID {
		return nil, ErrNotOwner
	}
	// ดึงสินค้าในตะกร้า
	cartItems, err := cart.GetCart(userID)
	if err != nil {
		return nil, err
	}

	if len(cartItems) == 0 {
		return nil, ErrEmptyCart
	}

	// สร้าง Address Snapshot
	snapshot, err := json.Marshal(address)
	if err != nil {
		return nil, err
	}

	var (
		subtotalAmount float64
		orderItems     []OrderItem
	)

	// 4. ตรวจสอบสินค้า + Stock + คำนวณราคา
	for _, cartItem := range cartItems {

		if cartItem.CartQuantity <= 0 {
			return nil, ErrInvalidQuantity
		}

		product, err := product.GetProduct(cartItem.ProductID)
		if err != nil {
			return nil, err
		}

		if cartItem.CartQuantity > product.ProductStock {
			return nil, ErrOutOfStock
		}

		subtotalAmount += product.ProductPrice * float64(cartItem.CartQuantity)

		orderItems = append(orderItems, OrderItem{
			ProductID:     product.ProductID,
			ProductName:   product.ProductName,
			ProductImage:  product.ProductImage,
			OrderQuantity: cartItem.CartQuantity,
			OrderPrice:    product.ProductPrice,
		})
	}

	var (
		discountAmount float64
		shippingAmount float64 = 40
		couponID       int64
	)

	couponCode := req.CouponCode

	if couponCode != "" {
		result := coupon.ApplyCouponService(
			couponCode,
			subtotalAmount,
		)

		if !result.OK {
			return nil, errors.New(result.Reason)
		}

		discountAmount = result.Amount
		couponID = result.CouponID

		if result.FreeShipping {
			shippingAmount = 0
		}
	}

	// คำนวณยอดหลังหักส่วนลด
	afterDiscount := subtotalAmount - discountAmount

	// ถ้ายอดหลังส่วนลดถึง 500 บาท ให้ส่งฟรี
	if afterDiscount >= 500 {
		shippingAmount = 0
	}

	// คำนวณ VAT 7% จากยอดหลังส่วนลด + ค่าส่ง
	beforeTax := afterDiscount + shippingAmount

	// VAT 7%
	taxAmount := beforeTax * 0.07

	// ยอดรวมสุดท้าย
	totalAmount := beforeTax + taxAmount

	// สร้าง คำสั่งซื้อ และ สินค้าในคำสั่งซื้อ
	var createdOrder *Order

	err = db.Transaction(func(tx *gorm.DB) error {

		// สร้าง คำสั่งซื้อ
		order := &Order{
			UserID:         userID,
			OrderAddress:   string(snapshot),
			SubtotalAmount: subtotalAmount,
			DiscountAmount: discountAmount,
			ShippingAmount: shippingAmount,
			TaxAmount:      taxAmount,
			CouponCode:     couponCode,
			TotalAmount:    totalAmount,
			OrderStatus:    "pending",
			PaymentMethod:  req.PaymentMethod,
			PaymentStatus:  "unpaid",
		}

		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// สร้าง สินค้าในคำสั่งซื้้อ
		for _, item := range orderItems {

			item.OrderID = order.OrderID

			if err := tx.Create(&item).Error; err != nil {
				return err
			}
		}

		// ลด Stock
		for _, cartItem := range cartItems {

			result := tx.
				Model(&product.Product{}).
				Where(
					"product_id = ? AND product_stock >= ?",
					cartItem.ProductID,
					cartItem.CartQuantity,
				).
				UpdateColumn(
					"product_stock",
					gorm.Expr(
						"product_stock - ?",
						cartItem.CartQuantity,
					),
				)

			if result.Error != nil {
				return result.Error
			}

			if result.RowsAffected == 0 {
				return ErrOutOfStock
			}
		}

		if couponID != 0 {
			if err := coupon.IncrementUsedCount(tx, couponID); err != nil {
				return err
			}
		}

		if err := cart.ClearCart(tx, userID); err != nil {
			return err
		}

		createdOrder = order

		return nil
	})

	if err != nil {
		return nil, err
	}

	return createdOrder, nil
}

// ดูคำสั่งซื้อทั้งหมด
func GetAllOrdersService(userID int64) ([]Order, error) {
	return GetAllOrders(userID)
}

// ดูคำสั่งซื้อเดียว
func GetOrderService(orderID, userID int64) (*Order, error) {
	order, err := GetOrder(orderID, userID)
	if err != nil {
		return nil, err
	}

	return order, nil
}

// คืน Stock สินค้าเมื่อโดน Cancel
func restoreStock(tx *gorm.DB, items []OrderItem) error {
	for _, item := range items {
		if err := tx.Model(&product.Product{}).
			Where("product_id = ?", item.ProductID).
			UpdateColumn("product_stock", gorm.Expr("product_stock + ?", item.OrderQuantity)).Error; err != nil {
			return err
		}
	}
	return nil
}

func UploadPaymentSlipService(orderID int64, userID int64, slipData []byte, contentType string) (*Order, error) {
	var order Order
	result := db.Where("order_id = ? AND user_id = ?", orderID, userID).First(&order)
	if result.Error != nil {
		return nil, result.Error
	}

	if order.PaymentStatus == PaymentPaid {
		return nil, errors.New("ออเดอร์นี้ชำระเงินแล้ว")
	}

	now := time.Now()

	order.PaymentSlip = slipData
	order.PaymentSlipContentType = contentType
	order.PaymentSubmittedAt = &now
	order.PaymentStatus = PaymentReviewing

	if err := db.Save(&order).Error; err != nil {
		return nil, err
	}

	return &order, nil
}

// ยกเลิกคำสั่งซื้อ
func CancelOrderService(orderID, userID int64) error {
	order, err := GetOrder(orderID, userID)
	if err != nil {
		return err
	}

	if order.OrderStatus != "pending" {
		return ErrCannotCancel
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := restoreStock(tx, order.Items); err != nil {
			return err
		}
		return tx.Model(order).Update("order_status", "cancelled").Error
	})
}

// Admin : ดูคำสั่งซื้อทั้งหมด
func GetAllOrdersAdminService() ([]Order, error) {
	return GetAllOrdersAdmin()
}

// Admin : ดูรายละเอียดคำสั่งซือ
func GetOrderAdminService(orderID int64) (*Order, error) {
	return GetOrderAdmin(orderID)
}

// Admin : เปลี่ยนสเตตัสของออเดอร์ลูกค้า
func UpdateOrderStatusService(orderID int64, adminUserID int64, status string) error {

	// สถานะ
	validStatus := map[string]bool{
		"pending":    true,
		"confirmed":  true,
		"shipped":    true,
		"deliveried": true,
		"cancelled":  true,
	}

	if !validStatus[status] {
		return errors.New("สถานะคำสั่งซื้อไม่ถูกต้อง")
	}

	order, err := GetOrderAdmin(orderID)
	if err != nil {
		return err
	}

	if order.OrderStatus == "cancelled" {
		return errors.New("คำสั่งซื้อนี้ถูกยกเลิก")
	}

	if order.OrderStatus == "deliveried" {
		return errors.New("คำสั่งซื้อนี้จัดส่งเรียบร้อยแล้ว")
	}

	oldStatus := order.OrderStatus
	if oldStatus == status {
		return nil
	}

	// ยกเลิกคำสั่งซื้อ
	if status == "cancelled" {

		err := db.Transaction(func(tx *gorm.DB) error {

			if err := restoreStock(tx, order.Items); err != nil {
				return err
			}

			if err := tx.
				Model(order).
				Update(
					"order_status",
					"cancelled",
				).
				Error; err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			return err
		}

		orderIDValue := order.OrderID

		req := &notification.CreateNotificationRequest{
			Audience: "user",
			UserID:   &order.UserID,
			Type:     "order",
			Title:    "คำสั่งซื้อถูกยกเลิก",
			Detail:   "คำสั่งซื้อของคุณถูกยกเลิก",
			Icon:     "fa-circle-xmark",
			OrderID:  &orderIDValue,
		}

		return notification.CreateNotificationService(
			adminUserID,
			req,
		)
	}

	// เปลี่ยนสถานะปกติ
	order.OrderStatus = status

	if err := UpdateOrder(order); err != nil {
		return err
	}

	// สร้างข้อความ Notification
	orderIDValue := order.OrderID

	var title string
	var detail string
	var icon string

	switch status {

	case "confirmed":
		title = "ร้านยืนยันคำสั่งซื้อแล้ว"
		detail = "คำสั่งซื้อของคุณได้รับการยืนยันและกำลังเตรียมสินค้า"
		icon = "fa-circle-check"

	case "shipped":
		title = "คำสั่งซื้อกำลังจัดส่ง"
		detail = "สินค้าของคุณถูกส่งออกจากร้านและกำลังเดินทางไปหาคุณ"
		icon = "fa-truck-fast"

	case "deliveried":
		title = "จัดส่งสำเร็จแล้ว"
		detail = "คำสั่งซื้อของคุณจัดส่งสำเร็จแล้ว ขอบคุณที่ใช้บริการ"
		icon = "fa-box-open"

	default:
		// pending ไม่ต้องสร้าง notification
		return nil
	}

	req := &notification.CreateNotificationRequest{
		Audience: "user",
		UserID:   &order.UserID,
		Type:     "order",
		Title:    title,
		Detail:   detail,
		Icon:     icon,
		OrderID:  &orderIDValue,
	}

	return notification.CreateNotificationService(
		adminUserID,
		req,
	)
}

// Update status การจ่ายเงิน
func UpdateOrderPaymentStatusService(orderID int64, adminUserID int64, status string) error {
	validStatus := map[string]bool{
		PaymentPaid:     true,
		PaymentRejected: true,
	}

	if !validStatus[status] {
		return errors.New("สถานะการชำระเงินไม่ถูกต้อง")
	}

	order, err := GetOrderAdmin(orderID)
	if err != nil {
		return err
	}

	if order.PaymentStatus == status {
		return nil
	}

	//อนุมัติการชำระเงิน
	if status == PaymentPaid {

		err := db.Transaction(func(tx *gorm.DB) error {

			if err := tx.
				Model(order).
				Updates(map[string]interface{}{
					"payment_status": "paid",
					"order_status":   "confirmed",
				}).
				Error; err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			return err
		}

		orderIDValue := order.OrderID

		req := &notification.CreateNotificationRequest{
			Audience: "user",
			UserID:   &order.UserID,
			Type:     "order",
			Title:    "ยืนยันการชำระเงินแล้ว",
			Detail:   "คำสั่งซื้อของคุณได้รับการยืนยันการชำระเงินเรียบร้อยแล้ว",
			Icon:     "fa-circle-check",
			OrderID:  &orderIDValue,
		}

		return notification.CreateNotificationService(
			adminUserID,
			req,
		)
	}

	//ปฎิเสธชำระเงิน
	if status == PaymentRejected {
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := restoreStock(tx, order.Items); err != nil {
				return err
			}

			if err := tx.Model(order).Updates(map[string]interface{}{"payment_status": "rejected", "order_status": "cancelled"}).Error; err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			return err
		}

		orderIDValue := order.OrderID

		req := &notification.CreateNotificationRequest{
			Audience: "user",
			UserID:   &order.UserID,
			Type:     "order",
			Title:    "ไม่สามารถยืนยันการชำระเงินได้",
			Detail:   "สลิปการชำระเงินถูกปฏิเสธ และคำสั่งซื้อถูกยกเลิก",
			Icon:     "fa-circle-xmark",
			OrderID:  &orderIDValue,
		}

		return notification.CreateNotificationService(
			adminUserID,
			req,
		)
	}
	return nil
}
