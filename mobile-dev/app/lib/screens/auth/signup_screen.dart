import 'package:flutter/material.dart';
import 'package:app/api/api_client.dart';
import 'package:app/screens/auth/login_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _birthDateController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  String _gender = "Nam";
  bool _loading = false;
  String _errorMessage = '';

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _birthDateController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF006C49),
              onPrimary: Colors.white,
              onSurface: Color(0xFF161B22),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _birthDateController.text = "${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _handleSubmit() async {
    final fullName = _fullNameController.text.trim();
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final address = _addressController.text.trim();
    final birthDate = _birthDateController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (fullName.isEmpty || username.isEmpty || email.isEmpty || phone.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (password != confirmPassword) {
      setState(() => _errorMessage = 'Mật khẩu xác nhận không khớp!');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = '';
    });

    final payload = {
      'full_name': fullName,
      'username': username,
      'email': email,
      'phone': phone,
      'address': address,
      'gender': _gender,
      'birth_date': birthDate,
      'password': password,
    };

    try {
      final res = await authApi.post('/auth/signup', data: payload);

      if (res.data != null && (res.data['success'] == true || res.statusCode == 201)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎉 Chúc mừng bạn đã đăng ký tài khoản thành công!'),
              backgroundColor: Color(0xFF006C49),
              duration: Duration(seconds: 3),
            ),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      } else {
        setState(() {
          _errorMessage = res.data?['message'] ?? 'Đăng ký tài khoản không thành công.';
        });
      }
    } catch (err) {
      setState(() {
        _errorMessage = 'Lỗi kết nối máy chủ hoặc thông tin đã tồn tại.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF161B22), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'CREATE ACCOUNT',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF161B22),
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Trở thành thành viên của hệ thống siêu thị Demi Mart',
                    style: TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),

                  if (_errorMessage.isNotEmpty) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFEE2E2)),
                      ),
                      child: Text(
                        '⚠️ $_errorMessage',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Họ tên & Tên đăng nhập
                  Row(
                    children: [
                      Expanded(
                        child: _buildInputGroup(
                          label: 'HỌ VÀ TÊN',
                          child: TextField(
                            controller: _fullNameController,
                            decoration: _inputDecoration('Nguyễn Văn A', Icons.person_outline),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildInputGroup(
                          label: 'TÊN ĐĂNG NHẬP',
                          child: TextField(
                            controller: _usernameController,
                            decoration: _inputDecoration('demi_user', Icons.account_circle_outlined),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Email & Số điện thoại
                  Row(
                    children: [
                      Expanded(
                        child: _buildInputGroup(
                          label: 'EMAIL',
                          child: TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: _inputDecoration('name@gmail.com', Icons.mail_outline),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildInputGroup(
                          label: 'SỐ ĐIỆN THOẠI',
                          child: TextField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: _inputDecoration('0901 234 567', Icons.phone_outlined),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Địa chỉ
                  _buildInputGroup(
                    label: 'ĐỊA CHỈ',
                    child: TextField(
                      controller: _addressController,
                      decoration: _inputDecoration('Quận 1, TP. Hồ Chí Minh', Icons.location_on_outlined),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Ngày sinh & Giới tính
                  Row(
                    children: [
                      Expanded(
                        child: _buildInputGroup(
                          label: 'NGÀY SINH',
                          child: GestureDetector(
                            onTap: _selectDate,
                            child: AbsorbPointer(
                              child: TextField(
                                controller: _birthDateController,
                                decoration: _inputDecoration('YYYY-MM-DD', Icons.calendar_today_outlined),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildInputGroup(
                          label: 'GIỚI TÍNH',
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _gender,
                                items: ['Nam', 'Nữ', 'Khác'].map((g) => DropdownMenuItem(value: g, child: Text(g, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)))).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _gender = val);
                                },
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Mật khẩu & Xác nhận
                  Row(
                    children: [
                      Expanded(
                        child: _buildInputGroup(
                          label: 'MẬT KHẨU',
                          child: TextField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration: _inputDecoration('••••••••', Icons.lock_outline),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildInputGroup(
                          label: 'XÁC NHẬN',
                          child: TextField(
                            controller: _confirmPasswordController,
                            obscureText: true,
                            decoration: _inputDecoration('••••••••', Icons.lock_outline),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Nút Submit Đăng Ký
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF006C49),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('ĐĂNG KÝ NGAY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
                                SizedBox(width: 6),
                                Icon(Icons.arrow_forward_rounded, size: 16),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  Center(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      },
                      child: RichText(
                        text: const TextSpan(
                          text: 'Đã có tài khoản? ',
                          style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600),
                          children: [
                            TextSpan(
                              text: 'Đăng nhập',
                              style: TextStyle(color: Color(0xFF006C49), fontWeight: FontWeight.w900),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputGroup({required String label, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 0.8),
        ),
        const SizedBox(height: 5),
        child,
      ],
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 12.5, color: Colors.grey),
      prefixIcon: Icon(icon, size: 17, color: const Color(0xFF94A3B8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF006C49), width: 1.5)),
    );
  }
}