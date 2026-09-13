package order

import "gorm.io/gorm"

var db *gorm.DB

func SetDB(database *gorm.DB) {
	db = database
}

// เพิ่ม Order
func CreateOrder(order *Order) error {
	return db.Create(order).Error
}

// รายเอียดคำสั่งซื้อทั้งหมด
func GetAllOrders(userID int64) ([]Order, error) {
	var orders []Order
	err := db.Where("user_id = ?", userID).Order("created_at desc").Find(&orders).Error
	return orders, err
}

// ดูคำสั่งซื้อเดียว
func GetOrder(orderID, userID int64) (*Order, error) {
	var order Order
	err := db.Preload("Items").Where("order_id = ? and user_id = ?", orderID, userID).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func UpdateOrder(order *Order) error {
	return db.Model(order).Updates(*order).Error
}

func DeleteOrder(orderID, userID int64) error {
	return db.Where("order_id = ? AND user_id = ?", orderID, userID).Delete(&Order{}, orderID).Error
}

// สร้างข้อมูลในคำสั่งซื้อ
func CreateOrderItem(item *OrderItem) error {
	return db.Create(item).Error
}

// ดึงข้อมูลสินค้าทั้งหมดในคำสั่งซื้อ
func GetOrderItems(orderID int64) ([]OrderItem, error) {
	var items []OrderItem
	err := db.Where("order_id = ?", orderID).Find(&items).Error
	return items, err
}
