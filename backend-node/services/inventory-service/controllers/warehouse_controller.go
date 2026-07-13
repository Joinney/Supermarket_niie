package controllers

import (
	"fmt"
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
		TrangThai:   true,
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

	var warehouse models.Warehouse
	if err := config.DB.Where("ma_kho = ?", maKho).First(&warehouse).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy kho hàng này"})
		return
	}

	var count int64
	config.DB.Table("ton_kho").Where("ma_kho = ?", maKho).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error": "TỪ CHỐI XÓA: Kho này đang chứa sản phẩm tồn kho. Vui lòng chuyển hàng sang kho khác trước khi xóa.",
		})
		return
	}

	if err := config.DB.Delete(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi khi xóa kho: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa kho hàng vĩnh viễn"})
}

// =========================================================
// CÁC HÀM MỚI: QUẢN LÝ ĐIỀU CHUYỂN KHO (INVENTORY TRANSFER)
// =========================================================

// =========================================================
// CÁC HÀM MỚI: QUẢN LÝ ĐIỀU CHUYỂN KHO (INVENTORY TRANSFER)
// =========================================================

// ---------------------------------------------------------
// 6. LẤY DANH SÁCH PHIẾU ĐIỀU CHUYỂN
// ---------------------------------------------------------
func GetTransferTickets(c *gin.Context) {
	var results []map[string]interface{}

	// 🌟 FIX: Bỏ JOIN users để tránh lỗi "relation does not exist" do khác Database
	query := `
		SELECT 
			p.ma_chuyen_kho AS ma_phieu, 
			p.kho_nguon, 
			p.kho_dich, 
			p.trang_thai, 
			p.ngay_tao, 
			p.nguoi_tao_id AS nguoi_tao, 
			COALESCE(p.nguoi_tao_name, 'Hệ thống') AS nguoi_tao,
			kn.ten_kho AS ten_kho_nguon, 
			kd.ten_kho AS ten_kho_dich
		FROM phieu_chuyen_kho p
		LEFT JOIN kho_hang kn ON p.kho_nguon = kn.ma_kho
		LEFT JOIN kho_hang kd ON p.kho_dich = kd.ma_kho
		ORDER BY p.ngay_tao DESC
	`

	if err := config.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy danh sách phiếu chuyển: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// ---------------------------------------------------------
// 7. TẠO PHIẾU CHUYỂN KHO MỚI (TRẠNG THÁI: PENDING)
// ---------------------------------------------------------
func CreateTransferTicket(c *gin.Context) {
	var input struct {
		KhoNguon   string `json:"kho_nguon" binding:"required"`
		KhoDich    string `json:"kho_dich" binding:"required"`
		GhiChu     string `json:"ghi_chu"`
		NguoiTaoID int    `json:"nguoi_tao_id"`
		NguoiTaoName string `json:"nguoi_tao_name"`
		Items      []struct {
			Sku      string `json:"sku" binding:"required"`
			Quantity int    `json:"quantity" binding:"required,gt=0"`
		} `json:"items" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	if input.KhoNguon == input.KhoDich {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kho nguồn và kho đích không được trùng nhau"})
		return
	}

	tx := config.DB.Begin()

	maPhieu := fmt.Sprintf("DC%s-%04d", time.Now().Format("0601"), time.Now().Unix()%10000)

	insertPhieu := `INSERT INTO phieu_chuyen_kho (ma_chuyen_kho, kho_nguon, kho_dich, ghi_chu, trang_thai, nguoi_tao_id, nguoi_tao_name, ngay_tao, ngay_cap_nhat) 
					VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?)`
	
	if err := tx.Exec(insertPhieu, maPhieu, input.KhoNguon, input.KhoDich, input.GhiChu, input.NguoiTaoID, input.NguoiTaoName, time.Now(), time.Now()).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi tạo phiếu: " + err.Error()})
		return
	}

	// 🌟 THUẬT TOÁN FIFO: Lấy lô thật từ Tồn kho để đưa vào Chi tiết chuyển
	for _, item := range input.Items {
		qtyNeeded := item.Quantity

		var lots []struct {
			MaLoHang      string
			SoLuongThucTe int
		}
		tx.Raw("SELECT ma_lo_hang, so_luong_thuc_te FROM ton_kho WHERE ma_kho = ? AND sku = ? AND so_luong_thuc_te > 0 ORDER BY ngay_tao ASC", input.KhoNguon, item.Sku).Scan(&lots)

		totalAvailable := 0
		for _, l := range lots {
			totalAvailable += l.SoLuongThucTe
		}
		if totalAvailable < qtyNeeded {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Kho nguồn chỉ còn %d đơn vị cho sản phẩm %s", totalAvailable, item.Sku)})
			return
		}

		for _, lot := range lots {
			if qtyNeeded <= 0 {
				break
			}

			takeFromLot := lot.SoLuongThucTe
			if qtyNeeded < takeFromLot {
				takeFromLot = qtyNeeded
			}

			insertChiTiet := `INSERT INTO chi_tiet_chuyen_kho (ma_chuyen_kho, sku, ma_lo_hang, so_luong) VALUES (?, ?, ?, ?)`
			if err := tx.Exec(insertChiTiet, maPhieu, item.Sku, lot.MaLoHang, takeFromLot).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lưu chi tiết lô hàng: " + err.Error()})
				return
			}

			qtyNeeded -= takeFromLot
		}
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"message": "Tạo phiếu điều chuyển thành công!", "ma_phieu": maPhieu})
}

// ---------------------------------------------------------
// 8. DUYỆT PHIẾU CHUYỂN & GHI LỊCH SỬ KHO (lich_su_kho)
// ---------------------------------------------------------
func ApproveTransferTicket(c *gin.Context) {
	maPhieu := c.Param("id")
	tx := config.DB.Begin()

	var phieu struct {
		KhoNguon  string
		KhoDich   string
		TrangThai string
	}
	if err := tx.Raw("SELECT kho_nguon, kho_dich, trang_thai FROM phieu_chuyen_kho WHERE ma_chuyen_kho = ? FOR UPDATE", maPhieu).Scan(&phieu).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể kiểm tra phiếu"})
		return
	}

	if phieu.TrangThai != "PENDING" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phiếu này đã được xử lý!"})
		return
	}

	var details []struct {
		Sku      string
		MaLoHang string
		SoLuong  int
	}
	tx.Raw("SELECT sku, ma_lo_hang, so_luong FROM chi_tiet_chuyen_kho WHERE ma_chuyen_kho = ?", maPhieu).Scan(&details)

	for _, detail := range details {
		// ==========================================
		// 1. XỬ LÝ KHO NGUỒN (XUẤT)
		// ==========================================
		var tonTruocNguon int
		if err := tx.Raw("SELECT so_luong_thuc_te FROM ton_kho WHERE ma_kho = ? AND sku = ? AND ma_lo_hang = ?", phieu.KhoNguon, detail.Sku, detail.MaLoHang).Scan(&tonTruocNguon).Error; err != nil || tonTruocNguon < detail.SoLuong {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Sản phẩm %s (Lô: %s) không đủ tồn kho thực tế!", detail.Sku, detail.MaLoHang)})
			return
		}
		
		tonSauNguon := tonTruocNguon - detail.SoLuong

		// Trừ tồn kho nguồn
		if err := tx.Exec("UPDATE ton_kho SET so_luong_thuc_te = ?, ngay_cap_nhat = ? WHERE ma_kho = ? AND sku = ? AND ma_lo_hang = ?", tonSauNguon, time.Now(), phieu.KhoNguon, detail.Sku, detail.MaLoHang).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi trừ tồn kho nguồn"})
			return
		}

		// 🌟 GHI LỊCH SỬ KHO NGUỒN
		if err := tx.Exec(`INSERT INTO lich_su_kho (ma_kho, sku, ma_lo_hang, loai_thay_doi, so_luong_thay_doi, so_luong_ton_truoc, so_luong_ton_sau, ma_tai_lieu_tham_chieu, ngay_tao)
                 VALUES (?, ?, ?, 'XUAT_CHUYEN_KHO', ?, ?, ?, ?, ?)`, 
				 phieu.KhoNguon, detail.Sku, detail.MaLoHang, -detail.SoLuong, tonTruocNguon, tonSauNguon, maPhieu, time.Now()).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi ghi lịch sử kho nguồn"})
			return
		}


		// ==========================================
		// 2. XỬ LÝ KHO ĐÍCH (NHẬP)
		// ==========================================
		var tonTruocDich int = 0 // Mặc định là 0 nếu lô này chưa từng có ở kho đích
		tx.Raw("SELECT so_luong_thuc_te FROM ton_kho WHERE ma_kho = ? AND sku = ? AND ma_lo_hang = ?", phieu.KhoDich, detail.Sku, detail.MaLoHang).Scan(&tonTruocDich)
		tonSauDich := tonTruocDich + detail.SoLuong

		// Cộng tồn kho đích (Dùng ON CONFLICT cập nhật nếu lô đã tồn tại)
		upsertQuery := `
			INSERT INTO ton_kho (ma_kho, sku, ma_lo_hang, so_luong_thuc_te, so_luong_tam_giu, ngay_tao, ngay_cap_nhat)
			VALUES (?, ?, ?, ?, 0, ?, ?)
			ON CONFLICT (ma_kho, sku, ma_lo_hang) 
			DO UPDATE SET so_luong_thuc_te = ?, ngay_cap_nhat = ?
		`
		if err := tx.Exec(upsertQuery, phieu.KhoDich, detail.Sku, detail.MaLoHang, detail.SoLuong, time.Now(), time.Now(), tonSauDich, time.Now()).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cộng tồn kho đích"})
			return
		}

		// 🌟 GHI LỊCH SỬ KHO ĐÍCH
		if err := tx.Exec(`INSERT INTO lich_su_kho (ma_kho, sku, ma_lo_hang, loai_thay_doi, so_luong_thay_doi, so_luong_ton_truoc, so_luong_ton_sau, ma_tai_lieu_tham_chieu, ngay_tao)
                 VALUES (?, ?, ?, 'NHAP_CHUYEN_KHO', ?, ?, ?, ?, ?)`, 
				 phieu.KhoDich, detail.Sku, detail.MaLoHang, detail.SoLuong, tonTruocDich, tonSauDich, maPhieu, time.Now()).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi ghi lịch sử kho đích"})
			return
		}
	}

	// Đánh dấu hoàn thành
	if err := tx.Exec("UPDATE phieu_chuyen_kho SET trang_thai = 'COMPLETED', ngay_cap_nhat = ? WHERE ma_chuyen_kho = ?", time.Now(), maPhieu).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật trạng thái phiếu"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Duyệt phiếu, điều chuyển kho và lưu lịch sử thành công!"})
}