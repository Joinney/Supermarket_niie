package models

import "time"

type Item struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	SKU         string    `gorm:"type:varchar(50);unique;not null" json:"sku"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Quantity    int       `gorm:"type:integer;default:0" json:"quantity"`
	Price       float64   `gorm:"type:numeric(10,2);default:0.0" json:"price"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}