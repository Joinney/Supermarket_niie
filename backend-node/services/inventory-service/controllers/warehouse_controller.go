package controllers

import (
	"net/http"
	"time"
	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

// GetWarehouses lấy toàn bộ danh sách kho hàng vật lý
func GetWarehouses(c *gin.Context) {
	var warehouses []models.Warehouse

	if err := config.DB.Order("ma_kho ASC").Find(&warehouses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi truy xuất dữ liệu kho: " + err.Error()})
		return
	}

	response := make([]map[string]interface{}, 0)
	for _, w := range warehouses {
		status := "inactive"
		if w.TrangThai {
			status = "active"
		}

		item := map[string]interface{}{
			"ma_kho":        w.MaKho,
			"ten_kho":       w.TenKho,
			"dia_chi":       w.DiaChi,
			"trang_thai":    status,
			"ngay_tao":       w.NgayTao.Format("02/01/2006 15:04"),
			"ngay_cap_nhat": w.NgayCapNhat.Format("02/01/2006 15:04"),
		}
		response = append(response, item)
	}
	c.JSON(http.StatusOK, response)
}

// ToggleWarehouseStatus: Bật/Tắt trạng thái kho hàng
func ToggleWarehouseStatus(c *gin.Context) {
	maKho := c.Param("id")
	var warehouse models.Warehouse

	// Tìm kho theo mã
	if err := config.DB.Where("ma_kho = ?", maKho).First(&warehouse).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy kho hàng này"})
		return
	}

	// Đảo ngược trạng thái (True thành False, False thành True)
	warehouse.TrangThai = !warehouse.TrangThai
	warehouse.NgayCapNhat = time.Now()

	// Lưu lại vào Database
	if err := config.DB.Save(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật trạng thái: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Cập nhật trạng thái thành công",
		"trang_thai": warehouse.TrangThai,
	})
}