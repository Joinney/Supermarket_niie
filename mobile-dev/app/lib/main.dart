import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:app/screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await Hive.openBox('auth_box'); // Mở box lưu trữ Token

  runApp(const DemiMartApp());
}

class DemiMartApp extends StatelessWidget {
  const DemiMartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Demi Mart',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF006C49),
          primary: const Color(0xFF006C49),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFFAFBFC),
      ),
      home: const MainNavigationScreen(),
    );
  }
}