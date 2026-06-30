package models

import (
	"time"
)

// Warehouse tương ứng với bảng kho_hang trong database
type Warehouse struct {
	MaKho       string    `gorm:"primaryKey;column:ma_kho;type:varchar(50)" json:"ma_kho"`
	TenKho      string    `gorm:"column:ten_kho;type:varchar(255)" json:"ten_kho"`
	DiaChi      string    `gorm:"column:dia_chi;type:text" json:"dia_chi"`
	TrangThai   bool      `gorm:"column:trang_thai;type:boolean" json:"trang_thai"`
	NgayTao     time.Time `gorm:"column:ngay_tao;autoCreateTime" json:"ngay_tao"`
	NgayCapNhat time.Time `gorm:"column:ngay_cap_nhat;autoUpdateTime" json:"ngay_cap_nhat"`
}

func (Warehouse) TableName() string {
	return "kho_hang" 
}

// Lot tương ứng với bảng lo_hang trong database
type Lot struct {
	MaLoHang    string    `gorm:"primaryKey;column:ma_lo_hang;type:varchar(50)" json:"ma_lo_hang"`
	NgaySanXuat time.Time `gorm:"column:ngay_san_xuat;type:date" json:"ngay_san_xuat"`
	NgayHetHan  time.Time `gorm:"column:ngay_het_han;type:date" json:"ngay_het_han"`
	GiaNhap     float64   `gorm:"column:gia_nhap;type:decimal(15,2)" json:"gia_nhap"`
	NgayTao     time.Time `gorm:"column:ngay_tao;autoCreateTime" json:"ngay_tao"`
	NgayCapNhat time.Time `gorm:"column:ngay_cap_nhat;autoUpdateTime" json:"ngay_cap_nhat"`
}

func (Lot) TableName() string {
	return "lo_hang"
}

// PhieuKho tương ứng với bảng phieu_kho trong database
type PhieuKho struct {
	MaPhieu         string    `gorm:"primaryKey;column:ma_phieu;type:varchar(50)" json:"ma_phieu"`
	LoaiPhieu       string    `gorm:"column:loai_phieu;type:varchar(20)" json:"loai_phieu"` 
	MaKho           string    `gorm:"column:ma_kho;type:varchar(50)" json:"ma_kho"`
	MaDonThamChieu  string    `gorm:"column:ma_don_tham_chieu;type:varchar(50)" json:"ma_don_tham_chieu"`
	GhiChu          string    `gorm:"column:ghi_chu;type:text" json:"ghi_chu"`
	// 🌟 ĐÃ SỬA: Chuyển từ string sang int để khớp hoàn toàn với kiểu INT của Postgres
	NguoiThucHienID int       `gorm:"column:nguoi_thuc_hien_id;type:integer" json:"nguoi_thuc_hien_id"`
	NgayTao         time.Time `gorm:"column:ngay_tao;autoCreateTime" json:"ngay_tao"`
	NgayCapNhat     time.Time `gorm:"column:ngay_cap_nhat;autoUpdateTime" json:"ngay_cap_nhat"`
}

func (PhieuKho) TableName() string {
	return "phieu_kho"
}

// ChiTietPhieuKho tương ứng với bảng chi_tiet_phieu_kho trong database
type ChiTietPhieuKho struct {
	ID       uint      `gorm:"primaryKey;column:id;autoIncrement" json:"id"`
	MaPhieu  string    `gorm:"column:ma_phieu;type:varchar(50)" json:"ma_phieu"`
	Sku      string    `gorm:"column:sku;type:varchar(50)" json:"sku"`
	MaLoHang string    `gorm:"column:ma_lo_hang;type:varchar(50)" json:"ma_lo_hang"`
	SoLuong  int       `gorm:"column:so_luong" json:"so_luong"` 
	NgayTao  time.Time `gorm:"column:ngay_tao;autoCreateTime" json:"ngay_tao"`
}

func (ChiTietPhieuKho) TableName() string {
	return "chi_tiet_phieu_kho"
}