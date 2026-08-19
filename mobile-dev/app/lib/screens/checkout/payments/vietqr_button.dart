import 'package:flutter/material.dart';

class VietQRButton extends StatelessWidget {
  final double amount;
  final VoidCallback onClick;
  final bool disabled;

  const VietQRButton({
    super.key,
    required this.amount,
    required this.onClick,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool isBtnDisabled = disabled || amount <= 0;

    return Container(
      width: double.infinity,
      height: 44,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        gradient: isBtnDisabled
            ? null
            : const LinearGradient(
                colors: [
                  Color(0xFF1D4ED8), // blue-700
                  Color(0xFF2563EB), // blue-600
                  Color(0xFFEF4444), // red-500
                ],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
        color: isBtnDisabled ? Colors.grey.shade300 : null,
        boxShadow: isBtnDisabled
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withAlpha(25),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(4),
          onTap: isBtnDisabled ? null : onClick,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Khối logo VietQR nền trắng nổi bật
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Text(
                        'Viet',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF1D4ED8),
                          height: 1.0,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 1),
                      Text(
                        'QR',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFEF4444),
                          height: 1.0,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Text Nhãn nút
                Text(
                  'Thanh toán chuyển khoản nhanh',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: isBtnDisabled ? Colors.grey.shade600 : Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}