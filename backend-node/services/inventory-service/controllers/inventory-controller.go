package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"supermarket/warehouse-service/config"
	"supermarket/warehouse-service/models"

	"github.com/gin-gonic/gin"
)

func GetInventory(c *gin.Context) {
	var items []models.Item
	if err := config.DB.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

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

type ImportProductPayload struct {
	Sku              string  `json:"sku" binding:"required"`
	Name             string  `json:"name"`
	StandardQuantity int     `json:"standard_quantity" binding:"required"`
	Price            float64 `json:"price" binding:"required"`
	LotName          string  `json:"lot_name" binding:"required"`
	ExpiryDate       string  `json:"expiry_date" binding:"required"`
}

type CreateInventoryImportInput struct {
	WarehouseID string                 `json:"warehouse_id" binding:"required"`
	ImportType  string                 `json:"import_type" binding:"required"`
	Note        string                 `json:"note"`
	Products    []ImportProductPayload `json:"products" binding:"required"`
}

// CreateInventoryImport xử lý tạo phiếu nhập và đồng bộ tự động dữ liệu lô hàng thực tế
func CreateInventoryImport(c *gin.Context) {
	var input CreateInventoryImportInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu payload không đúng cấu trúc: " + err.Error()})
		return
	}

	for _, p := range input.Products {
		var exists int64
		config.DB.Table("items").Where("sku = ?", p.Sku).Count(&exists)
if exists == 0 {
    // Chỉ chèn vào cột sku và name, để cột id tự động tăng theo cấu hình bigint của DB
    _ = config.DB.Exec("INSERT INTO items (sku, name, created_at, updated_at) VALUES (?, ?, ?, ?)", p.Sku, p.Name, time.Now(), time.Now())
}
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	todayStr := time.Now().Format("20060102")
	maPhieuAuto := fmt.Sprintf("PNK-%s-%d", todayStr, time.Now().UnixNano()%1000)

	phieuKho := models.PhieuKho{
		MaPhieu:         maPhieuAuto,
		LoaiPhieu:       input.ImportType,
		MaKho:           input.WarehouseID,
		GhiChu:          input.Note,
		NguoiThucHienID: 1,
	}

	if err := tx.Create(&phieuKho).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo chứng từ phiếu kho: " + err.Error()})
		return
	}

	for _, p := range input.Products {
		var lot models.Lot
		err := tx.Where("ma_lo_hang = ?", p.LotName).First(&lot).Error
		if err != nil {
			parsedExpiry, parseErr := time.Parse("2006-01-02", p.ExpiryDate)
			if parseErr != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Ngày hết hạn của sản phẩm %s không hợp lệ (Y-m-d)", p.Sku)})
				return
			}

			newLot := models.Lot{
				MaLoHang:    p.LotName,
				NgaySanXuat: time.Now(),
				NgayHetHan:  parsedExpiry,
				GiaNhap:     p.Price,
			}

			if err := tx.Create(&newLot).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi đồng bộ lô hàng mới vào cơ sở dữ liệu: " + err.Error()})
				return
			}
		}

		chiTiet := models.ChiTietPhieuKho{
			MaPhieu:  maPhieuAuto,
			Sku:      p.Sku,
			MaLoHang: p.LotName,
			SoLuong:  p.StandardQuantity,
		}

		if err := tx.Create(&chiTiet).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi lưu chi tiết mặt hàng nhập kho: " + err.Error()})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction Commit thất bại!"})
		return
	}

	go func(products []ImportProductPayload, warehouseID string) {
		type SyncItem struct {
			Sku      string `json:"sku"`
			Quantity int    `json:"quantity"`
		}

		var syncList []SyncItem
		for _, p := range products {
			syncList = append(syncList, SyncItem{
    Sku:      p.Sku,
    Quantity: p.StandardQuantity,
})

			var existStock int64
			config.DB.Table("ton_kho").Where("ma_kho = ? AND sku = ? AND ma_lo_hang = ?", warehouseID, p.Sku, p.LotName).Count(&existStock)
			if existStock == 0 {
				_ = config.DB.Exec("INSERT INTO ton_kho (ma_kho, sku, ma_lo_hang, so_luong_thuc_te, so_luong_tam_giu, ngay_tao, ngay_cap_nhat) VALUES (?, ?, ?, ?, 0, ?, ?)",
					warehouseID, p.Sku, p.LotName, p.StandardQuantity, time.Now(), time.Now())
			} else {
				_ = config.DB.Exec("UPDATE ton_kho SET so_luong_thuc_te = so_luong_thuc_te + ?, ngay_cap_nhat = ? WHERE ma_kho = ? AND sku = ? AND ma_lo_hang = ?",
					p.StandardQuantity, time.Now(), warehouseID, p.Sku, p.LotName)
			}
		}

		payloadBody := map[string]interface{}{
			"items": syncList,
		}

		jsonData, err := json.Marshal(payloadBody)
		if err != nil {
			fmt.Println("❌ [Sync] Lỗi mã hóa JSON dữ liệu tồn kho:", err.Error())
			return
		}

		productServiceHost := os.Getenv("PRODUCT_SERVICE_URL")
if productServiceHost == "" {
    productServiceHost = "http://localhost:5002" // fallback nếu chạy local không docker
}
productServiceURL := productServiceHost + "/api/products/internal/update-stock"

		req, err := http.NewRequest("PATCH", productServiceURL, bytes.NewBuffer(jsonData))
		if err != nil {
			fmt.Println("❌ [Sync] Lỗi khởi tạo request đồng bộ:", err.Error())
			return
		}
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Println("❌ [Sync] Lỗi kết nối HTTP tới Product-Service:", err.Error())
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			fmt.Printf("⚠️ [Sync] Product-Service phản hồi mã lỗi không thành công: %d\n", resp.StatusCode)
		} else {
			fmt.Println("📡 [Sync] Đã đồng bộ thành công dữ liệu sang Product-Service!")
		}
	}(input.Products, input.WarehouseID)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "🎉 Đã lưu chứng từ và cập nhật hệ thống lô hàng thành công!",
		"ma_phieu": maPhieuAuto,
	})
}

// 🌟 THÊM MỚI: API LẤY CHI TIẾT PHIẾU NHẬP KHO THỰC TẾ THEO ID CHỨNG TỪ
func GetInventoryImportDetail(c *gin.Context) {
	maPhieu := c.Param("id")

	var phieu models.PhieuKho
	if err := config.DB.Where("ma_phieu = ?", maPhieu).First(&phieu).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy chứng từ phiếu kho yêu cầu"})
		return
	}

	type ItemDetailResponse struct {
		Sku      string    `json:"sku"`
		Name     string    `json:"name"`
		MaLoHang string    `json:"ma_lo_hang"`
		SoLuong  int       `json:"so_luong"`
		GiaNhap  float64   `json:"gia_nhap"`
		Total    float64   `json:"total"`
		NgayTao  time.Time `json:"ngay_tao"`
	}

	var items []ItemDetailResponse

	err := config.DB.Table("chi_tiet_phieu_kho").
		Select("chi_tiet_phieu_kho.sku, items.name, chi_tiet_phieu_kho.ma_lo_hang, chi_tiet_phieu_kho.so_luong, lo_hang.gia_nhap, (chi_tiet_phieu_kho.so_luong * lo_hang.gia_nhap) as total, chi_tiet_phieu_kho.ngay_tao").
		Joins("LEFT JOIN lo_hang ON chi_tiet_phieu_kho.ma_lo_hang = lo_hang.ma_lo_hang").
		Joins("LEFT JOIN items ON chi_tiet_phieu_kho.sku = items.sku OR chi_tiet_phieu_kho.sku = items.id").
		Where("chi_tiet_phieu_kho.ma_phieu = ?", maPhieu).
		Scan(&items).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất dữ liệu: " + err.Error()})
		return
	}

	var totalMoney float64 = 0
	for _, item := range items {
		totalMoney += item.Total
	}

	c.JSON(http.StatusOK, gin.H{
		"ma_phieu":           phieu.MaPhieu,
		"loai_phieu":         phieu.LoaiPhieu,
		"ma_kho":             phieu.MaKho,
		"ghi_chu":            phieu.GhiChu,
		"nguoi_thuc_hien_id": phieu.NguoiThucHienID,
		"ngay_tao":           phieu.NgayTao.Format("02/01/2006 15:04"),
		"tong_tien":          totalMoney,
		"products":           items,
	})
}

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