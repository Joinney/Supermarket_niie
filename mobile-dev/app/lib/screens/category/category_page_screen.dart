import 'package:flutter/material.dart';
import 'package:app/api/api_client.dart';
import 'package:app/screens/category/category_detail_screen.dart';

class CategoryPageScreen extends StatefulWidget {
  const CategoryPageScreen({super.key});

  @override
  State<CategoryPageScreen> createState() => _CategoryPageScreenState();
}

class _CategoryPageScreenState extends State<CategoryPageScreen> {
  bool _isLoading = true;
  List<dynamic> _categories = [];

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    setState(() => _isLoading = true);
    try {
      final response = await productApi.get('/categories/tree?country=vn&role=client');
      if (response.data is List) {
        setState(() {
          _categories = response.data;
        });
      }
    } catch (e) {
      debugPrint('Lỗi tải danh sách danh mục cha: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getAvatarUrl(String name) {
    return 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=e6f0ed&color=006c49&font-size=0.4';
  }

  void _navigateToSubCategory(Map<String, dynamic> category) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CategoryDetailScreen(
          slug: category['slug'] ?? 'tat-ca',
          categoryName: category['name'] ?? category['ten_danh_muc'],
          parentCategoryData: category,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFBFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        automaticallyImplyLeading: false,
        title: const Text(
          'Danh mục sản phẩm',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: Color(0xFF161B22),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF006C49)))
          : RefreshIndicator(
              color: const Color(0xFF006C49),
              onRefresh: _fetchCategories,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final String name = cat['name'] ?? cat['ten_danh_muc'] ?? 'Danh mục';
                  final String? image = cat['image'] ?? cat['hinh_anh'];
                  final List children = (cat['children'] is List) ? cat['children'] : [];
                  final bool isHot = cat['hot'] == true;

                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(11),
                          child: Image.network(
                            image ?? _getAvatarUrl(name),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Image.network(_getAvatarUrl(name), fit: BoxFit.cover),
                          ),
                        ),
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          if (isHot)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEA619),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'HOT',
                                style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFF684000)),
                              ),
                            ),
                        ],
                      ),
                      subtitle: Text(
                        children.isNotEmpty
                            ? '${children.length} danh mục con'
                            : 'Xem tất cả sản phẩm',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Color(0xFF006C49)),
                      onTap: () => _navigateToSubCategory(cat),
                    ),
                  );
                },
              ),
            ),
    );
  }
}