import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app/api/api_client.dart';

class QuangCaoBanner extends StatefulWidget {
  const QuangCaoBanner({super.key});

  @override
  State<QuangCaoBanner> createState() => _QuangCaoBannerState();
}

class _QuangCaoBannerState extends State<QuangCaoBanner> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  // Quản lý PageView cho Banner Danh mục
  final PageController _catPageController = PageController(viewportFraction: 0.85);
  int _currentCatPage = 0;
  Timer? _catTimer;

  // Quản lý PageView cho Banner SNAP EBT
  final PageController _ebtPageController = PageController();
  int _currentEbtPage = 0;
  Timer? _ebtTimer;

  @override
  void initState() {
    super.initState();
    _fetchAds();
  }

  @override
  void dispose() {
    _catTimer?.cancel();
    _ebtTimer?.cancel();
    _catPageController.dispose();
    _ebtPageController.dispose();
    super.dispose();
  }

  Future<void> _fetchAds() async {
    try {
      final res = await promotionApi.get('/homeposters');
      if (mounted && res.data != null && res.data['success'] == true && res.data['data'] != null) {
        setState(() {
          _data = Map<String, dynamic>.from(res.data['data']);
          _loading = false;
        });
      } else {
        if (mounted) setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
    _setupTimers();
  }

  void _setupTimers() {
    final catList = _getCategoryBanners();
    final bool catAutoPlay = _data?['catAutoPlay'] ?? true;
    final int catInterval = (_data?['catInterval'] is num) ? (_data!['catInterval'] as num).toInt() : 4;

    if (catAutoPlay && catList.length > 1) {
      _catTimer?.cancel();
      _catTimer = Timer.periodic(Duration(seconds: catInterval), (_) {
        if (_catPageController.hasClients) {
          _currentCatPage = (_currentCatPage + 1) % catList.length;
          _catPageController.animateToPage(
            _currentCatPage,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
        }
      });
    }

    final ebtList = _getEbtList();
    final bool ebtAutoPlay = _data?['ebtAutoPlay'] ?? true;
    final int ebtInterval = (_data?['ebtInterval'] is num) ? (_data!['ebtInterval'] as num).toInt() : 5;

    if (ebtAutoPlay && ebtList.length > 1) {
      _ebtTimer?.cancel();
      _ebtTimer = Timer.periodic(Duration(seconds: ebtInterval), (_) {
        if (_ebtPageController.hasClients) {
          _currentEbtPage = (_currentEbtPage + 1) % ebtList.length;
          _ebtPageController.animateToPage(
            _currentEbtPage,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  Map<String, dynamic> _getHeroBanner() {
    return _data?['heroBanner'] ?? {
      'titleMain': 'Chợ Việt Nam & Châu Á',
      'titleHighlight': 'trực tuyến lớn nhất Mỹ',
      'offerBadge': '🚚 Giao hàng miễn phí cho 5 đơn đầu tiên',
      'offerSub': '*Giá trị tối thiểu \$35, thay đổi theo từng khu vực',
      'giftBadgeValue': '\$25',
      'giftBadgeText': 'Trị giá*',
      'truckImage': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
      'qrImage': 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://demimart.com/app',
      'qrText': 'Quét mã để tải app',
      'appReviewCount': 'Hơn 1 triệu lượt review',
    };
  }

  List<dynamic> _getCategoryBanners() {
    final list = _data?['categoryBanners'];
    if (list is List && list.isNotEmpty) return list;
    return [
      {
        'tag': 'Đặc sản',
        'title': 'Xôi Chè\nViệt Nam',
        'subtitle': 'Dẻo thơm hương nếp ngọt thanh vị chè!',
        'image': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80',
        'imageOnly': false,
        'showButton': true,
      },
      {
        'tag': 'Thực phẩm thiết yếu',
        'title': 'Món chay\nViệt Nam',
        'subtitle': 'Nguyên liệu thanh đạm, bữa ăn hài hòa',
        'image': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        'imageOnly': false,
        'showButton': true,
      },
      {
        'tag': 'Thực phẩm thiết yếu',
        'title': 'Cà phê & Trà',
        'subtitle': 'Cho mỗi ngày đều tràn năng lượng!',
        'image': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
        'imageOnly': false,
        'showButton': true,
      },
      {
        'tag': 'Đặc sản',
        'title': 'Bánh Mì',
        'subtitle': 'Khám phá nguyên bản Bánh Mì Việt Nam',
        'image': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        'imageOnly': false,
        'showButton': true,
      }
    ];
  }

  List<dynamic> _getEbtList() {
    final list = _data?['ebtList'];
    if (list is List && list.isNotEmpty) return list;
    return [
      {
        'useBannerImage': false,
        'bannerImageUrl': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=120&q=80',
        'title': 'Chúng tôi hiện chấp nhận thanh toán SNAP EBT',
        'subtitle': 'Sắm thực phẩm Việt & được giao hàng miễn phí',
        'note': '*Điều kiện EBT khác nhau theo từng tiểu bang.',
      }
    ];
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        height: 180,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(24),
        ),
      );
    }

    final hero = _getHeroBanner();
    final catList = _getCategoryBanners();
    final ebtList = _getEbtList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. TOP HERO BANNER
        _buildHeroBanner(hero),

        const SizedBox(height: 16),

        // 2. SLIDER BANNER DANH MỤC TRƯỢT NGANG SẮC NÉT
        _buildCategorySlider(catList),

        const SizedBox(height: 16),

        // 3. THANH THÔNG BÁO SNAP EBT ĐỘNG
        _buildEbtBanner(ebtList),
      ],
    );
  }

  // --- 1. HERO BANNER ---
  Widget _buildHeroBanner(Map<String, dynamic> hero) {
    final String titleMain = hero['titleMain'] ?? '';
    final String titleHighlight = hero['titleHighlight'] ?? '';
    final String offerBadge = hero['offerBadge'] ?? '';
    final String offerSub = hero['offerSub'] ?? '';
    final String giftBadgeValue = hero['giftBadgeValue'] ?? '\$25';
    final String giftBadgeText = hero['giftBadgeText'] ?? 'Trị giá*';
    final String truckImage = hero['truckImage'] ?? '';
    final String qrImage = hero['qrImage'] ?? '';
    final String qrText = hero['qrText'] ?? 'Quét mã để tải app';
    final String appReviewCount = hero['appReviewCount'] ?? 'Hơn 1 triệu lượt review';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF4FAF7), Colors.white, Color(0xFFFFF7ED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFE6F0ED)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            titleMain,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF161B22),
              height: 1.15,
            ),
          ),
          Text(
            titleHighlight,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF006C49),
              height: 1.15,
            ),
          ),
          const SizedBox(height: 10),

          // Offer Badge
          if (offerBadge.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFFFEA619),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                offerBadge,
                style: const TextStyle(
                  color: Color(0xFF684000),
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          if (offerSub.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              offerSub,
              style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
            ),
          ],
          const SizedBox(height: 14),

          // Ảnh xe giao hàng & Gift badge & QR Code
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Badge $25 xoay góc nổi bật
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFFEC4899), Color(0xFFF43F5E)]),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.pink.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      giftBadgeValue,
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                    Text(
                      giftBadgeText,
                      style: const TextStyle(color: Colors.white70, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),

              // Xe giao hàng Demi Mart rõ nét
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      truckImage,
                      height: 72,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(Icons.local_shipping, size: 40, color: Color(0xFF006C49)),
                    ),
                  ),
                ),
              ),

              // QR Code Box
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFD6EDE4)),
                ),
                child: Column(
                  children: [
                    Image.network(
                      qrImage,
                      width: 52,
                      height: 52,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(Icons.qr_code, size: 36, color: Color(0xFF006C49)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      appReviewCount,
                      style: const TextStyle(fontSize: 7, color: Color(0xFF006C49), fontWeight: FontWeight.bold),
                    )
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // --- 2. BANNER DANH MỤC (ẢNH RÕ NÉT, HỖ TRỢ IMAGE ONLY VÀ NÚT BẤM) ---
  Widget _buildCategorySlider(List<dynamic> list) {
    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _catPageController,
            itemCount: list.length,
            onPageChanged: (index) => setState(() => _currentCatPage = index),
            itemBuilder: (context, index) {
              final item = list[index];
              final String title = item['title'] ?? '';
              final String subtitle = item['subtitle'] ?? '';
              final String tag = item['tag'] ?? '';
              final String imageUrl = item['image'] ?? '';
              final bool imageOnly = item['imageOnly'] == true;
              final bool showButton = item['showButton'] != false;

              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // 1. Ảnh hiển thị rõ nét
                      Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: const Color(0xFF006C49)),
                      ),

                      // 2. Nếu không phải imageOnly thì hiển thị nhãn và nội dung chữ
                      if (!imageOnly) ...[
                        // Gradient nhẹ ở chân ảnh để đọc chữ rõ ràng
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withOpacity(0.75),
                              ],
                              stops: const [0.35, 1.0],
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              if (tag.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.4),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    tag,
                                    style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                                  ),
                                )
                              else
                                const SizedBox.shrink(),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          title,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w900,
                                            height: 1.15,
                                          ),
                                        ),
                                        if (subtitle.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            subtitle,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(color: Colors.white70, fontSize: 11),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  if (showButton)
                                    Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.arrow_forward_rounded, color: Color(0xFF006C49), size: 16),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // Nút bấm lùi
        if (list.length > 1)
          Positioned(
            left: 20,
            child: GestureDetector(
              onTap: () {
                final target = (_currentCatPage - 1 + list.length) % list.length;
                _catPageController.animateToPage(target, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
              },
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                ),
                child: const Icon(Icons.chevron_left, color: Colors.black87, size: 20),
              ),
            ),
          ),

        // Nút bấm tiến
        if (list.length > 1)
          Positioned(
            right: 20,
            child: GestureDetector(
              onTap: () {
                final target = (_currentCatPage + 1) % list.length;
                _catPageController.animateToPage(target, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
              },
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                ),
                child: const Icon(Icons.chevron_right, color: Colors.black87, size: 20),
              ),
            ),
          ),
      ],
    );
  }

  // --- 3. BANNER SNAP EBT (HỖ TRỢ ẢNH BANNER FULL HOẶC THẺ CARD XANH) ---
  Widget _buildEbtBanner(List<dynamic> ebtList) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      height: 75,
      child: PageView.builder(
        controller: _ebtPageController,
        itemCount: ebtList.length,
        onPageChanged: (index) => setState(() => _currentEbtPage = index),
        itemBuilder: (context, index) {
          final item = ebtList[index];
          final bool useBannerImage = item['useBannerImage'] == true;
          final String? bannerImageUrl = item['bannerImageUrl'];

          // 1. Trường hợp sử dụng hình ảnh Banner Full rõ nét
          if (useBannerImage && bannerImageUrl != null && bannerImageUrl.isNotEmpty) {
            return ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.network(
                bannerImageUrl,
                fit: BoxFit.cover,
                width: double.infinity,
                errorBuilder: (_, __, ___) => _buildEbtCard(item),
              ),
            );
          }

          // 2. Trường hợp thẻ xanh chuẩn SNAP EBT
          return _buildEbtCard(item);
        },
      ),
    );
  }

  Widget _buildEbtCard(dynamic item) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF00875A),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF059669)),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: const Text(
              'SNAP',
              style: TextStyle(color: Color(0xFF00875A), fontWeight: FontWeight.w900, fontSize: 10),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  item['title'] ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12),
                ),
                Text(
                  '${item['subtitle'] ?? ''} ${item['note'] ?? ''}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white70, fontSize: 10),
                ),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 14),
        ],
      ),
    );
  }
}