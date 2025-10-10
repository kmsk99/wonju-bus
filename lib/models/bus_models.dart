import 'dart:convert';

/// Basic route metadata for a bus service.
class BusRouteInfo {
  const BusRouteInfo({
    required this.routeNumber,
    required this.origin,
    required this.destination,
    required this.firstBusTime,
    required this.lastBusTime,
    required this.operationCount,
    required this.interval,
  });

  final String routeNumber;
  final String origin;
  final String destination;
  final String firstBusTime;
  final String lastBusTime;
  final String operationCount;
  final String interval;

  factory BusRouteInfo.fromJson(Map<String, dynamic> json) {
    return BusRouteInfo(
      routeNumber: json['routeNumber'] as String? ?? '',
      origin: json['origin'] as String? ?? '-',
      destination: json['destination'] as String? ?? '-',
      firstBusTime: json['firstBusTime'] as String? ?? '-',
      lastBusTime: json['lastBusTime'] as String? ?? '-',
      operationCount: json['operationCount'] as String? ?? '-',
      interval: json['interval'] as String? ?? '-',
    );
  }
}

/// Individual trip information for a bus operation.
class BusOperationInfo {
  const BusOperationInfo({
    required this.operationNumber,
    required this.departureTime,
    required this.arrivalTime,
    required this.departureName,
    required this.arrivalName,
    required this.category,
    required this.note,
  });

  final String operationNumber;
  final String departureTime;
  final String arrivalTime;
  final String departureName;
  final String arrivalName;
  final String category;
  final String note;

  factory BusOperationInfo.fromJson(Map<String, dynamic> json) {
    return BusOperationInfo(
      operationNumber: json['operationNumber'] as String? ?? '',
      departureTime: json['departureTime'] as String? ?? '-',
      arrivalTime: json['arrivalTime'] as String? ?? '-',
      departureName: json['departureName'] as String? ?? '-',
      arrivalName: json['arrivalName'] as String? ?? '-',
      category: json['category'] as String? ?? '공통',
      note: json['note'] as String? ?? '',
    );
  }
}

/// Full dataset for a bus route including the source file metadata.
class BusData {
  BusData({
    required this.routeInfo,
    required this.operationInfo,
    this.fileName,
    this.operatesToday,
  });

  final BusRouteInfo routeInfo;
  final List<BusOperationInfo> operationInfo;
  String? fileName;
  bool? operatesToday;

  factory BusData.fromJson(Map<String, dynamic> json) {
    final operations = (json['operationInfo'] as List<dynamic>? ?? [])
        .map((op) => BusOperationInfo.fromJson(op as Map<String, dynamic>))
        .toList();
    return BusData(
      routeInfo: BusRouteInfo.fromJson(
        json['routeInfo'] as Map<String, dynamic>? ?? <String, dynamic>{},
      ),
      operationInfo: operations,
    );
  }

  /// Convenience helper to decode raw JSON from asset strings.
  static BusData decode(String source) {
    final decoded = jsonDecode(source) as Map<String, dynamic>;
    return BusData.fromJson(decoded);
  }
}

/// Lightweight metadata extracted from a bus data file name.
class BusFileInfo {
  const BusFileInfo({
    required this.routeNumber,
    required this.dayTypeGroup,
    required this.fileName,
  });

  final String routeNumber;
  final String? dayTypeGroup;
  final String fileName;
}
