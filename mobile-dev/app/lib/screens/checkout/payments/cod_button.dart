import 'package:flutter/material.dart';

class CODButton extends StatelessWidget {
  final double amount;
  final VoidCallback onClick;
  final bool disabled;

  const CODButton({
    super.key,
    required this.amount,
    required this.onClick,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool isBtnDisabled = disabled || amount <= 0;

    return SizedBox(
      width: double.infinity,
      height: 44,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: isBtnDisabled ? Colors.grey.shade300 : const Color(0xFF10B981),
          disabledBackgroundColor: Colors.grey.shade300,
          elevation: isBtnDisabled ? 0 : 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: isBtnDisabled ? null : onClick,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon xe tải giao hàng
            Icon(
              Icons.local_shipping_rounded,
              size: 20,
              color: isBtnDisabled ? Colors.grey.shade500 : Colors.white,
            ),
            const SizedBox(width: 8),
            // Text Nhãn nút
            Text(
              'Thanh toán khi nhận hàng (COD)',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: isBtnDisabled ? Colors.grey.shade600 : Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}