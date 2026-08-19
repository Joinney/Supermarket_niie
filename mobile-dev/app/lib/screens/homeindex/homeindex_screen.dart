import 'package:flutter/material.dart';

class CategoryPageScreen extends StatelessWidget {
  const CategoryPageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Danh mục sản phẩm')),
      body: const Center(child: Text('Giao diện Danh mục')),
    );
  }
}