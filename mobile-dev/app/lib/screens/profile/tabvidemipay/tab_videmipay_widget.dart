import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';

class TabVidemipayWidget extends StatefulWidget {
  final Map<String, dynamic>? profile;

  const TabVidemipayWidget({super.key, this.profile});

  @override
  State<TabVidemipayWidget> createState() => _TabVidemipayWidgetState();
}

class _TabVidemipayWidgetState extends State<TabVidemipayWidget> {
  List<dynamic> _transactions = [];
  bool _loading = true;

  final NumberFormat _currencyFormat =
      NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchTransactions();
  }

  @override
  void didUpdateWidget(covariant TabVidemipayWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) {
      _fetchTransactions();
    }
  }

  Future<void> _fetchTransactions() async {
    final currentUserId =
        widget.profile?['user_id'] ?? widget.profile?['id'] ?? widget.profile?['ma_nguoi_dung'];
    if (currentUserId == null) {
      setState(() => _loading = false);
      return;
    }

    try {
      final res = await authApi.get('/auth/wallet/transactions/$currentUserId');
      if (mounted && res.data != null && res.data['success'] == true) {
        setState(() {
          _transactions = res.data['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Lỗi tải lịch sử ví: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatTime(dynamic isoString) {
    if (isoString == null || isoString.toString().isEmpty) return '';
    try {
      final d = DateTime.parse(isoString.toString());
      return DateFormat('dd/MM/yyyy - HH:mm:ss').format(d);
    } catch (_) {
      return isoString.toString();
    }
  }

  Map<String, dynamic> _formatTransaction(dynamic amount, dynamic type) {
    final clean = (amount ?? 0).toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    final numAmount = double.tryParse(clean) ?? 0.0;
    final absAmount = numAmount.abs();
    final formattedNumber = _currencyFormat.format(absAmount);

    if (type?.toString() == 'payment' || numAmount < 0) {
      return {
        'text': '-$formattedNumber',
        'color': const Color(0xFFDC2626),
      };
    }

    return {
      'text': '+$formattedNumber',
      'color': const Color(0xFF006C49),
    };
  }

  @override
  Widget build(BuildContext context) {
    final double walletBalance = double.tryParse(
            (widget.profile?['wallet_balance'] ?? 0).toString()) ??
        0.0;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. THẺ SỐ DƯ VÍ DEMI PAY
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF006C49), Color(0xFF004D34)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF006C49).withOpacity(0.25),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.account_balance_wallet_rounded,
                        color: Colors.white70, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'SỐ DƯ VÍ DEMI PAY',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  _currencyFormat.format(walletBalance),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // 2. TIÊU ĐỀ LỊCH SỬ GIAO DỊCH
          const Row(
            children: [
              Icon(Icons.history_rounded, size: 18, color: Color(0xFF006C49)),
              SizedBox(width: 8),
              Text(
                'LỊCH SỬ GIAO DỊCH VÍ',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 3. DANH SÁCH GIAO DỊCH
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF006C49)),
              ),
            )
          else if (_transactions.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
              alignment: Alignment.center,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.history_toggle_off_rounded,
                        size: 32, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Chưa có giao dịch nào',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Khi bạn hoàn tiền đơn hàng, tiền hoàn sẽ lập tức xuất hiện tại đây.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _transactions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final txn = _transactions[index];
                final formatted =
                    _formatTransaction(txn['amount'], txn['type']);

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          color: Color(0xFFFEF3C7),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.sync_rounded,
                            size: 18, color: Color(0xFFD97706)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              txn['title'] ?? 'Giao dịch ví',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            if (txn['description'] != null &&
                                txn['description'].toString().isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                txn['description'],
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 11, color: Colors.grey),
                              ),
                            ],
                            const SizedBox(height: 4),
                            Text(
                              _formatTime(txn['created_at']),
                              style: const TextStyle(
                                  fontSize: 10, color: Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            formatted['text'],
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: formatted['color'],
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'THÀNH CÔNG',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF006C49),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}