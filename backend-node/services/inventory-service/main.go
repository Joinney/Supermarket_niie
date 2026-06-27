package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/controllers"

	// 🌟 ĐỒNG BỘ KHỚP HOÀN TOÀN gói docs sinh tự động từ module gốc
	_ "supermarket/warehouse-service/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Nạp biến môi trường .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Cảnh báo: Không tìm thấy file .env, hệ thống sẽ dùng biến môi trường hệ thống!")
	}

	r := gin.Default()

	// 🌟 KHẮC PHỤC CHỐNG REDIRECT LÀM MẤT DATA: Tắt tự động thêm/bớt xuyệt đuôi của Gin
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// Cấu hình CORS nới lỏng bảo mật kết nối với Frontend React
	// 📁 Sửa lại đoạn này trong file main.go ở Backend của bạn:
r.Use(cors.New(cors.Config{
    // 🌟 KHẮC PHỤC CHÍNH: Chỉ định chính xác URL Frontend thay vì dùng "*"
    AllowOrigins:     []string{"http://localhost:5173"}, 
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true, // Do thuộc tính này bật nên bắt buộc AllowOrigins không được để "*"
    MaxAge:           12 * time.Hour,
}))

	// Kết nối Database Supabase
	config.ConnectDatabase()

	// 🚀 ĐĂNG KÝ ROUTE API V1
	api := r.Group("/api/v1")
	{
		// 🌟 CHUẨN HÓA: Bỏ toàn bộ dấu xuyệt (/) ở cuối để khớp 100% với Axios Frontend
		api.GET("/inventory", controllers.GetInventory)
		api.POST("/inventory", controllers.CreateItem)
		api.PUT("/inventory/:id/stock", controllers.UpdateStock)

		// Kho hàng (Warehouse) phục vụ trực tiếp component NhapKhoForm
		api.GET("/warehouses", controllers.GetWarehouses)
	}

	// Tài liệu API Swagger
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health Check dịch vụ kho hàng
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "OK",
			"service": "Demi Mart Inventory Service",
			"message": "Hệ thống quản lý kho đang hoạt động xanh mướt! 🚀📦",
		})
	})

	// Giao diện chào mừng mặc định màu #006c49
	r.GET("/", func(c *gin.Context) {
		htmlContent := `<!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>Demi Mart Inventory Service</title>
            <style>
                body {
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .container {
                    text-align: center;
                    background-color: #ffffff;
                    padding: 50px 40px;
                    border-radius: 12px;
                    max-width: 700px;
                    width: 90%;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                }
                h1 {
                    color: #006c49;
                    font-size: 2.8rem;
                    margin-top: 0;
                    margin-bottom: 20px;
                    font-weight: 700;
                }
                p {
                    color: #64748b;
                    font-size: 1.25rem;
                    margin-bottom: 35px;
                    line-height: 1.6;
                }
                .btn-swagger {
                    display: inline-block;
                    background-color: #006c49;
                    color: white;
                    padding: 14px 32px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1.1rem;
                    text-decoration: none;
                    transition: background-color 0.2s ease, transform 0.1s ease;
                    box-shadow: 0 4px 6px -1px rgba(0, 108, 73, 0.2);
                }
                .btn-swagger:hover {
                    background-color: #005439;
                }
                .btn-swagger:active {
                    transform: scale(0.98);
                }
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
	r.Run("0.0.0.0:" + port)
}