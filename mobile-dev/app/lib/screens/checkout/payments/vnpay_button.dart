import 'package:flutter/material.dart';

class VNPAYButton extends StatelessWidget {
  final double amount;
  final VoidCallback onClick;
  final bool disabled;

  const VNPAYButton({
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
          backgroundColor: isBtnDisabled ? Colors.grey.shade300 : const Color(0xFF005BAA),
          disabledBackgroundColor: Colors.grey.shade300,
          elevation: isBtnDisabled ? 0 : 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: isBtnDisabled ? null : onClick,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo VNPAY
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Opacity(
                opacity: isBtnDisabled ? 0.4 : 1.0,
                child: Image.network(
                  'https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo.svg',
                  height: 20,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Text(
                    'VNPAY',
                    style: TextStyle(
                      color: Color(0xFF005BAA),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            // Label
            Text(
              'Thanh toán qua VNPAY',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: isBtnDisabled ? Colors.grey.shade600 : Colors.white,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}