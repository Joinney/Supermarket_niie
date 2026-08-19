import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:app/api/api_client.dart';

class TabThongbaoWidget extends StatefulWidget {
  final Map<String, dynamic>? profile;

  const TabThongbaoWidget({super.key, this.profile});

  @override
  State<TabThongbaoWidget> createState() => _TabThongbaoWidgetState();
}

class _TabThongbaoWidgetState extends State<TabThongbaoWidget> {
  List<dynamic> _notifications = [];
  bool _loading = true;
  String _userId = '';

  int _currentPage = 1;
  int _itemsPerPage = 5;

  @override
  void initState() {
    super.initState();
    _initUserAndFetch();
  }

  @override
  void didUpdateWidget(covariant TabThongbaoWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) {
      _initUserAndFetch();
    }
  }

  void _initUserAndFetch() {
    final box = Hive.box('auth_box');
    final userMap = box.get('user');

    _userId = widget.profile?['id']?.toString() ??
        widget.profile?['user_id']?.toString() ??
        widget.profile?['ma_nguoi_dung']?.toString() ??
        (userMap is Map ? (userMap['id'] ?? userMap['_id'])?.toString() : null) ??
        '1';

    _fetchNotificationHistory();
  }

  Future<void> _fetchNotificationHistory() async {
    if (_userId.isEmpty) {
      setState(() => _loading = false);
      return;
    }

    try {
      final res = await notificationApi.get('/notifications/user/$_userId');
      if (mounted) {
        setState(() {
          if (res.data is List) {
            _notifications = res.data;
          } else if (res.data != null && res.data['data'] is List) {
            _notifications = res.data['data'];
          } else {
            _notifications = [];
          }
        });
      }
    } catch (e) {
      debugPrint('Lỗi tải lịch sử thông báo: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _checkIfRead(dynamic noti) {
    return noti['isRead'] == true || noti['read'] == true;
  }

  String? _getNotificationId(dynamic noti) {
    return (noti['id'] ?? noti['_id'])?.toString();
  }

  Future<void> _handleMarkAsRead(dynamic noti) async {
    final notiId = _getNotificationId(noti);
    if (notiId == null) return;

    // Optimistic UI update
    setState(() {
      _notifications = _notifications.map((n) {
        if (_getNotificationId(n) == notiId) {
          final updated = Map<String, dynamic>.from(n);
          updated['isRead'] = true;
          updated['read'] = true;
          return updated;
        }
        return n;
      }).toList();
    });

    try {
      await notificationApi.put('/notifications/$notiId/read');
    } catch (e) {
      debugPrint('Lỗi cập nhật đã đọc: $e');
    }
  }

  Future<void> _handleMarkAllAsRead() async {
    if (_notifications.isEmpty || _userId.isEmpty) return;

    setState(() {
      _notifications = _notifications.map((n) {
        final updated = Map<String, dynamic>.from(n);
        updated['isRead'] = true;
        updated['read'] = true;
        return updated;
      }).toList();
    });

    try {
      await notificationApi.put('/notifications/user/$_userId/read-all');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã đánh dấu tất cả thông báo là đã đọc!'),
          backgroundColor: Color(0xFF006C49),
          duration: Duration(seconds: 2),
        ),
      );
    } catch (e) {
      debugPrint('Lỗi đánh dấu tất cả đã đọc: $e');
    }
  }

  String _formatDate(dynamic dateStr) {
    if (dateStr == null || dateStr.toString().isEmpty) return 'Vừa xong';
    try {
      final d = DateTime.parse(dateStr.toString());
      return DateFormat('dd/MM/yyyy - HH:mm').format(d);
    } catch (_) {
      return dateStr.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = _notifications.any((n) => !_checkIfRead(n));

    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF006C49)),
        ),
      );
    }

    final totalPages = max(1, (_notifications.length / _itemsPerPage).ceil());
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    final endIndex = min(startIndex + _itemsPerPage, _notifications.length);
    final currentNotifications = _notifications.isEmpty
        ? []
        : _notifications.sublist(startIndex, endIndex);

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. HEADER & ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'THÔNG BÁO TRUNG TÂM',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Tổng số: ${_notifications.length} thông báo',
                    style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              if (hasUnread)
                GestureDetector(
                  onTap: _handleMarkAllAsRead,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE6F0ED),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFD6EDE4)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.done_all_rounded, size: 14, color: Color(0xFF006C49)),
                        SizedBox(width: 4),
                        Text(
                          'Đọc tất cả',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF006C49),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 16),

          // 2. DANH SÁCH THÔNG BÁO
          if (_notifications.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
              alignment: Alignment.center,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.notifications_off_outlined, size: 36, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Không có thông báo nào mới.',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: currentNotifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final noti = currentNotifications[index];
                final bool isRead = _checkIfRead(noti);
                final String title = noti['title'] ?? 'Thông báo hệ thống';
                final String desc = noti['description'] ?? '';
                final String timeText = _formatDate(noti['createdAt']);

                return GestureDetector(
                  onTap: () {
                    if (!isRead) _handleMarkAsRead(noti);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isRead ? Colors.white : const Color(0xFFF4FAF7),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isRead ? const Color(0xFFF1F5F9) : const Color(0xFFD6EDE4),
                        width: isRead ? 1 : 1.5,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isRead ? const Color(0xFFF1F5F9) : const Color(0xFFE6F0ED),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.inventory_2_outlined,
                            size: 20,
                            color: isRead ? Colors.grey : const Color(0xFF006C49),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w900,
                                        color: isRead ? const Color(0xFF475569) : const Color(0xFF161B22),
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: Text(
                                      timeText,
                                      style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              if (desc.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  desc,
                                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.3),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

          // 3. THANH ĐIỀU KHIỂN PHÂN TRANG
          if (_notifications.length > _itemsPerPage) ...[
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('Hiển thị: ', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    DropdownButton<int>(
                      value: _itemsPerPage,
                      underline: const SizedBox.shrink(),
                      items: const [
                        DropdownMenuItem(value: 5, child: Text('5')),
                        DropdownMenuItem(value: 10, child: Text('10')),
                        DropdownMenuItem(value: 20, child: Text('20')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _itemsPerPage = val;
                            _currentPage = 1;
                          });
                        }
                      },
                    ),
                  ],
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left_rounded),
                      onPressed: _currentPage > 1 ? () => setState(() => _currentPage--) : null,
                    ),
                    Text(
                      '$_currentPage / $totalPages',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.chevron_right_rounded),
                      onPressed: _currentPage < totalPages ? () => setState(() => _currentPage++) : null,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}