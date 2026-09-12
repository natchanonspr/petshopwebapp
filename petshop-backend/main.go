package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

<<<<<<< HEAD
=======
	"fmt"

	"petshop-backend/internal/address"
>>>>>>> 4519ec4dcc86e93b0a7bfdd9a6c7e29609fe8df8
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
	if err := godotenv.Load(); err != nil {
		log.Println("Load .env Error")
	}

	dbport := os.Getenv("DBPORT")
	dbhost := os.Getenv("DBHOST")
	dbuser := os.Getenv("DBUSER")
	dbname := os.Getenv("DBNAME")
	dbpassword := os.Getenv("DBPASSWORD")
	jwtSecret := os.Getenv("JWT_SECRET")

	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=disable", dbhost, dbport, dbuser, dbname, dbpassword)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to Connect to Database")
	}

	user.SetDB(db)
	pet.SetDB(db)
	product.SetDB(db)
	category.SetDB(db)
	cart.SetDB(db)
	address.SetDB(db)

<<<<<<< HEAD
	if err := db.AutoMigrate(&user.User{}, &pet.Pet{}, &category.Category{}, &product.Product{}, &cart.Cart{}); err != nil {
=======
	// สร้าง/อัปเดตตารางอัตโนมัติตาม struct
	if err := db.AutoMigrate(&user.User{}, &pet.Pet{}, &category.Category{}, &product.Product{}, &cart.Cart{}, &address.Address{}); err != nil {
>>>>>>> 4519ec4dcc86e93b0a7bfdd9a6c7e29609fe8df8
		log.Fatalf("AutoMigrate fail: %v", err)
	}

	if err := db.Exec(`
	DO $$
	BEGIN
		IF NOT EXISTS (
			SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_category'
		) THEN
			ALTER TABLE products
			ADD CONSTRAINT fk_products_category
			FOREIGN KEY (category_id) REFERENCES categories(category_id)
			ON DELETE RESTRICT;
		END IF;
	END
	$$;`).Error; err != nil {
		log.Println("Add FK constraint warning:", err)
	}

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5175, https://localhost:5175, https://garnet-tradition-persuader.ngrok-free.dev",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	app.Post("/register", user.Register)
	app.Post("/login", user.Login)
	app.Post("/auth/line", user.LineLogin)

	pets := app.Group("/pets", middleware.JWTProtected(jwtSecret))
	pets.Post("/", pet.Create)
	pets.Get("/:id", pet.Read)
	pets.Get("/", pet.List)
	pets.Put("/:id", pet.Update)
	pets.Delete("/:id", pet.Delete)

	app.Get("/products/:id", product.Read)
	app.Get("/products", product.List)

	adminProducts := app.Group("/products", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminProducts.Post("/", product.Create)
	adminProducts.Put("/:id", product.Update)
	adminProducts.Delete("/:id", product.Delete)

	app.Get("/categories", category.List)
	app.Get("/categories/:id", category.Read)

	adminCategories := app.Group("/categories", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminCategories.Post("/", category.Create)
	adminCategories.Put("/:id", category.Update)
	adminCategories.Delete("/:id", category.Delete)

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
