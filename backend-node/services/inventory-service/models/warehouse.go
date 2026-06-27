package models

import "time"

type Warehouse struct {
	MaKho       string    `gorm:"primaryKey;column:ma_kho" json:"ma_kho"`
	TenKho      string    `gorm:"column:ten_kho" json:"ten_kho"`
	DiaChi      string    `gorm:"column:dia_chi" json:"dia_chi"`
	TrangThai   bool      `gorm:"column:trang_thai" json:"trang_thai"`
	NgayTao     time.Time `gorm:"column:ngay_tao;autoCreateTime" json:"ngay_tao"`
	NgayCapNhat time.Time `gorm:"column:ngay_cap_nhat;autoUpdateTime" json:"ngay_cap_nhat"`
}

// Ghi đè tên bảng thực tế trong DB
func (Warehouse) TableName() string {
	return "kho_hang" 
}