package cart

import (
	"errors"
	"petshop-backend/internal/product"

	"gorm.io/gorm"
)

var ErrProductNotFound = errors.New("ไม่พบสินค้า")
var ErrOutOfStock = errors.New("สินค้าในสต็อกไม่พอ")
var ErrNotOwner = errors.New("ไม่ใช่รายการในตะกร้าของคุณ")
var ErrInvalidQuantity = errors.New("จำนวนต้องมากกว่า 0")

func AddItemService(userID int64, req *AddItemRequest) ([]Cart, error) {
	if req.CartQuantity <= 0 {
		return nil, ErrInvalidQuantity
	}

	product, err := product.GetProduct(req.ProductID)
	if err != nil {
		return nil, ErrProductNotFound
	}

	existing, err := GetCartByProduct(userID, req.ProductID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if existing != nil {
		nextQty := existing.CartQuantity + req.CartQuantity
		if nextQty > product.ProductStock {
			return nil, ErrOutOfStock
		}

		existing.CartQuantity = nextQty
		if err := UpdateCart(existing); err != nil {
			return nil, err
		}
	} else {
		if req.CartQuantity > product.ProductStock {
			return nil, ErrOutOfStock
		}

		item := &Cart{UserID: userID, ProductID: req.ProductID, CartQuantity: req.CartQuantity}
		if err := CreateCart(item); err != nil {
			return nil, err
		}
	}

	return GetCart(userID)
}

func UpdateItemService(userID, cartID int64, req *UpdateItemRequest) ([]Cart, error) {
	if req.CartQuantity <= 0 {
		return nil, ErrInvalidQuantity
	}

	item, err := GetCartByID(cartID)
	if err != nil {
		return nil, err
	}

	if item.UserID != userID {
		return nil, ErrNotOwner
	}

	product, err := product.GetProduct(item.ProductID)
	if err != nil {
		return nil, ErrProductNotFound
	}

	if req.CartQuantity > product.ProductStock {
		return nil, ErrOutOfStock
	}

	item.CartQuantity = req.CartQuantity
	if err := UpdateCart(item); err != nil {
		return nil, err
	}

	return GetCart(userID)
}

func RemoveItemServices(userID, cartID int64) ([]Cart, error) {
	item, err := GetCartByID(cartID)
	if err != nil {
		return nil, err
	}

	if item.UserID != userID {
		return nil, ErrNotOwner
	}

	if err := DeleteCart(cartID); err != nil {
		return nil, err
	}

	return GetCart(userID)
}

func GetCartService(userID int64) ([]Cart, error) {
	return GetCart(userID)
}
