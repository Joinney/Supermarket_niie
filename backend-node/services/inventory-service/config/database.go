package config

import (
	"fmt"
	"log"
	"os"
	"supermarket/warehouse-service/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	// Tạo chuỗi DSN kết nối PostgreSQL (Thêm sslmode=require vì dùng Supabase)
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=require TimeZone=Asia/Ho_Chi_Minh",
		host, user, password, dbName, port)

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("[-] Không thể kết nối đến cơ sở dữ liệu Supabase:", err)
	}

	// Tự động tạo hoặc cập nhật cấu trúc bảng 'items' dựa trên Model
	err = database.AutoMigrate(&models.Item{})
	if err != nil {
		log.Fatal("[-] Lỗi AutoMigrate:", err)
	}

	DB = database
	fmt.Println("[+] Kết nối và đồng bộ Database Supabase thành công!")
}