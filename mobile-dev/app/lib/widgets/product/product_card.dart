import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class ProductCard extends StatelessWidget {
  final Map<String, dynamic> p;
  final String? categoryName;
  final String? categorySlug;
  final VoidCallback? onAddToCart;

  const ProductCard({
    super.key,
    required this.p,
    this.categoryName,
    this.categorySlug,
    this.onAddToCart,
  });

  static final NumberFormat _currencyFormat =
      NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  double _parseNumber(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final clean = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }

  @override
  Widget build(BuildContext context) {
    const String defaultImage =
        'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=612&auto=format&fit=crop';

    // 1. Trích xuất hình ảnh chính
    final String mainImage = p['hinh_anh_chinh'] ??
        p['hinh_anh'] ??
        p['image'] ??
        (p['hinh_anh_phu'] is List && (p['hinh_anh_phu'] as List).isNotEmpty
            ? p['hinh_anh_phu'][0]
            : defaultImage);

    // 2. Trích xuất thông tin Sale
    final Map<String, dynamic>? activeSaleInfo =
        p['thong_tin_sale'] is Map<String, dynamic> ? p['thong_tin_sale'] : null;

    final double remainingSaleQuantity = activeSaleInfo != null
        ? (_parseNumber(activeSaleInfo['so_luong_gioi_han']) -
                _parseNumber(activeSaleInfo['da_ban']))
            .clamp(0.0, double.infinity)
        : 0.0;

    final bool isValidFlashSale =
        activeSaleInfo != null && remainingSaleQuantity > 0;

    // 3. Tính toán giá bán & giá gốc
    final double rawOriginalPrice = _parseNumber(p['gia_ban_le'] ??
        p['gia_goc'] ??
        p['gia_ban'] ??
        (p['chi_tiet_bien_the'] is List && (p['chi_tiet_bien_the'] as List).isNotEmpty
            ? p['chi_tiet_bien_the'][0]['gia_ban_le']
            : null) ??
        p['gia_ban_thap_nhat']);

    final double currentPrice = isValidFlashSale
        ? _parseNumber(activeSaleInfo['gia_khuyen_mai'] ?? activeSaleInfo['gia_sale'])
        : rawOriginalPrice;

    final double? originalPriceDisplay =
        isValidFlashSale && rawOriginalPrice > currentPrice
            ? rawOriginalPrice
            : null;

    // 4. Nhãn giảm giá (Badge)
    String? discountBadge;
    if (originalPriceDisplay != null && rawOriginalPrice > 0) {
      final int percent =
          (((rawOriginalPrice - currentPrice) / rawOriginalPrice) * 100).round();
      discountBadge = '-$percent%';
    } else if (isValidFlashSale) {
      discountBadge = 'SALE';
    } else if (p['is_hot'] == true || p['hot'] == true) {
      discountBadge = 'HOT 🔥';
    }

    // 5. Tính toán kho
    final double rawStock = _parseNumber(p['tong_ton_kho'] ??
        p['so_luong_ton'] ??
        p['ton_kho'] ??
        (p['chi_tiet_bien_the'] is List && (p['chi_tiet_bien_the'] as List).isNotEmpty
            ? p['chi_tiet_bien_the'][0]['so_luong_ton']
            : 100));

    final double stockCount = isValidFlashSale ? remainingSaleQuantity : rawStock;
    final bool isOutOfStock = stockCount <= 0;

    // Tên biến thể / Tên sản phẩm
    final String displayName = p['ten_bien_the'] ??
        (p['chi_tiet_bien_the'] is List && (p['chi_tiet_bien_the'] as List).isNotEmpty
            ? p['chi_tiet_bien_the'][0]['ten_bien_the']
            : null) ??
        p['ten_san_pham'] ??
        'Sản phẩm';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // KHỐI HÌNH ẢNH SẢN PHẨM + BADGE
          Expanded(
            child: Stack(
              children: [
                Container(
                  width: double.infinity,
                  height: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      mainImage,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Image.network(
                        defaultImage,
                        fit: BoxFit.cover,
                      ),
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          color: const Color(0xFFF1F5F9),
                          child: const Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFF006C49),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),

                // BADGE GIẢM GIÁ
                if (discountBadge != null && !isOutOfStock)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF3B30), Color(0xFFFF6B00)],
                        ),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        discountBadge,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),

                // BADGE HẾT HÀNG
                if (isOutOfStock)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text(
                          'TẠM HẾT HÀNG',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  ),

                // NÚT THÊM NHANH VÀO GIỎ
                if (!isOutOfStock)
                  Positioned(
                    bottom: 6,
                    right: 6,
                    child: GestureDetector(
                      onTap: onAddToCart,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.add_rounded,
                          size: 18,
                          color: Color(0xFF006C49),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 6),

          // GIÁ TIỀN
          if (isOutOfStock)
            const Text(
              'Hết hàng',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (originalPriceDisplay != null)
                  Text(
                    _currencyFormat.format(originalPriceDisplay),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.grey,
                      decoration: TextDecoration.lineThrough,
                      height: 1.0,
                    ),
                  ),
                Text(
                  _currencyFormat.format(currentPrice),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFFF3B30),
                    height: 1.1,
                  ),
                ),
              ],
            ),

          const SizedBox(height: 4),

          // TÊN SẢN PHẨM
          Text(
            displayName,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Color(0xFF161B22),
              height: 1.2,
            ),
          ),

          const SizedBox(height: 4),

          // DANH MỤC BADGE
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
            decoration: BoxDecoration(
              color: const Color(0xFFE6F0ED),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              categoryName ??
                  p['ten_danh_muc_con'] ??
                  p['ten_danh_muc'] ??
                  'Siêu thị',
              style: const TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w900,
                color: Color(0xFF006C49),
              ),
            ),
          ),
        ],
      ),
    );
  }
}