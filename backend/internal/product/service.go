package product

import (
	"errors"
	"petshop-backend/internal/category"
	"strings"
)

var (
	ErrInvalidCategory = errors.New("หมวดหมู่สินค้าไม่ถูกต้อง")
	ErrEmptyName       = errors.New("ชื่อสินค้าห้ามว่าง")
	ErrInvalidPrice    = errors.New("ราคาต้องมากกว่า 0")
	ErrInvalidStock    = errors.New("จำนวนสินค้าต้องไม่ติดลบ")
)

func validateProductRequest(req *ProductRequest) error {
	if req == nil {
		return errors.New("ข้อมูลสินค้าไม่ถูกต้อง")
	}

	if req.CategoryID <= 0 {
		return ErrInvalidCategory
	}

	if strings.TrimSpace(req.ProductName) == "" {
		return ErrEmptyName
	}

	if req.ProductPrice <= 0 {
		return ErrInvalidPrice
	}

	if req.ProductStock < 0 {
		return ErrInvalidStock
	}

	if req.ProductKcalPer100g < 0 {
		return errors.New("ค่าพลังงานอาหารต้องไม่ติดลบ")
	}

	//ตรวจหมวดหมู่ว่ามีจริงไหม
	if _, err := category.GetCategory(req.CategoryID); err != nil {
		return ErrInvalidCategory
	}

	return nil
}

func CreateProductService(req *ProductRequest) (*Product, error) {
	if err := validateProductRequest(req); err != nil {
		return nil, err
	}

	product := &Product{
		CategoryID:         req.CategoryID,
		ProductName:        strings.TrimSpace(req.ProductName),
		ProductPrice:       req.ProductPrice,
		ProductKcalPer100g: req.ProductKcalPer100g,
		ProductStock:       req.ProductStock,
		ProductImage:       strings.TrimSpace(req.ProductImage),
		Description:        strings.TrimSpace(req.Description),
		ProductStatus:      true,
	}

	if err := CreateProduct(product); err != nil {
		return nil, err
	}
	return product, nil
}

func UpdateProductService(productID int64, req *ProductRequest) (*Product, error) {
	if err := validateProductRequest(req); err != nil {
		return nil, err
	}

	product, err := GetProduct(productID)
	if err != nil {
		return nil, err
	}

	product.CategoryID = req.CategoryID
	product.ProductName = strings.TrimSpace(req.ProductName)
	product.ProductPrice = req.ProductPrice
	product.ProductKcalPer100g = req.ProductKcalPer100g
	product.ProductStock = req.ProductStock
	product.ProductImage = strings.TrimSpace(req.ProductImage)
	product.Description = strings.TrimSpace(req.Description)

	if err := UpdateProduct(product); err != nil {
		return nil, err
	}

	return product, nil
}

func DeleteProductService(productID int64) error {
	_, err := GetProduct(productID)
	if err != nil {
		return err
	}

	return DeleteProduct(productID)
}
