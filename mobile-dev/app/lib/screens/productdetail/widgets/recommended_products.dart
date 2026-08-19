import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/screens/productdetail/product_detail_screen.dart';

class RecommendedProducts extends StatelessWidget {
  final List<dynamic> products;
  final Function(dynamic product)? onAddToCart;

  const RecommendedProducts({super.key, required this.products, this.onAddToCart});

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) return const SizedBox.shrink();
    final NumberFormat currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Đề xuất cho bạn',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 190,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: products.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final prod = products[index];
                final double rPrice = double.tryParse(
                        (prod['gia_ban_thap_nhat'] ?? prod['gia_ban'] ?? 0).toString().replaceAll(RegExp(r'[^0-9.-]'), '')) ??
                    0.0;

                return GestureDetector(
                  onTap: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ProductDetailScreen(productId: prod['ma_san_pham'].toString()),
                      ),
                    );
                  },
                  child: Container(
                    width: 135,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  prod['hinh_anh_chinh'] ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e',
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                ),
                              ),
                              Positioned(
                                bottom: 4,
                                right: 4,
                                child: GestureDetector(
                                  onTap: () => onAddToCart?.call(prod),
                                  child: Container(
                                    width: 24,
                                    height: 24,
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
                                    ),
                                    child: const Icon(Icons.add, size: 16, color: Color(0xFF006C49)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          prod['ten_san_pham'] ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          currencyFormat.format(rPrice),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFFF3B30)),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}