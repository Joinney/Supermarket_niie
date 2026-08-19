import 'package:flutter/material.dart';
import 'package:app/api/api_client.dart';

class AddressModal extends StatefulWidget {
  final bool isOpen;
  final VoidCallback onClose;
  final Function(Map<String, dynamic>) onSelect;
  final List<dynamic> currentAddresses;
  final dynamic selectedAddressId;
  final Future<void> Function()? onRefresh;

  const AddressModal({
    super.key,
    required this.isOpen,
    required this.onClose,
    required this.onSelect,
    required this.currentAddresses,
    this.selectedAddressId,
    this.onRefresh,
  });

  @override
  State<AddressModal> createState() => _AddressModalState();
}

class _AddressModalState extends State<AddressModal> {
  bool _isFormOpen = false;
  dynamic _editingAddressId;

  // Dữ liệu địa chính
  List<dynamic> _provinces = [];
  List<dynamic> _districts = [];
  List<dynamic> _wards = [];
  bool _loadingGeography = false;

  // Form State
  String _receiverName = '';
  String _receiverPhone = '';
  String _provinceName = '';
  dynamic _provinceId;
  String _districtName = '';
  dynamic _districtId;
  String _wardName = '';
  String _wardCode = '';
  String _detailAddress = '';
  bool _isDefault = false;

  @override
  void didUpdateWidget(covariant AddressModal oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isOpen && _isFormOpen && _provinces.isEmpty) {
      _fetchProvinces();
    }
  }

  // --- API LẤY ĐỊA CHÍNH ---
  Future<void> _fetchProvinces() async {
    setState(() => _loadingGeography = true);
    try {
      final res = await orderApi.get('/orders/locations/provinces');
      if (res.data != null && res.data['success'] == true) {
        setState(() => _provinces = res.data['data'] ?? []);
      }
    } catch (e) {
      debugPrint('Lỗi lấy Tỉnh/Thành: $e');
    } finally {
      if (mounted) setState(() => _loadingGeography = false);
    }
  }

  Future<void> _fetchDistricts(dynamic provinceId) async {
    setState(() => _loadingGeography = true);
    try {
      final res = await orderApi.get('/orders/locations/districts?province_id=$provinceId');
      if (res.data != null && res.data['success'] == true) {
        setState(() => _districts = res.data['data'] ?? []);
      }
    } catch (e) {
      debugPrint('Lỗi lấy Quận/Huyện: $e');
    } finally {
      if (mounted) setState(() => _loadingGeography = false);
    }
  }

  Future<void> _fetchWards(dynamic districtId) async {
    setState(() => _loadingGeography = true);
    try {
      final res = await orderApi.get('/orders/locations/wards?district_id=$districtId');
      if (res.data != null && res.data['success'] == true) {
        setState(() => _wards = res.data['data'] ?? []);
      }
    } catch (e) {
      debugPrint('Lỗi lấy Phường/Xã: $e');
    } finally {
      if (mounted) setState(() => _loadingGeography = false);
    }
  }

  // --- THAO TÁC ĐỊA CHỈ ---
  Future<void> _handleDeleteAddress(dynamic addressId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: const Text('Bạn có chắc chắn muốn xóa địa chỉ này?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Xóa', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await authApi.delete('/addresses/$addressId');
      if (widget.onRefresh != null) await widget.onRefresh!();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa địa chỉ thất bại, vui lòng thử lại!')),
        );
      }
    }
  }

  Future<void> _handleSetDefault(Map<String, dynamic> addr) async {
    try {
      final updatePayload = {
        'receiver_name': addr['receiver_name'],
        'receiver_phone': addr['receiver_phone'],
        'province_name': addr['province_name'],
        'province_id': int.tryParse(addr['province_id'].toString()) ?? 1,
        'district_name': addr['district_name'],
        'district_id': int.tryParse(addr['district_id'].toString()) ?? 1,
        'ward_name': addr['ward_name'],
        'ward_id': (addr['ward_code'] ?? addr['ward_id'] ?? "1").toString(),
        'detail_address': addr['detail_address'],
        'is_default': true,
        'address_type': addr['address_type'] ?? 'home',
      };
      await authApi.put('/addresses/${addr['address_id']}', data: updatePayload);
      if (widget.onRefresh != null) await widget.onRefresh!();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đặt mặc định thất bại!')),
        );
      }
    }
  }

  void _handleEditClick(Map<String, dynamic> addr) async {
    setState(() {
      _editingAddressId = addr['address_id'];
      _receiverName = addr['receiver_name'] ?? '';
      _receiverPhone = addr['receiver_phone'] ?? '';
      _provinceName = addr['province_name'] ?? '';
      _provinceId = addr['province_id'];
      _districtName = addr['district_name'] ?? '';
      _districtId = addr['district_id'];
      _wardName = addr['ward_name'] ?? '';
      _wardCode = (addr['ward_code'] ?? addr['ward_id'] ?? '').toString();
      _detailAddress = addr['detail_address'] ?? '';
      _isDefault = addr['is_default'] == true || addr['is_default'] == 1;
      _isFormOpen = true;
    });

    if (_provinces.isEmpty) await _fetchProvinces();
    if (_provinceId != null) await _fetchDistricts(_provinceId);
    if (_districtId != null) await _fetchWards(_districtId);
  }

  void _handleAddClick() {
    setState(() {
      _editingAddressId = null;
      _receiverName = '';
      _receiverPhone = '';
      _provinceName = '';
      _provinceId = null;
      _districtName = '';
      _districtId = null;
      _wardName = '';
      _wardCode = '';
      _detailAddress = '';
      _isDefault = false;
      _districts = [];
      _wards = [];
      _isFormOpen = true;
    });
    if (_provinces.isEmpty) _fetchProvinces();
  }

  Future<void> _handleSubmitForm() async {
    if (_provinceId == null || _districtId == null || _wardCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn đầy đủ Tỉnh, Quận, Phường!')),
      );
      return;
    }
    if (_receiverName.isEmpty || _receiverPhone.isEmpty || _detailAddress.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đầy đủ các thông tin bắt buộc!')),
      );
      return;
    }

    final finalPayload = {
      'receiver_name': _receiverName,
      'receiver_phone': _receiverPhone,
      'province_name': _provinceName,
      'province_id': int.tryParse(_provinceId.toString()),
      'district_name': _districtName,
      'district_id': int.tryParse(_districtId.toString()),
      'ward_name': _wardName,
      'ward_id': _wardCode,
      'ward_code': _wardCode,
      'detail_address': _detailAddress,
      'is_default': _isDefault,
      'address_type': 'home',
    };

    try {
      if (_editingAddressId != null) {
        await authApi.put('/addresses/$_editingAddressId', data: finalPayload);
      } else {
        await authApi.post('/addresses', data: finalPayload);
      }
      setState(() => _isFormOpen = false);
      if (widget.onRefresh != null) await widget.onRefresh!();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể lưu địa chỉ. Vui lòng kiểm tra lại!')),
        );
      }
    }
  }

  // --- DIALOG CHỌN TỈNH / HUYỆN / XÃ VỚI TÌM KIẾM ---
  void _showLocationPicker({
    required String title,
    required List<dynamic> items,
    required String nameKey,
    required Function(dynamic item) onSelect,
  }) {
    String search = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = items.where((i) {
              final val = (i[nameKey] ?? '').toString().toLowerCase();
              return val.contains(search.toLowerCase());
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.7,
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
                  const SizedBox(height: 12),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Nhập từ khóa tìm kiếm...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    onChanged: (v) => setModalState(() => search = v),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: filtered.isEmpty
                        ? const Center(child: Text('Không tìm thấy dữ liệu', style: TextStyle(color: Colors.grey)))
                        : ListView.separated(
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final item = filtered[index];
                              return ListTile(
                                title: Text(item[nameKey] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                onTap: () {
                                  onSelect(item);
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

  @override
  Widget build(BuildContext context) {
    if (!widget.isOpen) return const SizedBox.shrink();

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        constraints: const BoxConstraints(maxHeight: 650),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: const Border(left: BorderSide(color: Color(0xFF006C49), width: 5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Dialog
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _isFormOpen
                      ? (_editingAddressId != null ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng')
                      : 'Chọn địa chỉ nhận hàng',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.grey),
                  onPressed: widget.onClose,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Content
            Expanded(
              child: _isFormOpen ? _buildAddressForm() : _buildAddressList(),
            ),
          ],
        ),
      ),
    );
  }

  // --- LIST ĐỊA CHỈ ---
  Widget _buildAddressList() {
    return Column(
      children: [
        Expanded(
          child: widget.currentAddresses.isEmpty
              ? const Center(child: Text('Bạn chưa có địa chỉ nào.', style: TextStyle(color: Colors.grey)))
              : ListView.separated(
                  itemCount: widget.currentAddresses.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final addr = widget.currentAddresses[index];
                    final isSelected = widget.selectedAddressId == addr['address_id'];
                    final isDefault = addr['is_default'] == true || addr['is_default'] == 1;

                    return InkWell(
                      onTap: () {
                        widget.onSelect(addr);
                        widget.onClose();
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFE6F0ED) : const Color(0xFFFAFBFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF006C49) : const Color(0xFFE2E8F0),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${addr['receiver_name']} | ${addr['receiver_phone']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                if (isDefault)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFD1FAE5),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text('Mặc định', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${addr['detail_address']}, ${addr['ward_name']}, ${addr['district_name']}, ${addr['province_name']}',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (!isDefault)
                                  IconButton(
                                    icon: const Icon(Icons.check_circle_outline, size: 18, color: Color(0xFF006C49)),
                                    onPressed: () => _handleSetDefault(addr),
                                  ),
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.blue),
                                  onPressed: () => _handleEditClick(addr),
                                ),
                                if (!isDefault)
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                    onPressed: () => _handleDeleteAddress(addr['address_id']),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF006C49),
              side: const BorderSide(color: Color(0xFF006C49)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            onPressed: _handleAddClick,
            icon: const Icon(Icons.add),
            label: const Text('+ Thêm địa chỉ mới', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  // --- FORM THÊM / SỬA ĐỊA CHỈ ---
  Widget _buildAddressForm() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_loadingGeography)
            const LinearProgressIndicator(color: Color(0xFF006C49), backgroundColor: Color(0xFFE6F0ED)),
          const SizedBox(height: 8),
          
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: TextEditingController(text: _receiverName)..selection = TextSelection.collapsed(offset: _receiverName.length),
                  decoration: const InputDecoration(labelText: 'Tên người nhận *', border: OutlineInputBorder()),
                  onChanged: (v) => _receiverName = v,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: TextEditingController(text: _receiverPhone)..selection = TextSelection.collapsed(offset: _receiverPhone.length),
                  decoration: const InputDecoration(labelText: 'Số điện thoại *', border: OutlineInputBorder()),
                  onChanged: (v) => _receiverPhone = v,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Pickers
          _buildDropdownTile(
            label: 'Tỉnh / Thành phố',
            value: _provinceName.isEmpty ? '-- Chọn Tỉnh / Thành --' : _provinceName,
            onTap: () {
              _showLocationPicker(
                title: 'Chọn Tỉnh / Thành phố',
                items: _provinces,
                nameKey: 'ProvinceName',
                onSelect: (p) {
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
                  _fetchDistricts(p['ProvinceID']);
                },
              );
            },
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildDropdownTile(
                  label: 'Quận / Huyện',
                  value: _districtName.isEmpty ? '-- Chọn Huyện --' : _districtName,
                  onTap: () {
                    if (_provinceId == null) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng chọn Tỉnh/Thành trước!')));
                      return;
                    }
                    _showLocationPicker(
                      title: 'Chọn Quận / Huyện',
                      items: _districts,
                      nameKey: 'DistrictName',
                      onSelect: (d) {
                        setState(() {
                          _districtId = d['DistrictID'];
                          _districtName = d['DistrictName'] ?? '';
                          _wardCode = '';
                          _wardName = '';
                          _wards = [];
                        });
                        _fetchWards(d['DistrictID']);
                      },
                    );
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildDropdownTile(
                  label: 'Phường / Xã',
                  value: _wardName.isEmpty ? '-- Chọn Phường --' : _wardName,
                  onTap: () {
                    if (_districtId == null) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng chọn Quận/Huyện trước!')));
                      return;
                    }
                    _showLocationPicker(
                      title: 'Chọn Phường / Xã',
                      items: _wards,
                      nameKey: 'WardName',
                      onSelect: (w) {
                        setState(() {
                          _wardCode = (w['WardCode'] ?? '').toString();
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

          TextField(
            controller: TextEditingController(text: _detailAddress)..selection = TextSelection.collapsed(offset: _detailAddress.length),
            decoration: const InputDecoration(
              labelText: 'Địa chỉ chi tiết (Số nhà, đường...) *',
              border: OutlineInputBorder(),
            ),
            onChanged: (v) => _detailAddress = v,
          ),
          const SizedBox(height: 8),

          CheckboxListTile(
            title: const Text('Đặt làm địa chỉ mặc định', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            value: _isDefault,
            activeColor: const Color(0xFF006C49),
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            onChanged: (v) => setState(() => _isDefault = v ?? false),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _isFormOpen = false),
                  child: const Text('Hủy bỏ'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF006C49)),
                  onPressed: _handleSubmitForm,
                  child: const Text('Lưu lại', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownTile({required String label, required String value, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(child: Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13))),
            const Icon(Icons.arrow_drop_down, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}