import 'dart:async';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:app/api/api_client.dart';

class AddressModal extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  final bool isDefaultForbiddenToUncheck;
  final Function(Map<String, dynamic> payload) onSave;

  const AddressModal({
    super.key,
    this.initialData,
    this.isDefaultForbiddenToUncheck = false,
    required this.onSave,
  });

  @override
  State<AddressModal> createState() => _AddressModalState();
}

class _AddressModalState extends State<AddressModal> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _detailAddressController = TextEditingController();

  int? _provinceId;
  String _provinceName = '';
  int? _districtId;
  String _districtName = '';
  String _wardCode = '';
  String _wardName = '';

  String _addressType = 'home';
  bool _isDefault = false;

  List<dynamic> _provinces = [];
  List<dynamic> _districts = [];
  List<dynamic> _wards = [];

  List<dynamic> _suggestions = [];
  bool _isSearchingSuggestions = false;
  Timer? _debounceTimer;

  final Dio _publicDio = Dio();

  @override
  void initState() {
    super.initState();
    _initData();
    _fetchProvinces();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _detailAddressController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _initData() {
    final data = widget.initialData;
    if (data != null) {
      _nameController.text = data['receiver_name'] ?? '';
      _phoneController.text = data['receiver_phone'] ?? '';
      _detailAddressController.text = data['detail_address'] ?? '';

      _provinceId = int.tryParse(data['province_id']?.toString() ?? '');
      _provinceName = data['province_name'] ?? '';
      _districtId = int.tryParse(data['district_id']?.toString() ?? '');
      _districtName = data['district_name'] ?? '';
      _wardCode = (data['ward_code'] ?? data['ward_id'] ?? '').toString();
      _wardName = data['ward_name'] ?? '';

      _addressType = data['address_type'] ?? 'home';
      _isDefault = data['is_default'] == true || data['is_default'] == 1;

      if (_provinceId != null) _fetchDistricts(_provinceId!);
      if (_districtId != null) _fetchWards(_districtId!);
    } else {
      _isDefault = widget.isDefaultForbiddenToUncheck;
    }
  }

  Future<void> _fetchProvinces() async {
    try {
      final res = await authApi.get('/addresses/locations/provinces');
      if (mounted && res.data != null && res.data['success'] == true) {
        setState(() {
          _provinces = res.data['data'] ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchDistricts(int provinceId) async {
    try {
      final res = await authApi.get('/addresses/locations/districts?province_id=$provinceId');
      if (mounted && res.data != null && res.data['success'] == true) {
        setState(() {
          _districts = res.data['data'] ?? [];
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchWards(int districtId) async {
    try {
      final res = await authApi.get('/addresses/locations/wards?district_id=$districtId');
      if (mounted && res.data != null && res.data['success'] == true) {
        setState(() {
          _wards = res.data['data'] ?? [];
        });
      }
    } catch (_) {}
  }

  void _onDetailAddressChanged(String val) {
    _debounceTimer?.cancel();
    if (val.trim().length < 3) {
      setState(() => _suggestions = []);
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      if (!mounted) return;
      setState(() => _isSearchingSuggestions = true);

      final parts = [val.trim(), _wardName, _districtName, _provinceName, "Việt Nam"]
          .where((s) => s.isNotEmpty)
          .join(', ');

      try {
        final response = await _publicDio.get(
          'https://nominatim.openstreetmap.org/search',
          queryParameters: {
            'q': parts,
            'format': 'json',
            'addressdetails': 1,
            'limit': 5,
            'countrycodes': 'vn',
          },
          options: Options(headers: {'User-Agent': 'DemiMartApp/1.0'}),
        );

        if (mounted && response.data != null && response.data is List) {
          setState(() {
            _suggestions = response.data;
          });
        }
      } catch (_) {
      } finally {
        if (mounted) setState(() => _isSearchingSuggestions = false);
      }
    });
  }

  void _openSelectionDialog({
    required String title,
    required List<dynamic> items,
    required String Function(dynamic) labelBuilder,
    required Function(dynamic) onSelected,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        List<dynamic> filtered = List.from(items);
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.7,
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(height: 12),
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                  const SizedBox(height: 12),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    onChanged: (text) {
                      setModalState(() {
                        filtered = items.where((i) => labelBuilder(i).toLowerCase().contains(text.toLowerCase())).toList();
                      });
                    },
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final item = filtered[index];
                        return ListTile(
                          title: Text(labelBuilder(item), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          onTap: () {
                            onSelected(item);
                            Navigator.pop(ctx);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _submit() {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final detail = _detailAddressController.text.trim();

    if (name.isEmpty || phone.isEmpty || _provinceId == null || _districtId == null || _wardCode.isEmpty || detail.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng điền đầy đủ các thông tin địa chỉ!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final payload = {
      'receiver_name': name,
      'receiver_phone': phone,
      'province_id': _provinceId,
      'province_name': _provinceName,
      'district_id': _districtId,
      'district_name': _districtName,
      'ward_id': _wardCode,
      'ward_code': _wardCode,
      'ward_name': _wardName,
      'detail_address': detail,
      'address_type': _addressType,
      'is_default': _isDefault,
    };

    widget.onSave(payload);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.initialData != null;

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 16,
        right: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isEditing ? 'CHỈNH SỬA ĐỊA CHỈ' : 'THÊM ĐỊA CHỈ MỚI',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20, color: Colors.grey),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _nameController,
                    decoration: _inputDecoration('Tên người nhận'),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: _inputDecoration('SĐT liên hệ'),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildDropdownTrigger(
              label: _provinceName.isNotEmpty ? _provinceName : '-- Chọn Tỉnh / Thành phố --',
              isSelected: _provinceName.isNotEmpty,
              onTap: () {
                _openSelectionDialog(
                  title: 'Chọn Tỉnh / Thành phố',
                  items: _provinces,
                  labelBuilder: (p) => p['ProvinceName'] ?? '',
                  onSelected: (p) {
                    setState(() {
                      _provinceId = p['ProvinceID'];
                      _provinceName = p['ProvinceName'] ?? '';
                      _districtId = null;
                      _districtName = '';
                      _wardCode = '';
                      _wardName = '';
                      _districts = [];
                      _wards = [];
                    });
                    _fetchDistricts(_provinceId!);
                  },
                );
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildDropdownTrigger(
                    label: _districtName.isNotEmpty ? _districtName : '-- Quận/Huyện --',
                    isSelected: _districtName.isNotEmpty,
                    enabled: _provinceId != null,
                    onTap: () {
                      _openSelectionDialog(
                        title: 'Chọn Quận / Huyện',
                        items: _districts,
                        labelBuilder: (d) => d['DistrictName'] ?? '',
                        onSelected: (d) {
                          setState(() {
                            _districtId = d['DistrictID'];
                            _districtName = d['DistrictName'] ?? '';
                            _wardCode = '';
                            _wardName = '';
                            _wards = [];
                          });
                          _fetchWards(_districtId!);
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildDropdownTrigger(
                    label: _wardName.isNotEmpty ? _wardName : '-- Phường/Xã --',
                    isSelected: _wardName.isNotEmpty,
                    enabled: _districtId != null,
                    onTap: () {
                      _openSelectionDialog(
                        title: 'Chọn Phường / Xã',
                        items: _wards,
                        labelBuilder: (w) => w['WardName'] ?? '',
                        onSelected: (w) {
                          setState(() {
                            _wardCode = w['WardCode'].toString();
                            _wardName = w['WardName'] ?? '';
                          });
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _detailAddressController,
                  onChanged: _onDetailAddressChanged,
                  decoration: _inputDecoration('Số nhà, tên đường chi tiết').copyWith(
                    suffixIcon: _isSearchingSuggestions
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF006C49))),
                          )
                        : null,
                  ),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                if (_suggestions.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    constraints: const BoxConstraints(maxHeight: 150),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: _suggestions.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final s = _suggestions[index];
                        final displayName = s['display_name'] ?? '';
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.location_on, size: 16, color: Color(0xFF006C49)),
                          title: Text(displayName, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold), maxLines: 2),
                          onTap: () {
                            final road = s['address']?['road'] ?? s['address']?['suburb'] ?? displayName.split(',')[0];
                            final houseNumber = s['address']?['house_number'] ?? '';
                            final clean = houseNumber.isNotEmpty ? '$houseNumber $road' : road;

                            setState(() {
                              _detailAddressController.text = clean;
                              _suggestions = [];
                            });
                          },
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    _buildTypeChip('home', 'Nhà riêng'),
                    const SizedBox(width: 8),
                    _buildTypeChip('office', 'Văn phòng'),
                  ],
                ),
                Row(
                  children: [
                    Checkbox(
                      value: _isDefault,
                      activeColor: const Color(0xFF006C49),
                      onChanged: widget.isDefaultForbiddenToUncheck
                          ? null
                          : (val) => setState(() => _isDefault = val ?? false),
                    ),
                    const Text('Mặc định', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF64748B))),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF006C49),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('LƯU ĐỊA CHỈ', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownTrigger({required String label, required bool isSelected, required VoidCallback onTap, bool enabled = true}) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: enabled ? const Color(0xFFF8FAFC) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? const Color(0xFF1E293B) : Colors.grey,
                ),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeChip(String type, String label) {
    final isSelected = _addressType == type;
    return GestureDetector(
      onTap: () => setState(() => _addressType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF006C49) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? const Color(0xFF006C49) : Colors.grey.shade300),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: isSelected ? Colors.white : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF006C49), width: 1.5)),
    );
  }
}