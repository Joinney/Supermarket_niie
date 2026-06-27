package controllers

import (
	"net/http"


	// 🌟 ĐỒNG BỘ: Đổi từ "inventory-service" về chuẩn module trong go.mod
	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

// GetInventory Lấy danh sách sản phẩm trong kho
func GetInventory(c *gin.Context) {
	var items []models.Item
	if err := config.DB.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateItem Thêm sản phẩm mới vào kho
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
	c.JSON(http.StatusCreated, input)
}

// UpdateStock Cập nhật số lượng sản phẩm (Nhập/Xuất kho)
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

// 🌟 BỔ SUNG: API Lấy danh sách thông tin các kho hàng (Select data)
// 📁 Sửa lại toàn bộ hàm này trong controllers/inventory-controller.go
func GetWarehouses(c *gin.Context) {
	var warehouses []models.Warehouse

	// 1. Lấy dữ liệu từ Database
	if err := config.DB.Find(&warehouses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi truy xuất dữ liệu kho: " + err.Error()})
		return
	}

	// 2. Tạo một Slice (Mảng trong Go) để chứa dữ liệu format
	// Khởi tạo mảng rỗng thay vì nil để tránh lỗi frontend nhận về null
	response := make([]map[string]interface{}, 0)

	for _, w := range warehouses {
		status := "maintenance"
		if w.TrangThai {
			status = "active"
		}

		item := map[string]interface{}{
			"ma_kho":        w.MaKho,
			"ten_kho":       w.TenKho,
			"dia_chi":       w.DiaChi,
			"trang_thai":    status,
			"ngay_tao":      w.NgayTao.Format("02/01/2006 15:04"),
			"ngay_cap_nhat": w.NgayCapNhat.Format("02/01/2006 15:04"),
		}
		
		response = append(response, item)
	}

	// 3. Trả về mảng JSON chuẩn (Gin sẽ tự động bọc dấu [...] cho biến response)
	c.JSON(http.StatusOK, response)
}