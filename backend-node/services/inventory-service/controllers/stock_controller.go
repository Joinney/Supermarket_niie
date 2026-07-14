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

// Struct phục vụ luồng trừ kho FIFO
type DeductStockInput struct {
	Sku      string `json:"sku" binding:"required"`
	Quantity int    `json:"quantity" binding:"required"`
}

// 🌟 Hàm hỗ trợ nội bộ: Tính tổng tồn kho hiện tại của một SKU và gửi đồng bộ sang Product Service
func calculateAndSyncStock(sku string) {
	var newTotal int
	errSum := config.DB.Table("ton_kho").
		Where("sku = ?", sku).
		Select("COALESCE(SUM(so_luong_thuc_te), 0)").
		Scan(&newTotal).Error

	if errSum != nil {
		fmt.Printf("❌ [DB ERROR] Không thể tính tổng tồn kho khi đồng bộ cho SKU %s: %v\n", sku, errSum)
		return
	}

	payload := map[string]interface{}{
		"sku":            sku,
		"total_quantity": newTotal,
	}
	jsonData, _ := json.Marshal(payload)

	productServiceHost := os.Getenv("PRODUCT_SERVICE_URL")
	if productServiceHost == "" {
		productServiceHost = "http://product-service:5002"
	}

	req, _ := http.NewRequest("PATCH", productServiceHost+"/api/v1/products/internal/sync-exact-stock", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ [HTTP ERROR] Không thể kết nối Product Service để đồng bộ SKU %s: %v\n", sku, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		fmt.Printf("❌ [HTTP ERROR] Product Service từ chối cập nhật SKU %s (Status: %d)\n", sku, resp.StatusCode)
	} else {
		fmt.Printf("✅ [Sync] Đồng bộ thành công biến động kho SKU %s sang Product Service, Tổng tồn mới: %d\n", sku, newTotal)
	}
}

// ----------------------------------------------------------------------
// 1. GetInventory: Lọc theo Kho nguồn (nếu có) & Gom nhóm tồn kho
// ----------------------------------------------------------------------
func GetInventory(c *gin.Context) {
	var inventoryList []InventoryStockResponse
	maKho := c.Query("ma_kho")

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

	if maKho != "" {
		query = query.Where("ton_kho.ma_kho = ?", maKho)
	}

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

// ----------------------------------------------------------------------
// 2. CreateItem: Đăng ký mã sản phẩm vật tư mới vào danh mục kho
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// 3. UpdateStock (ĐÃ CẬP NHẬT): Điều chỉnh tồn kho kiểm kê và đồng bộ ngay
// ----------------------------------------------------------------------
func UpdateStock(c *gin.Context) {
	id := c.Param("id") // Lưu ý: model Item của bạn map id với SKU
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
	
	// Cập nhật số lượng (ở đây cập nhật theo logic nghiệp vụ của bạn)
	if err := config.DB.Model(&item).Update("Quantity", input.Quantity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật"})
		return
	}

	// 🌟 ĐỒNG BỘ: Kích hoạt Goroutine đồng bộ số lượng chính xác sang Product Service
	go calculateAndSyncStock(id)

	c.JSON(http.StatusOK, item)
}

// ----------------------------------------------------------------------
// 4. DeductStockFIFO
// ----------------------------------------------------------------------
func DeductStockFIFO(c *gin.Context) {
	var input DeductStockInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	remainingToDeduct := input.Quantity

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		type TonKhoSnapshot struct {
			MaKho         string `gorm:"column:ma_kho"`
			Sku           string `gorm:"column:sku"`
			MaLoHang      string `gorm:"column:ma_lo_hang"`
			SoLuongThucTe int    `gorm:"column:so_luong_thuc_te"`
		}
		var stocks []TonKhoSnapshot

		// 1. SELECT BẰNG RAW SQL
		selectQuery := `
			SELECT ma_kho, sku, ma_lo_hang, so_luong_thuc_te
			FROM public.ton_kho
			WHERE sku = ? AND so_luong_thuc_te > 0
			ORDER BY ngay_tao ASC
		`
		if err := tx.Raw(selectQuery, input.Sku).Scan(&stocks).Error; err != nil {
			return err
		}

		var totalAvailable int
		for _, s := range stocks {
			totalAvailable += s.SoLuongThucTe
		}
		if totalAvailable < input.Quantity {
			return fmt.Errorf("không đủ hàng tồn kho thực tế cho mã SKU %s", input.Sku)
		}

		// 2. TRỪ DẦN VÀ UPDATE BẰNG RAW SQL
		for _, stock := range stocks {
			if remainingToDeduct <= 0 {
				break
			}

			deductAmount := 0
			if stock.SoLuongThucTe >= remainingToDeduct {
				deductAmount = remainingToDeduct
				remainingToDeduct = 0
			} else {
				deductAmount = stock.SoLuongThucTe
				remainingToDeduct -= stock.SoLuongThucTe
			}

			newQuantity := stock.SoLuongThucTe - deductAmount

			updateQuery := `
				UPDATE public.ton_kho
				SET so_luong_thuc_te = ?
				WHERE ma_kho = ? AND sku = ? AND ma_lo_hang = ?
			`
			if err := tx.Exec(updateQuery, newQuantity, stock.MaKho, stock.Sku, stock.MaLoHang).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi xử lý trừ kho FIFO: " + err.Error()})
		return
	}

	go calculateAndSyncStock(input.Sku)

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"message":           "Trừ kho theo cơ chế FIFO thành công",
		"sku":               input.Sku,
		"quantity_deducted": input.Quantity,
	})
}

// ----------------------------------------------------------------------
// 5. GetUnitConversions: Lấy cấu hình quy đổi đơn vị
// ----------------------------------------------------------------------
func GetUnitConversions(c *gin.Context) {
	var conversions []models.QuyDoiDonVi
	if err := config.DB.Find(&conversions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi truy xuất: " + err.Error()})
		return
	}
	if conversions == nil {
		conversions = make([]models.QuyDoiDonVi, 0)
	}
	c.JSON(http.StatusOK, conversions)
}


// =========================================================================
// 🚀 PHẦN MỚI BỔ SUNG: MODULE ĐỐI SOÁT VÀ ĐỒNG BỘ TOÀN DIỆN (RECONCILIATION)
// =========================================================================

// Struct chứa dữ liệu gửi đi khi đối soát
type ReconcileItem struct {
	Sku           string `json:"sku"`
	TotalQuantity int    `json:"total_quantity"`
}

// ExecuteFullReconciliation: Hàm lõi thực thi quét toàn bộ kho và đẩy đè sang Product Service
func ExecuteFullReconciliation() error {
	var results []ReconcileItem

	// 1. Tính tổng tồn kho của TẤT CẢ các SKU đang hoạt động trong bảng ton_kho
	// Dùng COALESCE để đảm bảo luôn trả về 0 nếu kho bị rỗng
	err := config.DB.Table("ton_kho").
		Select("sku, COALESCE(SUM(so_luong_thuc_te), 0) AS total_quantity").
		Group("sku").
		Scan(&results).Error

	if err != nil {
		return fmt.Errorf("lỗi query gộp dữ liệu kho: %v", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("không có dữ liệu tồn kho để đối soát")
	}

	// 2. Đóng gói payload gửi sang API bulk-sync của Product Service
	payload := map[string]interface{}{
		"sync_items": results,
	}
	jsonData, _ := json.Marshal(payload)

	productServiceHost := os.Getenv("PRODUCT_SERVICE_URL")
	if productServiceHost == "" {
		productServiceHost = "http://product-service:5002"
	}

	url := productServiceHost + "/api/v1/products/internal/bulk-sync-stock"
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	// Timeout dài hơn (30s) vì quá trình đối soát và update hàng loạt có thể mất thời gian
	client := &http.Client{Timeout: 30 * time.Second} 
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("không thể kết nối tới Product Service: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)
		return fmt.Errorf("product service từ chối đối soát, mã lỗi: %d, chi tiết: %s", resp.StatusCode, buf.String())
	}

	fmt.Printf("✅ [Reconciliation] Đã đối soát thành công %d mã SKU lúc %s\n", len(results), time.Now().Format("15:04:05"))
	return nil
}

// ----------------------------------------------------------------------
// 6. HandleManualReconcile: API kích hoạt đối soát thủ công từ Frontend
// ----------------------------------------------------------------------
func HandleManualReconcile(c *gin.Context) {
	err := ExecuteFullReconciliation()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Yêu cầu đối soát và đồng bộ toàn bộ kho thành công!"})
}