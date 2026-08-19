import 'package:flutter/material.dart';
import 'package:app/api/api_client.dart';
import 'package:app/screens/profile/tabdiachi/address_modal.dart';

class TabDiachiWidget extends StatefulWidget {
  final List<dynamic> addresses;
  final VoidCallback onRefresh;

  const TabDiachiWidget({
    super.key,
    required this.addresses,
    required this.onRefresh,
  });

  @override
  State<TabDiachiWidget> createState() => _TabDiachiWidgetState();
}

class _TabDiachiWidgetState extends State<TabDiachiWidget> {
  void _openAddressModal({Map<String, dynamic>? initialData}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddressModal(
        initialData: initialData,
        isDefaultForbiddenToUncheck: widget.addresses.isEmpty || (initialData != null && initialData['is_default'] == true),
        onSave: (payload) async {
          final addressId = initialData?['address_id'];
          try {
            if (addressId != null) {
              await authApi.put('/addresses/$addressId', data: payload);
              _showToast('Cập nhật địa chỉ thành công!');
            } else {
              await authApi.post('/addresses', data: payload);
              _showToast('Đã thêm địa chỉ mới!');
            }
            widget.onRefresh();
          } catch (e) {
            _showToast('Lỗi khi lưu địa chỉ!', isError: true);
          }
        },
      ),
    );
  }

  Future<void> _handleSetDefault(dynamic addressId) async {
    try {
      final target = widget.addresses.firstWhere((a) => a['address_id'] == addressId);
      final payload = Map<String, dynamic>.from(target);
      payload['is_default'] = true;

      await authApi.put('/addresses/$addressId', data: payload);
      _showToast('Đã đặt làm điểm nhận hàng mặc định!');
      widget.onRefresh();
    } catch (_) {
      _showToast('Không thể thiết lập mặc định', isError: true);
    }
  }

  Future<void> _handleDelete(dynamic addressId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận xóa', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        content: const Text('Bạn có chắc muốn xóa địa chỉ này khỏi sổ lưu trữ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('HỦY')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('XÓA', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await authApi.delete('/addresses/$addressId');
        _showToast('Đã xóa địa chỉ thành công!');
        widget.onRefresh();
      } catch (_) {
        _showToast('Lỗi khi xóa địa chỉ', isError: true);
      }
    }
  }

  void _showToast(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red.shade700 : const Color(0xFF006C49),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SỔ ĐỊA CHỈ CÁ NHÂN',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
                ),
                SizedBox(height: 2),
                Text(
                  'Quản lý điểm giao nhận phục vụ định tuyến cước',
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
            ElevatedButton.icon(
              onPressed: () => _openAddressModal(),
              icon: const Icon(Icons.add, size: 14),
              label: const Text('THÊM MỚI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF006C49),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
            ),
          ],
        ),

        const SizedBox(height: 14),

        // Danh sách địa chỉ
        if (widget.addresses.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 48),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            child: const Column(
              children: [
                Icon(Icons.location_off_outlined, size: 36, color: Colors.grey),
                SizedBox(height: 8),
                Text(
                  'Sổ địa chỉ trống rỗng',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.addresses.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final addr = widget.addresses[index];
              final bool isDefault = addr['is_default'] == true || addr['is_default'] == 1;
              final String type = addr['address_type'] ?? 'home';

              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: isDefault ? const Color(0xFFD6EDE4) : const Color(0xFFF1F5F9)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          addr['receiver_name'] ?? 'Người nhận',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF161B22)),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE6F0ED),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            addr['receiver_phone'] ?? '',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF006C49)),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: type == 'home' ? const Color(0xFFEFF6FF) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            type == 'home' ? 'Nhà riêng' : 'Văn phòng',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: type == 'home' ? const Color(0xFF2563EB) : const Color(0xFFD97706),
                            ),
                          ),
                        ),
                        if (isDefault) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Mặc định',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.red),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      addr['detail_address'] ?? '',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '📍 ${addr['ward_name'] ?? ''} • ${addr['district_name'] ?? ''} • ${addr['province_name'] ?? ''}',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                    ),
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () => _openAddressModal(initialData: Map<String, dynamic>.from(addr)),
                              child: const Row(
                                children: [
                                  Icon(Icons.edit_outlined, size: 12, color: Color(0xFF006C49)),
                                  SizedBox(width: 4),
                                  Text('Cập nhật', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF006C49))),
                                ],
                              ),
                            ),
                            if (!isDefault) ...[
                              const SizedBox(width: 14),
                              GestureDetector(
                                onTap: () => _handleDelete(addr['address_id']),
                                child: const Row(
                                  children: [
                                    Icon(Icons.delete_outline, size: 12, color: Colors.red),
                                    SizedBox(width: 4),
                                    Text('Xóa', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.red)),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                        if (!isDefault)
                          OutlinedButton(
                            onPressed: () => _handleSetDefault(addr['address_id']),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              side: const BorderSide(color: Color(0xFFE2E8F0)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Đặt làm mặc định', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black87)),
                          )
                        else
                          const Row(
                            children: [
                              Icon(Icons.check, size: 12, color: Color(0xFF006C49)),
                              SizedBox(width: 4),
                              Text('Đang mặc định', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }
}