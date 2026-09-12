package category

import (
	"errors"
)

var ErrEmptyName = errors.New("ชื่อหมวดหมู่ห้ามว่าง")
var ErrCategoryInUse = errors.New("ไม่สามารถลบหมวดหมู่ที่มีสินค้าอยู่")

func CreateCategoryService(req *CategoryRequest) (*Category, error) {
	if req.CategoryName == "" {
		return nil, ErrEmptyName
	}

	category := &Category{
		CategoryName: req.CategoryName,
	}

	if err := CreateCategory(category); err != nil {
		return nil, err
	}
	return category, nil
}

func UpdateCategoryService(categoryID int64, req *CategoryRequest) (*Category, error) {
	if req.CategoryName == "" {
		return nil, ErrEmptyName
	}

	category, err := GetCategory(categoryID)
	if err != nil {
		return nil, err
	}

	category.CategoryName = req.CategoryName

	if err := UpdateCategory(category); err != nil {
		return nil, err
	}
	return category, nil
}

func DeleteCategoryService(cateogryID int64) error {
	_, err := GetCategory(cateogryID)
	if err != nil {
		return err
	}

	return DeleteCategory(cateogryID)
}
