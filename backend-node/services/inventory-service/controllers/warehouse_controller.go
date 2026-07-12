package controllers

import (
	"net/http"
	"time"

	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

// ---------------------------------------------------------
// 1. LẤY DANH SÁCH KHO
// ---------------------------------------------------------
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
			"ngay_tao":      w.NgayTao.Format("02/01/2006 15:04"),
			"ngay_cap_nhat": w.NgayCapNhat.Format("02/01/2006 15:04"),
		}
		response = append(response, item)
	}
	c.JSON(http.StatusOK, response)
}

// ---------------------------------------------------------
// 2. TẠO KHO MỚI
// ---------------------------------------------------------
func CreateWarehouse(c *gin.Context) {
	var input struct {
		MaKho  string `json:"ma_kho" binding:"required"`
		TenKho string `json:"ten_kho" binding:"required"`
		DiaChi string `json:"dia_chi"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu đầu vào không hợp lệ: " + err.Error()})
		return
	}

	// Kiểm tra mã kho đã tồn tại chưa
	var count int64
	config.DB.Model(&models.Warehouse{}).Where("ma_kho = ?", input.MaKho).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Mã kho này đã tồn tại trong hệ thống"})
		return
	}

	newWarehouse := models.Warehouse{
		MaKho:       input.MaKho,
		TenKho:      input.TenKho,
		DiaChi:      input.DiaChi,
		TrangThai:   true, // Mặc định tạo ra là Hoạt động
		NgayTao:     time.Now(),
		NgayCapNhat: time.Now(),
	}

	if err := config.DB.Create(&newWarehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo kho: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Tạo kho thành công", "data": newWarehouse})
}

// ---------------------------------------------------------
// 3. CHỈNH SỬA THÔNG TIN KHO
// ---------------------------------------------------------
func UpdateWarehouse(c *gin.Context) {
	maKho := c.Param("id")
	var input struct {
		TenKho string `json:"ten_kho" binding:"required"`
		DiaChi string `json:"dia_chi"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu đầu vào không hợp lệ"})
		return
	}

	var warehouse models.Warehouse
	if err := config.DB.Where("ma_kho = ?", maKho).First(&warehouse).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy kho hàng này"})
		return
	}

	warehouse.TenKho = input.TenKho
	warehouse.DiaChi = input.DiaChi
	warehouse.NgayCapNhat = time.Now()

	if err := config.DB.Save(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật kho: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật kho thành công", "data": warehouse})
}

// ---------------------------------------------------------
// 4. BẬT / TẮT TRẠNG THÁI KHO
// ---------------------------------------------------------
func ToggleWarehouseStatus(c *gin.Context) {
	maKho := c.Param("id")
	var warehouse models.Warehouse

	if err := config.DB.Where("ma_kho = ?", maKho).First(&warehouse).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy kho hàng này"})
		return
	}

	warehouse.TrangThai = !warehouse.TrangThai
	warehouse.NgayCapNhat = time.Now()

	if err := config.DB.Save(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật trạng thái: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Cập nhật trạng thái thành công",
		"trang_thai": warehouse.TrangThai,
	})
}

// ---------------------------------------------------------
// 5. XÓA CỨNG KHO HÀNG (CÓ BẢO VỆ)
// ---------------------------------------------------------
func DeleteWarehouse(c *gin.Context) {
	maKho := c.Param("id")

	// 1. Kiểm tra kho có tồn tại không
	var warehouse models.Warehouse
	if err := config.DB.Where("ma_kho = ?", maKho).First(&warehouse).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy kho hàng này"})
		return
	}

	// 2. BẢO VỆ: Kiểm tra xem kho này đã có phiếu nhập/xuất nào chưa
	// Sử dụng Raw Query kiểm tra trực tiếp bảng inventory_tickets cho an toàn
	var count int64
	config.DB.Table("inventory_tickets").Where("ma_kho = ?", maKho).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error": "TỪ CHỐI XÓA: Kho này đang chứa dữ liệu phiếu nhập/xuất. Vui lòng chuyển trạng thái sang 'Bảo trì' thay vì xóa.",
		})
		return
	}

	// 3. Thực hiện xóa cứng (Hard Delete)
	if err := config.DB.Delete(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi xóa kho: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa kho hàng vĩnh viễn"})
}