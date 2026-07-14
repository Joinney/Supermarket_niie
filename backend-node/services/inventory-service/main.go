package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/controllers"
	"supermarket/warehouse-service/models" // Đồng bộ cấu trúc bảng tự động bằng AutoMigrate

	_ "supermarket/warehouse-service/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Cảnh báo: Không tìm thấy file .env, hệ thống sẽ dùng biến môi trường hệ thống!")
	}

	r := gin.Default()
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// === 🛡️ CẤU HÌNH CORS ĐỒNG BỘ MÔI TRƯỜNG ===
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173", 
			"http://localhost:3000",
			"https://demimart-fe.onrender.com", 
		}, 
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Kết nối cơ sở dữ liệu Postgres public.lo_hang / public.kho_hang
	config.ConnectDatabase()

	// Hệ thống tự động kiểm tra và đồng bộ cấu trúc Database thực tế
	if config.DB != nil {
		err := config.DB.AutoMigrate(
			&models.Warehouse{},
			&models.Lot{},
			&models.PhieuKho{},
			&models.ChiTietPhieuKho{},
			&models.NhaCungCap{}, // 🌟 BƯỚC 1: Bổ sung AutoMigrate cho bảng mới
		)
		if err != nil {
			log.Fatalf("❌ Lỗi đồng bộ cấu trúc Database (AutoMigrate thất bại): %v", err)
		} else {
			log.Println("📡 Hệ thống GORM AutoMigrate cấu trúc kho bãi thành công!")
		}
	}

	// ========================================================
	// 📡 ĐỊNH TUYẾN NHÓM API V1 CHUẨN HÓA (REFACTORING GROUP)
	// ========================================================
	api := r.Group("/api/v1")
	{
		// 🏢 1. NHÓM QUẢN LÝ KHO HÀNG (warehouse_controller.go)
		api.GET("/warehouses", controllers.GetWarehouses)
		api.PUT("/warehouses/:id/toggle-status", controllers.ToggleWarehouseStatus)
		api.POST("/warehouses", controllers.CreateWarehouse)      
		api.PUT("/warehouses/:id", controllers.UpdateWarehouse)    
		api.DELETE("/warehouses/:id", controllers.DeleteWarehouse) 

		// 🧾 2. NHÓM CHỨNG TỪ & PHIẾU NHẬP KHO (import_controller.go)
		api.POST("/inventory", controllers.CreateInventoryImport)
		api.GET("/inventory-tickets", controllers.GetInventoryTickets)
		api.GET("/inventory-import/:id", controllers.GetInventoryImportDetail)

		// 📦 3. NHÓM QUẢN LÝ LÔ HÀNG & DATE (lot_controller.go)
		api.GET("/lots/summary", controllers.GetLotsSummary)
		api.POST("/lots", controllers.CreateLot)

		// 📊 4. NHÓM TỒN KHO VÀ ĐƠN VỊ VẬT TƯ (stock_controller.go)
		api.GET("/inventory", controllers.GetInventory)
		api.PUT("/inventory/:id/stock", controllers.UpdateStock)
		api.GET("/unit-conversions", controllers.GetUnitConversions) 
		
		// 🏭 5. NHÓM NHÀ CUNG CẤP & CÔNG NỢ (supplier_controller.go)
		api.GET("/inventory/suppliers", controllers.GetSuppliers) 

		// 🚚 6. NHÓM ĐIỀU CHUYỂN KHO (warehouse_controller.go)
		api.GET("/transfers", controllers.GetTransferTickets)
		api.POST("/transfers", controllers.CreateTransferTicket)
		api.PATCH("/transfers/:id/approve", controllers.ApproveTransferTicket)
	}
	
	// Tài liệu API Swagger
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Endpoint kiểm tra sức khỏe hệ thống (Health Check)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "OK",
			"service": "Demi Mart Inventory Service",
			"message": "Hệ thống quản lý kho đang hoạt động xanh mướt! 🚀📦",
		})
	})

	// Giao diện Web mặc định khi vào cổng port 5006
	r.GET("/", func(c *gin.Context) {
		htmlContent := `<!DOCTYPE html>
		<html lang="vi">
		<head>
			<meta charset="UTF-8">
			<title>Demi Mart Inventory Service</title>
			<style>
				body { background-color: #f8fafc; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
				.container { text-align: center; background-color: #ffffff; padding: 50px 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
				h1 { color: #006c49; margin-bottom: 20px; }
				.btn-swagger { display: inline-block; background-color: #006c49; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
			</style>
		</head>
		<body>
			<div class="container">
				<h1>Demi Mart Inventory Service</h1>
				<p>Hệ thống đang hoạt động xanh mướt! 🚀</p>
				<a href="/docs/index.html" class="btn-swagger">Vào Swagger xem API &rarr;</a>
			</div>
		</body>
		</html>`
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, htmlContent)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5006"
	}
	log.Printf("📡 Warehouse-Service đang khởi chạy tại cổng: %s", port)
	r.Run("0.0.0.0:" + port)
}