package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
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

	// =========================================================================
	// XỬ LÝ ĐỒNG BỘ DANH MỤC SẢN PHẨM TRƯỚC TRANSACTION (HỖ TRỢ SKU CHỨA KÝ TỰ CHỮ)
	// =========================================================================
	for _, p := range input.Products {
		var exists int64
		// Kiểm tra sự tồn tại trong danh mục items dựa trên chuỗi SKU (bất kể cột tên là id hay sku)
		config.DB.Table("items").Where("id = ? OR sku = ?", p.Sku, p.Sku).Count(&exists)

		if exists == 0 {
			// Thử chèn bản ghi mới với chuỗi SKU vào DB nhằm thỏa mãn ràng buộc khóa ngoại
			// Sử dụng lệnh INSERT IGNORE hoặc ON CONFLICT DO NOTHING để chống crash luồng hệ thống
			_ = config.DB.Exec("INSERT INTO items (sku, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING", p.Sku, p.Name, time.Now(), time.Now())
			
			// Trường hợp cấu trúc bảng items của bạn dùng cột id làm khóa chính nhưng đổi sang kiểu VARCHAR/TEXT
			_ = config.DB.Exec("INSERT INTO items (id, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING", p.Sku, p.Name, time.Now(), time.Now())
		}
	}

	// =========================================================================
	// BẮT ĐẦU BLOCK TRANSACTION CHÍNH
	// =========================================================================
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
		// Xử lý kiểm tra/tạo lô hàng mới
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

	// =========================================================================
	// 📡 ĐỒNG BỘ SỐ LƯỢNG TỒN KHO SANG PRODUCT-SERVICE (BẤT ĐỒNG BỘ)
	// =========================================================================
	go func(products []ImportProductPayload) {
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
		}

		payloadBody := map[string]interface{}{
			"items": syncList,
		}

		jsonData, err := json.Marshal(payloadBody)
		if err != nil {
			fmt.Println("❌ [Sync] Lỗi mã hóa JSON dữ liệu tồn kho:", err.Error())
			return
		}

		productServiceURL := "http://localhost:5002/api/products/internal/update-stock"

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
	}(input.Products)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "🎉 Đã lưu chứng từ và cập nhật hệ thống lô hàng thành công!",
		"ma_phieu": maPhieuAuto,
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