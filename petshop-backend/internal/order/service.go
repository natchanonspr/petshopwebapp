package order

import (
	"encoding/json"
	"errors"

	"petshop-backend/internal/address"
	"petshop-backend/internal/cart"
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
		totalAmount float64
		orderItems  []OrderItem
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

		totalAmount += product.ProductPrice * float64(cartItem.CartQuantity)

		orderItems = append(orderItems, OrderItem{
			ProductID:     product.ProductID,
			ProductName:   product.ProductName,
			ProductImage:  product.ProductImage,
			OrderQuantity: cartItem.CartQuantity,
			OrderPrice:    product.ProductPrice,
		})
	}

	// สร้าง คำสั่งซื้อ และ สินค้าในคำสั่งซื้อ
	var createdOrder *Order

	err = db.Transaction(func(tx *gorm.DB) error {

		// สร้าง คำสั่งซื้อ
		order := &Order{
			UserID:        userID,
			OrderAddress:  string(snapshot),
			TotalAmount:   totalAmount,
			OrderStatus:   "pending",
			PaymentMethod: req.PaymentMethod,
			PaymentStatus: "unpaid",
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

// ดูคำสั่งซื้อทั้งหมดของ user
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

// ยกเลิกคำสั่งซื้อ
func CancelOrderService(orderID, userID int64) error {
	order, err := GetOrder(orderID, userID)
	if err != nil {
		return err
	}

	if order.OrderStatus != "pending" {
		return ErrCannotCancel
	}

	order.OrderStatus = "cancelled"

	return UpdateOrder(order)
}
