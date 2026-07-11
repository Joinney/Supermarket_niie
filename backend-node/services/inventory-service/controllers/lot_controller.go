package controllers

import (
	"net/http"
	"time"

	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

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