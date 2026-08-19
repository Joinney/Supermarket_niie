import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';
import 'package:app/widgets/product/product_card.dart';
import 'package:app/widgets/home/quang_cao_banner.dart';
import 'package:app/screens/productdetail/product_detail_screen.dart';
import 'package:app/screens/category/category_detail_screen.dart'; // Import màn hình danh mục sản phẩm

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Trạng thái tải dữ liệu
  bool _isLoading = true;

  // Dữ liệu API Backend
  List<dynamic> _apiProducts = [];
  List<dynamic> _topFavoriteProducts = [];
  List<dynamic> _flashSaleData = [];
  List<dynamic> _categories = [];

  // Controllers cho hiệu ứng tự động trượt chéo vô tận 2 dòng
  final ScrollController _scrollControllerRow1 = ScrollController();
  final ScrollController _scrollControllerRow2 = ScrollController();
  Timer? _autoScrollTimer;

  // Trạng thái Flash Sale
  String _selectedFlashSlot = "running";
  Timer? _countdownTimer;
  DateTime _currentTime = DateTime.now();

  // Trạng thái Khám phá bộ sưu tập (5 Tab)
  int _selectedCollectionIndex = 0;
  final List<Map<String, String>> _collectionTabs = [
    {"id": "recommend", "label": "Gợi ý cho bạn"},
    {"id": "chosen", "label": "Chúng tôi chọn"},
    {"id": "new_release", "label": "Hàng mới về"},
    {"id": "good_price", "label": "Giá tốt mỗi ngày"},
    {"id": "week_new", "label": "Mới về tuần này"},
  ];

  final NumberFormat _currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _fetchHomeData();

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
      }
    });

    _startInfinitePillMarquee();
  }

  // Khởi động chuyển động trượt mượt mà vô tận cho 2 dòng viên thuốc
  void _startInfinitePillMarquee() {
    _autoScrollTimer = Timer.periodic(const Duration(milliseconds: 30), (_) {
      if (!mounted) return;

      // Dòng 1: Trượt từ từ sang phải
      if (_scrollControllerRow1.hasClients) {
        final max1 = _scrollControllerRow1.position.maxScrollExtent;
        final current1 = _scrollControllerRow1.offset;
        if (current1 >= max1) {
          _scrollControllerRow1.jumpTo(0);
        } else {
          _scrollControllerRow1.jumpTo(current1 + 0.6);
        }
      }

      // Dòng 2: Trượt từ từ ngược chiều
      if (_scrollControllerRow2.hasClients) {
        final max2 = _scrollControllerRow2.position.maxScrollExtent;
        final current2 = _scrollControllerRow2.offset;
        if (current2 >= max2) {
          _scrollControllerRow2.jumpTo(0);
        } else {
          _scrollControllerRow2.jumpTo(current2 + 0.8);
        }
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _autoScrollTimer?.cancel();
    _scrollControllerRow1.dispose();
    _scrollControllerRow2.dispose();
    super.dispose();
  }

  // --- HÀM ĐIỀU HƯỚNG QUA TRANG CHI TIẾT SẢN PHẨM ---
  void _navigateToDetail(dynamic productId) {
    if (productId == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProductDetailScreen(productId: productId.toString()),
      ),
    );
  }

 // --- HÀM ĐIỀU HƯỚNG BẤM TỪ TRANG HOME SANG CATEGORY DETAIL ---
void _navigateToCategory(String slug, String categoryName) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => CategoryDetailScreen(
        slug: slug,
        categoryName: categoryName,
      ),
    ),
  );
}

  // --- HÀM GỌI DỮ LIỆU TỪ BACKEND GATEWAY ---
  Future<dynamic> _safeApiCall(Future<dynamic> apiCall, String apiName) async {
    try {
      return await apiCall;
    } catch (e) {
      debugPrint('Lỗi API $apiName: $e');
      return null;
    }
  }

  Future<void> _fetchHomeData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final responses = await Future.wait([
        _safeApiCall(productApi.get('/products?role=client&limit=100&country=vn'), 'Products'),
        _safeApiCall(productApi.get('/products/top/favorites'), 'Top Favorites'),
        _safeApiCall(promotionApi.get('/client/flash-sale/active'), 'Flash Sale'),
        _safeApiCall(productApi.get('/categories/tree?country=vn'), 'Categories'),
      ]);

      if (!mounted) return;

      final prodRes = responses[0];
      final favRes = responses[1];
      final flashRes = responses[2];
      final catRes = responses[3];

      setState(() {
        if (prodRes?.data != null) {
          final d = prodRes.data;
          if (d is List) {
            _apiProducts = d;
          } else if (d['data'] is List) {
            _apiProducts = d['data'];
          } else if (d['products'] is List) {
            _apiProducts = d['products'];
          }
        }

        if (favRes?.data != null) {
          final d = favRes.data;
          if (d is List) {
            _topFavoriteProducts = d;
          } else if (d['data'] is List) {
            _topFavoriteProducts = d['data'];
          }
        }

        if (flashRes?.data != null) {
          final d = flashRes.data;
          if (d is List) {
            _flashSaleData = d;
          } else if (d['data'] is List) {
            _flashSaleData = d['data'];
          } else if (d['success'] == true && d['data'] is List) {
            _flashSaleData = d['data'];
          }
        }

        if (catRes?.data != null) {
          final d = catRes.data;
          if (d is List) {
            _categories = d;
          } else if (d['data'] is List) {
            _categories = d['data'];
          }
        }

        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Lỗi tổng Trang Chủ: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<dynamic> get _runningPromos {
    return _flashSaleData.where((item) {
      final chuongTrinh = item['chuong_trinh'];
      if (chuongTrinh == null) return false;
      final start = DateTime.tryParse(chuongTrinh['thoi_gian_bat_dau'] ?? '') ?? DateTime.now();
      final end = DateTime.tryParse(chuongTrinh['thoi_gian_ket_thuc'] ?? '') ?? DateTime.now();
      return start.isBefore(_currentTime) && end.isAfter(_currentTime);
    }).toList();
  }

  List<dynamic> get _upcomingPromos {
    return _flashSaleData.where((item) {
      final chuongTrinh = item['chuong_trinh'];
      if (chuongTrinh == null) return false;
      final start = DateTime.tryParse(chuongTrinh['thoi_gian_bat_dau'] ?? '') ?? DateTime.now();
      return start.isAfter(_currentTime);
    }).toList();
  }

  String _twoDigits(int n) => n.toString().padLeft(2, '0');

  Map<String, String> _getTimeLeft(DateTime? endTime) {
    if (endTime == null) return {"hh": "00", "mm": "00", "ss": "00"};
    final diff = endTime.difference(_currentTime);
    if (diff.isNegative) return {"hh": "00", "mm": "00", "ss": "00"};

    return {
      "hh": _twoDigits(diff.inHours),
      "mm": _twoDigits(diff.inMinutes.remainder(60)),
      "ss": _twoDigits(diff.inSeconds.remainder(60)),
    };
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0đ';
    final numVal = num.tryParse(price.toString()) ?? 0;
    return _currencyFormat.format(numVal);
  }

  String _getAvatarUrl(String name) {
    return 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=e6f0ed&color=006c49&font-size=0.4';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFBFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F0ED),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.storefront_rounded, color: Color(0xFF006C49)),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Demi Mart',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF161B22),
                  ),
                ),
                Text(
                  'Thực phẩm tươi ngon mỗi ngày',
                  style: TextStyle(fontSize: 11, color: Colors.black54),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: Colors.black87),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFF006C49),
        onRefresh: _fetchHomeData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. THANH TÌM KIẾM
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: const TextField(
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm sản phẩm, thực phẩm tươi...',
                      hintStyle: TextStyle(fontSize: 14, color: Colors.grey),
                      border: InputBorder.none,
                      icon: Icon(Icons.search, color: Colors.grey),
                    ),
                  ),
                ),
              ),

              // 2. HAI DÒNG VIÊN THUỐC CHÉO SO LE & TỰ ĐỘNG CHUYỂN ĐỘNG VÔ TẬN
              _buildStaggeredPillsSection(),

              const SizedBox(height: 12),

              // 3. BANNER QUẢNG CÁO & HERO
              const QuangCaoBanner(),
              const SizedBox(height: 12),

              // 4. FLASH SALE SECTION
              _buildFlashSaleSection(),

              const SizedBox(height: 16),

              // 5. TOP SẢN PHẨM YÊU THÍCH
              _buildTopFavoritesSection(),

              const SizedBox(height: 20),

              // 6. KHÁM PHÁ BỘ SƯU TẬP
              _buildCollectionSection(),

              const SizedBox(height: 20),

              // 7. BANNER KHUYẾN MÃI NGANG
              _buildPromoBanner(),

              const SizedBox(height: 24),

              // 8. GLOBAL+ BẢNG XẾP HẠNG
              _buildRankingSection(),
            ],
          ),
        ),
      ),
    );
  }

  // --- WIDGET 2 DÒNG VIÊN THUỐC CHÉO SO LE VÀ TỰ ĐỘNG CHUYỂN ĐỘNG VÒNG LẶP ---
  Widget _buildStaggeredPillsSection() {
    if (_categories.isEmpty && _isLoading) {
      return Container(
        height: 88,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        child: Column(
          children: [
            Container(
              height: 38,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 38,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ],
        ),
      );
    }

    if (_categories.isEmpty) return const SizedBox.shrink();

    final List<dynamic> row1Items = [];
    final List<dynamic> row2Items = [];
    for (int i = 0; i < _categories.length; i++) {
      if (i % 2 == 0) {
        row1Items.add(_categories[i]);
      } else {
        row2Items.add(_categories[i]);
      }
    }

    final infiniteRow1 = [...row1Items, ...row1Items, ...row1Items, ...row1Items];
    final infiniteRow2 = [...row2Items, ...row2Items, ...row2Items, ...row2Items];

    return Column(
      children: [
        // DÒNG 1
        SizedBox(
          height: 42,
          child: ListView.builder(
            controller: _scrollControllerRow1,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: infiniteRow1.length,
            padding: const EdgeInsets.only(left: 16),
            itemBuilder: (context, index) {
              return _buildSinglePill(infiniteRow1[index]);
            },
          ),
        ),

        const SizedBox(height: 8),

        // DÒNG 2
        SizedBox(
          height: 42,
          child: ListView.builder(
            controller: _scrollControllerRow2,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: infiniteRow2.length,
            padding: const EdgeInsets.only(left: 38),
            itemBuilder: (context, index) {
              return _buildSinglePill(infiniteRow2[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSinglePill(dynamic cat) {
    final String catName = cat['name'] ?? cat['ten_danh_muc'] ?? 'Danh mục';
    final String? catImage = cat['image'] ?? cat['hinh_anh'];
    final String catSlug = cat['slug'] ?? 'tat-ca';
    final bool isHot = cat['hot'] == true;

    return GestureDetector(
      onTap: () => _navigateToCategory(catSlug, catName),
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.025),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Container(
                width: 26,
                height: 26,
                color: const Color(0xFFF1F5F9),
                child: Image.network(
                  catImage ?? _getAvatarUrl(catName),
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Image.network(
                    _getAvatarUrl(catName),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              catName,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
            ),
            if (isHot) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEA619),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'HOT',
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF684000),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // --- FLASH SALE WIDGET ---
  Widget _buildFlashSaleSection() {
    final running = _runningPromos;
    final upcoming = _upcomingPromos;
    final activePromo = running.isNotEmpty ? running[0] : null;

    DateTime? endTime;
    if (activePromo != null && activePromo['chuong_trinh'] != null) {
      endTime = DateTime.tryParse(activePromo['chuong_trinh']['thoi_gian_ket_thuc'] ?? '');
    }
    final timeLeft = _getTimeLeft(endTime);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF3B30), Color(0xFFFF6B00), Color(0xFFFF3B30)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.red.withOpacity(0.12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(21),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF3B30), Color(0xFFFF6B00)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.bolt, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'GIỜ VÀNG DEAL SỐC',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          color: Color(0xFFFF3B30),
                        ),
                      ),
                      if (_selectedFlashSlot == "running" && activePromo != null)
                        Row(
                          children: [
                            const Text(
                              'KẾT THÚC TRONG ',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.red),
                            ),
                            _buildTimerBox(timeLeft["hh"]!),
                            const Text(' : ', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                            _buildTimerBox(timeLeft["mm"]!),
                            const Text(' : ', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                            _buildTimerBox(timeLeft["ss"]!, isPulse: true),
                          ],
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedFlashSlot = "running"),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        gradient: _selectedFlashSlot == "running"
                            ? const LinearGradient(colors: [Color(0xFFFF3B30), Color(0xFFFF6B00)])
                            : null,
                        color: _selectedFlashSlot == "running" ? null : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'Đang diễn ra • Live',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _selectedFlashSlot == "running" ? Colors.white : Colors.black87,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedFlashSlot = "upcoming"),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        gradient: _selectedFlashSlot == "upcoming"
                            ? const LinearGradient(colors: [Color(0xFFFF3B30), Color(0xFFFF6B00)])
                            : null,
                        color: _selectedFlashSlot == "upcoming" ? null : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'Sắp diễn ra (${upcoming.length})',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _selectedFlashSlot == "upcoming" ? Colors.white : Colors.black87,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            if (_selectedFlashSlot == "running")
              running.isNotEmpty && (running[0]['products'] as List?)?.isNotEmpty == true
                  ? SizedBox(
                      height: 250,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: (running[0]['products'] as List).length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final item = running[0]['products'][index];
                          final saleInfo = item['thong_tin_sale'] ?? {};
                          final int sold = saleInfo['da_ban'] ?? 0;
                          final int limit = saleInfo['so_luong_gioi_han'] ?? 30;
                          final double percent = limit > 0 ? (sold / limit).clamp(0.0, 1.0) : 0.0;
                          final productId = item['ma_san_pham'] ?? item['id'];

                          return SizedBox(
                            width: 155,
                            child: GestureDetector(
                              onTap: () => _navigateToDetail(productId),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: ProductCard(
                                      p: Map<String, dynamic>.from(item),
                                      categoryName: 'Siêu Sale',
                                      categorySlug: 'khuyen-mai',
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Stack(
                                    children: [
                                      Container(
                                        height: 18,
                                        decoration: BoxDecoration(
                                          color: Colors.orange.shade100,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                      ),
                                      FractionallySizedBox(
                                        widthFactor: percent,
                                        child: Container(
                                          height: 18,
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [Colors.amber, Color(0xFFFF6B00)],
                                            ),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                        ),
                                      ),
                                      Positioned.fill(
                                        child: Center(
                                          child: Text(
                                            sold >= limit ? 'HẾT HÀNG' : 'Còn ${limit - sold}/$limit suất',
                                            style: const TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF5D1D00),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    )
                  : Container(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      alignment: Alignment.center,
                      child: const Text(
                        'Hiện chưa có sản phẩm Flash Sale nào đang mở bán.',
                        style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                      ),
                    )
            else
              upcoming.isNotEmpty
                  ? Column(
                      children: upcoming.map((promo) {
                        final ct = promo['chuong_trinh'] ?? {};
                        final startStr = ct['thoi_gian_bat_dau'] ?? '';
                        final startDate = DateTime.tryParse(startStr);
                        final dateText = startDate != null
                            ? DateFormat('HH:mm - dd/MM/yyyy').format(startDate)
                            : startStr;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    ct['ten_chuong_trinh'] ?? 'Chương trình Flash Sale',
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFFF3B30)),
                                  ),
                                  Text(
                                    'Bắt đầu: $dateText',
                                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'SẮP MỞ',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    )
                  : Container(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      alignment: Alignment.center,
                      child: const Text(
                        'Chưa có lịch Flash Sale sắp tới.',
                        style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                      ),
                    ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimerBox(String text, {bool isPulse = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: isPulse ? const Color(0xFFFF3B30) : const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
      ),
    );
  }

  // --- TOP YÊU THÍCH ---
  Widget _buildTopFavoritesSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(width: 4, height: 18, color: const Color(0xFF006C49)),
                  const SizedBox(width: 8),
                  const Text(
                    'TOP YÊU THÍCH',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF161B22)),
                  ),
                ],
              ),
              const Row(
                children: [
                  Text(
                    'Xem thêm',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF006C49)),
                  ),
                  Icon(Icons.chevron_right, size: 16, color: Color(0xFF006C49)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          _isLoading
              ? SizedBox(
                  height: 200,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: 4,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (_, __) => Container(
                      width: 140,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                )
              : _topFavoriteProducts.isEmpty
                  ? Container(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      alignment: Alignment.center,
                      child: const Text('Chưa có sản phẩm yêu thích nào!', style: TextStyle(color: Colors.grey)),
                    )
                  : SizedBox(
                      height: 200,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _topFavoriteProducts.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final p = _topFavoriteProducts[index];
                          final productId = p['ma_san_pham'] ?? p['id'];

                          return SizedBox(
                            width: 140,
                            child: GestureDetector(
                              onTap: () => _navigateToDetail(productId),
                              child: ProductCard(
                                p: Map<String, dynamic>.from(p),
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

  // --- BỘ SƯU TẬP ---
  Widget _buildCollectionSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F0ED),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(Icons.auto_awesome, color: Color(0xFF006C49), size: 16),
              ),
              const SizedBox(width: 8),
              const Text(
                'Khám phá bộ sưu tập',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  fontStyle: FontStyle.italic,
                  color: Color(0xFF161B22),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: List.generate(_collectionTabs.length, (index) {
              final isSelected = _selectedCollectionIndex == index;
              return GestureDetector(
                onTap: () => setState(() => _selectedCollectionIndex = index),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF006C49) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _collectionTabs[index]['label']!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : Colors.grey.shade700,
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 14),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _isLoading
              ? GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: 4,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 0.76,
                  ),
                  itemBuilder: (_, __) => Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                )
              : _apiProducts.isEmpty
                  ? Container(
                      padding: const EdgeInsets.symmetric(vertical: 30),
                      alignment: Alignment.center,
                      child: const Text('Đang cập nhật danh sách sản phẩm...', style: TextStyle(color: Colors.grey)),
                    )
                  : GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _apiProducts.length > 8 ? 8 : _apiProducts.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 0.76,
                      ),
                      itemBuilder: (context, index) {
                        final p = _apiProducts[index];
                        final productId = p['ma_san_pham'] ?? p['id'];

                        return GestureDetector(
                          onTap: () => _navigateToDetail(productId),
                          child: ProductCard(
                            p: Map<String, dynamic>.from(p),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  // --- BANNER NGANG ---
  Widget _buildPromoBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF006C49),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Tuần lễ Việt Nam Toàn Cầu+',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
              ),
              SizedBox(height: 4),
              Text(
                'Khám phá hương vị không biên giới!',
                style: TextStyle(color: Colors.white70, fontSize: 11),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.arrow_forward, color: Color(0xFF006C49), size: 20),
          ),
        ],
      ),
    );
  }

  // --- BẢNG XẾP HẠNG TOP 3 ---
  Widget _buildRankingSection() {
    final topThree = _apiProducts.take(3).toList();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.amber.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.emoji_events, color: Colors.amber, size: 20),
              ),
              const SizedBox(width: 8),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Global+ Bảng xếp hạng',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic),
                  ),
                  Text(
                    'CẬP NHẬT MỖI NGÀY',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF006C49)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (topThree.isNotEmpty)
            Row(
              children: List.generate(topThree.length, (index) {
                final p = topThree[index];
                final colors = [Colors.amber, Colors.grey.shade400, Colors.brown.shade300];
                final productId = p['ma_san_pham'] ?? p['id'];

                return Expanded(
                  child: GestureDetector(
                    onTap: () => _navigateToDetail(productId),
                    child: Container(
                      margin: EdgeInsets.only(right: index < topThree.length - 1 ? 8 : 0),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: index == 0 ? Colors.amber.shade50 : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: index == 0 ? Colors.amber.shade200 : Colors.grey.shade200),
                      ),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor: colors[index],
                            child: Text(
                              '#${index + 1}',
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            p['ten_san_pham'] ?? 'Sản phẩm',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _formatPrice(p['gia_ban']),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF006C49)),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              alignment: Alignment.center,
              child: const Text('Đang cập nhật bảng xếp hạng...', style: TextStyle(color: Colors.grey)),
            ),
        ],
      ),
    );
  }
}