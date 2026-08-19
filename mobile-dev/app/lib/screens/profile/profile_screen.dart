import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';

// Import 8 module Tab con theo đúng cây thư mục
import 'package:app/screens/profile/tabhoso/tab_hoso_widget.dart';
import 'package:app/screens/profile/tabdiachi/tab_diachi_widget.dart';
import 'package:app/screens/profile/tabbaomat/tab_baomat_widget.dart';
import 'package:app/screens/profile/tabthongbao/tab_thongbao_widget.dart';
import 'package:app/screens/profile/tabdonhang/tab_donhang_widget.dart';
import 'package:app/screens/profile/tabvoucher/tab_voucher_widget.dart';
import 'package:app/screens/profile/tabdathich/tab_dathich_widget.dart';
import 'package:app/screens/profile/tabvidemipay/tab_videmipay_widget.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _loading = true;

  // Quản lý Tab đang hoạt động
  String _activeTab = 'profile'; // profile | orders | wallet | addresses | vouchers | favorites | security | notifications
  String _selectedOrderStatus = 'xac-nhan';

  // Dữ liệu người dùng & hệ thống
  Map<String, dynamic>? _profile;
  int _loyaltyPoints = 0;
  List<dynamic> _ordersList = [];
  List<dynamic> _addresses = [];

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  final List<Map<String, dynamic>> _orderStepsConfig = [
    {
      'label': 'Xác nhận',
      'queryValue': 'xac-nhan',
      'icon': Icons.history_rounded,
      'matchStatuses': ['chờ xác nhận', 'xác nhận', 'pending', 'chờ xử lý'],
    },
    {
      'label': 'Lấy hàng',
      'queryValue': 'lay-hang',
      'icon': Icons.inventory_2_outlined,
      'matchStatuses': ['lấy hàng', 'đang xử lý'],
    },
    {
      'label': 'Đang giao',
      'queryValue': 'dang-giao',
      'icon': Icons.local_shipping_outlined,
      'matchStatuses': ['đang giao'],
    },
    {
      'label': 'Đã giao',
      'queryValue': 'da-giao',
      'icon': Icons.check_circle_outline_rounded,
      'matchStatuses': ['đã giao', 'hoàn thành', 'delivered'],
    },
    {
      'label': 'Đã hủy',
      'queryValue': 'da-huy',
      'icon': Icons.cancel_outlined,
      'matchStatuses': ['đã hủy', 'cancelled'],
    },
  ];

  @override
  void initState() {
    super.initState();
    _initFetchAllData();
  }

  Future<void> _initFetchAllData() async {
    setState(() => _loading = true);
    try {
      await Future.wait([
        _fetchProfileData(),
        _fetchLoyaltyPoints(),
        _fetchOrders(),
        _fetchAddresses(),
      ]);
    } catch (e) {
      debugPrint('Lỗi tải dữ liệu Profile: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // 1. Tải thông tin hồ sơ
  Future<void> _fetchProfileData() async {
    try {
      final res = await authApi.get('/profile/hoso');
      if (res.data != null && res.data['success'] == true) {
        if (mounted) {
          setState(() {
            _profile = Map<String, dynamic>.from(res.data['data']);
          });
        }
      }
    } catch (e) {
      debugPrint('Lỗi lấy hồ sơ: $e');
    }
  }

  // 2. Tải số dư Xu thưởng tích lũy
  Future<void> _fetchLoyaltyPoints() async {
    try {
      final res = await authApi.get('/auth/loyalty/balance');
      if (res.data != null && res.data['success'] == true) {
        if (mounted) {
          setState(() {
            _loyaltyPoints = res.data['data']['availablePoints'] ?? 0;
          });
        }
      }
    } catch (e) {
      debugPrint('Lỗi ví xu: $e');
    }
  }

  // 3. Tải danh sách đơn hàng
  Future<void> _fetchOrders() async {
    try {
      final res = await orderApi.get('/orders/my-orders');
      if (res.data != null && res.data['success'] == true) {
        if (mounted) {
          setState(() {
            _ordersList = res.data['data'] ?? [];
          });
        }
      }
    } catch (e) {
      debugPrint('Lỗi lấy đơn hàng: $e');
    }
  }

  // 4. Tải danh sách địa chỉ
  Future<void> _fetchAddresses() async {
    try {
      final res = await authApi.get('/addresses');
      if (res.data != null && res.data['success'] == true) {
        if (mounted) {
          setState(() {
            _addresses = res.data['data'] ?? [];
          });
        }
      }
    } catch (e) {
      debugPrint('Lỗi lấy sổ địa chỉ: $e');
    }
  }

  // Cập nhật hồ sơ
  Future<void> _handleSaveProfile(Map<String, dynamic> updatedProfile) async {
    try {
      final res = await authApi.put('/profile/hoso', data: updatedProfile);
      if (res.data != null && res.data['success'] == true) {
        _showToast('Đã cập nhật hồ sơ cá nhân thành công!');
        _fetchProfileData();
      } else {
        _showToast('Lỗi khi cập nhật hồ sơ', isError: true);
      }
    } catch (e) {
      _showToast('Lỗi kết nối máy chủ', isError: true);
    }
  }

  // Hủy đơn hàng
  Future<void> _handleCancelOrder(dynamic orderTarget) async {
    final orderId = orderTarget['ma_don_hang'] ?? orderTarget['id'];
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận hủy đơn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        content: Text('Bạn có chắc chắn muốn hủy đơn hàng #$orderId?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('QUAY LẠI')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('HỦY ĐƠN', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        final res = await orderApi.put('/orders/$orderId/cancel');
        if (res.data != null && res.data['success'] == true) {
          _showToast(res.data['message'] ?? 'Hủy đơn hàng thành công!');
          _fetchOrders();
          _fetchProfileData();
        } else {
          _showToast(res.data?['message'] ?? 'Không thể hủy đơn hàng vào lúc này.', isError: true);
        }
      } catch (err) {
        _showToast('Hệ thống bận, không thể hủy đơn hàng vào lúc này.', isError: true);
      }
    }
  }

  // Mua lại đơn cũ (Thêm lại toàn bộ item vào giỏ hàng)
  Future<void> _handleReorder(dynamic orderTarget) async {
    final List<dynamic> items = orderTarget['danh_sach_san_pham'] ?? orderTarget['items'] ?? orderTarget['products'] ?? [];

    if (items.isEmpty) {
      _showToast('Đơn hàng không có dữ liệu sản phẩm để mua lại!', isError: true);
      return;
    }

    _showToast('Đang thêm sản phẩm cũ vào giỏ hàng...');

    try {
      for (final item in items) {
        final variantId = item['variant_id'] ?? item['variantId'] ?? item['ma_bien_the'];
        final productName = item['product_name'] ?? item['name'] ?? 'Sản phẩm Demi Mart';
        final qty = item['quantity'] ?? item['qty'] ?? 1;

        if (variantId != null) {
          await cartApi.post(
            '/cart/add',
            data: {
              'variantId': variantId,
              'name': productName,
              'quantity': int.tryParse(qty.toString()) ?? 1,
              'price': double.tryParse((item['price'] ?? 0).toString()) ?? 0.0,
              'image_url': item['image_url'] ?? item['hinh_anh_chinh'] ?? '',
            },
          );
        }
      }

      _showToast('Đã thêm thành công! Vui lòng kiểm tra giỏ hàng.');
    } catch (e) {
      _showToast('Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!', isError: true);
    }
  }

  // Hộp thoại Điểm danh nhận Xu
  void _showCheckInDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.bolt_rounded, color: Color(0xFFFEA619), size: 24),
            SizedBox(width: 8),
            Text('Điểm danh nhận Xu', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
          ],
        ),
        content: const Text(
          'Chúc mừng bạn đã điểm danh hôm nay và nhận được +100 Xu thưởng tích lũy!',
          style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              setState(() {
                _loyaltyPoints += 100;
              });
              Navigator.pop(ctx);
              _showToast('Đã cộng +100 Xu vào ví thưởng!');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006C49),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('NHẬN XU NGAY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
          ),
        ],
      ),
    );
  }

  void _showToast(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red.shade700 : const Color(0xFF006C49),
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  int _countOrders(List<String> matchStatuses) {
    return _ordersList.where((o) {
      final status = (o['trang_thai_don_hang'] ?? '').toString().trim().toLowerCase();
      return matchStatuses.contains(status);
    }).length;
  }

  Widget _buildTierBadge(String? tier) {
    final name = (tier ?? 'BẠC').toUpperCase();
    Color bg = const Color(0xFFF1F5F9);
    Color textCol = const Color(0xFF64748B);
    IconData icon = Icons.workspace_premium_outlined;

    if (name == 'KIM CƯƠNG') {
      bg = const Color(0xFFEEF2FF);
      textCol = const Color(0xFF4F46E5);
      icon = Icons.diamond_outlined;
    } else if (name == 'VÀNG') {
      bg = const Color(0xFFFEF3C7);
      textCol = const Color(0xFFD97706);
      icon = Icons.workspace_premium_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: textCol),
          const SizedBox(width: 4),
          Text(
            name,
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textCol, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF006C49)),
        ),
      );
    }

    final String fullName = _profile?['full_name'] ?? 'Khách hàng DemiMart';
    final String avatarUrl = _profile?['avatar_url'] ??
        'https://ui-avatars.com/api/?name=${Uri.encodeComponent(fullName)}&background=006c49&color=fff';
    final double walletBalance = double.tryParse((_profile?['wallet_balance'] ?? 0).toString()) ?? 0.0;

    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Tài khoản cá nhân',
          style: TextStyle(color: Color(0xFF161B22), fontSize: 16, fontWeight: FontWeight.w900),
        ),
      ),
      body: RefreshIndicator(
        color: const Color(0xFF006C49),
        onRefresh: _initFetchAllData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              // 1. KHỐI THÔNG TIN PROFILE HEADER
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: const Color(0xFFE6F0ED),
                      backgroundImage: NetworkImage(avatarUrl),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fullName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF161B22),
                            ),
                          ),
                          const SizedBox(height: 4),
                          _buildTierBadge(_profile?['membership_tier']),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE6F0ED),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'ĐANG HOẠT ĐỘNG',
                        style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // 2. KHỐI VÍ DEMI PAY & ĐIỂM THƯỞNG XU
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(
                  children: [
                    // Thẻ Ví Demi Pay
                    Expanded(
                      flex: 6,
                      child: GestureDetector(
                        onTap: () => setState(() => _activeTab = 'wallet'),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF006C49), Color(0xFF004D34)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF006C49).withOpacity(0.25),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.account_balance_wallet_rounded, color: Colors.white70, size: 14),
                                      SizedBox(width: 6),
                                      Text(
                                        'VÍ DEMI PAY',
                                        style: TextStyle(color: Colors.white70, fontSize: 9, fontWeight: FontWeight.w900),
                                      ),
                                    ],
                                  ),
                                  Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 11),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _currencyFormat.format(walletBalance),
                                style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Thẻ Điểm thưởng tích lũy (Xu)
                    Expanded(
                      flex: 4,
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.star_rounded, color: Color(0xFFFEA619), size: 15),
                                    SizedBox(width: 4),
                                    Text(
                                      'XU THƯỞNG',
                                      style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                GestureDetector(
                                  onTap: _showCheckInDialog,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEA619),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'ĐIỂM DANH',
                                      style: TextStyle(color: Colors.white, fontSize: 7.5, fontWeight: FontWeight.w900),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '$_loyaltyPoints Xu',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // 3. TAB CHUYỂN ĐỔI NGANG (HORIZONTAL TABS)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(
                  children: [
                    _buildTabChip('profile', 'Hồ sơ', Icons.person_outline),
                    _buildTabChip('orders', 'Đơn hàng', Icons.inventory_2_outlined),
                    _buildTabChip('wallet', 'Ví Demi', Icons.account_balance_wallet_outlined),
                    _buildTabChip('addresses', 'Địa chỉ', Icons.location_on_outlined),
                    _buildTabChip('vouchers', 'Voucher', Icons.local_offer_outlined),
                    _buildTabChip('favorites', 'Đã thích', Icons.favorite_border_rounded),
                    _buildTabChip('security', 'Bảo mật', Icons.shield_outlined),
                    _buildTabChip('notifications', 'Thông báo', Icons.notifications_none_rounded),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // 4. MINIBAR 5 TRẠNG THÁI ĐƠN HÀNG
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: _orderStepsConfig.map((step) {
                    final String qVal = step['queryValue'];
                    final String label = step['label'];
                    final IconData icon = step['icon'];
                    final List<String> matchStatuses = List<String>.from(step['matchStatuses']);
                    final int count = _countOrders(matchStatuses);
                    final bool isSelected = _selectedOrderStatus == qVal && _activeTab == 'orders';

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _activeTab = 'orders';
                          _selectedOrderStatus = qVal;
                        });
                      },
                      child: Column(
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFFE6F0ED) : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: isSelected ? const Color(0xFF006C49) : Colors.transparent),
                                ),
                                child: Icon(icon, size: 18, color: const Color(0xFF006C49)),
                              ),
                              if (count > 0)
                                Positioned(
                                  top: -4,
                                  right: -4,
                                  child: Container(
                                    padding: const EdgeInsets.all(3.5),
                                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                    child: Text(
                                      '$count',
                                      style: const TextStyle(color: Colors.white, fontSize: 7.5, fontWeight: FontWeight.w900),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            label,
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                              color: isSelected ? const Color(0xFF006C49) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 12),

              // 5. NỘI DUNG RENDER DỰA TRÊN TAB ĐANG CHỌN
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: _buildActiveTabContent(),
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabChip(String id, String label, IconData icon) {
    final bool isSelected = _activeTab == id;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = id),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF006C49) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xFF006C49) : Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Icon(icon, size: 13, color: isSelected ? Colors.white : Colors.black87),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveTabContent() {
    switch (_activeTab) {
      case 'profile':
        return TabHosoWidget(
          profile: _profile,
          onSaveProfile: _handleSaveProfile,
        );

      case 'orders':
        return TabDonhangWidget(
          orders: _ordersList,
          currentStatusQuery: _selectedOrderStatus,
          onCancelOrder: _handleCancelOrder,
          onReorder: _handleReorder,
          onRefresh: _fetchOrders,
        );

      case 'wallet':
        return TabVidemipayWidget(profile: _profile);

      case 'addresses':
        return TabDiachiWidget(
          addresses: _addresses,
          onRefresh: _fetchAddresses,
        );

      case 'vouchers':
        return TabVoucherWidget(profile: _profile);

      case 'favorites':
        return const TabDathichWidget();

      case 'security':
        return TabBaomatWidget(profile: _profile);

      case 'notifications':
        return TabThongbaoWidget(profile: _profile);

      default:
        return TabHosoWidget(
          profile: _profile,
          onSaveProfile: _handleSaveProfile,
        );
    }
  }
}