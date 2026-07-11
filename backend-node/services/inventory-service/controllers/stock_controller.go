package controllers

import (
	"net/http"
	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

// GetInventory lấy toàn bộ danh mục sản phẩm (items) đăng ký với kho
func GetInventory(c *gin.Context) {
	var items []models.Item
	if err := config.DB.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateItem đăng ký một mã sản phẩm vật tư mới vào danh mục kho
func CreateItem(c *gin.Context) {
	var input models.Item
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể thêm sản phẩm"})
		return
	}
	c.JSON(http.StatusOK, input)
}

// UpdateStock điều chỉnh tăng giảm số lượng tồn kho (Dùng cho kiểm kê)
func UpdateStock(c *gin.Context) {
	id := c.Param("id")
	var item models.Item
	if err := config.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy sản phẩm"})
		return
	}
	var input struct {
		Quantity int `json:"quantity" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	config.DB.Model(&item).Update("Quantity", input.Quantity)
	c.JSON(http.StatusOK, item)
}

// GetUnitConversions lấy bảng cấu hình quy đổi đơn vị bán lẻ/đóng gói
func GetUnitConversions(c *gin.Context) {
	var conversions []models.QuyDoiDonVi
	if err := config.DB.Find(&conversions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi truy xuất danh sách quy đổi đơn vị: " + err.Error()})
		return
	}
	if conversions == nil {
		conversions = make([]models.QuyDoiDonVi, 0)
	}
	c.JSON(http.StatusOK, conversions)
}