import pool from '../configs/database.js';
// Tạm thời comment axios nếu chưa cài hoặc chưa dùng tới để tránh lỗi khởi động server
// import axios from 'axios';
import { batchGenerateDescriptions, generateDescriptionFromAI } from '../utils/aiDescriptionGenerator.js'; 

// 1. Lấy tất cả sản phẩm (Trang Home)
export const getAllProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                sp.*, 
                dm.ten_danh_muc,
                dm.duong_dan_seo AS slug_danh_muc,
                LOWER(vm.ma_quoc_gia) AS country_code,
                COALESCE((SELECT MIN(gia_ban_le) FROM bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS hinh_anh_chinh,
                -- Lấy array mã biến thể để sau này map stock
                COALESCE((SELECT array_agg(ma_bien_the) FROM bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), '{}') as variant_ids
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            LEFT JOIN vung_mien vm ON sp.ma_vung = vm.ma_vung
            WHERE sp.trang_thai = true
            ORDER BY sp.ngay_tao DESC
            LIMIT $1 OFFSET $2;
        `;

        const { rows: products } = await pool.query(query, [limit, offset]);

        if (products.length === 0) return res.status(200).json([]);

        // --- TẠM THỜI BỎ QUA GỌI INVENTORY SERVICE ---
        // Gán tồn kho giả để Frontend không bị lỗi undefined
        const finalProducts = products.map(p => {
            delete p.variant_ids; 
            return { ...p, tong_ton_kho: 999 }; // Số ảo để test giao diện
        });

        res.status(200).json(finalProducts);
    } catch (error) {
        console.error("Lỗi API getAllProducts:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// 2. Lấy chi tiết 1 sản phẩm (Trang Chi tiết)
export const getProductById = async (req, res) => {
    const { id } = req.params; 
    try {
        const query = `
            SELECT 
                sp.*, 
                dm.ten_danh_muc,
                dm.duong_dan_seo AS slug_danh_muc,
                LOWER(vm.ma_quoc_gia) AS country_code,
                COALESCE(
                    (SELECT json_agg(bt) FROM bien_the_san_pham bt WHERE bt.ma_san_pham = sp.ma_san_pham), 
                    '[]'
                ) as bien_the,
                COALESCE(
                    (SELECT json_agg(m) FROM media_san_pham m WHERE m.ma_san_pham = sp.ma_san_pham), 
                    '[]'
                ) as media
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            LEFT JOIN vung_mien vm ON sp.ma_vung = vm.ma_vung
            WHERE sp.ma_san_pham = $1;
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại Demi ơi!" });
        }

        const product = result.rows[0];

        // --- TẠM THỜI BỎ QUA GỌI INVENTORY SERVICE ---
        // Gán tồn kho cho từng biến thể để nút chọn biến thể hoạt động
        if (product.bien_the) {
            product.bien_the = product.bien_the.map(bt => ({
                ...bt,
                ton_kho: 100 // Số ảo
            }));
        }

        res.status(200).json(product); 
    } catch (error) {
        console.error("Lỗi API getProductById:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// 3. Lấy sản phẩm theo danh mục (slug)
export const getProductsByCategorySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        let query = `
            SELECT 
                sp.*, 
                dm.ten_danh_muc,
                dm.duong_dan_seo AS slug_danh_muc,
                LOWER(vm.ma_quoc_gia) AS country_code,
                COALESCE((SELECT MIN(gia_ban_le) FROM bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS hinh_anh_chinh
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            LEFT JOIN vung_mien vm ON sp.ma_vung = vm.ma_vung
            WHERE sp.trang_thai = true
        `;
        
        const params = [];

        // Nếu slug không phải 'tat-ca', thêm điều kiện lọc theo danh mục
        if (slug !== 'tat-ca') {
            query += ` AND dm.duong_dan_seo = $1`;
            params.push(slug);
        }

        query += ` ORDER BY sp.ngay_tao DESC;`;

        const { rows: products } = await pool.query(query, params);

        // Gán tồn kho giả giống hàm getAllProducts để UI không bị lỗi
        const finalProducts = products.map(p => ({ ...p, tong_ton_kho: 999 }));

        res.status(200).json(finalProducts);
    } catch (error) {
        console.error("Lỗi API getProductsByCategorySlug:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// 4. Tìm kiếm sản phẩm theo từ khóa
export const searchProducts = async (req, res) => {
    const keyword = req.query.keyword || '';
    
    try {
        const query = `
            SELECT 
                sp.*, 
                dm.ten_danh_muc,
                dm.duong_dan_seo AS slug_danh_muc,
                LOWER(vm.ma_quoc_gia) AS country_code,
                COALESCE((SELECT MIN(gia_ban_le) FROM bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS hinh_anh_chinh
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            LEFT JOIN vung_mien vm ON sp.ma_vung = vm.ma_vung
            WHERE sp.trang_thai = true 
            AND (sp.ten_san_pham ILIKE $1 OR sp.mo_ta ILIKE $1)
            ORDER BY sp.ngay_tao DESC;
        `;
        
        // Thêm dấu % để tìm kiếm chứa từ khóa (LIKE %keyword%)
        const searchTerm = `%${keyword}%`;
        const { rows: products } = await pool.query(query, [searchTerm]);

        // Gán tồn kho giả để UI không bị lỗi
        const finalProducts = products.map(p => ({ ...p, tong_ton_kho: 999 }));

        res.status(200).json(finalProducts);
    } catch (error) {
        console.error("Lỗi API searchProducts:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// 5. Batch generate descriptions via AI and store in database
export const batchGenerateDescriptionsController = async (req, res) => {
    try {
        const { productIds, language = 'vi', useOnlineResearch = true } = req.body;

        // Validate input
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'productIds must be a non-empty array',
            });
        }

        // Limit batch size to prevent excessive API usage
        if (productIds.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 100 products per request. Please split into multiple requests.',
            });
        }

        console.log(`🚀 Starting batch description generation for ${productIds.length} products...`);

        // Fetch products from database
        const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
        const fetchQuery = `
            SELECT 
                sp.ma_san_pham,
                sp.ten_san_pham,
                dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.ma_san_pham = ANY($1::text[])
            ORDER BY sp.ngay_tao DESC;
        `;

        const { rows: products } = await pool.query(fetchQuery, [productIds]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found with provided IDs',
            });
        }

        console.log(`📦 Found ${products.length} products to process`);

        // Generate descriptions via AI
        const generatedDescriptions = await batchGenerateDescriptions(products, { useOnlineResearch });

        // Separate successful and failed generations
        const successful = generatedDescriptions.filter((d) => d.success);
        const failed = generatedDescriptions.filter((d) => !d.success);

        console.log(`✅ Generated ${successful.length} descriptions, ${failed.length} failures`);

        // Update database with generated descriptions
        let updatedCount = 0;
        for (const item of successful) {
            const updateQuery = `
                UPDATE san_pham
                SET mo_ta_ngan = $1, ngay_cap_nhat = NOW()
                WHERE ma_san_pham = $2;
            `;
            await pool.query(updateQuery, [item.description, item.ma_san_pham]);
            updatedCount++;
        }

        console.log(`💾 Updated ${updatedCount} products in database`);

        // Return comprehensive report
        res.status(200).json({
            success: true,
            message: `Batch description generation completed. ${updatedCount} products updated.`,
            summary: {
                total: generatedDescriptions.length,
                successful: successful.length,
                failed: failed.length,
            },
            results: {
                successful: successful.map((d) => ({
                    ma_san_pham: d.ma_san_pham,
                    description: d.description,
                })),
                failed: failed.map((d) => ({
                    ma_san_pham: d.ma_san_pham,
                    error: d.error,
                })),
            },
        });
    } catch (error) {
        console.error('❌ Batch Generation Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error during batch description generation',
            error: error.message,
        });
    }
};

// 6. Get products without descriptions (candidates for AI generation)
export const getProductsWithoutDescriptions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT 
                sp.ma_san_pham,
                sp.ten_san_pham,
                dm.ten_danh_muc,
                sp.mo_ta_ngan,
                sp.ngay_tao
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.trang_thai = true 
            AND (sp.mo_ta_ngan IS NULL OR sp.mo_ta_ngan = '' OR sp.mo_ta_ngan = 'Sản phẩm tuyển chọn từ Demi Mart.')
            ORDER BY sp.ngay_tao DESC
            LIMIT $1 OFFSET $2;
        `;

        const { rows: products } = await pool.query(query, [limit, offset]);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM san_pham sp
            WHERE sp.trang_thai = true 
            AND (sp.mo_ta_ngan IS NULL OR sp.mo_ta_ngan = '' OR sp.mo_ta_ngan = 'Sản phẩm tuyển chọn từ Demi Mart.');
        `;

        const { rows: countResult } = await pool.query(countQuery);
        const totalCount = parseInt(countResult[0].total);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + products.length < totalCount,
            },
        });
    } catch (error) {
        console.error('Lỗi getProductsWithoutDescriptions:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// 7. Refresh empty descriptions with online research
export const refreshEmptyDescriptions = async (req, res) => {
    try {
        const limit = parseInt(req.body.limit) || 50;
        const useOnlineResearch = req.body.useOnlineResearch !== false;

        const query = `
            SELECT ma_san_pham, ten_san_pham, dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.trang_thai = true
            AND (sp.mo_ta_ngan IS NULL OR sp.mo_ta_ngan = '' OR sp.mo_ta_ngan = 'Sản phẩm tuyển chọn từ Demi Mart.')
            ORDER BY sp.ngay_tao DESC
            LIMIT $1;
        `;

        const { rows: products } = await pool.query(query, [limit]);

        if (products.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No old products need description refresh.',
                summary: {
                    total: 0,
                    successful: 0,
                    failed: 0,
                },
            });
        }

        console.log(`🔄 Refreshing ${products.length} old products with online research...`);

        const generatedDescriptions = await batchGenerateDescriptions(products, { useOnlineResearch });
        const successful = generatedDescriptions.filter((d) => d.success);
        const failed = generatedDescriptions.filter((d) => !d.success);

        for (const item of successful) {
            await pool.query(
                `UPDATE san_pham SET mo_ta_ngan = $1, ngay_cap_nhat = NOW() WHERE ma_san_pham = $2;`,
                [item.description, item.ma_san_pham]
            );
        }

        res.status(200).json({
            success: true,
            message: `Refreshed descriptions for ${successful.length} products.`,
            summary: {
                total: generatedDescriptions.length,
                successful: successful.length,
                failed: failed.length,
            },
            results: {
                successful: successful.map((d) => ({ ma_san_pham: d.ma_san_pham, description: d.description })),
                failed: failed.map((d) => ({ ma_san_pham: d.ma_san_pham, error: d.error })),
            },
        });
    } catch (error) {
        console.error('❌ Refresh Empty Descriptions Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error refreshing empty descriptions',
            error: error.message,
        });
    }
};

// 8. Create product with auto-generated description
export const createProduct = async (req, res) => {
    try {
        const { ten_san_pham, ma_danh_muc, gia_ban_le, mo_ta, ma_vung } = req.body;

        // Validate required fields
        if (!ten_san_pham || !ma_danh_muc) {
            return res.status(400).json({
                success: false,
                message: 'ten_san_pham and ma_danh_muc are required',
            });
        }

        // Get category name for AI prompt
        const categoryRes = await pool.query(
            'SELECT ten_danh_muc FROM danh_muc WHERE ma_danh_muc = $1',
            [ma_danh_muc]
        );
        const categoryName = categoryRes.rows[0]?.ten_danh_muc || '';

        // Insert product
        const insertQuery = `
            INSERT INTO san_pham (ten_san_pham, ma_danh_muc, gia_ban_le, mo_ta, ma_vung, trang_thai, ngay_tao)
            VALUES ($1, $2, $3, $4, $5, true, NOW())
            RETURNING *;
        `;

        const productRes = await pool.query(insertQuery, [
            ten_san_pham,
            ma_danh_muc,
            gia_ban_le || null,
            mo_ta || null,
            ma_vung || null,
        ]);

        const newProduct = productRes.rows[0];

        // Auto-generate description in background (don't wait for it)
        console.log(`🤖 Auto-generating description for new product: ${ten_san_pham}`);
        
        generateDescriptionFromAI(ten_san_pham, categoryName, true)
            .then(async (description) => {
                if (description) {
                    await pool.query(
                        'UPDATE san_pham SET mo_ta_ngan = $1 WHERE ma_san_pham = $2',
                        [description, newProduct.ma_san_pham]
                    );
                    console.log(`✅ Description auto-generated for product: ${newProduct.ma_san_pham}`);
                }
            })
            .catch((err) => {
                console.error(`⚠️  Failed to auto-generate description: ${err.message}`);
            });

        res.status(201).json({
            success: true,
            data: newProduct,
            message: 'Product created. Description will be generated automatically.',
        });
    } catch (error) {
        console.error('Lỗi createProduct:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// 8. Periodic task: Generate descriptions for products without them
// Call this from server startup or scheduler
export const schedulePeriodicDescriptionGeneration = () => {
    // Check every 6 hours (21600000 ms) for products needing descriptions
    const checkInterval = 6 * 60 * 60 * 1000;

    setInterval(async () => {
        try {
            console.log('🌙 Running periodic description regeneration check...');

            // Fetch a batch of products to regenerate, prioritizing oldest/never-updated descriptions.
            // This will eventually refresh every product description over time.
            const query = `
                SELECT ma_san_pham, ten_san_pham, ten_danh_muc
                FROM san_pham sp
                LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
                WHERE sp.trang_thai = true
                ORDER BY sp.ngay_cap_nhat NULLS FIRST, sp.ngay_cap_nhat ASC
                LIMIT 50;
            `;

            const result = await pool.query(query);

            if (result.rows.length > 0) {
                console.log(`⏳ Found ${result.rows.length} products to regenerate descriptions for`);
                
                // Generate descriptions
                const generated = await batchGenerateDescriptions(result.rows, { useOnlineResearch: true });
                const successfulItems = generated.filter((item) => item.success);

                for (const item of successfulItems) {
                    await pool.query(
                        `UPDATE san_pham SET mo_ta_ngan = $1, ngay_cap_nhat = NOW() WHERE ma_san_pham = $2;`,
                        [item.description, item.ma_san_pham]
                    );
                }

                console.log(`✅ Regenerated ${successfulItems.length}/${result.rows.length} descriptions`);
            } else {
                console.log('✅ No products found to regenerate');
            }
        } catch (error) {
            console.error('❌ Periodic regeneration error:', error.message);
        }
    }, checkInterval);

    console.log('📅 Periodic description generation scheduled (every 6 hours)');
};