import 'package:flutter/material.dart';
import 'package:app/api/api_client.dart';

class TabBaomatWidget extends StatefulWidget {
  final Map<String, dynamic>? profile;

  const TabBaomatWidget({super.key, this.profile});

  @override
  State<TabBaomatWidget> createState() => _TabBaomatWidgetState();
}

class _TabBaomatWidgetState extends State<TabBaomatWidget> {
  // Các bước: "verify-password" | "forgot-password" | "otp-verify" | "reset-password"
  String _securityStep = "verify-password";

  final TextEditingController _currentPasswordController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmNewPasswordController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmNewPasswordController.dispose();
    super.dispose();
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

  // 1. Xác thực mật khẩu hiện tại
  Future<void> _handleVerifyCurrentPassword() async {
    final password = _currentPasswordController.text.trim();
    if (password.isEmpty) {
      _showToast('Vui lòng nhập mật khẩu hiện tại', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await authApi.post(
        '/profile/verify-password',
        data: {'password': password},
      );
      if (res.data != null && res.data['success'] == true) {
        _showToast('Xác thực danh tính thành công!');
        setState(() => _securityStep = "reset-password");
      } else {
        _showToast(res.data?['message'] ?? 'Mật khẩu không chính xác', isError: true);
      }
    } catch (err) {
      _showToast('Mật khẩu không chính xác hoặc lỗi hệ thống', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // 2. Bắn mã OTP về Email
  Future<void> _handleSendOTP() async {
    final email = widget.profile?['email'];
    if (email == null || email.toString().isEmpty) {
      _showToast('Không tìm thấy thông tin email tài khoản', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await authApi.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
      if (res.data != null && res.data['success'] == true) {
        _showToast('Mã OTP bảo mật đã được gửi về email!');
        setState(() => _securityStep = "otp-verify");
      } else {
        _showToast('Không thể gửi mã xác thực', isError: true);
      }
    } catch (_) {
      _showToast('Lỗi khi gửi mã xác thực về Email', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // 3. Xác thực mã OTP
  Future<void> _handleVerifyOTP() async {
    final email = widget.profile?['email'];
    final otp = _otpController.text.trim();

    if (otp.length != 6) {
      _showToast('Vui lòng nhập đủ 6 chữ số mã OTP', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await authApi.post(
        '/auth/verify-otp',
        data: {'email': email, 'otp': otp},
      );
      if (res.data != null && res.data['success'] == true) {
        _showToast('Mã OTP hợp lệ!');
        setState(() => _securityStep = "reset-password");
      } else {
        _showToast('Mã OTP không đúng hoặc đã hết hạn', isError: true);
      }
    } catch (_) {
      _showToast('Mã OTP không đúng hoặc đã hết hạn', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // 4. Lưu mật mã mới
  Future<void> _handleResetPassword() async {
    final newPass = _newPasswordController.text.trim();
    final confirmPass = _confirmNewPasswordController.text.trim();

    if (newPass.length < 6) {
      _showToast('Mật khẩu mới tối thiểu 6 ký tự', isError: true);
      return;
    }

    if (newPass != confirmPass) {
      _showToast('Mật khẩu xác nhận không khớp!', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      dynamic res;
      final otp = _otpController.text.trim();
      final email = widget.profile?['email'];

      if (otp.isNotEmpty && email != null) {
        res = await authApi.post(
          '/auth/reset-password',
          data: {
            'email': email,
            'otp': otp,
            'newPassword': newPass,
          },
        );
      } else {
        res = await authApi.put(
          '/profile/change-password',
          data: {'newPassword': newPass},
        );
      }

      if (res.data != null && res.data['success'] == true) {
        _showToast('Đổi mật khẩu bảo mật thành công!');
        setState(() {
          _securityStep = "verify-password";
          _currentPasswordController.clear();
          _otpController.clear();
          _newPasswordController.clear();
          _confirmNewPasswordController.clear();
        });
      } else {
        _showToast(res.data?['message'] ?? 'Lỗi cập nhật mật khẩu', isError: true);
      }
    } catch (_) {
      _showToast('Lỗi cập nhật cấu trúc mật khẩu', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = widget.profile?['email'] ?? '---';

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // TIÊU ĐỀ
          const Text(
            'BẢO MẬT TÀI KHOẢN',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
          ),
          const SizedBox(height: 4),
          const Text(
            'Quản lý cấu trúc mã khóa mật mã hệ thống',
            style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),

          // KHỐI CARD THỰC HIỆN TỪNG BƯỚC
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              children: [
                // 1. XÁC NHẬN MẬT KHẨU HIỆN TẠI
                if (_securityStep == "verify-password") ...[
                  Column(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE6F0ED),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.shield_outlined, size: 30, color: Color(0xFF006C49)),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Xác nhận danh tính',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Nhập mật khẩu hiện tại để tiếp tục thiết lập chuỗi bảo mật.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _currentPasswordController,
                        obscureText: true,
                        textAlign: TextAlign.center,
                        decoration: _inputDecoration('••••••••'),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleVerifyCurrentPassword,
                          style: _buttonStyle(),
                          child: _isLoading
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('TIẾP TỤC BƯỚC KẾ', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: () => setState(() => _securityStep = "forgot-password"),
                        child: const Text(
                          'Bạn quên mật khẩu bảo mật?',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF006C49)),
                        ),
                      ),
                    ],
                  ),
                ],

                // 2. QUÊN MẬT KHẨU (GỬI OTP)
                if (_securityStep == "forgot-password") ...[
                  Positioned(
                    top: 0,
                    left: 0,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.grey),
                      onPressed: () => setState(() => _securityStep = "verify-password"),
                    ),
                  ),
                  Column(
                    children: [
                      const SizedBox(height: 10),
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE6F0ED),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.mail_outline_rounded, size: 30, color: Color(0xFF006C49)),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Khôi phục mật mã',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 6),
                      Text.rich(
                        TextSpan(
                          text: 'Mã OTP bảo mật sẽ được gửi về hòm thư Email đăng ký:\n',
                          children: [
                            TextSpan(
                              text: email,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF161B22)),
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleSendOTP,
                          style: _buttonStyle(),
                          child: _isLoading
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('BẮN MÃ OTP VỀ EMAIL', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                        ),
                      ),
                    ],
                  ),
                ],

                // 3. NHẬP MÃ OTP
                if (_securityStep == "otp-verify") ...[
                  Positioned(
                    top: 0,
                    left: 0,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.grey),
                      onPressed: () => setState(() => _securityStep = "forgot-password"),
                    ),
                  ),
                  Column(
                    children: [
                      const SizedBox(height: 10),
                      const Text(
                        'Xác thực mã OTP',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Nhập mã xác thực 6 chữ số vừa nhận được',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: 200,
                        child: TextField(
                          controller: _otpController,
                          maxLength: 6,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 8),
                          decoration: _inputDecoration('').copyWith(counterText: ''),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleVerifyOTP,
                          style: _buttonStyle(),
                          child: _isLoading
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('XÁC THỰC TOKEN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                        ),
                      ),
                    ],
                  ),
                ],

                // 4. ĐẶT LẠI MẬT KHẨU MỚI
                if (_securityStep == "reset-password") ...[
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: Colors.grey),
                            onPressed: () => setState(() {
                              _securityStep = _otpController.text.isNotEmpty ? "otp-verify" : "verify-password";
                            }),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Đặt lại chuỗi khóa mật mã',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'MẬT KHẨU MỚI',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _newPasswordController,
                        obscureText: true,
                        decoration: _inputDecoration('Tối thiểu 6 ký tự'),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'NHẬP LẠI MẬT KHẨU',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _confirmNewPasswordController,
                        obscureText: true,
                        decoration: _inputDecoration('Xác nhận mã bảo mật'),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleResetPassword,
                          style: _buttonStyle(),
                          child: _isLoading
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('LƯU MẬT MÃ MỚI', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFF006C49), width: 1.5),
      ),
    );
  }

  ButtonStyle _buttonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF006C49),
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    );
  }
}