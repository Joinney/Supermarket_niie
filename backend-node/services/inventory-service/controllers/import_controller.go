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
	UserId      int                    `json:"user_id"`
	FullName    string                 `json:"full_name"`
	Products    []ImportProductPayload `json:"products" binding:"required"`
}

// GetInventoryTickets lấy danh sách tất cả chứng từ nhập xuất kho
func GetInventoryTickets(c *gin.Context) {
	var tickets []models.PhieuKho
	if err := config.DB.Order("ngay_tao desc").Find(&tickets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách phiếu: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

// GetInventoryImportDetail xem chi tiết một phiếu nhập và tính tổng tiền
func GetInventoryImportDetail(c *gin.Context) {
	maPhieu := c.Param("id")
	var phieu models.PhieuKho
	if err := config.DB.Where("ma_phieu = ?", maPhieu).First(&phieu).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy chứng từ phiếu kho"})
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
    	Joins("LEFT JOIN items ON chi_tiet_phieu_kho.sku = items.sku"). 
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

// CreateInventoryImport tạo phiếu nhập kho + chạy goroutine đồng bộ tồn kho sang Website bán hàng
func CreateInventoryImport(c *gin.Context) {
	var input CreateInventoryImportInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload sai cấu trúc: " + err.Error()})
		return
	}

	for _, p := range input.Products {
		var exists int64
		config.DB.Table("items").Where("sku = ?", p.Sku).Count(&exists)
		if exists == 0 {
			_ = config.DB.Exec("INSERT INTO items (sku, name, created_at, updated_at) VALUES (?, ?, ?, ?)", p.Sku, p.Name, time.Now(), time.Now())
		}
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	maPhieuAuto := fmt.Sprintf("PNK-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano()%1000)
	finalNote := input.Note
	if input.FullName != "" {
		if finalNote != "" {
			finalNote = fmt.Sprintf("Người lập: %s | Ghi chú: %s", input.FullName, finalNote)
		} else {
			finalNote = fmt.Sprintf("Người lập: %s", input.FullName)
		}
	}

	executorID := input.UserId
	if executorID == 0 {
		executorID = 1
	}

	phieuKho := models.PhieuKho{
		MaPhieu:         maPhieuAuto,
		LoaiPhieu:       input.ImportType,
		MaKho:           input.WarehouseID,
		GhiChu:          finalNote,
		NguoiThucHienID: executorID,
	}

	if err := tx.Create(&phieuKho).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi tạo chứng từ: " + err.Error()})
		return
	}

	for _, p := range input.Products {
		var lot models.Lot
		err := tx.Where("ma_lo_hang = ?", p.LotName).First(&lot).Error
		if err != nil {
			parsedExpiry, parseErr := time.Parse("2006-01-02", p.ExpiryDate)
			if parseErr != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "Ngày hết hạn sai định dạng (Y-m-d)"})
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
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lưu lô hàng: " + err.Error()})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lưu chi tiết phiếu: " + err.Error()})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction Commit thất bại"})
		return
	}

	// Luồng xử lý ngầm (Asynchronous Sync) sang Website bán hàng giữ nguyên bằng Goroutine
	go func(products []ImportProductPayload, warehouseID string) {
		type SyncItem struct {
			Sku      string `json:"sku"`
			Quantity int    `json:"quantity"`
		}
		var syncList []SyncItem
		for _, p := range products {
			syncList = append(syncList, SyncItem{Sku: p.Sku, Quantity: p.StandardQuantity})
			var existStock int64
			config.DB.Table("ton_kho").Where("ma_kho = ? AND sku = ? AND ma_lo_hang = ?", warehouseID, p.Sku, p.LotName).Count(&existStock)
			if existStock == 0 {
				_ = config.DB.Exec("INSERT INTO ton_kho (ma_kho, sku, ma_lo_hang, so_luong_thuc_te, so_luong_tam_giu, ngay_tao, ngay_cap_nhat) VALUES (?, ?, ?, ?, 0, ?, ?)", warehouseID, p.Sku, p.LotName, p.StandardQuantity, time.Now(), time.Now())
			} else {
				_ = config.DB.Exec("UPDATE ton_kho SET so_luong_thuc_te = so_luong_thuc_te + ?, ngay_cap_nhat = ? WHERE ma_kho = ? AND sku = ? AND ma_lo_hang = ?", p.StandardQuantity, time.Now(), warehouseID, p.Sku, p.LotName)
			}
		}

		jsonData, _ := json.Marshal(map[string]interface{}{"items": syncList})
		productServiceHost := os.Getenv("PRODUCT_SERVICE_URL")
		if productServiceHost == "" {
			productServiceHost = "http://localhost:5002"
		}
		req, _ := http.NewRequest("PATCH", productServiceHost+"/api/products/internal/update-stock", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			fmt.Println("📡 [Sync] Đã đồng bộ tồn kho sang Product-Service!")
		}
	}(input.Products, input.WarehouseID)

	c.JSON(http.StatusCreated, gin.H{"message": "🎉 Lưu chứng từ nhập kho thành công!", "ma_phieu": maPhieuAuto})
}