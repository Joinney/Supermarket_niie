import express from 'express';
import { getInternalVariants } from '../controllers/productController.js';

import {
    getAllProducts,
    getAllCategories,
    getProductById,
    getProductsByCategorySlug,
    searchProducts,
    searchCategories,
    batchGenerateDescriptionsController,
    getProductsWithoutDescriptions,
    refreshEmptyDescriptions,
    createProduct,
    getAllCountries
} from '../controllers/productController.js';

const router = express.Router();

// =========================================================================
// 🌐 0. ROUTE NỘI BỘ (INTERNAL INTER-SERVICE ROUTE)
// =========================================================================
router.post('/internal/variants', getInternalVariants);

// =========================================================================
// 🏢 1. NHÓM ROUTE TĨNH (STATIC ROUTES)
// =========================================================================
router.get('/countries', getAllCountries);
router.get('/search', searchProducts);
router.get('/categories', getAllCategories);
router.get('/categories/search', searchCategories);
router.get('/without-descriptions', getProductsWithoutDescriptions);
router.post('/batch-generate-descriptions', batchGenerateDescriptionsController);
router.post('/refresh-empty-descriptions', refreshEmptyDescriptions);

// =========================================================================
// 🔄 2. NHÓM ROUTE ĐỘNG (DYNAMIC ROUTES)
// =========================================================================
router.get('/category/:slug', getProductsByCategorySlug);
router.get('/', getAllProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);

export default router;