package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"petshop-backend/internal/address"
	"petshop-backend/internal/ai"
	"petshop-backend/internal/cart"
	"petshop-backend/internal/category"
	"petshop-backend/internal/middleware"
	"petshop-backend/internal/notification"
	"petshop-backend/internal/order"
	"petshop-backend/internal/pet"
	"petshop-backend/internal/product"
	"petshop-backend/internal/user"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

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

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		panic("Failed to Connect to Database")
	}

	user.SetDB(db)
	pet.SetDB(db)
	product.SetDB(db)
	category.SetDB(db)
	cart.SetDB(db)
	address.SetDB(db)
	order.SetDB(db)
	notification.SetDB(db)
	ai.SetDB(db)

	// สร้าง/อัปเดตตารางอัตโนมัติตาม struct
	if err := db.AutoMigrate(
		&user.User{},
		&pet.Pet{},
		&order.Order{},
		&order.OrderItem{},
		&category.Category{},
		&product.Product{},
		&address.Address{},
		&cart.Cart{},
		&notification.Notification{},
		&notification.NotificationRecipient{},
	); err != nil {
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
		AllowOrigins: strings.Join([]string{
			"http://localhost:5175",
			"http://127.0.0.1:5175",
			"https://petshopwebapp-coz5.vercel.app",
		}, ","),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, ngrok-skip-browser-warning",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
	}))

	// User API
	app.Post("/register", user.Register)
	app.Post("/login", user.Login)
	app.Post("/auth/line", user.LineLogin)

	profile := app.Group("/profile", middleware.JWTProtected(jwtSecret))
	profile.Get("/", user.GetProfile)
	profile.Put("/", user.UpdateProfile)

	// Admin User API
	adminUsers := app.Group("/admin/users", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminUsers.Get("/", user.AdminList)
	adminUsers.Get("/:id", user.AdminRead)
	adminUsers.Delete("/:id", user.AdminDelete)
	adminUsers.Patch("/:id/role", user.AdminUpdateRole)

	// PET API
	pets := app.Group("/pets", middleware.JWTProtected(jwtSecret))
	pets.Post("/", pet.Create)
	pets.Get("/:id", pet.Read)
	pets.Get("/", pet.List)
	pets.Put("/:id", pet.Update)
	pets.Delete("/:id", pet.Delete)

	//Product API
	app.Get("/products/:id", product.Read)
	app.Get("/products", product.List)
	//Product Admin
	adminProducts := app.Group("/products", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminProducts.Post("/", product.Create)
	adminProducts.Put("/:id", product.Update)
	adminProducts.Delete("/:id", product.Delete)

	// Category API
	app.Get("/categories", category.List)
	app.Get("/categories/:id", category.Read)
	// Category Admin
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

	// Order API
	orderGroup := app.Group("/orders", middleware.JWTProtected(jwtSecret))
	orderGroup.Post("/", order.Create)
	orderGroup.Get("/", order.List)
	orderGroup.Get("/:id", order.Read)
	orderGroup.Patch("/:id/cancel", order.Cancel)
	// Admin Order API
	adminOrders := app.Group("/admin/orders", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminOrders.Get("/", order.AdminList)
	adminOrders.Get("/:id", order.AdminRead)
	adminOrders.Patch("/:id/status", order.AdminUpdateStatus)

	// Noti API
	notifications := app.Group("/notifications", middleware.JWTProtected(jwtSecret))
	notifications.Get("/", notification.List)
	notifications.Get("/unread-count", notification.UnreadCount)
	notifications.Patch("/:id/read", notification.MarkRead)
	notifications.Patch("/read-all", notification.MarkAllRead)
	//Admin Noti
	adminNotifications := app.Group("/admin/notifications", middleware.JWTProtected(jwtSecret), middleware.AdminOnly)
	adminNotifications.Get("/", notification.AdminList)
	adminNotifications.Post("/", notification.AdminCreate)
	adminNotifications.Delete("/", notification.AdminDelete)

	//AI
	app.Get("/ai/recommendations", middleware.JWTProtected(os.Getenv("JWT_SECRET")), ai.Recommendations)

	port := os.Getenv("PORT")
	log.Fatal(app.Listen(":" + port))
}
