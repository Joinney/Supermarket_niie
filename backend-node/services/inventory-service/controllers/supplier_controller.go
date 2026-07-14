package controllers

import (
	"net/http"
	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

// GetSuppliers API trả về danh sách các nhà cung cấp đang ACTIVE
func GetSuppliers(c *gin.Context) {
	var suppliers []models.NhaCungCap
	
	// Truy vấn các nhà cung cấp đang hoạt động
	if err := config.DB.Where("trang_thai = ?", "ACTIVE").Find(&suppliers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách Nhà cung cấp"})
		return
	}

	c.JSON(http.StatusOK, suppliers)
}