package controllers

import (
	"net/http"
	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

// InventoryStockResponse định nghĩa cấu trúc dữ liệu trả về cho Frontend
type InventoryStockResponse struct {
	Sku        string  `json:"id" gorm:"column:sku"`
	Name       string  `json:"name" gorm:"column:name"`
	Quantity   int     `json:"quantity" gorm:"column:total_quantity"`
	CostPrice  float64 `json:"costPrice" gorm:"column:total_cost_value"`
	TotalValue float64 `json:"totalValue" gorm:"column:total_retail_value"`
	CreatedAt  string  `json:"createdAt" gorm:"column:first_import_date"`
	UpdatedAt  string  `json:"updatedAt" gorm:"column:last_update_date"`  
	Supplier   string  `json:"supplier" gorm:"column:supplier_name"`
}

// 🌟 GetInventory (ĐÃ NÂNG CẤP): Lọc theo Kho nguồn (nếu có) & Gom nhóm tồn kho
func GetInventory(c *gin.Context) {
	var inventoryList []InventoryStockResponse

	// Lấy tham số ma_kho từ URL (nếu có)
	maKho := c.Query("ma_kho")

	// Khởi tạo câu truy vấn cơ bản
	// Sửa lại câu truy vấn để nối bảng qua phieu_kho
    query := config.DB.Table("ton_kho").
        Select(`
            ton_kho.sku, 
            COALESCE(MAX(items.name), 'Sản phẩm chưa xác định') AS name, 
            SUM(ton_kho.so_luong_thuc_te) AS total_quantity,
            SUM(ton_kho.so_luong_thuc_te * COALESCE(lo_hang.gia_nhap, 0)) AS total_cost_value,
            SUM(ton_kho.so_luong_thuc_te * COALESCE(items.price, lo_hang.gia_nhap * 1.3, 0)) AS total_retail_value,
            MIN(ton_kho.ngay_tao) AS first_import_date,
            MAX(ton_kho.ngay_cap_nhat) AS last_update_date,
            MAX(nha_cung_cap.ten_nha_cung_cap) AS supplier_name 
        `).
        Joins("LEFT JOIN items ON ton_kho.sku = items.sku").
        Joins("LEFT JOIN lo_hang ON ton_kho.ma_lo_hang = lo_hang.ma_lo_hang").
        Joins("LEFT JOIN chi_tiet_phieu_kho ON ton_kho.sku = chi_tiet_phieu_kho.sku AND ton_kho.ma_lo_hang = chi_tiet_phieu_kho.ma_lo_hang").
        Joins("LEFT JOIN phieu_kho ON chi_tiet_phieu_kho.ma_phieu = phieu_kho.ma_phieu").
        Joins("LEFT JOIN nha_cung_cap ON phieu_kho.ma_nha_cung_cap = nha_cung_cap.ma_nha_cung_cap")

	// 🌟 FIX LOGIC: Nếu FE truyền lên ma_kho thì chỉ lọc tồn kho của đúng kho đó!
	if maKho != "" {
		query = query.Where("ton_kho.ma_kho = ?", maKho)
	}

	// Thực thi gom nhóm và quét dữ liệu
	err := query.
		Group("ton_kho.sku").
		Order("last_update_date DESC"). 
		Scan(&inventoryList).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy vấn tổng hợp tồn kho: " + err.Error()})
		return
	}

	if inventoryList == nil {
		inventoryList = make([]InventoryStockResponse, 0)
	}

	c.JSON(http.StatusOK, inventoryList)
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