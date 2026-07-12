package controllers

import (
	"net/http"
	"time"

	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

// 🌟 KHAI BÁO STRUCT Ở NGOÀI HÀM ĐỂ TRÁNH LỖI SWAGGER (exit code: 1)
type LotSummaryResponse struct {
	MaLoHang    string    `json:"ma_lo_hang" gorm:"column:ma_lo_hang"`
	Sku         string    `json:"sku" gorm:"column:sku"`
	TenSanPham  string    `json:"ten_san_pham" gorm:"column:ten_san_pham"`
	NgaySanXuat time.Time `json:"ngay_san_xuat" gorm:"column:ngay_san_xuat"`
	NgayHetHan  time.Time `json:"ngay_het_han" gorm:"column:ngay_het_han"`
	TonHienTai  int       `json:"ton_hien_tai" gorm:"column:ton_hien_tai"`
}

// GetLots lấy danh sách toàn bộ lô hàng hiện có để kiểm soát date
func GetLots(c *gin.Context) {
	var lots []models.Lot
	if err := config.DB.Order("ma_lo_hang DESC").Find(&lots).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tải danh sách lô hàng: " + err.Error()})
		return
	}
	if lots == nil {
		lots = make([]models.Lot, 0)
	}
	c.JSON(http.StatusOK, lots)
}

// Lấy danh sách Lô Hàng kèm Tồn kho và Tên Sản Phẩm (Dùng cho giao diện Quản lý Lô Hàng)
func GetLotsSummary(c *gin.Context) {
	var summaries []LotSummaryResponse

	// THỰC HIỆN JOIN 3 BẢNG: lo_hang -> ton_kho -> items
	err := config.DB.Table("lo_hang").
		Select("lo_hang.ma_lo_hang, ton_kho.sku, COALESCE(items.name, 'Chưa xác định') AS ten_san_pham, lo_hang.ngay_san_xuat, lo_hang.ngay_het_han, COALESCE(ton_kho.so_luong_thuc_te, 0) AS ton_hien_tai").
		Joins("LEFT JOIN ton_kho ON lo_hang.ma_lo_hang = ton_kho.ma_lo_hang").
		Joins("LEFT JOIN items ON ton_kho.sku = items.sku").
		Order("lo_hang.ngay_het_han ASC"). // Sắp xếp theo ngày hết hạn (Cận date lên đầu)
		Scan(&summaries).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy vấn dữ liệu lô hàng: " + err.Error()})
		return
	}

	if summaries == nil {
		summaries = make([]LotSummaryResponse, 0)
	}

	c.JSON(http.StatusOK, summaries)
}

// CreateLot tạo mới lô hàng thủ công từ giao diện nếu cần
func CreateLot(c *gin.Context) {
	var input struct {
		Sku        string  `json:"sku" binding:"required"`
		LotName    string  `json:"lot_name" binding:"required"`
		Price      float64 `json:"price"`
		ExpiryDate string  `json:"expiry_date" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu lô hàng không hợp lệ: " + err.Error()})
		return
	}

	parsedExpiry, err := time.Parse("2006-01-02", input.ExpiryDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng ngày hết hạn phải là YYYY-MM-DD"})
		return
	}

	newLot := models.Lot{
		MaLoHang:    input.LotName,
		NgaySanXuat: time.Now(),
		NgayHetHan:  parsedExpiry,
		GiaNhap:     input.Price,
	}

	if err := config.DB.Create(&newLot).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi lưu lô hàng vào Database: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, newLot)
}