import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';
import 'package:app/screens/productdetail/product_detail_screen.dart';

class TabDathichWidget extends StatefulWidget {
  const TabDathichWidget({super.key});

  @override
  State<TabDathichWidget> createState() => _TabDathichWidgetState();
}

class _TabDathichWidgetState extends State<TabDathichWidget> {
  List<dynamic> _favorites = [];
  bool _loading = true;

  int _currentPage = 1;
  int _itemsPerPage = 6;

  final NumberFormat _currencyFormat =
      NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchFavorites();
  }

  Future<void> _fetchFavorites() async {
    try {
      final res = await productApi.get('/products/favorites/me');
      if (mounted && res.data != null && res.data['success'] == true) {
        setState(() {
          _favorites = res.data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Lỗi lấy danh sách yêu thích: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleUnlike(dynamic maSanPham) async {
    final previousFavorites = List<dynamic>.from(_favorites);
    final updatedFavorites = _favorites
        .where((item) => item['ma_san_pham'] != maSanPham)
        .toList();

    final newTotalPages =
        max(1, (updatedFavorites.length / _itemsPerPage).ceil());
    setState(() {
      _favorites = updatedFavorites;
      if (_currentPage > newTotalPages) {
        _currentPage = newTotalPages;
      }
    });

    try {
      final res = await productApi.post(
        '/products/$maSanPham/likes',
        data: {'trang_thai': false},
      );
      if (res.data == null || res.data['success'] != true) {
        if (mounted) setState(() => _favorites = previousFavorites);
      }
    } catch (e) {
      debugPrint('Lỗi khi bỏ thích: $e');
      if (mounted) setState(() => _favorites = previousFavorites);
    }
  }

  double _parseNumber(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final clean = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF006C49)),
        ),
      );
    }

    if (_favorites.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.favorite_border_rounded,
                  size: 48, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            const Text(
              'BẠN CHƯA YÊU THÍCH SẢN PHẨM NÀO',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: Color(0xFF64748B),
                letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      );
    }

    final totalPages = max(1, (_favorites.length / _itemsPerPage).ceil());
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    final endIndex = min(startIndex + _itemsPerPage, _favorites.length);
    final currentFavoritesOnPage = _favorites.sublist(startIndex, endIndex);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'SẢN PHẨM YÊU THÍCH',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: Color(0xFF161B22),
                fontStyle: FontStyle.italic,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${_favorites.length} MỤC',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF64748B),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: currentFavoritesOnPage.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final item = currentFavoritesOnPage[index];
            final productId = item['ma_san_pham'];
            final String productName = item['ten_san_pham'] ?? 'Sản phẩm';
            final String imageUrl = item['hinh_anh_chinh'] ??
                'https://images.unsplash.com/photo-1542838132-92c53300491e';
            final double price = _parseNumber(item['gia_ban_thap_nhat']);

            return Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      if (productId != null) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ProductDetailScreen(
                                productId: productId.toString()),
                          ),
                        );
                      }
                    },
                    child: Container(
                      width: 75,
                      height: 75,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(
                              Icons.shopping_basket_outlined,
                              color: Color(0xFF006C49)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GestureDetector(
                          onTap: () {
                            if (productId != null) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ProductDetailScreen(
                                      productId: productId.toString()),
                                ),
                              );
                            }
                          },
                          child: Text(
                            productName,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _currencyFormat.format(price),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF006C49),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (productId != null) {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ProductDetailScreen(
                                          productId: productId.toString()),
                                    ),
                                  );
                                }
                              },
                              child: const Row(
                                children: [
                                  Icon(Icons.open_in_new_rounded,
                                      size: 13, color: Color(0xFF006C49)),
                                  SizedBox(width: 4),
                                  Text(
                                    'Xem chi tiết',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF006C49),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              icon: const Icon(Icons.favorite_rounded,
                                  size: 20, color: Color(0xFFFF3B30)),
                              onPressed: () => _handleUnlike(productId),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        if (_favorites.length > _itemsPerPage) ...[
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('Hiển thị: ',
                      style: TextStyle(fontSize: 11, color: Colors.grey)),
                  DropdownButton<int>(
                    value: _itemsPerPage,
                    underline: const SizedBox.shrink(),
                    items: const [
                      DropdownMenuItem(value: 6, child: Text('6 mục')),
                      DropdownMenuItem(value: 12, child: Text('12 mục')),
                      DropdownMenuItem(value: 24, child: Text('24 mục')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _itemsPerPage = val;
                          _currentPage = 1;
                        });
                      }
                    },
                  ),
                ],
              ),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded),
                    onPressed: _currentPage > 1
                        ? () => setState(() => _currentPage--)
                        : null,
                  ),
                  Text(
                    '$_currentPage / $totalPages',
                    style: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded),
                    onPressed: _currentPage < totalPages
                        ? () => setState(() => _currentPage++)
                        : null,
                  ),
                ],
              ),
            ],
          ),
        ],
      ],
    );
  }
}