import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PaymentModal extends StatelessWidget {
  final bool isOpen;
  final VoidCallback onClose;
  final Function(String methodId) onSelect;
  final String selectedMethod;
  final double finalTotal;
  final double walletBalance;

  const PaymentModal({
    super.key,
    required this.isOpen,
    required this.onClose,
    required this.onSelect,
    required this.selectedMethod,
    this.finalTotal = 0,
    this.walletBalance = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (!isOpen) return const SizedBox.shrink();

    final NumberFormat currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');
    final bool isWalletEligible = walletBalance >= finalTotal && finalTotal > 0;

    // Danh sách phương thức thanh toán
    final List<Map<String, dynamic>> paymentMethods = [
      {
        'id': 'DemiPay',
        'name': 'Ví DemiPay',
        'description': isWalletEligible
            ? 'Thanh toán ngay bằng số dư ví. (Khả dụng: ${currencyFormat.format(walletBalance)})'
            : 'Số dư ví không đủ. (Khả dụng: ${currencyFormat.format(walletBalance)})',
        'iconWidget': const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFF006C49), size: 24),
        'activeBorder': const Color(0xFF006C49),
        'activeBg': const Color(0xFFE6F0ED),
        'textColor': const Color(0xFF006C49),
        'disabled': !isWalletEligible,
      },
      {
        'id': 'COD',
        'name': 'Thanh toán khi nhận hàng (COD)',
        'description': 'Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận kiện hàng.',
        'iconWidget': const Icon(Icons.local_shipping_outlined, color: Color(0xFF047857), size: 24),
        'activeBorder': const Color(0xFF10B981),
        'activeBg': const Color(0xFFD1FAE5),
        'textColor': const Color(0xFF065F46),
        'disabled': false,
      },
      {
        'id': 'PayPal',
        'name': 'PayPal System',
        'description': 'Thanh toán quốc tế an toàn tuyệt đối qua cổng giao dịch PayPal (USD).',
        'iconWidget': const Icon(Icons.payment_rounded, color: Color(0xFF003087), size: 24),
        'activeBorder': const Color(0xFF003087),
        'activeBg': const Color(0xFFE0E7FF),
        'textColor': const Color(0xFF003087),
        'disabled': false,
      },
      {
        'id': 'VNPay',
        'name': 'VNPay Cổng Chính',
        'description': 'Quét mã QR-Code ứng dụng ngân hàng hoặc thẻ ATM / Visa nội địa.',
        'iconWidget': Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('VN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF005BAA), height: 1.0)),
              Text('PAY', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFFE02020), height: 1.0)),
            ],
          ),
        ),
        'activeBorder': const Color(0xFF005BAA),
        'activeBg': const Color(0xFFE0F2FE),
        'textColor': const Color(0xFF005BAA),
        'disabled': false,
      },
      {
        'id': 'MoMo',
        'name': 'Ví Điện Tử MoMo',
        'description': 'Kết nối siêu tốc và bảo mật với ví điện tử số 1 Việt Nam.',
        'iconWidget': Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: const Color(0xFFA50064),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Center(
            child: Text('Mo', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
        'activeBorder': const Color(0xFFA50064),
        'activeBg': const Color(0xFFFCE7F3),
        'textColor': const Color(0xFFA50064),
        'disabled': false,
      },
      {
        'id': 'Banking',
        'name': 'Chuyển Khoản Ngân Hàng',
        'description': 'Tạo mã VietQR chuyển khoản nhanh liên ngân hàng 24/7.',
        'iconWidget': Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: const Color(0xFF1D4ED8)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('Viet', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF1D4ED8), height: 1.0)),
              Text('QR', style: TextStyle(fontSize: 7, fontWeight: FontWeight.w800, color: Color(0xFFEF4444), height: 1.0)),
            ],
          ),
        ),
        'activeBorder': const Color(0xFF1D4ED8),
        'activeBg': const Color(0xFFEEF2FF),
        'textColor': const Color(0xFF1D4ED8),
        'disabled': false,
      },
    ];

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(16),
        constraints: const BoxConstraints(maxHeight: 580, maxWidth: 420),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Modal
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.payment_rounded, size: 20, color: Color(0xFF006C49)),
                    SizedBox(width: 8),
                    Text(
                      'PHƯƠNG THỨC THANH TOÁN',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF006C49),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20, color: Colors.grey),
                  onPressed: onClose,
                ),
              ],
            ),
            const Divider(height: 16),

            // Danh sách lựa chọn
            Expanded(
              child: ListView.separated(
                itemCount: paymentMethods.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final method = paymentMethods[index];
                  final String id = method['id'];
                  final bool isSelected = selectedMethod == id;
                  final bool isDisabled = method['disabled'] == true;

                  final Color activeBorder = method['activeBorder'];
                  final Color activeBg = method['activeBg'];
                  final Color textColor = method['textColor'];

                  return InkWell(
                    onTap: isDisabled
                        ? null
                        : () {
                            onSelect(id);
                            onClose();
                          },
                    borderRadius: BorderRadius.circular(12),
                    child: Opacity(
                      opacity: isDisabled ? 0.5 : 1.0,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDisabled
                              ? Colors.grey.shade100
                              : (isSelected ? activeBg : const Color(0xFFFAFBFC)),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected && !isDisabled ? activeBorder : const Color(0xFFE2E8F0),
                            width: isSelected && !isDisabled ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Icon Box
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Center(child: method['iconWidget']),
                            ),
                            const SizedBox(width: 12),

                            // Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        method['name'],
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                          color: isDisabled
                                              ? Colors.grey.shade500
                                              : (isSelected ? textColor : const Color(0xFF1E293B)),
                                        ),
                                      ),
                                      if (isSelected && !isDisabled)
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: BoxDecoration(
                                            color: activeBorder,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    method['description'],
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: isDisabled ? Colors.red.shade400 : const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),

            // Nút đóng
            SizedBox(
              width: double.infinity,
              height: 40,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey.shade200,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: onClose,
                child: const Text(
                  'ĐÓNG LAỊ',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}