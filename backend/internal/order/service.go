package order

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"petshop-backend/internal/address"
	"petshop-backend/internal/cart"
	"petshop-backend/internal/coupon"
	"petshop-backend/internal/notification"
	"petshop-backend/internal/product"

	"gorm.io/gorm"
)

var (
	ErrAddressNotFound  = errors.New("ไม่พบที่อยู่")
	ErrNotOwner         = errors.New("ไม่ใช่ข้อมูลของคุณ")
	ErrEmptyCart        = errors.New("ตะกร้าว่าง")
	ErrOutOfStock       = errors.New("สินค้าในสต็อกไม่พอ")
	ErrInvalidQuantity  = errors.New("จำนวนสินค้าต้องมากกว่า 0")
	ErrCannotCancel     = errors.New("ไม่สามารถยกเลิกคำสั่งซื้อนี้ได้")
	ErrCannotUploadSlip = errors.New("ไม่สามารถส่งสลิปสำหรับคำสั่งซื้อนี้ได้")
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

		subtotalAmount += (product.ProductPrice * float64(cartItem.CartQuantity)) - taxamount 

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
		couponID       *int64
	)

	couponCode := strings.ToUpper(strings.TrimSpace(req.CouponCode))

	if couponCode != "" {
		result := coupon.ApplyCouponService(
			userID,
			couponCode,
			subtotalAmount,
		)

		if !result.OK {
			return nil, errors.New(result.Reason)
		}

		discountAmount = result.Amount
		id := result.CouponID
		couponID = &id

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

	// ยอดที่ลูกค้าต้องจ่ายจริง
	totalAmount := afterDiscount + shippingAmount

	// VAT 7%
	const taxRate = 0.07
	taxAmount := totalAmount * taxRate / (1 + taxRate)

	// สร้าง คำสั่งซื้อ และ สินค้าในคำสั่งซื้อ
	var createdOrder *Order

	err = db.Transaction(func(tx *gorm.DB) error {

		// ใช้ coupon ก่อนสร้าง Order
		if couponID != nil {
			if err := coupon.ConsumeCoupon(tx, *couponID, userID, couponCode); err != nil {
				return err
			}
		}

		// สร้าง Order
		order := &Order{
			UserID:         userID,
			OrderAddress:   string(snapshot),
			SubtotalAmount: subtotalAmount,
			DiscountAmount: discountAmount,
			ShippingAmount: shippingAmount,
			TaxAmount:      taxAmount,
			CouponID:       couponID,
			CouponCode:     couponCode,
			TotalAmount:    totalAmount,
			OrderStatus:    OrderPending,
			PaymentMethod:  req.PaymentMethod,
			PaymentStatus:  PaymentUnpaid,
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

// กำหนดเวลา 5นาทีถ้ายังไม่ชำระเงินจะขึ้นว่าหมดอายุ
const unpaidOrderTimeout = 5 * time.Minute

// ยกเลิก Order ที่ยังไม่ได้ชำระเงินเกินเวลาที่กำหนด
func ExpireUnpaidOrdersService() error {
	cutoff := time.Now().Add(-unpaidOrderTimeout)

	var orders []Order

	if err := db.
		Preload("Items").Where(
		"order_status = ? AND payment_status = ? AND created_at <= ?",
		OrderPending, PaymentUnpaid, cutoff,
	).Find(&orders).Error; err != nil {
		return err
	}

	for _, order := range orders {

		err := db.Transaction(func(tx *gorm.DB) error {

			// เช็กสถานะซ้ำอีกครั้งก่อนยกเลิก
			// ป้องกันกรณีลูกค้าชำระเงินหรือ Admin เปลี่ยนสถานะไปแล้ว
			result := tx.
				Model(&Order{}).
				Where("order_id = ? AND order_status = ? AND payment_status = ?",
					order.OrderID, OrderPending, PaymentUnpaid,
				).Updates(map[string]interface{}{
				"order_status": OrderCancelled,
			})

			if result.Error != nil {
				return result.Error
			}

			// ถ้าสถานะเปลี่ยนไปแล้วระหว่างที่เรากำลังทำงาน
			// จะไม่ต้องคืน Stock/Coupon ซ้ำ
			if result.RowsAffected == 0 {
				return nil
			}

			// คืน Stock
			if err := restoreStock(tx, order.Items); err != nil {
				return err
			}

			// คืนจำนวนการใช้ Coupon
			if order.CouponID != nil {
				if err := coupon.DecrementUsedCount(tx, *order.CouponID); err != nil {
					return err
				}
			}

			return nil
		})

		if err != nil {
			return err
		}
	}

	return nil
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

	if order.OrderStatus != OrderPending || order.PaymentStatus != PaymentUnpaid {
		return nil, ErrCannotUploadSlip
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

	if order.OrderStatus != OrderPending || order.PaymentStatus != PaymentUnpaid {
		return ErrCannotCancel
	}

	return db.Transaction(func(tx *gorm.DB) error {
		//คืน stock สินค้า
		if err := restoreStock(tx, order.Items); err != nil {
			return err
		}

		// คืน coupon
		if order.CouponID != nil {
			if err := coupon.DecrementUsedCount(tx, *order.CouponID); err != nil {
				return err
			}
		}

		if err := tx.Model(order).Updates(map[string]interface{}{
			"order_status":   OrderCancelled,
			"payment_status": PaymentRejected,
		}).Error; err != nil {
			return err
		}

		return nil
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

	// ตรวจสอบสเตตัส
	validStatus := map[string]bool{
		OrderPending:   true,
		OrderConfirmed: true,
		OrderShipped:   true,
		OrderDelivered: true,
		OrderCancelled: true,
	}

	if !validStatus[status] {
		return errors.New("สถานะคำสั่งซื้อไม่ถูกต้อง")
	}

	// ดึง Order
	order, err := GetOrderAdmin(orderID)
	if err != nil {
		return err
	}

	oldStatus := order.OrderStatus

	if oldStatus == status {
		return nil
	}

	switch oldStatus {
	case OrderPending:
		if status != OrderConfirmed && status != OrderCancelled {
			return errors.New("ออเดอร์ที่รอดำเนินการสามารถเปลี่ยนเป็นยืนยันหรือยกเลิกได้เท่านั้น")
		}

	case OrderConfirmed:
		if status != OrderShipped && status != OrderCancelled {
			return errors.New("ออเดอร์ที่ยืนยันแล้วสามารถเปลี่ยนเป็นกำลังจัดส่งหรือยกเลิกได้เท่านั้น")
		}

	case OrderShipped:
		if status != OrderDelivered {
			return errors.New("ออเดอร์ที่กำลังจัดส่งสามารถเปลี่ยนเป็นจัดส่งสำเร็จได้เท่านั้น")
		}

	case OrderDelivered:
		return errors.New("คำสั่งซื้อนี้จัดส่งสำเร็จแล้ว")

	case OrderCancelled:
		return errors.New("คำสั่งซื้อนี้ถูกยกเลิกแล้ว")

	default:
		return errors.New("พบสถานะคำสั่งซื้อที่ไม่รู้จัก")
	}

	// ยกเลิกคำสั่งซื้อ
	if status == OrderCancelled {

		err := db.Transaction(func(tx *gorm.DB) error {

			/// คืน Stock สินค้า
			if err := restoreStock(tx, order.Items); err != nil {
				return err
			}

			// คืนจำนวนการใช้ Coupon
			if order.CouponID != nil {
				if err := coupon.DecrementUsedCount(tx, *order.CouponID); err != nil {
					return err
				}
			}

			// เปลี่ยนสถานะ
			if err := tx.Model(order).Update("order_status", OrderCancelled).Error; err != nil {
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

	case OrderConfirmed:
		title = "ร้านยืนยันคำสั่งซื้อแล้ว"
		detail = fmt.Sprintf("คำสั่งซื้อ #%d ได้รับการยืนยันและกำลังเตรียมสินค้า", order.OrderID)
		icon = "fa-circle-check"

	case OrderShipped:
		title = "คำสั่งซื้อกำลังจัดส่ง"
		detail = fmt.Sprintf("คำสั่งซื้่อ #%d เตรียมสินค้าเรียบร้อยแล้วและจัดส่งไปหาคุณ", order.OrderID)
		icon = "fa-truck-fast"

	case OrderDelivered:
		title = "จัดส่งสำเร็จแล้ว"
		detail = fmt.Sprintf("คำสั่งซื้อ #%d จัดส่งสำเร็จแล้ว ขอบคุณที่ใช้บริการ", order.OrderID)
		icon = "fa-box-open"

	default:
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

			if err := tx.Model(order).Updates(map[string]interface{}{
				"payment_status": "paid",
				"order_status":   "confirmed",
			}).Error; err != nil {
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
			Detail:   fmt.Sprintf("คำสั่งซื้อ #%d ยอดรวม %.2f฿ ได้รับการยืนยันการชำระเงินเรียบร้อยแล้ว", order.OrderID, order.TotalAmount),
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

			if order.CouponID != nil {
				if err := coupon.DecrementUsedCount(tx, *order.CouponID); err != nil {
					return err
				}
			}

			if err := tx.Model(order).Updates(map[string]interface{}{
				"payment_status": "rejected",
				"order_status":   "cancelled",
			}).Error; err != nil {
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
			Detail:   fmt.Sprintf("คำสั่งซื้อ #%d ไม่สามารถยืนยันการชำระเงินเงินได้", order.OrderID),
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
