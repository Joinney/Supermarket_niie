import 'dart:async';
import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ApiClient {
  static const String baseUrl = 'https://api-gateway-vuyo.onrender.com/api/v1';

  static bool _isRefreshing = false;
  static final List<Function(String? token)> _refreshSubscribers = [];

  static Box get _box => Hive.box('auth_box');

  static Dio createDio({String? customBaseUrl}) {
    final dio = Dio(
      BaseOptions(
        baseUrl: customBaseUrl ?? baseUrl,
        connectTimeout: const Duration(seconds: 45),
        receiveTimeout: const Duration(seconds: 45),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = _box.get('adminToken') ?? _box.get('token');

          if (token != null && token.toString().isNotEmpty) {
            options.headers['Authorization'] = 'Bearer ${token.toString().trim()}';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final RequestOptions originalRequest = error.requestOptions;

          // Bỏ qua interceptor cho các API auth cơ bản
          if (originalRequest.path.contains('/auth/login') ||
              originalRequest.path.contains('/auth/signup') ||
              originalRequest.path.contains('/auth/refresh-token')) {
            return handler.next(error);
          }

          if (error.response?.statusCode == 401) {
            final refreshToken = _box.get('refreshToken');

            if (refreshToken != null && refreshToken.toString().isNotEmpty) {
              if (!_isRefreshing) {
                _isRefreshing = true;

                try {
                  final refreshDio = Dio(BaseOptions(
                    connectTimeout: const Duration(seconds: 30),
                  ));
                  final res = await refreshDio.post(
                    '$baseUrl/auth/refresh-token',
                    data: {'refreshToken': refreshToken},
                  );

                  final newToken = res.data['token'] ?? res.data['accessToken'];

                  if (newToken != null) {
                    await _box.put('token', newToken);

                    for (var cb in _refreshSubscribers) {
                      cb(newToken);
                    }
                    _refreshSubscribers.clear();
                    _isRefreshing = false;

                    originalRequest.headers['Authorization'] = 'Bearer $newToken';
                    final retryResponse = await dio.fetch(originalRequest);
                    return handler.resolve(retryResponse);
                  }
                } catch (refreshErr) {
                  _isRefreshing = false;
                  for (var cb in _refreshSubscribers) {
                    cb(null);
                  }
                  _refreshSubscribers.clear();
                  await _box.clear();
                  return handler.next(error);
                }
              }

              // Luồng xếp hàng chờ gia hạn Token
              final completer = Completer<Response>();
              _refreshSubscribers.add((newToken) async {
                if (newToken != null) {
                  originalRequest.headers['Authorization'] = 'Bearer $newToken';
                  try {
                    final res = await dio.fetch(originalRequest);
                    completer.complete(res);
                  } catch (e) {
                    completer.completeError(e);
                  }
                } else {
                  completer.completeError(error);
                }
              });

              try {
                final retryResult = await completer.future;
                return handler.resolve(retryResult);
              } catch (e) {
                return handler.next(error);
              }
            } else {
              await _box.clear();
            }
          }

          return handler.next(error);
        },
      ),
    );

    return dio;
  }
}

final Dio authApi = ApiClient.createDio();
final Dio productApi = ApiClient.createDio();
final Dio cartApi = ApiClient.createDio();
final Dio orderApi = ApiClient.createDio();
final Dio paymentApi = ApiClient.createDio();
final Dio warehouseApi = ApiClient.createDio();
final Dio addressApi = ApiClient.createDio();
final Dio notificationApi = ApiClient.createDio();

// Đồng bộ Base URL với Web Axios
final Dio promotionApi = ApiClient.createDio(customBaseUrl: '${ApiClient.baseUrl}/promotions');
final Dio couponApi = ApiClient.createDio(customBaseUrl: '${ApiClient.baseUrl}/coupons');