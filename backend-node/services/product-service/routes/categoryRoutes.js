import express from 'express';
import { 
    getAllCategories, 
    searchCategories, 
    getAllCountries,
    getParentCategories,
    deleteParentCategory,
    restoreParentCategory,
    hardDeleteParentCategory
} from '../controllers/categoryController.js';

const router = express.Router();

// Route cho Danh mục
router.get('/tree', getAllCategories); // Lấy cây danh mục
router.get('/search', searchCategories); // Tìm kiếm danh mục

// Route cho Quốc gia (Dropdown bộ lọc)
router.get('/countries', getAllCountries); 

// Route cho Admin quản lý danh mục
router.get('/parents', getParentCategories);
router.delete('/parents/:id', deleteParentCategory);
router.put('/parents/:id/restore', restoreParentCategory);
router.delete('/parents/:id/hard', hardDeleteParentCategory);
export default router;