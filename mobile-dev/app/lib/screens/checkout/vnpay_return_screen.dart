import 'package:flutter/material.dart';
import 'package:app/api/api_client.dart';

class VnpayReturnScreen extends StatefulWidget {
  final Map<String, String> queryParameters;

  const VnpayReturnScreen({
    super.key,
    required this.queryParameters,
  });

  @override
  State<VnpayReturnScreen> createState() => _VnpayReturnScreenState();
}

class _VnpayReturnScreenState extends State<VnpayReturnScreen> {
  bool _isProcessing = true;
  bool _isSuccess = false;
  String _message = 'Đang đối soát kết quả giao dịch từ ngân hàng VNPay...';

  // Chặn việc gọi API bị lặp trùng 2 lần
  bool _hasCalledApi = false;

  @override
  void initState() {
    super.initState();
    _verifyTransaction();
  }

  Future<void> _verifyTransaction() async {
    if (_hasCalledApi) return;
    _hasCalledApi = true;

    try {
      // 1. Chuyển Map queryParameters thành chuỗi Query String
      final queryString = Uri(queryParameters: widget.queryParameters).query;

      // 2. Gửi tham số URL sang Backend đối soát chữ ký bảo mật
      final response = await paymentApi.get('/vnpay-return?$queryString');

      if (response.data != null && response.data['success'] == true) {
        if (mounted) {
          setState(() {
            _isProcessing = false;
            _isSuccess = true;
            _message = '🎉 Thanh toán VNPay thành công rực rỡ!';
          });

          // Tự động điều hướng về màn hình đơn hàng sau 2 giây
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              Navigator.popUntil(context, (route) => route.isFirst);
            }
          });
        }
      } else {
        throw Exception(response.data?['message'] ?? 'Thanh toán thất bại');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isSuccess = false;
          _message = '❌ Giao dịch thất bại hoặc chữ ký không hợp lệ!';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(12),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_isProcessing) ...[
                  const SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(
                      color: Color(0xFF006C49),
                      strokeWidth: 3,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF006C49),
                    ),
                  ),
                ] else ...[
                  Icon(
                    _isSuccess ? Icons.check_circle_rounded : Icons.cancel_rounded,
                    size: 64,
                    color: _isSuccess ? const Color(0xFF006C49) : Colors.redAccent,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _message,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: _isSuccess ? const Color(0xFF006C49) : Colors.redAccent,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isSuccess ? const Color(0xFF006C49) : Colors.slate,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.popUntil(context, (route) => route.isFirst);
                      },
                      child: Text(
                        _isSuccess ? 'XEM ĐƠN HÀNG' : 'QUAY LẠI TRANG CHỦ',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}