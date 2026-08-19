import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:app/api/api_client.dart'; 
import 'package:app/screens/checkout/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _isLoading = true;
  List<dynamic> _cart = [];
  
  final Set<String> _selectedVariantIds = {};
  final Set<String> _expandedProductIds = {};

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchCart();
  }

  // --- 1. LẤY GIỎ HÀNG TỪ BACKEND ---
  Future<void> _fetchCart() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final response = await cartApi.get('/cart');
      dynamic rawData = response.data;
      List<dynamic> items = [];

      if (rawData is Map && rawData.containsKey('items')) {
        items = rawData['items'] is List ? rawData['items'] : [];
      } else if (rawData is List) {
        items = rawData;
      }

      final formattedCart = items.map((item) => _formatCartItem(item)).toList();

      if (mounted) {
        setState(() {
          _cart = formattedCart;
          _selectedVariantIds.clear();
          for (var item in _cart) {
            final vId = item['variantId']?.toString();
            if (vId != null && vId.isNotEmpty) {
              _selectedVariantIds.add(vId);
            }
          }
        });
        _updateExpandedGroups();
      }
    } catch (e) {
      debugPrint('Lỗi tải giỏ hàng: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // --- 2. FORMAT CÁC MỤC GIỎ HÀNG ---
  Map<String, dynamic> _formatCartItem(dynamic item) {
    if (item is! Map<String, dynamic>) return {};

    final resolvedProductId = item['productId'] ??
        item['product_id'] ??
        item['id'] ??
        item['ma_san_pham'] ??
        item['id_san_pham'] ??
        '';

    final resolvedVariantId = item['variantId'] ?? item['variant_id'] ?? item['ma_bien_the'] ?? '';

    return {
      'productId': resolvedProductId.toString(),
      'id': resolvedProductId.toString(),
      'variantId': resolvedVariantId.toString(),
      'sku': item['sku'] ?? item['ma_sku'] ?? resolvedVariantId.toString(),
      'name': item['name'] ?? item['ten_san_pham'] ?? 'Sản phẩm',
      'variantName': item['variantName'] ?? item['ten_bien_the'] ?? '',
      'price': (item['price'] ?? item['gia_ban_le'] ?? item['gia_khuyen_mai'] ?? 0).toDouble(),
      'quantity': (item['quantity'] ?? 1) as int,
      'stock': (item['stock'] ?? item['so_luong_ton'] ?? item['so_luong_thuc_te'] ?? 9999) as int,
      'image': item['image'] ?? item['duong_dan_url'] ?? item['hinh_anh_url'] ?? '',
      'categorySlug': item['categorySlug'] ?? item['slug_danh_muc'] ?? 'san-pham',
      'countryCode': item['countryCode'] ?? item['country_code'] ?? 'vn',
      'thuoc_tinh_hop_nhat': item['thuoc_tinh_hop_nhat'] ?? [],
      'ten_don_vi': item['ten_don_vi'] ?? 'Gói',
    };
  }

  // --- 3. GOM CÁC PHÂN LOẠI TRÙNG PRODUCT_ID ---
  List<Map<String, dynamic>> _getGroupedCart() {
    final Map<String, Map<String, dynamic>> groups = {};

    for (var item in _cart) {
      final String pId = item['productId'] ?? 'unknown';

      if (!groups.containsKey(pId)) {
        groups[pId] = {
          'productId': pId,
          'name': item['name'],
          'image': item['image'],
          'countryCode': item['countryCode'],
          'categorySlug': item['categorySlug'],
          'totalQuantity': 0,
          'subVariants': <Map<String, dynamic>>[],
        };
      }

      groups[pId]!['totalQuantity'] = (groups[pId]!['totalQuantity'] as int) + (item['quantity'] as int);
      (groups[pId]!['subVariants'] as List<Map<String, dynamic>>).add(item);
    }

    return groups.values.toList();
  }

  void _updateExpandedGroups() {
    final grouped = _getGroupedCart();
    for (var group in grouped) {
      final subVars = group['subVariants'] as List;
      if (subVars.length > 1) {
        _expandedProductIds.add(group['productId'].toString());
      }
    }
  }

  // --- 4. THAO TÁC CẬP NHẬT SỐ LƯỢNG & XÓA ---
  Future<void> _handleUpdateQuantity(Map<String, dynamic> item, String type) async {
    final int currentQty = item['quantity'] ?? 1;
    final int maxStock = item['stock'] ?? 9999;

    if (type == 'minus' && currentQty <= 1) return;
    if (type == 'plus' && currentQty >= maxStock) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Rất tiếc! Phân loại này chỉ còn $maxStock sản phẩm.')),
      );
      return;
    }

    final int change = type == 'plus' ? 1 : -1;
    final updatedItem = Map<String, dynamic>.from(item);
    updatedItem['quantity'] = change;

    try {
      // ✅ ĐÃ SỬA LỖI: Truyền endpoint vào đối số thứ nhất và payload vào đối số thứ hai
      await cartApi.post('/cart/add', data: updatedItem);
      _fetchCart();
    } catch (e) {
      debugPrint('Lỗi cập nhật số lượng: $e');
    }
  }

  Future<void> _handleRemoveFromCart(String variantId) async {
    try {
      await cartApi.delete('/cart/remove/$variantId');
      _fetchCart();
    } catch (e) {
      debugPrint('Lỗi xóa mục khỏi giỏ: $e');
    }
  }

  // --- 5. LOGIC CHỌN TOÀN BỘ / NHÓM / TỪNG MỤC ---
  void _toggleSelectAll() {
    setState(() {
      if (_selectedVariantIds.length == _cart.length) {
        _selectedVariantIds.clear();
      } else {
        _selectedVariantIds.clear();
        for (var item in _cart) {
          _selectedVariantIds.add(item['variantId'].toString());
        }
      }
    });
  }

  void _toggleSelectGroup(List<Map<String, dynamic>> subVariants) {
    final subIds = subVariants.map((v) => v['variantId'].toString()).toList();
    final isAllSelected = subIds.every((id) => _selectedVariantIds.contains(id));

    setState(() {
      if (isAllSelected) {
        _selectedVariantIds.removeAll(subIds);
      } else {
        _selectedVariantIds.addAll(subIds);
      }
    });
  }

  void _toggleSelectItem(String variantId) {
    setState(() {
      if (_selectedVariantIds.contains(variantId)) {
        _selectedVariantIds.remove(variantId);
      } else {
        _selectedVariantIds.add(variantId);
      }
    });
  }

  // --- 6. TÍNH TỔNG TIỀN ---
  double _calculateTotalPrice() {
    double total = 0.0;
    for (var item in _cart) {
      final String vId = item['variantId'].toString();
      if (_selectedVariantIds.contains(vId)) {
        final double price = (item['price'] as num).toDouble();
        final int qty = item['quantity'] as int;
        total += price * qty;
      }
    }
    return total;
  }

  void _handleCheckout() {
    if (_selectedVariantIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn ít nhất một sản phẩm để thanh toán!')),
      );
      return;
    }

    final selectedItems = _cart.where((item) => _selectedVariantIds.contains(item['variantId'].toString())).toList();

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CheckoutScreen(selectedCartItems: selectedItems),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final groupedCart = _getGroupedCart();
    final double totalPrice = _calculateTotalPrice();

    return Scaffold(
      backgroundColor: const Color(0xFFFAFBFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black87, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            const Text(
              'GIỎ HÀNG CỦA BẠN',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: Color(0xFF161B22),
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F0ED),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF006C49).withOpacity(0.2)),
              ),
              child: Text(
                '${_cart.length} mục',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF006C49),
                ),
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF006C49)))
          : _cart.isEmpty
              ? _buildEmptyCartState()
              : RefreshIndicator(
                  color: const Color(0xFF006C49),
                  onRefresh: _fetchCart,
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        color: const Color(0xFFFFFBEB),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: const Row(
                          children: [
                            Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFFD97706)),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Giao hàng miễn phí cho đơn hàng từ 500k',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                              ),
                            ),
                          ],
                        ),
                      ),

                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        child: Row(
                          children: [
                            Checkbox(
                              value: _selectedVariantIds.length == _cart.length && _cart.isNotEmpty,
                              activeColor: const Color(0xFF006C49),
                              onChanged: (_) => _toggleSelectAll(),
                            ),
                            Text(
                              'Chọn tất cả phân loại (${_selectedVariantIds.length}/${_cart.length})',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF334155)),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1),

                      Expanded(
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: groupedCart.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final group = groupedCart[index];
                            final List<Map<String, dynamic>> subVariants =
                                List<Map<String, dynamic>>.from(group['subVariants']);
                            final bool hasMultiple = subVariants.length > 1;

                            if (!hasMultiple) {
                              return _buildSingleVariantCard(subVariants[0]);
                            } else {
                              return _buildGroupedVariantCard(group, subVariants);
                            }
                          },
                        ),
                      ),

                      _buildCheckoutBottomBar(totalPrice),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSingleVariantCard(Map<String, dynamic> item) {
    final String variantId = item['variantId'].toString();
    final bool isSelected = _selectedVariantIds.contains(variantId);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? const Color(0xFF006C49) : const Color(0xFFE2E8F0),
          width: isSelected ? 1.5 : 1.0,
        ),
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Checkbox(
            value: isSelected,
            activeColor: const Color(0xFF006C49),
            onChanged: (_) => _toggleSelectItem(variantId),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              item['image'] ?? '',
              width: 60,
              height: 60,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200, width: 60, height: 60),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['name'] ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                ),
                if (item['variantName'] != null && item['variantName'].isNotEmpty)
                  Text(
                    'Phân loại: ${item['variantName']}',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                const SizedBox(height: 6),
                Text(
                  _currencyFormat.format(item['price']),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                ),
              ],
            ),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.remove_circle_outline, size: 20),
                onPressed: () => _handleUpdateQuantity(item, 'minus'),
              ),
              Text('${item['quantity']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              IconButton(
                icon: const Icon(Icons.add_circle_outline, size: 20),
                onPressed: () => _handleUpdateQuantity(item, 'plus'),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                onPressed: () => _handleRemoveFromCart(variantId),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGroupedVariantCard(Map<String, dynamic> group, List<Map<String, dynamic>> subVariants) {
    final String pId = group['productId'].toString();
    final bool isExpanded = _expandedProductIds.contains(pId);
    final bool isAllSelected = subVariants.map((v) => v['variantId'].toString()).every((id) => _selectedVariantIds.contains(id));

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Checkbox(
                  value: isAllSelected,
                  activeColor: const Color(0xFF006C49),
                  onChanged: (_) => _toggleSelectGroup(subVariants),
                ),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    group['image'] ?? '',
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200, width: 50, height: 50),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        group['name'] ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Tổng phân loại: ${group['totalQuantity']} mục',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF006C49), fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      if (isExpanded) {
                        _expandedProductIds.remove(pId);
                      } else {
                        _expandedProductIds.add(pId);
                      }
                    });
                  },
                  icon: Icon(isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 18),
                  label: Text(
                    isExpanded ? 'Thu gọn' : 'Chi tiết (${subVariants.length})',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          if (isExpanded)
            Column(
              children: subVariants.map((sub) => _buildSingleVariantCard(sub)).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildCheckoutBottomBar(double totalPrice) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4)),
        ],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Tổng tạm tính:', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                Text(
                  _currencyFormat.format(totalPrice),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                ),
              ],
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFEA619),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              onPressed: _handleCheckout,
              child: Text(
                'Thanh toán (${_selectedVariantIds.length})',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF422006)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyCartState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('Túi hàng trống', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 20),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006C49),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(context),
            child: const Text('Quay lại mua sắm', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}