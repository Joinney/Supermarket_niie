import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';
import 'package:app/screens/profile/tabdonhang/modal_chitiet_donhang.dart';
import 'package:app/screens/profile/tabdonhang/modal_lotrinh.dart';

class OrderStepItem {
  final String id;
  final String label;
  final IconData icon;
  final List<String> matchStatuses;

  const OrderStepItem({
    required this.id,
    required this.label,
    required this.icon,
    required this.matchStatuses,
  });
}

const List<OrderStepItem> _orderStepsConfig = [
  OrderStepItem(
    id: "step_init",
    label: "Xác nhận",
    icon: Icons.assignment_turned_in_outlined,
    matchStatuses: ["chờ xác nhận", "xác nhận", "pending", "chờ xử lý"],
  ),
  OrderStepItem(
    id: "step_pack",
    label: "Lấy hàng",
    icon: Icons.inventory_2_outlined,
    matchStatuses: ["lấy hàng", "đang xử lý"],
  ),
  OrderStepItem(
    id: "step_delivery",
    label: "Đang giao",
    icon: Icons.two_wheeler_outlined,
    matchStatuses: ["đang giao"],
  ),
  OrderStepItem(
    id: "step_done",
    label: "Đã giao",
    icon: Icons.home_outlined,
    matchStatuses: ["đã giao", "hoàn thành", "delivered"],
  ),
  OrderStepItem(
    id: "step_cancel",
    label: "Đã hủy",
    icon: Icons.cancel_outlined,
    matchStatuses: ["đã hủy", "cancelled"],
  ),
];

class TabDonhangWidget extends StatefulWidget {
  final List<dynamic> orders;
  final String currentStatusQuery;
  final Function(dynamic order)? onCancelOrder;
  final Function(dynamic order)? onReorder;
  final VoidCallback onRefresh;

  const TabDonhangWidget({
    super.key,
    required this.orders,
    required this.currentStatusQuery,
    this.onCancelOrder,
    this.onReorder,
    required this.onRefresh,
  });

  @override
  State<TabDonhangWidget> createState() => _TabDonhangWidgetState();
}

class _TabDonhangWidgetState extends State<TabDonhangWidget> {
  final Map<String, bool> _expandedOrders = {};
  final Set<String> _reviewedOrderIds = {};

  int _currentPage = 1;
  int _itemsPerPage = 5;

  final NumberFormat _currencyFormat =
      NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _checkReviewStatuses();
  }

  @override
  void didUpdateWidget(covariant TabDonhangWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentStatusQuery != widget.currentStatusQuery) {
      setState(() => _currentPage = 1);
    }
    if (oldWidget.orders != widget.orders) {
      _checkReviewStatuses();
    }
  }

  Future<void> _checkReviewStatuses() async {
    final deliveredOrders = widget.orders.where((o) {
      final status =
          (o['trang_thai_don_hang'] ?? '').toString().trim().toLowerCase();
      return status == "đã giao" || status == "hoàn thành";
    });

    for (final order in deliveredOrders) {
      final orderIdStr =
          (order['id'] ?? order['ma_don_hang'] ?? '').toString();
      if (orderIdStr.isNotEmpty && !_reviewedOrderIds.contains(orderIdStr)) {
        try {
          final res = await productApi.get('/orders/$orderIdStr/check-review');
          if (mounted &&
              res.data != null &&
              res.data['success'] == true &&
              res.data['hasReviewed'] == true) {
            setState(() {
              _reviewedOrderIds.add(orderIdStr);
            });
          }
        } catch (_) {}
      }
    }
  }

  double _parseNumber(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final clean = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }

  void _openDetailModal(Map<String, dynamic> order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ModalChiTietDonHang(order: order),
    );
  }

  void _openRouteModal(Map<String, dynamic> order) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ModalLoTrinh(order: order),
      ),
    );
  }

  List<Map<String, dynamic>> _groupOrderItems(List<dynamic> rawItems) {
    final Map<String, Map<String, dynamic>> grouped = {};

    for (final item in rawItems) {
      final key = (item['ma_san_pham'] ??
              item['product_name'] ??
              item['name'] ??
              'unknown')
          .toString();

      if (!grouped.containsKey(key)) {
        grouped[key] = {
          'product_name': item['product_name'] ??
              item['name'] ??
              'Kiện hàng Demi Mart',
          'image_url': item['hinh_anh_chinh'] ??
              item['image_url'] ??
              item['hinh_anh'] ??
              '',
          'variants': <Map<String, dynamic>>[],
        };
      }

      (grouped[key]!['variants'] as List<Map<String, dynamic>>).add({
        'name': item['variant_name'] ?? 'Mặc định',
        'qty': _parseNumber(item['quantity'] ?? item['qty'] ?? 1).toInt(),
      });
    }

    return grouped.values.toList();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.orders.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: const Column(
          children: [
            Icon(Icons.inventory_2_outlined, size: 40, color: Colors.grey),
            SizedBox(height: 10),
            Text(
              'Bạn chưa có đơn hàng mua sắm nào.',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey),
            ),
          ],
        ),
      );
    }

    final activeStepConfig = _orderStepsConfig.firstWhere(
      (step) =>
          step.id == widget.currentStatusQuery ||
          step.label == widget.currentStatusQuery,
      orElse: () => _orderStepsConfig[0],
    );

    final filteredOrders = widget.orders.where((order) {
      final normalized =
          (order['trang_thai_don_hang'] ?? '').toString().trim().toLowerCase();
      return activeStepConfig.matchStatuses.contains(normalized);
    }).toList();

    if (filteredOrders.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Column(
          children: [
            const Icon(Icons.inventory_2_outlined, size: 40, color: Colors.grey),
            const SizedBox(height: 10),
            Text(
              'Không có đơn hàng nào thuộc trạng thái "${activeStepConfig.label}".',
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey),
            ),
          ],
        ),
      );
    }

    final totalPages = max(1, (filteredOrders.length / _itemsPerPage).ceil());
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    final endIndex = min(startIndex + _itemsPerPage, filteredOrders.length);
    final currentOrdersOnPage = filteredOrders.sublist(startIndex, endIndex);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'LỊCH SỬ GIAO DỊCH VẬN ĐƠN',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: Color(0xFF161B22),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${activeStepConfig.label}: ${filteredOrders.length} ĐƠN',
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
          itemCount: currentOrdersOnPage.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final order =
                Map<String, dynamic>.from(currentOrdersOnPage[index]);
            final orderIdStr =
                (order['ma_don_hang'] ?? order['id'] ?? '').toString();
            final String statusText =
                order['trang_thai_don_hang'] ?? 'Chờ xác nhận';
            final String normalizedStatus = statusText.trim().toLowerCase();

            final bool isCancelled =
                normalizedStatus == "đã hủy" || normalizedStatus == "cancelled";
            final bool isPendingCancel = normalizedStatus == "chờ xác nhận" ||
                normalizedStatus == "pending" ||
                normalizedStatus == "chờ xử lý";
            final bool isConfirmed =
                normalizedStatus == "xác nhận" || normalizedStatus == "confirmed";
            final bool isDelivered = normalizedStatus == "đã giao" ||
                normalizedStatus == "hoàn thành" ||
                normalizedStatus == "delivered";
            final bool isShipping = normalizedStatus == "đang giao";

            final double totalPayment = _parseNumber(
                order['tong_thanh_toan'] ?? order['tong_tien']);
            final String carrier =
                order['don_vi_van_chuyen'] ?? 'Siêu thị Demi';

            final List<dynamic> rawItems = order['danh_sach_san_pham'] ??
                order['items'] ??
                order['products'] ??
                [];
            final groupedItems = _groupOrderItems(rawItems);
            final firstGroup = groupedItems.isNotEmpty ? groupedItems[0] : null;
            final isExpanded = _expandedOrders[orderIdStr] == true;

            final progressSteps = _orderStepsConfig
                .where((s) => s.id != "step_cancel")
                .toList();
            final currentStepIndex = progressSteps.indexWhere(
              (step) => step.matchStatuses.contains(normalizedStatus),
            );

            return Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isCancelled ? const Color(0xFFFEF2F2) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isCancelled
                      ? const Color(0xFFFEE2E2)
                      : const Color(0xFFF1F5F9),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Header Card
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'MÃ ĐƠN: #$orderIdStr',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF161B22),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Đặt lúc: ${order['ngay_tao'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.tryParse(order['ngay_tao']) ?? DateTime.now()) : 'Vừa xong'}',
                            style: const TextStyle(
                                fontSize: 10, color: Colors.grey),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isCancelled
                              ? const Color(0xFFFEE2E2)
                              : const Color(0xFFE6F0ED),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isCancelled
                                ? const Color(0xFFFECACA)
                                : const Color(0xFFD6EDE4),
                          ),
                        ),
                        child: Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: isCancelled
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF006C49),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 18),

                  // 2. Sản phẩm hiển thị
                  if (firstGroup != null) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            firstGroup['image_url'] ??
                                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150',
                            width: 52,
                            height: 52,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 52,
                              height: 52,
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.shopping_bag_outlined,
                                  color: Colors.grey),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                firstGroup['product_name'] ?? 'Sản phẩm',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Phân loại: ${(firstGroup['variants'] as List).map((v) => "${v['name']} • x${v['qty']}").join(', ')}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 10, color: Colors.grey),
                              ),
                              if (groupedItems.length > 1) ...[
                                const SizedBox(height: 4),
                                GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _expandedOrders[orderIdStr] =
                                          !isExpanded;
                                    });
                                  },
                                  child: Row(
                                    children: [
                                      Text(
                                        isExpanded
                                            ? 'Thu gọn'
                                            : 'Xem thêm ${groupedItems.length - 1} sản phẩm khác',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF006C49),
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                      Icon(
                                        isExpanded
                                            ? Icons.keyboard_arrow_up_rounded
                                            : Icons.keyboard_arrow_down_rounded,
                                        size: 14,
                                        color: const Color(0xFF006C49),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Tổng tiền',
                                style:
                                    TextStyle(fontSize: 10, color: Colors.grey)),
                            const SizedBox(height: 2),
                            Text(
                              _currencyFormat.format(totalPayment),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF006C49),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],

                  // 3. Danh sách sản phẩm mở rộng khi bấm xem thêm
                  if (isExpanded && groupedItems.length > 1) ...[
                    const SizedBox(height: 8),
                    const Divider(height: 12),
                    ...groupedItems.sublist(1).map((group) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                group['image_url'] ?? '',
                                width: 38,
                                height: 38,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                    width: 38,
                                    height: 38,
                                    color: Colors.grey.shade100),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    group['product_name'] ?? '',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    'Phân loại: ${(group['variants'] as List).map((v) => "${v['name']} • x${v['qty']}").join(', ')}',
                                    style: const TextStyle(
                                        fontSize: 9, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],

                  // 4. Stepper Progress
                  if (!isCancelled) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 10, horizontal: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: List.generate(progressSteps.length, (idx) {
                          final step = progressSteps[idx];
                          final bool isVisited =
                              currentStepIndex >= 0 && idx <= currentStepIndex;

                          String stepLabel = step.label;
                          if (step.id == "step_init") {
                            stepLabel = (normalizedStatus == "xác nhận")
                                ? "Xác nhận"
                                : "Chờ xác nhận";
                          }

                          return Expanded(
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    children: [
                                      Container(
                                        width: 26,
                                        height: 26,
                                        decoration: BoxDecoration(
                                          color: isVisited
                                              ? const Color(0xFFFF6B00)
                                              : const Color(0xFFE2E8F0),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: Icon(
                                          step.icon,
                                          size: 13,
                                          color: isVisited
                                              ? Colors.white
                                              : Colors.grey,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        stepLabel,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontSize: 8,
                                          fontWeight: FontWeight.bold,
                                          color: isVisited
                                              ? const Color(0xFFD97706)
                                              : Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (idx < progressSteps.length - 1)
                                  Container(
                                    width: 16,
                                    height: 2,
                                    color: (currentStepIndex >= 0 &&
                                            idx < currentStepIndex)
                                        ? const Color(0xFFFF6B00)
                                        : const Color(0xFFE2E8F0),
                                  ),
                              ],
                            ),
                          );
                        }),
                      ),
                    ),
                  ],

                  const Divider(height: 18),

                  // 5. Footer hành động
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '🚀 Giao bởi: $carrier',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Nút Hủy đơn khi Chờ xác nhận
                      if (isPendingCancel && !isCancelled)
                        OutlinedButton(
                          onPressed: () => widget.onCancelOrder?.call(order),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFFCA5A5)),
                            backgroundColor: const Color(0xFFFEF2F2),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('Hủy đơn hàng',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFFDC2626))),
                        ),

                      // Đã xác nhận -> Không cho hủy
                      if (isConfirmed)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('Hủy đơn hàng',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey)),
                        ),

                      // Đang giao -> Theo dõi lộ trình
                      if (isShipping)
                        ElevatedButton.icon(
                          onPressed: () => _openRouteModal(order),
                          icon: const Icon(Icons.location_on_outlined, size: 12),
                          label: const Text('Theo dõi lộ trình',
                              style: TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.w900)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE6F0ED),
                            foregroundColor: const Color(0xFF006C49),
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                        ),

                      // Đã giao -> Xem chi tiết + Đánh giá
                      if (isDelivered) ...[
                        OutlinedButton.icon(
                          onPressed: () => _openDetailModal(order),
                          icon: const Icon(Icons.receipt_long_rounded, size: 12),
                          label: const Text('Chi tiết',
                              style: TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF334155),
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 5),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                        const SizedBox(width: 6),
                        if (_reviewedOrderIds.contains(orderIdStr))
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE6F0ED),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.star_rounded,
                                    size: 12, color: Color(0xFF006C49)),
                                SizedBox(width: 2),
                                Text('Đã đánh giá',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF006C49))),
                              ],
                            ),
                          )
                        else
                          ElevatedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('Mở biểu mẫu đánh giá...')),
                              );
                            },
                            icon: const Icon(Icons.star_outline_rounded,
                                size: 12),
                            label: const Text('Đánh giá',
                                style: TextStyle(
                                    fontSize: 10, fontWeight: FontWeight.w900)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFEF3C7),
                              foregroundColor: const Color(0xFFD97706),
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                      ],

                      // Đã hủy -> Mua lại
                      if (isCancelled)
                        ElevatedButton(
                          onPressed: () => widget.onReorder?.call(order),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF006C49),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('Mua lại',
                              style: TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.w900)),
                        ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),

        // 6. Phân trang
        if (filteredOrders.length > _itemsPerPage) ...[
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
                      DropdownMenuItem(value: 5, child: Text('5 đơn')),
                      DropdownMenuItem(value: 10, child: Text('10 đơn')),
                      DropdownMenuItem(value: 20, child: Text('20 đơn')),
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