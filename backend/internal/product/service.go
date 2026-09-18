package product

import "errors"

var ErrInvalidStock = errors.New("จำนวนสินค้าต้องไม่ติดลบ")

func CreateProductService(req *ProductRequest) (*Product, error) {
	if req.ProductStock < 0 {
		return nil, ErrInvalidStock
	}
	product := &Product{
		CategoryID:    req.CategoryID,
		ProductName:   req.ProductName,
		ProductPrice:  req.ProductPrice,
		ProductStock:  req.ProductStock,
		ProductImage:  req.ProductImage,
		Description:   req.Description,
		ProductStatus: true,
	}

	if err := CreateProduct(product); err != nil {
		return nil, err
	}
	return product, nil
}

func UpdateProductService(productID int64, req *ProductRequest) (*Product, error) {
	product, err := GetProduct(productID)
	if err != nil {
		return nil, err
	}

	product.CategoryID = req.CategoryID
	product.ProductName = req.ProductName
	product.ProductPrice = req.ProductPrice
	product.ProductStock = req.ProductStock
	product.ProductImage = req.ProductImage
	product.Description = req.Description

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
