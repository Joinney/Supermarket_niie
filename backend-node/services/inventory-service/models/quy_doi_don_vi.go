package models

import "time"

type QuyDoiDonVi struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	MaSanPham     string    `gorm:"column:ma_san_pham;type:varchar(50)" json:"ma_san_pham"`
	MaDonViLon    string    `gorm:"column:ma_don_vi_lon;type:varchar(50)" json:"ma_don_vi_lon"`
	MaDonViCoSo   string    `gorm:"column:ma_don_vi_co_so;type:varchar(50)" json:"ma_don_vi_co_so"`
	SoLuongQuyDoi int       `gorm:"column:so_luong_quy_doi" json:"so_luong_quy_doi"`
	NgayTao       time.Time `gorm:"column:ngay_tao;autoCreateTime" json:"ngay_tao"`
}

func (QuyDoiDonVi) TableName() string {
	return "quy_doi_don_vi"
}