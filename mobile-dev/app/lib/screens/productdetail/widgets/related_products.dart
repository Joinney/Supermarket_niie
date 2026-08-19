import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/screens/productdetail/product_detail_screen.dart';

class RelatedProducts extends StatelessWidget {
  final List<dynamic> products;

  const RelatedProducts({super.key, required this.products});

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
            'Sản phẩm liên quan',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
          ),
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: products.length > 4 ? 4 : products.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final prod = products[index];
              final double price = double.tryParse(
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
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        prod['hinh_anh_chinh'] ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e',
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            prod['ten_san_pham'] ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            currencyFormat.format(price),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFFFF3B30)),
                          ),
                        ],
                      ),
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