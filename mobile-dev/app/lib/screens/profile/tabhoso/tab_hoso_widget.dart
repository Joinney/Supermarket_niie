import 'package:flutter/material.dart';

class TabHosoWidget extends StatefulWidget {
  final Map<String, dynamic>? profile;
  final Function(Map<String, dynamic> updatedProfile)? onSaveProfile;
  final VoidCallback? onAvatarChange;

  const TabHosoWidget({
    super.key,
    required this.profile,
    this.onSaveProfile,
    this.onAvatarChange,
  });

  @override
  State<TabHosoWidget> createState() => _TabHosoWidgetState();
}

class _TabHosoWidgetState extends State<TabHosoWidget> {
  late TextEditingController _fullNameController;
  late TextEditingController _phoneController;
  late TextEditingController _birthdayController;
  String _selectedGender = 'Nam';

  @override
  void initState() {
    super.initState();
    _initFormData();
  }

  @override
  void didUpdateWidget(covariant TabHosoWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) {
      _initFormData();
    }
  }

  void _initFormData() {
    _fullNameController = TextEditingController(text: widget.profile?['full_name'] ?? '');
    _phoneController = TextEditingController(text: widget.profile?['phone_number'] ?? '');
    
    final rawBirthday = widget.profile?['birthday']?.toString() ?? '';
    _birthdayController = TextEditingController(
      text: rawBirthday.contains('T') ? rawBirthday.split('T')[0] : rawBirthday,
    );

    _selectedGender = widget.profile?['gender'] ?? 'Nam';
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _birthdayController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    DateTime initialDate = DateTime.tryParse(_birthdayController.text) ?? DateTime(2000, 1, 1);
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
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
        _birthdayController.text = "${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  void _handleSave() {
    final updatedData = Map<String, dynamic>.from(widget.profile ?? {});
    updatedData['full_name'] = _fullNameController.text.trim();
    updatedData['phone_number'] = _phoneController.text.trim();
    updatedData['birthday'] = _birthdayController.text.trim();
    updatedData['gender'] = _selectedGender;

    widget.onSaveProfile?.call(updatedData);
  }

  @override
  Widget build(BuildContext context) {
    final String username = widget.profile?['username'] ?? '---';
    final String email = widget.profile?['email'] ?? '---';
    final String avatarUrl = widget.profile?['avatar_url'] ??
        'https://ui-avatars.com/api/?name=${Uri.encodeComponent(widget.profile?['full_name'] ?? "User")}&background=006c49&color=fff';

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // TIÊU ĐỀ
          const Text(
            'HỒ SƠ CÁ NHÂN',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
          ),
          const SizedBox(height: 16),

          // KHỐI AVATAR TRÒN + NÚT CAMERA
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Stack(
                    children: [
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4))
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(21),
                          child: Image.network(
                            avatarUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 45, color: Color(0xFF006C49)),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: -2,
                        right: -2,
                        child: GestureDetector(
                          onTap: widget.onAvatarChange,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                            ),
                            child: const Icon(Icons.camera_alt_rounded, size: 16, color: Color(0xFF006C49)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'ẢNH HỒ SƠ CÁ NHÂN',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // 1. TÊN ĐĂNG NHẬP (READONLY)
          _buildFormRow(
            label: 'TÊN ĐĂNG NHẬP',
            child: Text(
              username,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
            ),
          ),
          const Divider(height: 20),

          // 2. HỌ VÀ TÊN
          _buildFormRow(
            label: 'HỌ VÀ TÊN',
            child: TextField(
              controller: _fullNameController,
              decoration: _inputDecoration('Nhập họ và tên'),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),

          // 3. EMAIL (DISABLED)
          _buildFormRow(
            label: 'EMAIL',
            child: TextField(
              controller: TextEditingController(text: email),
              enabled: false,
              decoration: _inputDecoration('').copyWith(
                fillColor: const Color(0xFFF1F5F9),
                filled: true,
              ),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ),
          const SizedBox(height: 12),

          // 4. SỐ ĐIỆN THOẠI
          _buildFormRow(
            label: 'SỐ ĐIỆN THOẠI',
            child: TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: _inputDecoration('Nhập số điện thoại'),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),

          // 5. GIỚI TÍNH (RADIO BUTTONS)
          _buildFormRow(
            label: 'GIỚI TÍNH',
            child: Row(
              children: ['Nam', 'Nữ', 'Khác'].map((gender) {
                final isSelected = _selectedGender == gender;
                return GestureDetector(
                  onTap: () => setState(() => _selectedGender = gender),
                  child: Container(
                    margin: const EdgeInsets.only(right: 16),
                    child: Row(
                      children: [
                        Radio<String>(
                          value: gender,
                          groupValue: _selectedGender,
                          activeColor: const Color(0xFF006C49),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedGender = val);
                          },
                        ),
                        Text(
                          gender,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: const Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // 6. NGÀY SINH (DATE PICKER)
          _buildFormRow(
            label: 'NGÀY SINH',
            child: GestureDetector(
              onTap: _selectDate,
              child: AbsorbPointer(
                child: TextField(
                  controller: _birthdayController,
                  decoration: _inputDecoration('YYYY-MM-DD').copyWith(
                    suffixIcon: const Icon(Icons.calendar_today_rounded, size: 18, color: Color(0xFF006C49)),
                  ),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // NÚT LƯU THAY ĐỔI
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _handleSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF006C49),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: const Text(
                'LƯU THAY ĐỔI HỒ SƠ',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormRow({required String label, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), letterSpacing: 0.8),
        ),
        const SizedBox(height: 6),
        child,
      ],
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
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF006C49), width: 1.5),
      ),
    );
  }
}