package helpers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"log"
)

// SyncStockToProductService gọi API nội bộ sang Product Service
func SyncStockToProductService(sku string, totalQuantity int) {
	// LƯU Ý: Sửa lại tên host và port cho đúng với docker-compose của product-service của bạn
	// Ví dụ: http://localhost:5002 hoặc http://product-service:5002
	productServiceURL := "http://product-service:5002/api/v1/products/internal/sync-exact-stock"

	payload := map[string]interface{}{
		"sku":            sku,
		"total_quantity": totalQuantity,
	}
	jsonValue, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPatch, productServiceURL, bytes.NewBuffer(jsonValue))
	if err != nil {
		log.Printf("❌ Lỗi tạo request đồng bộ kho cho SKU %s: %v\n", sku, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ Lỗi không gọi được Product Service cho SKU %s: %v\n", sku, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("⚠️ Product service trả về lỗi khi đồng bộ SKU %s, Status: %d\n", sku, resp.StatusCode)
		return
	}

	log.Printf("✅ Đã đồng bộ thành công SKU %s với số lượng %d sang Product Service\n", sku, totalQuantity)
}