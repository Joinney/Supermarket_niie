import express from 'express';
import { 
    createFlashSale, 
    addItemsToFlashSale, 
    updateFlashSale, 
    deleteFlashSale, 
    getActiveFlashSaleClient,
    getAllFlashSalesAdmin,
    getFlashSaleByIdAdmin,
    checkInternalVariantPromotion,
    updateFlashSaleSoldQuantity 
} from '../controllers/promotionController.js';

const router = express.Router();

// ==========================================
//  API DÀNH CHO CLIENT (NGƯỜI MUA)
// ==========================================
// Lấy chương trình Flash Sale đang chạy để hiện ra trang Home
router.get('/client/flash-sale/active', getActiveFlashSaleClient);

//  API DÀNH CHO ADMIN (QUẢN TRỊ VIÊN)
// ==========================================
// 1. Tạo chương trình Khuyến mãi mới
router.post('/admin/flash-sale', createFlashSale);

// 2. Thêm hoặc cập nhật mảng biến thể (sản phẩm) vào chương trình
router.post('/admin/flash-sale/:ma_khuyen_mai/items', addItemsToFlashSale);

// 3. Sửa thông tin chương trình (tên, thời gian, trạng thái bật/tắt)
router.put('/admin/flash-sale/:ma_khuyen_mai', updateFlashSale);

// 4. Xóa vĩnh viễn chương trình (sẽ xóa luôn các biến thể trong đó)
router.delete('/admin/flash-sale/:ma_khuyen_mai', deleteFlashSale);

// 5. Lấy danh sách tất cả chương trình
router.get('/admin/flash-sale', getAllFlashSalesAdmin);

// 6. Lấy thông tin chi tiết của một chương trình theo ID
router.get('/admin/flash-sale/:ma_khuyen_mai', getFlashSaleByIdAdmin);

// 7. Kiểm tra xem một biến thể có đang trong chương trình khuyến mãi hay không
router.post('/internal/check-variant-promotion', checkInternalVariantPromotion);

// 8. Cập nhật số lượng đã bán khi có đơn hàng thành công 
router.post('/internal/update-sold', updateFlashSaleSoldQuantity);
export default router;