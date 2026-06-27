package models

import "time"

type Item struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Quantity    int       `gorm:"not null;default:0" json:"quantity"`
	Price       float64   `gorm:"type:numeric(10,2)" json:"price"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Tên bảng tương ứng trong database của bạn (ví dụ: items hoặc san_pham)
func (Item) TableName() string {
	return "items"
}