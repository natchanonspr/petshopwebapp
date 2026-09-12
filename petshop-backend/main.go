package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"fmt"

	"petshop-backend/internal/address"
	"petshop-backend/internal/cart"
	"petshop-backend/internal/category"
	"petshop-backend/internal/middleware"
	"petshop-backend/internal/pet"
	"petshop-backend/internal/product"
	"petshop-backend/internal/user"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	//เชื่อม PostgreSQL
	if err := godotenv.Load(); err != nil {
		log.Println("Load .env Error")
	}

	dbport := os.Getenv("DBPORT")
	dbhost := os.Getenv("DBHOST")
	dbuser := os.Getenv("DBUSER")
	dbname := os.Getenv("DBNAME")
	dbpassword := os.Getenv("DBPASSWORD")
	jwtSecret := os.Getenv("JWT_SECRET")

	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s  sslmode=disable",
		dbhost, dbport, dbuser, dbname, dbpassword)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to Connect to Database")
	}
	//ส่ง db เข้า package
	user.SetDB(db)
	pet.SetDB(db)
	product.SetDB(db)
	category.SetDB(db)
	cart.SetDB(db)
	address.SetDB(db)

	// สร้าง/อัปเดตตารางอัตโนมัติตาม struct
	if err := db.AutoMigrate(&user.User{}, &pet.Pet{}, &category.Category{}, &product.Product{}, &cart.Cart{}, &address.Address{}); err != nil {
		log.Fatalf("AutoMigrate fail: %v", err)
	}
	// กัน category_id ชี้ไปหมวดที่ไม่มีจริง + กันลบ category ที่ยังมี product ใช้อยู่
	if err := db.Exec(`
	ALTER TABLE products
	ADD CONSTRAINT fk_products_category
	FOREIGN KEY (category_id) REFERENCES categories(category_id)
	ON DELETE RESTRICT`).Error; err != nil {
		log.Println("Add FK constraint warning:", err)
	}

	// เชื่อม fiber
	app := fiber.New()

	// อนุญาต frontend เรียก API ข้าม origin
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5175, https://garnet-tradition-persuader.ngrok-free.dev",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// User API
	app.Post("/register", user.Register)
	app.Post("/login", user.Login)
	app.Post("/auth/line", user.LineLogin)

	// Pet API
	pets := app.Group("/pets", middleware.JWTProtected(jwtSecret))
	pets.Post("/", pet.Create)
	pets.Get("/:id", pet.Read)
	pets.Get("/", pet.List)
	pets.Put("/:id", pet.Update)
	pets.Delete("/:id", pet.Delete)

	// Product API User
	app.Get("/products/:id", product.Read)
	app.Get("/products", product.List)

	// Product API Admin
	adminProducts := app.Group("/products", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminProducts.Post("/", product.Create)
	adminProducts.Put("/:id", product.Update)
	adminProducts.Delete("/:id", product.Delete)

	// Category API
	app.Get("/categories", category.List)
	app.Get("/categories/:id", category.Read)

	adminCategories := app.Group("/categories", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminCategories.Post("/", category.Create)
	adminCategories.Put("/:id", category.Update)
	adminCategories.Delete("/:id", category.Delete)

	// Cart API
	carts := app.Group("/cart", middleware.JWTProtected(jwtSecret))
	carts.Get("/", cart.ReadCart)
	carts.Post("/items", cart.AddItem)
	carts.Put("/items/:itemId", cart.UpdateItem)
	carts.Delete("/items/:itemId", cart.RemoveItem)

	// Address API
	addresses := app.Group("/addresses", middleware.JWTProtected(jwtSecret))
	addresses.Get("/", address.List)
	addresses.Post("/", address.Create)
	addresses.Put("/:id", address.Update)
	addresses.Delete("/:id", address.Delete)

	port := os.Getenv("PORT")
	log.Fatal(app.Listen(":" + port))
}
