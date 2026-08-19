import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';

class ModalChiTietDonHang extends StatefulWidget {
  final Map<String, dynamic> order;

  const ModalChiTietDonHang({super.key, required this.order});

  @override
  State<ModalChiTietDonHang> createState() => _ModalChiTietDonHangState();
}

class _ModalChiTietDonHangState extends State<ModalChiTietDonHang> {
  bool _loading = true;
  String _liveUserAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  String _receiverName = "Khách hàng DemiMart";
  String _receiverPhone = "Chưa cập nhật SĐT";
  String _fullAddress = "Đang kết xuất địa chỉ đặt hàng từ hệ thống...";

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchOrderDetailedInfo();
  }

  double _parseNumber(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final clean = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }

  Future<void> _fetchOrderDetailedInfo() async {
    final order = widget.order;

    try {
      // 1. Luồng đồng bộ Avatar người dùng
      String targetAvatar = order['items']?['avatar_url'] ??
          order['user_info']?['avatar_url'] ??
          order['user_info']?['avatar'] ??
          order['user_info']?['image_url'] ??
          order['avatar_url'] ??
          '';

      final userId = order['user_id'];
      if (targetAvatar.isEmpty && userId != null) {
        try {
          final userRes = await authApi.get('/auth/internal/users/$userId');
          if (userRes.data != null) {
            targetAvatar = userRes.data['avatar_url'] ??
                userRes.data['avatar'] ??
                userRes.data['image_url'] ??
                '';
          }
        } catch (_) {}
      }

      if (targetAvatar.isNotEmpty) {
        _liveUserAvatar = targetAvatar;
      }

      // 2. Luồng đồng bộ địa chỉ giao hàng
      try {
        final addrRes = await authApi.get('/addresses');
        final List<dynamic> addrList = addrRes.data?['data'] ?? addrRes.data ?? [];
        if (addrList.isNotEmpty) {
          final toDistrictId = order['to_district_id']?.toString();

          final matched = addrList.firstWhere(
            (a) => toDistrictId != null && a['district_id']?.toString() == toDistrictId,
            orElse: () => addrList.firstWhere(
              (a) => a['is_default'] == true,
              orElse: () => addrList[0],
            ),
          );

          if (matched != null) {
            _receiverName = matched['receiver_name'] ?? _receiverName;
            _receiverPhone = matched['receiver_phone'] ?? _receiverPhone;
            _fullAddress =
                "${matched['detail_address'] ?? ''}, ${matched['ward_name'] ?? ''}, ${matched['district_name'] ?? ''}, ${matched['province_name'] ?? ''}";
          }
        }
      } catch (_) {}
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final String orderCode = (order['ma_don_hang'] ?? order['order_code'] ?? '---').toString();
    final String status = order['trang_thai_don_hang'] ?? 'Đã giao';
    final String paymentMethod = order['phuong_thuc_thanh_toan'] ?? 'Thẻ tín dụng / COD';
    final String carrier = order['don_vi_van_chuyen'] ?? 'Siêu thị DemiMart Express';
    final String createdAt = order['ngay_tao'] != null
        ? DateFormat('dd/MM/yyyy - HH:mm').format(DateTime.tryParse(order['ngay_tao']) ?? DateTime.now())
        : 'Vừa xong';

    final List<dynamic> items = order['danh_sach_san_pham'] ?? order['items'] ?? order['products'] ?? [];
    final double shippingCost = _parseNumber(order['phi_van_chuyen']);
    final double discountAmount = _parseNumber(order['so_tien_giam_gia']);
    final double totalPayment = _parseNumber(order['tong_thanh_toan'] ?? order['tong_tien']);

    double totalItemsPrice = 0.0;
    for (var item in items) {
      totalItemsPrice += _parseNumber(item['price']) * _parseNumber(item['quantity'] ?? item['qty'] ?? 1);
    }

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.88),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // 1. HEADER
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: const BoxDecoration(
              color: Color(0xFF006C49),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Row(
              children: [
                const Icon(Icons.tag_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CHI TIẾT ĐƠN HÀNG #$orderCode',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined, size: 10, color: Color(0xFFA7F3D0)),
                          const SizedBox(width: 4),
                          Text(
                            'Đặt lúc: $createdAt',
                            style: const TextStyle(color: Color(0xFFA7F3D0), fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // 2. BODY CONTENT
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF006C49)),
                  )
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Trạng thái & Thanh toán
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF4FAF7),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFD6EDE4)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('TRẠNG THÁI',
                                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey)),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: const Color(0xFFD6EDE4)),
                                      ),
                                      child: Text(
                                        status,
                                        style: const TextStyle(
                                            fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('THANH TOÁN',
                                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey)),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(Icons.credit_card, size: 14, color: Colors.grey),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            paymentMethod,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 14),

                        // Thông tin người nhận
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.person_outline, size: 14, color: Colors.grey),
                                  SizedBox(width: 6),
                                  Text(
                                    'THÔNG TIN NGƯỜI NHẬN',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                              const Divider(height: 16),
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 20,
                                    backgroundColor: const Color(0xFFE6F0ED),
                                    backgroundImage: NetworkImage(_liveUserAvatar),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Họ và tên', style: TextStyle(fontSize: 9, color: Colors.grey)),
                                        Text(_receiverName,
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      const Text('Điện thoại', style: TextStyle(fontSize: 9, color: Colors.grey)),
                                      Text(_receiverPhone,
                                          style: const TextStyle(
                                              fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Text(
                                  '📍 $_fullAddress',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 14),

                        // Danh sách sản phẩm mua
                        Text(
                          'DANH SÁCH SẢN PHẨM (${items.length})',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 8),
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: items.length,
                          separatorBuilder: (_, __) => const Divider(height: 16),
                          itemBuilder: (context, index) {
                            final item = items[index];
                            final int qty = _parseNumber(item['quantity'] ?? item['qty'] ?? 1).toInt();
                            final double price = _parseNumber(item['price']);
                            final String img = item['image_url'] ??
                                item['hinh_anh_chinh'] ??
                                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150';

                            return Row(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Image.network(
                                    img,
                                    width: 50,
                                    height: 50,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) =>
                                        Container(width: 50, height: 50, color: Colors.grey.shade100),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item['product_name'] ?? item['name'] ?? 'Sản phẩm Demi Mart',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Phân loại: ${item['variant_name'] ?? 'Mặc định'}',
                                        style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      _currencyFormat.format(price * qty),
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                                    ),
                                    Text(
                                      '${_currencyFormat.format(price)} x $qty',
                                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ],
                            );
                          },
                        ),

                        const SizedBox(height: 14),

                        // Đơn vị vận chuyển
                        Row(
                          children: [
                            const Icon(Icons.local_shipping_outlined, size: 16, color: Colors.grey),
                            const SizedBox(width: 6),
                            Text(
                              'Đơn vị vận chuyển: $carrier',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
          ),

          // 3. BILL BREAKDOWN
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Column(
              children: [
                _buildBillRow('Tiền hàng (${items.length} món)', _currencyFormat.format(totalItemsPrice)),
                const SizedBox(height: 4),
                _buildBillRow('Phí vận chuyển', '+ ${_currencyFormat.format(shippingCost)}'),
                if (discountAmount > 0) ...[
                  const SizedBox(height: 4),
                  _buildBillRow('Khuyến mãi giảm giá', '- ${_currencyFormat.format(discountAmount)}', isDiscount: true),
                ],
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Tổng thanh toán', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                    Text(
                      _currencyFormat.format(totalPayment),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(String label, String value, {bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
        Text(
          value,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isDiscount ? Colors.red : const Color(0xFF1E293B),
          ),
        ),
      ],
    );
  }
}