import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';
import 'package:app/widgets/product/product_card.dart';
import 'package:app/screens/productdetail/product_detail_screen.dart';

class CategoryDetailScreen extends StatefulWidget {
  final String slug;
  final String? categoryName;
  final Map<String, dynamic>? parentCategoryData;

  const CategoryDetailScreen({
    super.key,
    required this.slug,
    this.categoryName,
    this.parentCategoryData,
  });

  @override
  State<CategoryDetailScreen> createState() => _CategoryDetailScreenState();
}

class _CategoryDetailScreenState extends State<CategoryDetailScreen> {
  bool _isLoading = true;
  String _currentSlug = '';
  String _displayName = '';

  List<dynamic> _products = [];
  List<dynamic> _subCategories = [];
  String? _activeSubCategorySlug;

  // Trạng thái Bộ lọc & Phân trang
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalResults = 0;
  String _selectedSort = 'noi-bat';
  String _selectedPrice = 'tat-ca';
  bool _freshShipping = false;
  bool _globalShipping = false;

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _currentSlug = widget.slug;
    _displayName = widget.categoryName ?? widget.slug.replaceAll('-', ' ').toUpperCase();

    if (widget.parentCategoryData != null && widget.parentCategoryData!['children'] is List) {
      _subCategories = (widget.parentCategoryData!['children'] as List)
          .where((c) => c['trang_thai'] != false)
          .toList();
    }

    _fetchCategoryProducts();
  }

  Future<void> _fetchCategoryProducts() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final response = await productApi.get(
        '/products/category/$_currentSlug',
        queryParameters: {
          'country': 'vn',
          'role': 'client',
          'sort': _selectedSort,
          'price': _selectedPrice,
          'fresh': _freshShipping,
          'global': _globalShipping,
          'page': _currentPage,
          'limit': 12,
        },
      );

      if (!mounted) return;

      if (response.data != null) {
        final d = response.data;
        setState(() {
          if (d['products'] is List) {
            _products = d['products'];
            _totalPages = d['totalPages'] ?? 1;
            _totalResults = d['total'] ?? _products.length;
          } else if (d is List) {
            _products = d;
            _totalResults = d.length;
            _totalPages = 1;
          }
        });
      }
    } catch (e) {
      debugPrint('Lỗi tải sản phẩm danh mục con: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onSubCategoryTap(String subSlug) {
    setState(() {
      if (_activeSubCategorySlug == subSlug) {
        _activeSubCategorySlug = null;
        _currentSlug = widget.slug;
      } else {
        _activeSubCategorySlug = subSlug;
        _currentSlug = subSlug;
      }
      _currentPage = 1;
    });
    _fetchCategoryProducts();
  }

  void _navigateToDetail(dynamic productId) {
    if (productId == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProductDetailScreen(productId: productId.toString()),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
          _displayName,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF161B22),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded, color: Color(0xFF006C49)),
            onPressed: _showFilterBottomSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Sub Categories Horizontal Card Slider
          if (_subCategories.isNotEmpty) _buildSubCategoriesBar(),

          // Sort & Count Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$_totalResults kết quả',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey),
                ),
                DropdownButton<String>(
                  value: _selectedSort,
                  underline: const SizedBox.shrink(),
                  icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF006C49)),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF161B22)),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        _selectedSort = val;
                        _currentPage = 1;
                      });
                      _fetchCategoryProducts();
                    }
                  },
                  items: const [
                    DropdownMenuItem(value: 'noi-bat', child: Text('Nổi bật')),
                    DropdownMenuItem(value: 'gia-thap', child: Text('Giá: Thấp đến Cao')),
                    DropdownMenuItem(value: 'gia-cao', child: Text('Giá: Cao đến Thấp')),
                    DropdownMenuItem(value: 'ban-chay', child: Text('Bán chạy nhất')),
                  ],
                ),
              ],
            ),
          ),

          // Product Grid View
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF006C49)))
                : _products.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        color: const Color(0xFF006C49),
                        onRefresh: _fetchCategoryProducts,
                        child: GridView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _products.length,
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.72,
                          ),
                          itemBuilder: (context, index) {
                            final p = _products[index];
                            final productId = p['ma_san_pham'] ?? p['id'];
                            return GestureDetector(
                              onTap: () => _navigateToDetail(productId),
                              child: ProductCard(
                                p: Map<String, dynamic>.from(p),
                                categoryName: _displayName,
                                categorySlug: _currentSlug,
                              ),
                            );
                          },
                        ),
                      ),
          ),

          if (!_isLoading && _totalPages > 1) _buildPaginationBar(),
        ],
      ),
    );
  }

  Widget _buildSubCategoriesBar() {
    return Container(
      height: 78,
      margin: const EdgeInsets.only(top: 8, bottom: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _subCategories.length,
        itemBuilder: (context, index) {
          final sub = _subCategories[index];
          final String subSlug = sub['slug'] ?? '';
          final String subName = sub['name'] ?? sub['ten_danh_muc_con'] ?? '';
          final String? imageUrl = sub['Hinh_anh'] ?? sub['image'] ?? sub['hinhanh'];
          final bool isActive = _activeSubCategorySlug == subSlug;

          return GestureDetector(
            onTap: () => _onSubCategoryTap(subSlug),
            child: Container(
              width: 175,
              height: 74,
              margin: const EdgeInsets.only(right: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isActive ? const Color(0xFF006C49) : const Color(0xFFE2E8F0),
                  width: isActive ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: imageUrl != null && imageUrl.isNotEmpty && imageUrl != '[null]'
                          ? Image.network(
                              imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: const Color(0xFFF1F5F9),
                                child: const Icon(Icons.image_not_supported_outlined, color: Colors.grey),
                              ),
                            )
                          : Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFFF1F5F9), Color(0xFFE2E8F0)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                            ),
                    ),
                    Positioned(
                      left: 10,
                      top: 18,
                      child: Container(
                        constraints: const BoxConstraints(maxWidth: 115),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withOpacity(0.5)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: Text(
                          subName,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                            height: 1.2,
                          ),
                        ),
                      ),
                    ),
                    if (isActive)
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 0,
                        child: Container(
                          height: 5,
                          color: const Color(0xFF006C49),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          const Text(
            'Chưa có sản phẩm nào phù hợp bộ lọc.',
            style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildPaginationBar() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: _currentPage > 1
                ? () {
                    setState(() => _currentPage--);
                    _fetchCategoryProducts();
                  }
                : null,
          ),
          Text(
            'Trang $_currentPage / $_totalPages',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: _currentPage < _totalPages
                ? () {
                    setState(() => _currentPage++);
                    _fetchCategoryProducts();
                  }
                : null,
          ),
        ],
      ),
    );
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Bộ lọc sản phẩm', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      TextButton(
                        onPressed: () {
                          setModalState(() {
                            _selectedPrice = 'tat-ca';
                            _freshShipping = false;
                            _globalShipping = false;
                          });
                        },
                        child: const Text('Đặt lại', style: TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                  const Divider(),
                  CheckboxListTile(
                    title: const Text('Giao hàng hoả tốc', style: TextStyle(fontSize: 13)),
                    value: _freshShipping,
                    activeColor: const Color(0xFF006C49),
                    onChanged: (val) => setModalState(() => _freshShipping = val ?? false),
                  ),
                  CheckboxListTile(
                    title: const Text('Giao hàng Global', style: TextStyle(fontSize: 13)),
                    value: _globalShipping,
                    activeColor: const Color(0xFF006C49),
                    onChanged: (val) => setModalState(() => _globalShipping = val ?? false),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF006C49),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        setState(() => _currentPage = 1);
                        _fetchCategoryProducts();
                      },
                      child: const Text('Áp dụng', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}