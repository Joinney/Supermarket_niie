import express from 'express';
import { 
    getAllCategories, 
    searchCategories, 
    getAllCountries,
    getParentCategories,
    createParentCategory,
    updateParentCategory,
    deleteParentCategory,
    restoreParentCategory,
    hardDeleteParentCategory,
    getChildCategories,
    createChildCategory,
    updateChildCategory,
    deleteChildCategory,
    restoreChildCategory,
    hardDeleteChildCategory,
    toggleHotChildCategory
} from '../controllers/categoryController.js';

const router = express.Router();

// Route cho Danh mục
router.get('/tree', getAllCategories); // Lấy cây danh mục
router.get('/search', searchCategories); // Tìm kiếm danh mục

// Route cho Quốc gia (Dropdown bộ lọc)
router.get('/countries', getAllCountries); 

// Route cho Admin quản lý danh mục (cha)
router.get('/parents', getParentCategories);
router.put('/parents/:id', updateParentCategory);
router.post('/parents', createParentCategory);
router.delete('/parents/:id', deleteParentCategory);
router.put('/parents/:id/restore', restoreParentCategory);
router.delete('/parents/:id/hard', hardDeleteParentCategory);
export default router;

// Route cho Danh mục (con)
router.get('/children', getChildCategories);
router.post('/children', createChildCategory);
router.put('/children/:id', updateChildCategory);
router.delete('/children/:id', deleteChildCategory);
router.put('/children/:id/restore', restoreChildCategory);
router.delete('/children/:id/hard', hardDeleteChildCategory);
router.put('/children/:id/toggle-hot', toggleHotChildCategory);