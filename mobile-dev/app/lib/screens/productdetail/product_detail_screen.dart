import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';
import 'package:app/screens/productdetail/widgets/feedback_section.dart';
import 'package:app/screens/productdetail/widgets/related_products.dart';
import 'package:app/screens/productdetail/widgets/recommended_products.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _product;
  Map<String, dynamic>? _selectedVariant;
  String _selectedMediaUrl = '';
  int _quantity = 1;

  // Trạng thái yêu thích
  bool _isLiked = false;
  int _likeCount = 0;
  bool _isLiking = false;

  // Quản lý thuộc tính đa tầng được chọn
  Map<String, String> _selectedAttributes = {};

  // Dữ liệu Flash Sale & Đánh giá & Sản phẩm liên quan
  List<dynamic> _activeFlashSales = [];
  Map<String, dynamic> _reviewData = {'summary': null, 'reviews': []};
  List<dynamic> _relatedProducts = [];
  List<dynamic> _recommendedProducts = [];

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchFullProductDetail();
    _fetchActiveFlashSales();
  }

  Future<void> _fetchActiveFlashSales() async {
    try {
      final res = await promotionApi.get('/client/flash-sale/active');
      if (mounted && res.data != null && res.data['success'] == true && res.data['data'] is List) {
        setState(() {
          _activeFlashSales = res.data['data'];
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchFullProductDetail() async {
    setState(() => _isLoading = true);
    try {
      final res = await productApi.get('/products/${widget.productId}?country=vn&role=client');
      final data = res.data is List ? res.data[0] : res.data;

      if (data != null && data['ma_san_pham'] != null) {
        _product = Map<String, dynamic>.from(data);

        // Chuẩn hóa danh sách biến thể & thuộc tính
        final List<dynamic> rawVariants = _product!['bien_the'] ?? _product!['variants'] ?? [];
        final List<Map<String, dynamic>> variants = rawVariants.map((bt) {
          final mapBt = Map<String, dynamic>.from(bt);
          if (mapBt['thuoc_tinh_hop_nhat'] is List &&
              (mapBt['thuoc_tinh'] == null || (mapBt['thuoc_tinh'] as Map).isEmpty)) {
            final flatAttrs = <String, dynamic>{};
            for (var a in (mapBt['thuoc_tinh_hop_nhat'] as List)) {
              if (a is Map && a['ten_thuoc_tinh'] != null && a['gia_tri'] != null) {
                flatAttrs[a['ten_thuoc_tinh'].toString()] = a['gia_tri'].toString();
              }
            }
            mapBt['thuoc_tinh'] = flatAttrs;
          }
          return mapBt;
        }).toList();

        _product!['bien_the'] = variants;

        // Chọn biến thể mặc định
        if (variants.isNotEmpty) {
          _selectedVariant = variants.firstWhere(
            (v) => v['la_ban_chay'] == true,
            orElse: () => variants[0],
          );

          if (_selectedVariant!['thuoc_tinh'] is Map) {
            _selectedAttributes = Map<String, String>.from(
              (_selectedVariant!['thuoc_tinh'] as Map).map((k, v) => MapEntry(k.toString(), v.toString())),
            );
          }
        }

        // Bắt ảnh đại diện
        _updateSelectedMedia();

        _fetchLikes();
        _fetchReviews();
        _fetchRelatedAndRecommended();
      }
    } catch (e) {
      debugPrint('Lỗi tải chi tiết: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _updateSelectedMedia() {
    String foundMedia = _selectedVariant?['hinh_anh_url'] ??
        _selectedVariant?['image_url'] ??
        _selectedVariant?['hinh_anh'] ??
        '';

    if (foundMedia.isEmpty && _product!['media'] is List) {
      final mediaList = _product!['media'] as List;
      final match = mediaList.firstWhere(
        (m) =>
            m['ma_bien_the']?.toString() == _selectedVariant?['ma_bien_the']?.toString() ||
            m['variant_id']?.toString() == _selectedVariant?['ma_bien_the']?.toString() ||
            m['sku']?.toString() == _selectedVariant?['sku']?.toString(),
        orElse: () => mediaList.firstWhere((m) => m['la_anh_chinh'] == true, orElse: () => mediaList.firstOrNull),
      );
      if (match != null && match['duong_dan_url'] != null) {
        foundMedia = match['duong_dan_url'].toString();
      }
    }

    if (foundMedia.isEmpty) {
      foundMedia = _product!['hinh_anh_chinh'] ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e';
    }

    setState(() {
      _selectedMediaUrl = foundMedia;
    });
  }

  Future<void> _fetchLikes() async {
    try {
      final res = await productApi.get('/products/${widget.productId}/likes');
      if (mounted && res.data != null && res.data['success'] == true) {
        setState(() {
          _likeCount = res.data['data']['total_likes'] ?? 0;
          _isLiked = res.data['data']['is_liked_by_user'] ?? false;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchReviews() async {
    try {
      final res = await productApi.get('/products/${widget.productId}/reviews');
      if (mounted && res.data != null) {
        setState(() {
          _reviewData = Map<String, dynamic>.from(res.data);
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchRelatedAndRecommended() async {
    final catId = _product?['ma_dm_con'] ?? _product?['ma_danh_muc'];
    if (catId == null) return;
    try {
      final res = await productApi.get('/products/${widget.productId}/related?category=$catId&limit=10');
      if (mounted && res.data is List) {
        setState(() {
          _relatedProducts = (res.data as List).take(4).toList();
          _recommendedProducts = res.data;
        });
      }
    } catch (_) {}
  }

  Future<void> _toggleLike() async {
    if (_isLiking) return;
    setState(() {
      _isLiking = true;
      _isLiked = !_isLiked;
      _likeCount += _isLiked ? 1 : -1;
    });

    try {
      await productApi.post(
        '/products/${widget.productId}/likes',
        data: {
          'ma_san_pham': widget.productId,
          'trang_thai': _isLiked,
        },
      );
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLiked = !_isLiked;
          _likeCount += _isLiked ? 1 : -1;
        });
      }
    } finally {
      if (mounted) setState(() => _isLiking = false);
    }
  }

  // --- LOGIC PHÂN TÍCH NHÓM THUỘC TÍNH (EAV / MATRIX) ---
  Map<String, List<String>> get _nhomPhanLoai {
    final List<dynamic> variants = _product?['bien_the'] ?? [];
    final Map<String, Set<String>> groups = {};

    for (var bt in variants) {
      if (bt is Map && bt['thuoc_tinh'] is Map) {
        (bt['thuoc_tinh'] as Map).forEach((k, v) {
          final strKey = k.toString().trim();
          final strVal = v.toString().trim();
          if (strKey.isNotEmpty && strVal.isNotEmpty) {
            groups.putIfAbsent(strKey, () => <String>{}).add(strVal);
          }
        });
      }
    }
    return groups.map((k, v) => MapEntry(k, v.toList()));
  }

  bool _isOptionValid(String key, String value) {
    final List<dynamic> variants = _product?['bien_the'] ?? [];
    return variants.any((bt) {
      if (bt is Map && bt['thuoc_tinh'] is Map) {
        final targetVal = bt['thuoc_tinh'][key]?.toString().trim().toLowerCase();
        return targetVal == value.trim().toLowerCase();
      }
      return false;
    });
  }

  bool _isOptionInStock(String key, String value) {
    final List<dynamic> variants = _product?['bien_the'] ?? [];
    return variants.any((bt) {
      if (bt is Map && bt['thuoc_tinh'] is Map) {
        final targetVal = bt['thuoc_tinh'][key]?.toString().trim().toLowerCase();
        final stock = _parseNumber(bt['so_luong_ton']);
        return targetVal == value.trim().toLowerCase() && stock > 0;
      }
      return false;
    });
  }

  void _handleAttributeSelect(String key, String value) {
    final List<dynamic> variants = _product?['bien_the'] ?? [];
    final nextAttributes = Map<String, String>.from(_selectedAttributes)..[key] = value;

    // Tìm biến thể thỏa mãn toàn bộ các thuộc tính đã chọn
    Map<String, dynamic>? matchedVariant;
    for (var bt in variants) {
      if (bt is Map && bt['thuoc_tinh'] is Map) {
        final attrs = bt['thuoc_tinh'] as Map;
        bool allMatch = true;
        _nhomPhanLoai.keys.forEach((k) {
          if (nextAttributes[k] != null) {
            if (attrs[k]?.toString().trim().toLowerCase() != nextAttributes[k]!.trim().toLowerCase()) {
              allMatch = false;
            }
          }
        });
        if (allMatch) {
          matchedVariant = Map<String, dynamic>.from(bt);
          break;
        }
      }
    }

    // Nếu không có biến thể khớp hoàn hảo, fallback về biến thể có thuộc tính vừa bấm và còn hàng
    if (matchedVariant == null) {
      final fallbackVariants = variants.where((bt) {
        if (bt is Map && bt['thuoc_tinh'] is Map) {
          return bt['thuoc_tinh'][key]?.toString().trim().toLowerCase() == value.trim().toLowerCase();
        }
        return false;
      }).toList();

      final inStockVariant = fallbackVariants.firstWhere(
        (v) => _parseNumber(v['so_luong_ton']) > 0,
        orElse: () => fallbackVariants.firstOrNull,
      );

      if (inStockVariant != null) {
        matchedVariant = Map<String, dynamic>.from(inStockVariant);
        if (matchedVariant['thuoc_tinh'] is Map) {
          _selectedAttributes = Map<String, String>.from(
            (matchedVariant['thuoc_tinh'] as Map).map((k, v) => MapEntry(k.toString(), v.toString())),
          );
        }
      }
    } else {
      _selectedAttributes = nextAttributes;
    }

    if (matchedVariant != null) {
      setState(() {
        _selectedVariant = matchedVariant;
        _quantity = 1;
      });
      _updateSelectedMedia();
    }
  }

  // --- TÍNH TOÁN GIÁ & FLASH SALE ---
  Map<String, dynamic>? get _activeSaleItem {
    if (_selectedVariant == null || _activeFlashSales.isEmpty) return null;
    final variantId = _selectedVariant!['ma_bien_the']?.toString();

    for (var promo in _activeFlashSales) {
      if (promo['products'] is List) {
        for (var p in (promo['products'] as List)) {
          final chiTiet = p['chi_tiet_bien_the'];
          if (chiTiet is List && chiTiet.isNotEmpty) {
            if (chiTiet[0]['ma_bien_the']?.toString() == variantId) {
              return p['thong_tin_sale'] ?? p;
            }
          }
        }
      }
    }
    return null;
  }

  double _parseNumber(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final clean = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: CircularProgressIndicator(color: Color(0xFF006C49))),
      );
    }

    if (_product == null) {
      return Scaffold(
        appBar: AppBar(backgroundColor: Colors.white, elevation: 0),
        body: const Center(child: Text('Không tìm thấy thông tin sản phẩm.')),
      );
    }

    // Logic tính toán Flash Sale
    final saleItem = _activeSaleItem;
    final double remainingSaleQuantity = saleItem != null
        ? (_parseNumber(saleItem['so_luong_gioi_han']) - _parseNumber(saleItem['da_ban'])).clamp(0.0, double.infinity)
        : (_selectedVariant?['thong_tin_sale'] != null
            ? (_parseNumber(_selectedVariant!['thong_tin_sale']['so_luong_gioi_han']) -
                    _parseNumber(_selectedVariant!['thong_tin_sale']['da_ban']))
                .clamp(0.0, double.infinity)
            : 0.0);

    final bool isFlashSale = (saleItem != null ||
            _selectedVariant?['thong_tin_sale'] != null ||
            _selectedVariant?['is_flash_sale'] == true) &&
        remainingSaleQuantity > 0;

    final double currentPrice = isFlashSale
        ? _parseNumber(saleItem?['gia_khuyen_mai'] ??
            _selectedVariant?['thong_tin_sale']?['gia_khuyen_mai'] ??
            _selectedVariant?['gia_khuyen_mai'] ??
            _selectedVariant?['gia_ban_le'])
        : _parseNumber(_selectedVariant?['gia_ban_le'] ?? _product!['gia_ban_thap_nhat']);

    final double rawOriginalPrice = _parseNumber(_selectedVariant?['gia_goc'] ??
        _selectedVariant?['gia_ban_le'] ??
        _product!['gia_ban_thap_nhat']);
    final double? originalPrice = (isFlashSale && rawOriginalPrice > currentPrice) ? rawOriginalPrice : null;

    final int rawStock = _parseNumber(_selectedVariant?['so_luong_ton']).toInt();
    final int stockCount = isFlashSale ? remainingSaleQuantity.toInt().clamp(0, rawStock) : rawStock;
    final bool isOutOfStock = stockCount <= 0;

    final nhomAttrs = _nhomPhanLoai;
    final bool isMultiTier = nhomAttrs.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFBFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _product!['ten_san_pham'] ?? 'Chi tiết sản phẩm',
          style: const TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: _isLiked ? Colors.red : Colors.black87,
            ),
            onPressed: _toggleLike,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. KHỐI HÌNH ẢNH CHÍNH & MEDIA THUMBNAILS
            _buildMediaGallery(),

            // 2. THÔNG TIN CƠ BẢN (TÊN, GIÁ, SKU, MÔ TẢ)
            _buildProductInfo(currentPrice, originalPrice, isFlashSale),

            // 3. CHỌN BIẾN THỂ & THUỘC TÍNH ĐA TẦNG (MA TRẬN)
            _buildVariantAndAttributeSelector(isMultiTier, nhomAttrs),

            // 4. CHỌN SỐ LƯỢNG & TẠM TÍNH
            _buildQuantityAndSubtotal(currentPrice, stockCount, isOutOfStock, isFlashSale),

            const SizedBox(height: 16),

            // 5. ĐÁNH GIÁ SẢN PHẨM (FEEDBACK)
            FeedbackSection(reviewData: _reviewData),

            const SizedBox(height: 16),

            // 6. SẢN PHẨM LIÊN QUAN
            RelatedProducts(products: _relatedProducts),

            const SizedBox(height: 16),

            // 7. ĐỀ XUẤT CHO BẠN
            RecommendedProducts(
              products: _recommendedProducts,
              onAddToCart: (p) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Đã thêm ${p['ten_san_pham']} vào giỏ hàng!'),
                    backgroundColor: const Color(0xFF006C49),
                  ),
                );
              },
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomActionBar(isOutOfStock, currentPrice),
    );
  }

  // --- 1. MEDIA GALLERY ---
  Widget _buildMediaGallery() {
    final List<dynamic> mediaList = _product!['media'] ?? [];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            height: 280,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(20),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.network(
                _selectedMediaUrl,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Center(
                  child: Icon(Icons.shopping_basket_outlined, size: 64, color: Color(0xFF006C49)),
                ),
              ),
            ),
          ),
          if (mediaList.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 60,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: mediaList.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final m = mediaList[index];
                  final String url = m['duong_dan_url'] ?? '';
                  final bool isSelected = _selectedMediaUrl == url;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedMediaUrl = url),
                    child: Container(
                      width: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF006C49) : Colors.grey.shade200,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(url, fit: BoxFit.cover),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  // --- 2. THÔNG TIN SẢN PHẨM & GIÁ ---
  Widget _buildProductInfo(double price, double? originalPrice, bool isFlashSale) {
    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF006C49),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'DEMI FRESH',
                  style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'SKU: ${_selectedVariant?['sku'] ?? 'N/A'}',
                style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Row(
                children: [
                  const Icon(Icons.favorite_rounded, color: Colors.red, size: 14),
                  const SizedBox(width: 4),
                  Text('$_likeCount', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _product!['ten_san_pham'] ?? '',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
          ),
          if (_selectedVariant?['ten_bien_the'] != null && _selectedVariant!['ten_bien_the'] != 'Mặc định') ...[
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F0ED),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'Phân loại: ${_selectedVariant!['ten_bien_the']}',
                style: const TextStyle(color: Color(0xFF006C49), fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                _currencyFormat.format(price),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: isFlashSale ? const Color(0xFFFF3B30) : const Color(0xFF006C49),
                ),
              ),
              if (originalPrice != null) ...[
                const SizedBox(width: 8),
                Text(
                  _currencyFormat.format(originalPrice),
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.grey,
                    decoration: TextDecoration.lineThrough,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
              if (isFlashSale) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFFFF3B30), Color(0xFFFF6B00)]),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'ĐANG SALE 🔥',
                    style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                  ),
                ),
              ],
            ],
          ),
          if (_product!['mo_ta'] != null && _product!['mo_ta'].toString().isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: const Border(left: BorderSide(color: Color(0xFF006C49), width: 3)),
              ),
              child: Text(
                _product!['mo_ta'],
                style: const TextStyle(fontSize: 12, color: Colors.black87, fontStyle: FontStyle.italic),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // --- 3. BỘ CHỌN THUỘC TÍNH ĐA TẦNG (COLOR / SIZE / V.V.) ---
  Widget _buildVariantAndAttributeSelector(bool isMultiTier, Map<String, List<String>> nhomAttrs) {
    if (isMultiTier) {
      return Container(
        color: Colors.white,
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: nhomAttrs.entries.map((entry) {
            final tenThuocTinh = entry.key;
            final danhSachGiaTri = entry.value;

            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tenThuocTinh.toUpperCase(),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: danhSachGiaTri.map((giaTri) {
                      final isSelected =
                          _selectedAttributes[tenThuocTinh]?.trim().toLowerCase() == giaTri.trim().toLowerCase();
                      final isValid = _isOptionValid(tenThuocTinh, giaTri);
                      final inStock = isValid && _isOptionInStock(tenThuocTinh, giaTri);

                      return GestureDetector(
                        onTap: () {
                          if (isValid) _handleAttributeSelect(tenThuocTinh, giaTri);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFE6F0ED)
                                : (isValid && inStock ? Colors.white : const Color(0xFFF8FAFC)),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF006C49)
                                  : (isValid && inStock ? Colors.grey.shade300 : Colors.grey.shade200),
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: Text(
                            giaTri,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? const Color(0xFF006C49)
                                  : (isValid && inStock ? Colors.black87 : Colors.grey.shade400),
                              decoration: !isValid ? TextDecoration.lineThrough : null,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      );
    }

    // Trường hợp danh sách biến thể đơn
    final List<dynamic> variants = _product!['bien_the'] ?? [];
    if (variants.length <= 1) return const SizedBox.shrink();

    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('PHÂN LOẠI SẢN PHẨM', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B))),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: variants.map((v) {
              final isSelected = _selectedVariant?['ma_bien_the'] == v['ma_bien_the'];
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedVariant = Map<String, dynamic>.from(v);
                    _quantity = 1;
                  });
                  _updateSelectedMedia();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF006C49) : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: isSelected ? const Color(0xFF006C49) : Colors.grey.shade300),
                  ),
                  child: Text(
                    v['ten_bien_the'] ?? 'Mặc định',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : Colors.black87,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // --- 4. SỐ LƯỢNG & TẠM TÍNH ---
  Widget _buildQuantityAndSubtotal(double price, int stockCount, bool isOutOfStock, bool isFlashSale) {
    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isFlashSale ? 'Suất Flash Sale: $stockCount' : 'Kho: $stockCount',
                style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove, size: 16),
                      onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                    ),
                    Text('$_quantity', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.add, size: 16),
                      onPressed: _quantity < stockCount ? () => setState(() => _quantity++) : null,
                    ),
                  ],
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('Tạm tính', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                _currencyFormat.format(price * _quantity),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // --- 5. THANH THAO TÁC DƯỚI CÙNG (BOTTOM BAR) ---
  Widget _buildBottomActionBar(bool isOutOfStock, double currentPrice) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: isOutOfStock
                    ? null
                    : () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Đã thêm $_quantity x ${_product!['ten_san_pham']} vào giỏ hàng!'),
                            backgroundColor: const Color(0xFF006C49),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                icon: const Icon(Icons.add_shopping_cart_rounded, size: 18),
                label: const Text('GIỎ HÀNG', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF006C49),
                  side: const BorderSide(color: Color(0xFF006C49), width: 1.5),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: isOutOfStock ? null : () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFB800),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  isOutOfStock ? 'HẾT HÀNG' : 'MUA NGAY',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}