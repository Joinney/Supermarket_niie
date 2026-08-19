import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:app/api/api_client.dart';

class ModalLoTrinh extends StatefulWidget {
  final Map<String, dynamic> order;

  const ModalLoTrinh({super.key, required this.order});

  @override
  State<ModalLoTrinh> createState() => _ModalLoTrinhState();
}

class _ModalLoTrinhState extends State<ModalLoTrinh> {
  final MapController _mapController = MapController();
  final Dio _publicDio = Dio();

  bool _loading = true;
  List<LatLng> _routeCoordinates = [];
  int _currentCoordIndex = 0;

  Map<String, dynamic>? _selectedStation;
  String _firstMileName = "Bưu cục gom hàng DemiMart";
  String _lastMileName = "Bưu cục phát chặng cuối";
  double _distanceKm = 0.0;
  int _durationMin = 0;
  int _totalHubs = 0;

  String _receiverName = "Khách hàng DemiMart";
  String _receiverPhone = "Chưa cập nhật SĐT";
  String _fullAddress = "Đang kết xuất địa chỉ đặt hàng...";
  String _liveUserAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  @override
  void initState() {
    super.initState();
    _fetchRouteAndDetails();
  }

  double _parseNumber(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    final clean = val.toString().replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }

  Future<void> _fetchRouteAndDetails() async {
    final order = widget.order;
    final double userLat = _parseNumber(order['to_lat'] ?? order['latitude'] ?? 10.762622);
    final double userLng = _parseNumber(order['to_lng'] ?? order['longitude'] ?? 106.660172);

    const double storeLat = 10.771963;
    const double storeLng = 106.697194;

    try {
      try {
        final userId = order['user_id'];
        if (userId != null) {
          final userRes = await authApi.get('/auth/internal/users/$userId');
          if (userRes.data != null && userRes.data['avatar_url'] != null) {
            _liveUserAvatar = userRes.data['avatar_url'];
          }
        }

        final addrRes = await authApi.get('/addresses');
        final List<dynamic> addrList = addrRes.data?['data'] ?? addrRes.data ?? [];
        if (addrList.isNotEmpty) {
          final toDistrictId = order['to_district_id']?.toString();
          final matched = addrList.firstWhere(
            (a) => toDistrictId != null && a['district_id']?.toString() == toDistrictId,
            orElse: () => addrList.firstWhere((a) => a['is_default'] == true, orElse: () => addrList[0]),
          );
          if (matched != null) {
            _receiverName = matched['receiver_name'] ?? _receiverName;
            _receiverPhone = matched['receiver_phone'] ?? _receiverPhone;
            _fullAddress = "${matched['detail_address']}, ${matched['ward_name']}, ${matched['district_name']}, ${matched['province_name']}";
          }
        }
      } catch (_) {}

      List<dynamic> stationLogs = [];
      try {
        final targetOrderId = order['id'] ?? order['ma_don_hang'];
        final trackingRes = await orderApi.get('/shipping/logs/$targetOrderId');
        if (trackingRes.data != null && trackingRes.data['success'] == true) {
          stationLogs = trackingRes.data['data'] ?? [];
        }
      } catch (_) {}

      List<String> waypoints = ["$storeLng,$storeLat"];

      for (var log in stationLogs) {
        final lat = _parseNumber(log['station_lat']);
        final lng = _parseNumber(log['station_lng']);
        if (lat != 0 && lng != 0) {
          waypoints.add("$lng,$lat");
          if (log['station_type'] == 'FIRST_MILE') {
            _firstMileName = log['station_name'] ?? _firstMileName;
          } else if (log['station_type'] == 'LAST_MILE') {
            _lastMileName = log['station_name'] ?? _lastMileName;
          } else if (log['station_type'] == 'HUB') {
            _totalHubs++;
          }
        }
      }

      waypoints.add("$userLng,$userLat");

      final osrmUrl = "https://router.project-osrm.org/route/v1/driving/${waypoints.join(';')}?overview=full&geometries=geojson";
      final routeRes = await _publicDio.get(osrmUrl);

      if (routeRes.data != null && routeRes.data['code'] == 'Ok' && routeRes.data['routes'] is List) {
        final route = routeRes.data['routes'][0];
        final List<dynamic> coords = route['geometry']['coordinates'];

        _routeCoordinates = coords.map((c) => LatLng(c[1].toDouble(), c[0].toDouble())).toList();
        _distanceKm = double.parse((_parseNumber(route['distance']) / 1000).toStringAsFixed(1));
        _durationMin = (_parseNumber(route['duration']) / 60).ceil();
        _currentCoordIndex = (_routeCoordinates.length * 0.4).toInt();
      }
    } catch (e) {
      debugPrint('Lỗi lộ trình: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _focusOnVehicle() {
    if (_routeCoordinates.isNotEmpty) {
      final safeIdx = _currentCoordIndex.clamp(0, _routeCoordinates.length - 1);
      _mapController.move(_routeCoordinates[safeIdx], 15.5);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final String orderCode = (order['ma_don_hang'] ?? order['order_code'] ?? '---').toString();
    final double userLat = _parseNumber(order['to_lat'] ?? order['latitude'] ?? 10.762622);
    final double userLng = _parseNumber(order['to_lng'] ?? order['longitude'] ?? 106.660172);

    final LatLng currentVehiclePos = _routeCoordinates.isNotEmpty
        ? _routeCoordinates[_currentCoordIndex.clamp(0, _routeCoordinates.length - 1)]
        : const LatLng(10.771963, 106.697194);

    final passedCoords = _routeCoordinates.isNotEmpty
        ? _routeCoordinates.sublist(0, _currentCoordIndex.clamp(0, _routeCoordinates.length))
        : <LatLng>[];
    final remainingCoords = _routeCoordinates.isNotEmpty
        ? _routeCoordinates.sublist(_currentCoordIndex.clamp(0, _routeCoordinates.length))
        : <LatLng>[];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF006C49),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'LỘ TRÌNH ĐƠN HÀNG #$orderCode',
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF006C49)))
          : Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: currentVehiclePos,
                    initialZoom: 13.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.demimart.app',
                    ),
                    if (passedCoords.length > 1)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: passedCoords,
                            color: const Color(0xFF006C49),
                            strokeWidth: 5.0,
                          ),
                        ],
                      ),
                    if (remainingCoords.length > 1)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: remainingCoords,
                            color: const Color(0xFF006C49).withOpacity(0.4),
                            strokeWidth: 4.0,
                          ),
                        ],
                      ),
                    MarkerLayer(
                      markers: [
                        const Marker(
                          point: LatLng(10.771963, 106.697194),
                          width: 36,
                          height: 36,
                          child: Icon(Icons.storefront_rounded, color: Color(0xFF006C49), size: 32),
                        ),
                        Marker(
                          point: LatLng(userLat, userLng),
                          width: 44,
                          height: 44,
                          child: Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF006C49), width: 3),
                              color: Colors.white,
                              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6)],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Image.network(_liveUserAvatar, fit: BoxFit.cover),
                            ),
                          ),
                        ),
                        Marker(
                          point: currentVehiclePos,
                          width: 80,
                          height: 60,
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF006C49),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Đang di chuyển',
                                  style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const Icon(Icons.local_shipping_rounded, color: Color(0xFFFF6B00), size: 30),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Positioned(
                  top: 70,
                  right: 14,
                  child: FloatingActionButton.small(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF006C49),
                    onPressed: _focusOnVehicle,
                    child: const Icon(Icons.my_location_rounded),
                  ),
                ),
                Positioned(
                  top: 10,
                  left: 14,
                  right: 14,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('📍 $_firstMileName',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                              const SizedBox(height: 2),
                              Text('🏁 $_lastMileName',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF006C49))),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('$_distanceKm km', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
                            Text('⏳ ~$_durationMin phút', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.orange)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                      boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(radius: 18, backgroundImage: NetworkImage(_liveUserAvatar)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(_receiverName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  Text(_receiverPhone, style: const TextStyle(fontSize: 11, color: Color(0xFF006C49), fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: const Color(0xFFE6F0ED), borderRadius: BorderRadius.circular(8)),
                              child: Text(
                                order['trang_thai_don_hang'] ?? 'Đang giao',
                                style: const TextStyle(color: Color(0xFF006C49), fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('📍 $_fullAddress', style: const TextStyle(fontSize: 11, color: Colors.grey), maxLines: 2),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}