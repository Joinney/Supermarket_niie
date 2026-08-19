import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class PayPalButton extends StatefulWidget {
  final double amount;
  final Function(Map<String, dynamic> details) onSuccess;
  final VoidCallback onError;

  const PayPalButton({
    super.key,
    required this.amount,
    required this.onSuccess,
    required this.onError,
  });

  @override
  State<PayPalButton> createState() => _PayPalButtonState();
}

class _PayPalButtonState extends State<PayPalButton> {
  bool _isLoading = false;

  double get _amountInUSD => widget.amount / 25000;

  Future<void> _handlePayPalPayment() async {
    if (widget.amount <= 0) return;

    setState(() => _isLoading = true);

    try {
      final String amountStr = _amountInUSD.toStringAsFixed(2);
      debugPrint('🚀 Khởi tạo thanh toán PayPal với số tiền: \$$amountStr USD');

      final Uri paypalUri = Uri.parse(
        'https://www.sandbox.paypal.com/checkoutnow?token=mock_paypal_token&amount=$amountStr',
      );

      if (await canLaunchUrl(paypalUri)) {
        await launchUrl(paypalUri, mode: LaunchMode.externalApplication);

        final mockPayPalDetails = {
          'id': 'PAYPAL_${DateTime.now().millisecondsSinceEpoch}',
          'status': 'COMPLETED',
          'intent': 'CAPTURE',
          'purchase_units': [
            {
              'description': 'Thanh toán hóa đơn mua sắm tại Supermarket',
              'amount': {
                'currency_code': 'USD',
                'value': amountStr,
              },
              'payments': {
                'captures': [
                  {
                    'id': 'CAP_${DateTime.now().millisecondsSinceEpoch}',
                    'status': 'COMPLETED',
                  }
                ]
              }
            }
          ]
        };

        widget.onSuccess(mockPayPalDetails);
      } else {
        widget.onError();
      }
    } catch (e) {
      debugPrint('❌ Lỗi xử lý PayPal Button: $e');
      widget.onError();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isBtnDisabled = widget.amount <= 0 || _isLoading;

    return SizedBox(
      width: double.infinity,
      height: 44,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: isBtnDisabled ? Colors.grey.shade300 : const Color(0xFFFFC439),
          disabledBackgroundColor: Colors.grey.shade300,
          elevation: isBtnDisabled ? 0 : 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: isBtnDisabled ? null : _handlePayPalPayment,
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: Color(0xFF003087), strokeWidth: 2),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  RichText(
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: 'Pay',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: Color(0xFF003087),
                          ),
                        ),
                        TextSpan(
                          text: 'Pal',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: Color(0xFF0079C1),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '(\$${_amountInUSD.toStringAsFixed(2)} USD)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isBtnDisabled ? Colors.grey.shade600 : const Color(0xFF003087),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}