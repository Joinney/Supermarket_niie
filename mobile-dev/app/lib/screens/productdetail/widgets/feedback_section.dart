import 'package:flutter/material.dart';

class FeedbackSection extends StatefulWidget {
  final Map<String, dynamic> reviewData;

  const FeedbackSection({super.key, required this.reviewData});

  @override
  State<FeedbackSection> createState() => _FeedbackSectionState();
}

class _FeedbackSectionState extends State<FeedbackSection> {
  String _activeFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final summary = widget.reviewData['summary'];
    final List<dynamic> reviews = widget.reviewData['reviews'] ?? [];

    final filterOptions = [
      {'id': 'all', 'label': 'Tất Cả', 'count': summary?['total'] ?? reviews.length},
      {'id': '5star', 'label': '5 Sao', 'count': summary?['5'] ?? 0},
      {'id': '4star', 'label': '4 Sao', 'count': summary?['4'] ?? 0},
      {'id': '3star', 'label': '3 Sao', 'count': summary?['3'] ?? 0},
      {'id': 'media', 'label': 'Có Ảnh / Video', 'count': summary?['hasMedia'] ?? 0},
    ];

    final filteredReviews = reviews.where((r) {
      if (_activeFilter == 'all') return true;
      if (_activeFilter == 'media') return r['media'] is List && (r['media'] as List).isNotEmpty;
      if (_activeFilter.endsWith('star')) {
        final starVal = int.tryParse(_activeFilter.replaceAll('star', '')) ?? 5;
        return r['so_sao'] == starVal;
      }
      return true;
    }).toList();

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: Color(0xFF006C49)),
              const SizedBox(width: 8),
              const Text(
                'ĐÁNH GIÁ SẢN PHẨM',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
              ),
              const Spacer(),
              Text(
                '(${summary?['total'] ?? reviews.length} đánh giá)',
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Tổng quan Rating
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF4FAF7),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFD6EDE4)),
            ),
            child: Row(
              children: [
                Text(
                  '${summary?['avgRating'] ?? 5.0}',
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: List.generate(
                        5,
                        (index) => const Icon(Icons.star_rounded, color: Colors.amber, size: 16),
                      ),
                    ),
                    const Text('Đánh giá thực tế từ khách hàng', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: filterOptions.map((f) {
                final isSelected = _activeFilter == f['id'];
                return GestureDetector(
                  onTap: () => setState(() => _activeFilter = f['id'] as String),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF006C49) : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF006C49) : Colors.grey.shade300,
                      ),
                    ),
                    child: Text(
                      '${f['label']} (${f['count']})',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : Colors.black87,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 14),

          // Danh sách Reviews
          if (filteredReviews.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: Text('Chưa có đánh giá nào phù hợp bộ lọc.', style: TextStyle(color: Colors.grey))),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredReviews.length > 5 ? 5 : filteredReviews.length,
              separatorBuilder: (_, __) => const Divider(height: 20),
              itemBuilder: (context, index) {
                final r = filteredReviews[index];
                final List<dynamic> media = r['media'] ?? [];

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: const Color(0xFFE6F0ED),
                          child: Text(
                            (r['user']?['username'] ?? 'U').toString().substring(0, 1).toUpperCase(),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF006C49)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          r['user']?['username'] ?? 'Khách hàng',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        const Spacer(),
                        Row(
                          children: List.generate(
                            r['so_sao'] ?? 5,
                            (_) => const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      r['noi_dung'] ?? '',
                      style: const TextStyle(fontSize: 12, color: Colors.black87),
                    ),
                    if (media.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 55,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: media.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 6),
                          itemBuilder: (_, mIdx) => ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              media[mIdx]['url'] ?? '',
                              width: 55,
                              height: 55,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}