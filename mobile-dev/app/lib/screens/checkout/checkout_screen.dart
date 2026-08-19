import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:app/api/api_client.dart';
import 'package:app/screens/checkout/widgets/address_modal.dart';
import 'package:app/screens/checkout/widgets/shipping_modal.dart';
import 'package:app/screens/checkout/widgets/payment_modal.dart';
import 'package:app/screens/checkout/payments/cod_button.dart';
import 'package:app/screens/checkout/payments/vnpay_button.dart';
import 'package:app/screens/checkout/payments/vietqr_button.dart';
import 'package:app/screens/checkout/payments/paypal_button.dart';

class CheckoutScreen extends StatefulWidget {
  final List<dynamic> selectedCartItems;

  const CheckoutScreen({
    super.key,
    required this.selectedCartItems,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  // State địa chỉ
  Map<String, dynamic>? _selectedAddress;
  List<dynamic> _addresses = [];
  bool _isLoadingAddress = true;
  bool _isAddressModalOpen = false;

  // State vận chuyển
  List<dynamic> _shippingMethods = [];
  Map<String, dynamic>? _selectedShipping;
  bool _isShippingModalOpen = false;
  double _shippingFee = 0.0;
  String _shippingTimeText = '';
  String _storeName = '';
  double _distanceKm = 0.0;
  int _estimatedMinutes = 0;
  bool _isLoadingShipping = false;

  // State phương thức thanh toán
  String _selectedPaymentMethod = 'COD';
  bool _isPaymentModalOpen = false;

  // State Voucher & Demi Xu
  String _couponCodeInput = '';
  Map<String, dynamic>? _appliedCoupon;
  String _couponMessage = '';
  bool _isCouponError = false;
  bool _isValidatingCoupon = false;
  bool _showVoucherModal = false;
  List<dynamic> _availableVouchers = [];
  bool _isLoadingVouchers = false;

  // Ví & Tiền tích lũy
  double _walletBalance = 0.0;
  int _loyaltyPoints = 0;
  bool _usePoints = false;

  bool _isPlacingOrder = false;

  @override
  void initState() {
    super.initState();
    _fetchUserData();
    _fetchAddresses();
  }

  // --- 1. LẤY DỮ LIỆU TÀI CHÍNH NGƯỜI DÙNG ---
  Future<void> _fetchUserData() async {
    try {
      final profileRes = await authApi.get('/profile/hoso');
      if (profileRes.data != null && profileRes.data['success'] == true) {
        setState(() {
          _walletBalance = (profileRes.data['data']['wallet_balance'] ?? 0).toDouble();
        });
      }

      final pointRes = await authApi.get('/auth/loyalty/balance');
      if (pointRes.data != null && pointRes.data['success'] == true) {
        setState(() {
          _loyaltyPoints = pointRes.data['data']['availablePoints'] ?? 0;
        });
      }
    } catch (e) {
      debugPrint('Lỗi nạp thông tin tài chính: $e');
    }
  }

  // --- 2. LẤY DANH SÁCH ĐỊA CHỈ ---
  Future<void> _fetchAddresses() async {
    setState(() => _isLoadingAddress = true);
    try {
      final res = await authApi.get('/addresses');
      final List<dynamic> data = res.data['data'] ?? res.data ?? [];
      setState(() {
        _addresses = data;
        _selectedAddress = data.firstWhere(
          (a) => a['is_default'] == true || a['is_default'] == 1,
          orElse: () => data.isNotEmpty ? data.first : null,
        );
      });
      if (_selectedAddress != null) {
        _calcDistanceShipping(_selectedAddress!);
      }
    } catch (e) {
      debugPrint('Lỗi nạp danh sách địa chỉ: $e');
    } finally {
      if (mounted) setState(() => _isLoadingAddress = false);
    }
  }

  // --- 3. TÍNH PHÍ VẬN CHUYỂN THEO TỌA ĐỘ ---
  Future<void> _calcDistanceShipping(Map<String, dynamic> addr) async {
    final lat = addr['latitude'];
    final lng = addr['longitude'];
    if (lat == null || lng == null) return;

    setState(() => _isLoadingShipping = true);
    try {
      final response = await orderApi.post('/orders/shipping/calc', data: {
        'userLat': lat,
        'userLng': lng,
      });

      if (response.data != null && response.data['success'] == true) {
        final data = response.data['data'];
        final fee = (data['shippingFee'] ?? 0).toDouble();
        final minutes = data['estimatedMinutes'] ?? 0;
        final dist = (data['distanceKm'] ?? 0).toDouble();
        final store = data['nearestStore']?['name'] ?? 'Siêu thị DemiMart';
        final timeStr = '$minutes phút (${dist}km)';

        final demiExpressOption = {
          'id': 'demi-store-express',
          'name': '🚀 Giao từ: $store',
          'cost': fee,
          'days': 'Dự kiến nhận sau $timeStr',
          'logo': '',
        };

        setState(() {
          _shippingFee = fee;
          _shippingTimeText = timeStr;
          _storeName = store;
          _distanceKm = dist;
          _estimatedMinutes = minutes;
          _shippingMethods = [demiExpressOption];
          _selectedShipping = demiExpressOption;
        });
      }
    } catch (e) {
      debugPrint('Lỗi tính phí vận chuyển: $e');
    } finally {
      if (mounted) setState(() => _isLoadingShipping = false);
    }
  }

  // --- TÍNH TOÁN HÓA ĐƠN ---
  double get _itemTotal {
    double total = 0.0;
    for (var item in widget.selectedCartItems) {
      final price = (item['price'] ?? 0).toDouble();
      final qty = (item['quantity'] ?? 1) as int;
      total += price * qty;
    }
    return total;
  }

  double get _discountAmount => (_appliedCoupon?['discount_amount'] ?? 0).toDouble();

  double get _totalBeforePoints {
    final sub = _itemTotal + _shippingFee - _discountAmount;
    return sub < 0 ? 0 : sub;
  }

  double get _maxPointsToUse {
    final pts = _loyaltyPoints.toDouble();
    return pts < _totalBeforePoints ? pts : _totalBeforePoints;
  }

  double get _finalTotal => _usePoints ? _totalBeforePoints - _maxPointsToUse : _totalBeforePoints;

  // --- ÁP DỤNG MÃ GIẢM GIÁ ---
  Future<void> _handleApplyCoupon(String code) async {
    if (code.trim().isEmpty) return;
    setState(() => _isValidatingCoupon = true);

    try {
      final res = await couponApi.post('/validate', data: {
        'code': code.trim(),
        'order_amount': _itemTotal,
      });

      if (res.data != null && res.data['success'] == true) {
        setState(() {
          _appliedCoupon = res.data['data'];
          _couponMessage = res.data['message'] ?? 'Áp dụng mã thành công!';
          _isCouponError = false;
          _showVoucherModal = false;
        });
      }
    } catch (e) {
      setState(() {
        _appliedCoupon = null;
        _couponMessage = 'Mã không hợp lệ hoặc đã hết hạn';
        _isCouponError = true;
      });
    } finally {
      if (mounted) setState(() => _isValidatingCoupon = false);
    }
  }

  // --- THỰC THI TẠO ĐƠN HÀNG ---
  Future<dynamic> _executePlaceOrder([Map<String, dynamic> extraPaymentInfo = const {}]) async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn địa chỉ giao hàng!')),
      );
      return false;
    }

    final targetAddressId = _selectedAddress!['address_id'] ?? _selectedAddress!['id'];

    final orderData = {
      'address_id': targetAddressId != null ? int.tryParse(targetAddressId.toString()) : null,
      'thong_tin_giao_hang': {
        'ten_nguoi_nhan': _selectedAddress!['receiver_name'] ?? _selectedAddress!['receiverName'] ?? 'Khách hàng',
        'so_dien_thoai': _selectedAddress!['receiver_phone'] ?? _selectedAddress!['receiverPhone'] ?? '0123456789',
        'dia_chi_day_du': '${_selectedAddress!['detail_address'] ?? ''}, ${_selectedAddress!['ward_name'] ?? ''}, ${_selectedAddress!['district_name'] ?? ''}, ${_selectedAddress!['province_name'] ?? ''}',
      },
      'to_district_id': int.tryParse((_selectedAddress!['district_id'] ?? 1454).toString()),
      'to_ward_code': (_selectedAddress!['ward_code'] ?? _selectedAddress!['ward_id'] ?? "21211").toString(),
      'weight': 1000,
      'danh_sach_san_pham': widget.selectedCartItems.map((item) {
        final vId = (item['variant_id'] ?? item['variantId'] ?? '').toString();
        return {
          'variant_id': vId,
          'sku': (item['sku'] ?? vId).toString(),
          'quantity': item['quantity'],
          'price': item['price'],
          'name': item['name'] ?? 'Sản phẩm',
          'variant_name': item['variantName'] ?? item['variant_name'] ?? '',
          'image_url': item['image_url'] ?? item['image'] ?? '',
          'ma_san_pham': (item['ma_san_pham'] ?? item['productId'] ?? '').toString(),
        };
      }).toList(),
      'don_vi_van_chuyen': _storeName.isNotEmpty ? 'Siêu thị $_storeName' : 'Siêu thị DemiMart Express',
      'to_lat': _selectedAddress!['latitude'],
      'to_lng': _selectedAddress!['longitude'],
      'tong_khoang_cach_km': _distanceKm,
      'thoi_gian_du_kien_phut': _estimatedMinutes,
      'tong_thoi_gian_du_kien_phut': _estimatedMinutes,
      'tong_tien_hang': _itemTotal,
      'phi_van_chuyen': _shippingFee,
      'so_tien_giam_gia': _discountAmount,
      'coupon_code': _appliedCoupon?['code'],
      'points_used': _usePoints ? _maxPointsToUse.toInt() : 0,
      'tong_thanh_toan': _finalTotal,
      'phuong_thuc_thanh_toan': _selectedPaymentMethod,
      ...extraPaymentInfo,
    };

    try {
      final result = await orderApi.post('/orders/place-order', data: orderData);
      if (result.data != null && result.data['success'] == true) {
        return result.data['ma_don_hang'] ?? result.data['data']?['ma_don_hang'];
      }
    } catch (e) {
      debugPrint('Lỗi đặt hàng: $e');
    }
    return false;
  }

  // --- XỬ LÝ THANH TOÁN COD ---
  Future<void> _handlePlaceOrderCOD() async {
    setState(() => _isPlacingOrder = true);
    final orderId = await _executePlaceOrder();
    if (orderId != false && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🎉 Đặt hàng thành công! Mã đơn: $orderId'),
          backgroundColor: const Color(0xFF006C49),
        ),
      );
      Navigator.popUntil(context, (route) => route.isFirst);
    }
    if (mounted) setState(() => _isPlacingOrder = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Thanh toán đơn hàng', style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildAddressSection(),
            const SizedBox(height: 12),
            _buildCartItemsSection(),
            const SizedBox(height: 12),
            _buildShippingAndPerksSection(),
            const SizedBox(height: 12),
            _buildPaymentMethodSection(),
            const SizedBox(height: 16),
            _buildOrderSummarySection(),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomSheet: _buildModals(),
    );
  }

  Widget _buildAddressSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: const Border(left: BorderSide(color: Color(0xFF006C49), width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.location_on, size: 18, color: Color(0xFF006C49)),
                  SizedBox(width: 6),
                  Text('ĐỊA CHỈ NHẬN HÀNG', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF006C49))),
                ],
              ),
              TextButton(
                onPressed: () => setState(() => _isAddressModalOpen = true),
                child: const Text('Thay đổi', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_isLoadingAddress)
            const CircularProgressIndicator(color: Color(0xFF006C49))
          else if (_selectedAddress != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_selectedAddress!['receiver_name'] ?? 'Người nhận'} (${_selectedAddress!['receiver_phone'] ?? ''})',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_selectedAddress!['detail_address'] ?? ''}, ${_selectedAddress!['ward_name'] ?? ''}, ${_selectedAddress!['district_name'] ?? ''}, ${_selectedAddress!['province_name'] ?? ''}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
              ],
            )
          else
            const Text('Chưa chọn địa chỉ giao hàng', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildCartItemsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('KIỆN HÀNG SẢN PHẨM (${widget.selectedCartItems.length})', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
          const Divider(height: 20),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.selectedCartItems.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = widget.selectedCartItems[index];
              final price = (item['price'] ?? 0).toDouble();
              final qty = item['quantity'] ?? 1;

              return Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      item['image_url'] ?? item['image'] ?? '',
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
                        Text(item['name'] ?? 'Sản phẩm', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                        if (item['variantName'] != null)
                          Text('Phân loại: ${item['variantName']}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        Text('x$qty', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  Text(_currencyFormat.format(price * qty), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF006C49))),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildShippingAndPerksSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.local_shipping_outlined, size: 18, color: Color(0xFF006C49)),
                  SizedBox(width: 6),
                  Text('VẬN CHUYỂN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
                ],
              ),
              Text(_currencyFormat.format(_shippingFee), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          if (_storeName.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('🚀 Giao từ: $_storeName ($_shippingTimeText)', style: const TextStyle(fontSize: 11, color: Color(0xFF006C49), fontStyle: FontStyle.italic)),
            ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.confirmation_number_outlined, size: 18, color: Color(0xFF006C49)),
                  SizedBox(width: 6),
                  Text('MÃ GIẢM GIÁ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
                ],
              ),
              OutlinedButton(
                style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFF006C49))),
                onPressed: () => setState(() => _showVoucherModal = true),
                child: Text(_appliedCoupon != null ? _appliedCoupon!['code'] : 'Chọn mã', style: const TextStyle(fontSize: 11, color: Color(0xFF006C49))),
              ),
            ],
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.bolt, size: 18, color: Colors.amber),
                  const SizedBox(width: 6),
                  Text('DÙNG DEMI XU ($_loyaltyPoints Xu)', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
              Switch(
                value: _usePoints,
                activeColor: const Color(0xFF006C49),
                onChanged: _maxPointsToUse > 0 ? (v) => setState(() => _usePoints = v) : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: const [
              Icon(Icons.payment, size: 18, color: Color(0xFF006C49)),
              SizedBox(width: 6),
              Text('THANH TOÁN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
            ],
          ),
          TextButton(
            onPressed: () => setState(() => _isPaymentModalOpen = true),
            child: Text(_selectedPaymentMethod, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF006C49))),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderSummarySection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          _summaryRow('Tiền hàng', _itemTotal),
          _summaryRow('Phí ship', _shippingFee),
          if (_discountAmount > 0) _summaryRow('Giảm giá', -_discountAmount, isGreen: true),
          if (_usePoints && _maxPointsToUse > 0) _summaryRow('Dùng Xu', -_maxPointsToUse, isAmber: true),
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('TỔNG THANH TOÁN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              Text(_currencyFormat.format(_finalTotal), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF006C49))),
            ],
          ),
          const SizedBox(height: 16),
          if (_selectedPaymentMethod == 'COD')
            CODButton(amount: _finalTotal, onClick: _handlePlaceOrderCOD, disabled: _isPlacingOrder)
          else if (_selectedPaymentMethod == 'VNPay')
            VNPAYButton(amount: _finalTotal, onClick: () {}, disabled: _isPlacingOrder)
          else if (_selectedPaymentMethod == 'Banking' || _selectedPaymentMethod == 'VIETQR')
            VietQRButton(amount: _finalTotal, onClick: () {}, disabled: _isPlacingOrder)
          else if (_selectedPaymentMethod == 'PayPal')
            PayPalButton(amount: _finalTotal, onSuccess: (details) {}, onError: () {}),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, double amount, {bool isGreen = false, bool isAmber = false}) {
    Color col = Colors.black87;
    if (isGreen) col = const Color(0xFF006C49);
    if (isAmber) col = Colors.amber.shade900;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          Text(_currencyFormat.format(amount), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: col)),
        ],
      ),
    );
  }

  Widget? _buildModals() {
    if (_isAddressModalOpen) {
      return AddressModal(
        isOpen: _isAddressModalOpen,
        onClose: () => setState(() => _isAddressModalOpen = false),
        onSelect: (addr) {
          setState(() => _selectedAddress = addr);
          _calcDistanceShipping(addr);
        },
        currentAddresses: _addresses,
        selectedAddressId: _selectedAddress?['address_id'],
        onRefresh: _fetchAddresses,
      );
    }
    if (_isShippingModalOpen) {
      return ShippingModal(
        isOpen: _isShippingModalOpen,
        onClose: () => setState(() => _isShippingModalOpen = false),
        onSelect: (method) => setState(() => _selectedShipping = method),
        shippingMethods: _shippingMethods,
        selectedMethodId: _selectedShipping?['id'],
      );
    }
    if (_isPaymentModalOpen) {
      return PaymentModal(
        isOpen: _isPaymentModalOpen,
        onClose: () => setState(() => _isPaymentModalOpen = false),
        onSelect: (methodId) => setState(() => _selectedPaymentMethod = methodId),
        selectedMethod: _selectedPaymentMethod,
        finalTotal: _finalTotal,
        walletBalance: _walletBalance,
      );
    }
    return null;
  }
}