import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';

class TabVoucherWidget extends StatefulWidget {
  final Map<String, dynamic>? profile;

  const TabVoucherWidget({super.key, this.profile});

  @override
  State<TabVoucherWidget> createState() => _TabVoucherWidgetState();
}

class _TabVoucherWidgetState extends State<TabVoucherWidget> {
  bool _loading = true;
  List<dynamic> _coupons = [];
  double _totalSpent = 0.0;
  Map<String, double> _vipThresholds = {
    'vang': 5000000.0,
    'kimcuong': 10000000.0,
  };

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchAllData();
  }

  double _parseNumber(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final clean = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }

  Future<void> _fetchAllData() async {
    setState(() => _loading = true);
    try {
      final userId = widget.profile?['id'] ?? widget.profile?['ma_nguoi_dung'] ?? '';

      final results = await Future.wait<dynamic>([
        couponApi.get('/').catchError((_) => null),
        authApi.get('/auth/settings/vip').catchError((_) => null),
        if (userId.toString().isNotEmpty)
          orderApi.get('/orders/internal/user-spent/$userId').catchError((_) => null)
        else
          Future.value(null),
      ]);

      final couponRes = results[0];
      final settingsRes = results[1];
      final spentRes = results.length > 2 ? results[2] : null;

      if (couponRes != null && couponRes.data != null && couponRes.data['success'] == true) {
        final List<dynamic> list = couponRes.data['data'] ?? [];
        _coupons = list.where((c) => c['is_active'] == true).toList();
      }

      if (settingsRes != null && settingsRes.data != null && settingsRes.data['success'] == true) {
        final data = settingsRes.data['data'] ?? {};
        _vipThresholds = {
          'vang': _parseNumber(data['vang'] ?? 5000000),
          'kimcuong': _parseNumber(data['kimcuong'] ?? 10000000),
        };
      }

      if (spentRes != null && spentRes.data != null && spentRes.data['success'] == true) {
        _totalSpent = _parseNumber(spentRes.data['total_spent'] ?? 0);
      }
    } catch (e) {
      debugPrint('Lỗi đồng bộ dữ liệu Voucher: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _handleCopy(String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã sao chép mã: $code'),
        backgroundColor: const Color(0xFF006C49),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Map<String, dynamic> _calculateProgress(String tier) {
    final Map<String, int> tierWeight = {'BẠC': 1, 'VÀNG': 2, 'KIM CƯƠNG': 3};
    final int currentWeight = tierWeight[tier] ?? 1;

    String actualTier = 'BẠC';
    if (_totalSpent >= _vipThresholds['kimcuong']!) {
      actualTier = 'KIM CƯƠNG';
    } else if (_totalSpent >= _vipThresholds['vang']!) {
      actualTier = 'VÀNG';
    }

    final int actualWeight = tierWeight[actualTier] ?? 1;

    double percent = 0.0;
    String nextTierText = '';
    String neededText = '';
    bool isGracePeriod = false;

    if (currentWeight > actualWeight) {
      isGracePeriod = true;
      if (tier == 'VÀNG') {
        percent = (_totalSpent / _vipThresholds['vang']!) * 100;
        nextTierText = 'Duy trì VÀNG';
        neededText = 'Cần ${_currencyFormat.format(_vipThresholds['vang']! - _totalSpent)} để duy trì';
      } else if (tier == 'KIM CƯƠNG') {
        percent = (_totalSpent / _vipThresholds['kimcuong']!) * 100;
        nextTierText = 'Duy trì KIM CƯƠNG';
        neededText = 'Cần ${_currencyFormat.format(_vipThresholds['kimcuong']! - _totalSpent)} để duy trì';
      }
    } else {
      if (tier == 'KIM CƯƠNG') {
        percent = 100.0;
        nextTierText = 'Hạng Cao Nhất';
      } else if (tier == 'VÀNG') {
        final double required = _vipThresholds['kimcuong']! - _vipThresholds['vang']!;
        final double current = _totalSpent - _vipThresholds['vang']!;
        percent = required > 0 ? (current / required) * 100 : 100.0;
        nextTierText = 'Lên KIM CƯƠNG';
        neededText = 'Cần thêm ${_currencyFormat.format(_vipThresholds['kimcuong']! - _totalSpent)}';
      } else {
        percent = (_totalSpent / _vipThresholds['vang']!) * 100;
        nextTierText = 'Lên VÀNG';
        neededText = 'Cần thêm ${_currencyFormat.format(_vipThresholds['vang']! - _totalSpent)}';
      }
    }

    return {
      'percent': (percent / 100).clamp(0.0, 1.0),
      'nextTierText': nextTierText,
      'neededText': neededText,
      'isGracePeriod': isGracePeriod,
    };
  }

  @override
  Widget build(BuildContext context) {
    final String tier = (widget.profile?['membership_tier'] ?? 'BẠC').toString().toUpperCase();
    final progress = _calculateProgress(tier);

    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF006C49)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. HEADER & PROGRESS BAR THĂNG HẠNG
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF006C49), Color(0xFF004D35)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF006C49).withOpacity(0.25),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.confirmation_num_outlined, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Ưu đãi độc quyền của bạn',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text.rich(
                        TextSpan(
                          text: 'Hạng hiện tại: ',
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                          children: [
                            TextSpan(
                              text: tier,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                            ),
                          ],
                        ),
                      ),
                      if (progress['isGracePeriod'] == true) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.amber.withOpacity(0.4)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.security, size: 10, color: Colors.amberAccent),
                              SizedBox(width: 4),
                              Text(
                                'Đang bảo lưu hạng',
                                style: TextStyle(color: Colors.amberAccent, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Text(
                      'Đã chi tiêu: ${_currencyFormat.format(_totalSpent)}',
                      style: const TextStyle(color: Color(0xFFA7F3D0), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Progress Bar Box
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'TIẾN ĐỘ THĂNG HẠNG',
                          style: TextStyle(color: Colors.white70, fontSize: 9, fontWeight: FontWeight.w900),
                        ),
                        Text(
                          progress['nextTierText'],
                          style: TextStyle(
                            color: progress['isGracePeriod'] == true ? Colors.amberAccent : Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: progress['percent'],
                        minHeight: 8,
                        backgroundColor: Colors.black.withOpacity(0.25),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          progress['isGracePeriod'] == true ? const Color(0xFFFBBF24) : const Color(0xFFFEA619),
                        ),
                      ),
                    ),
                    if (progress['neededText'].toString().isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        progress['neededText'],
                        style: const TextStyle(color: Colors.white70, fontSize: 9, fontStyle: FontStyle.italic),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 2. GRID DANH SÁCH VOUCHER
        if (_coupons.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Text(
              'Hiện không có mã giảm giá nào đang phát hành.',
              style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _coupons.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final coupon = _coupons[index];
              final double reqSpent = _parseNumber(coupon['min_lifetime_spent']);

              final bool isEligible = tier == 'KIM CƯƠNG' ||
                  reqSpent == 0 ||
                  (tier == 'VÀNG' && reqSpent <= _vipThresholds['vang']!);

              final String code = coupon['code'] ?? 'DEMI';
              final String desc = coupon['description'] ??
                  'Giảm ${_currencyFormat.format(_parseNumber(coupon['discount_value']))}';
              final String endDate = coupon['end_date'] != null
                  ? DateFormat('dd/MM/yyyy').format(DateTime.tryParse(coupon['end_date']) ?? DateTime.now())
                  : 'Hết hạn sớm';

              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isEligible ? Colors.white : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isEligible ? const Color(0xFFD6EDE4) : const Color(0xFFE2E8F0),
                    width: isEligible ? 1.5 : 1,
                  ),
                  boxShadow: isEligible
                      ? [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isEligible ? const Color(0xFFE6F0ED) : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.auto_awesome,
                        size: 22,
                        color: isEligible ? const Color(0xFF006C49) : Colors.grey,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            code,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              color: isEligible ? const Color(0xFF006C49) : const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            desc,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              if (!isEligible) ...[
                                const Icon(Icons.lock_outline_rounded, size: 10, color: Colors.grey),
                                const SizedBox(width: 4),
                              ],
                              Text(
                                'HSD: $endDate',
                                style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (isEligible)
                      ElevatedButton.icon(
                        onPressed: () => _handleCopy(code),
                        icon: const Icon(Icons.copy_rounded, size: 12),
                        label: const Text('COPY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF006C49),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFFDE68A)),
                        ),
                        child: const Text(
                          'Yêu cầu hạng cao',
                          style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                        ),
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