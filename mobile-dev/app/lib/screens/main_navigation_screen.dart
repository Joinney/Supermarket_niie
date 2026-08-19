import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:app/screens/homeindex/home_screen.dart';
import 'package:app/screens/category/category_page_screen.dart';
import 'package:app/screens/promotion/promotion_page_screen.dart';
import 'package:app/screens/giohang/cart_screen.dart';
import 'package:app/screens/profile/profile_screen.dart';
import 'package:app/screens/auth/login_screen.dart'; // 🌟 Import trang Login

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    CategoryPageScreen(),
    PromotionPageScreen(),
    CartScreen(),
    ProfileScreen(),
  ];

  // 🌟 Hàm kiểm tra xem người dùng đã đăng nhập chưa
  bool _checkIsLoggedIn() {
    final box = Hive.box('auth_box');
    final token = box.get('token') ?? box.get('accessToken');
    return token != null && token.toString().isNotEmpty;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (int index) {
          // 🌟 Kiểm tra nếu người dùng bấm vào tab cuối cùng (index == 4 tương ứng với 'Tài khoản')
          if (index == 4) {
            if (!_checkIsLoggedIn()) {
              // Nếu chưa đăng nhập -> Chuyển hướng sang trang Login
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
              return; // Ngừng không cho đổi index sang ProfileScreen nữa
            }
          }

          // Nếu đã đăng nhập hoặc bấm các tab khác thì cho phép chuyển bình thường
          setState(() {
            _selectedIndex = index;
          });
        },
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFE0F2F1),
        elevation: 8,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFF00897B)),
            label: 'Trang chủ',
          ),
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view_rounded, color: Color(0xFF00897B)),
            label: 'Danh mục',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_offer_outlined),
            selectedIcon: Icon(Icons.local_offer, color: Color(0xFF00897B)),
            label: 'Khuyến mãi',
          ),
          NavigationDestination(
            icon: Badge(
              label: Text('0'),
              child: Icon(Icons.shopping_cart_outlined),
            ),
            selectedIcon: Badge(
              label: Text('0'),
              child: Icon(Icons.shopping_cart, color: Color(0xFF00897B)),
            ),
            label: 'Giỏ hàng',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFF00897B)),
            label: 'Tài khoản',
          ),
        ],
      ),
    );
  }
}