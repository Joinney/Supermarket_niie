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
	"gorm.io/gorm"
)

type ImportProductPayload struct {
	Sku              string  `json:"sku" binding:"required"`
	Name             string  `json:"name"`
	StandardQuantity int     `json:"standard_quantity" binding:"required"`
	Price            float64 `json:"price" binding:"required"` // Giá nhập / Giá vốn
	LotName          string  `json:"lot_name" binding:"required"`
	ExpiryDate       string  `json:"expiry_date" binding:"required"`
}

type CreateInventoryImportInput struct {
	WarehouseID  string                 `json:"warehouse_id" binding:"required"`
	ImportType   string                 `json:"import_type" binding:"required"`
	Note         string                 `json:"note"`
	UserId       int                    `json:"user_id"`
	FullName     string                 `json:"full_name"`
	AmountPaid   float64                `json:"amount_paid"`
	SupplierID   string                 `json:"supplier_id"`
	SupplierName string                 `json:"supplier_name"`
	Products     []ImportProductPayload `json:"products" binding:"required"`
}

// Data model cho API thanh toán
type PaymentInput struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// ----------------------------------------------------------------------
// 1. GetInventoryTickets: Lấy danh sách kèm số liệu Công Nợ
// ----------------------------------------------------------------------
func GetInventoryTickets(c *gin.Context) {
	var tickets []models.PhieuKho
	
	err := config.DB.Table("phieu_kho").
		Order("ngay_tao DESC").
		Find(&tickets).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách phiếu: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, tickets)
}

// ----------------------------------------------------------------------
// 2. GetInventoryImportDetail: Xem chi tiết phiếu nhập
// ----------------------------------------------------------------------
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

	c.JSON(http.StatusOK, gin.H{
		"ma_phieu":              phieu.MaPhieu,
		"loai_phieu":            phieu.LoaiPhieu,
		"ma_kho":                phieu.MaKho,
		"ghi_chu":               phieu.GhiChu,
		"nguoi_thuc_hien_id":    phieu.NguoiThucHienID,
		"nha_cung_cap":          phieu.NhaCungCap,
		"ngay_tao":              phieu.NgayTao.Format("02/01/2006 15:04"),
		"tong_tien":             phieu.TongTien,
		"da_thanh_toan":         phieu.DaThanhToan,
		"trang_thai_thanh_toan": phieu.TrangThaiThanhToan,
		"products":              items,
	})
}

// ----------------------------------------------------------------------
// 3. CreateInventoryImport: Tạo phiếu, tính Tổng Tiền, và đồng bộ Tồn kho
// ----------------------------------------------------------------------
func CreateInventoryImport(c *gin.Context) {
	var input CreateInventoryImportInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload sai cấu trúc: " + err.Error()})
		return
	}

	if input.AmountPaid < 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Số tiền thanh toán không được âm!"})
        return
    }
	
	// Đăng ký Sku mới (nếu chưa có)
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

	// 🌟 Tính TỔNG TIỀN (Giá vốn * Số lượng) của toàn bộ phiếu nhập
	var totalMoney float64 = 0
    for _, p := range input.Products {
        totalMoney += float64(p.StandardQuantity) * p.Price
    }

	// 🌟 XÁC ĐỊNH TRẠNG THÁI THANH TOÁN (Tự động)
	paymentStatus := "UNPAID"
    if input.AmountPaid >= totalMoney && totalMoney > 0 {
        paymentStatus = "PAID"
    } else if input.AmountPaid > 0 {
        paymentStatus = "PARTIAL"
    }

	// 🌟 Lưu Tổng Tiền và Đã Thanh Toán vào Struct PhieuKho
	phieuKho := models.PhieuKho{
		MaPhieu:            maPhieuAuto,
		LoaiPhieu:          input.ImportType,
		MaKho:              input.WarehouseID,
		GhiChu:             finalNote,
		NguoiThucHienID:    executorID,
		MaNhaCungCap:       input.SupplierID,
		NhaCungCap:         input.SupplierName,
		TongTien:           totalMoney,        
		DaThanhToan:        input.AmountPaid,   
		TrangThaiThanhToan: paymentStatus,     
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

	// ---------------------------------------------------------
	// 🌟 GOROUTINE ĐỒNG BỘ TỒN KHO & BẮT LỖI
	// ---------------------------------------------------------
	go func(products []ImportProductPayload, warehouseID string) {
		for _, p := range products {
			// 1. Lưu hoặc Cập nhật bảng ton_kho cho lô hàng vừa nhập 
			var existStock int64
			config.DB.Table("ton_kho").Where("ma_kho = ? AND sku = ? AND ma_lo_hang = ?", warehouseID, p.Sku, p.LotName).Count(&existStock)
			
			if existStock == 0 {
				errInsert := config.DB.Exec("INSERT INTO ton_kho (ma_kho, sku, ma_lo_hang, so_luong_thuc_te, so_luong_tam_giu, ngay_tao, ngay_cap_nhat) VALUES (?, ?, ?, ?, 0, ?, ?)", warehouseID, p.Sku, p.LotName, p.StandardQuantity, time.Now(), time.Now()).Error
				if errInsert != nil {
					fmt.Printf("❌ [DB ERROR] LỖI THÊM MỚI TỒN KHO CHO SKU %s: %v\n", p.Sku, errInsert)
				}
			} else {
				errUpdate := config.DB.Exec("UPDATE ton_kho SET so_luong_thuc_te = so_luong_thuc_te + ?, ngay_cap_nhat = ? WHERE ma_kho = ? AND sku = ? AND ma_lo_hang = ?", p.StandardQuantity, time.Now(), warehouseID, p.Sku, p.LotName).Error
				if errUpdate != nil {
					fmt.Printf("❌ [DB ERROR] LỖI CẬP NHẬT TỒN KHO CHO SKU %s: %v\n", p.Sku, errUpdate)
				}
			}

			// 🌟 2. Tính lại TỔNG tồn kho thực tế của SKU này 
			var newTotal int
			errSum := config.DB.Table("ton_kho").
				Where("sku = ?", p.Sku).
				Select("COALESCE(SUM(so_luong_thuc_te), 0)").
				Scan(&newTotal).Error

			if errSum != nil {
				fmt.Printf("❌ [DB ERROR] KHÔNG THỂ TÍNH TỔNG TỒN KHO SKU %s: %v\n", p.Sku, errSum)
				continue 
			}

			// 🌟 3. Gọi API sang Product Service để ghi đè số lượng tuyệt đối
			payload := map[string]interface{}{
				"sku":            p.Sku,
				"total_quantity": newTotal,
			}
			jsonData, _ := json.Marshal(payload)

			productServiceHost := os.Getenv("PRODUCT_SERVICE_URL")
			if productServiceHost == "" {
				productServiceHost = "http://product-service:5002" 
			}
			
			req, _ := http.NewRequest("PATCH", productServiceHost+"/api/v1/products/internal/sync-exact-stock", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")
			
			client := &http.Client{Timeout: 10 * time.Second}
			resp, err := client.Do(req)
			
			if err != nil {
				fmt.Printf("❌ [HTTP CRITICAL] ĐỒNG BỘ SKU %s SANG PRODUCT-SERVICE THẤT BẠI: %v\n", p.Sku, err)
				continue
			}
			
			if resp.StatusCode >= 400 {
				buf := new(bytes.Buffer)
				buf.ReadFrom(resp.Body)
				fmt.Printf("❌ [HTTP CRITICAL] PRODUCT-SERVICE TỪ CHỐI ĐỒNG BỘ SKU %s (Status: %d): %s\n", p.Sku, resp.StatusCode, buf.String())
			} else {
				fmt.Printf("✅ [Sync] Đã báo Product-Service cập nhật SKU %s thành %d cái!\n", p.Sku, newTotal)
			}
			resp.Body.Close()
		}
	}(input.Products, input.WarehouseID)

	c.JSON(http.StatusCreated, gin.H{"message": "🎉 Lưu chứng từ nhập kho thành công!", "ma_phieu": maPhieuAuto})
}

// ----------------------------------------------------------------------
// 4. PayImportReceipt: Thanh toán công nợ cho nhà cung cấp (MỚI)
// ----------------------------------------------------------------------
func PayImportReceipt(c *gin.Context) {
	receiptID := c.Param("id")

	var input PaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Số tiền không hợp lệ"})
		return
	}

	// Sử dụng Transaction để bảo vệ dữ liệu tiền bạc
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var phieu models.PhieuKho
		
		if err := tx.Where("ma_phieu = ?", receiptID).First(&phieu).Error; err != nil {
			return fmt.Errorf("không tìm thấy phiếu nhập kho %s", receiptID)
		}

		if phieu.DaThanhToan >= phieu.TongTien {
			return fmt.Errorf("phiếu nhập kho này đã được thanh toán hoàn tất")
		}

		tienConNo := phieu.TongTien - phieu.DaThanhToan
		if input.Amount > tienConNo {
			return fmt.Errorf("số tiền thanh toán (%.2f) lớn hơn số tiền còn nợ (%.2f)", input.Amount, tienConNo)
		}

		// Cập nhật lại số tiền đã thanh toán
		phieu.DaThanhToan += input.Amount
		
		if phieu.DaThanhToan >= phieu.TongTien {
			phieu.TrangThaiThanhToan = "PAID" 
		} else {
			phieu.TrangThaiThanhToan = "PARTIAL"
		}

		if err := tx.Save(&phieu).Error; err != nil {
			return fmt.Errorf("không thể cập nhật phiếu kho: %v", err)
		}

		// Giảm trừ công nợ cho Nhà cung cấp
		if phieu.MaNhaCungCap != "" {
			err := tx.Model(&models.NhaCungCap{}).
				Where("ma_nha_cung_cap = ?", phieu.MaNhaCungCap).
				UpdateColumn("cong_no_hien_tai", gorm.Expr("cong_no_hien_tai - ?", input.Amount)).Error
			if err != nil {
				return fmt.Errorf("lỗi cập nhật công nợ cho nhà cung cấp")
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true, 
		"message": "Nộp tiền thanh toán công nợ thành công",
	})
}