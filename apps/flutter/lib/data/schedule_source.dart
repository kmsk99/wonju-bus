import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// A complete snapshot is validated before replacing the offline copy.
class ScheduleSource {
  ScheduleSource({
    http.Client? client,
    Future<String> Function()? loadBundled,
    this.baseUrl = const String.fromEnvironment(
      'BUS_DATA_URL',
      defaultValue: 'https://wonju-bus-mason.vercel.app/api/schedules',
    ),
  }) : _client = client ?? http.Client(),
       _loadBundled =
           loadBundled ??
           (() => rootBundle.loadString('assets/data/snapshot.json'));

  final http.Client _client;
  final Future<String> Function() _loadBundled;
  final String baseUrl;
  String get _cacheKey => 'bus_snapshot_v1:$baseUrl';

  Future<Map<String, dynamic>> load() async {
    SharedPreferences? preferences;
    try {
      preferences = await SharedPreferences.getInstance();
    } catch (_) {
      // Storage failures must not prevent online or bundled data loading.
    }
    try {
      final response = await _client
          .get(Uri.parse(baseUrl))
          .timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) {
        throw const FormatException('HTTP failure');
      }
      final raw = utf8.decode(response.bodyBytes);
      final snapshot = decode(raw);
      try {
        await preferences?.setString(_cacheKey, raw);
      } catch (_) {
        // A valid online snapshot can still be used if persistence fails.
      }
      return snapshot;
    } catch (_) {
      try {
        final cached = preferences?.getString(_cacheKey);
        if (cached != null) return decode(cached);
      } catch (_) {
        // Ignore a corrupt cache and fall back to the packaged snapshot.
      }
      return decode(await _loadBundled());
    } finally {
      _client.close();
    }
  }

  static Map<String, dynamic> decode(String raw) {
    final value = jsonDecode(raw);
    if (value is! Map<String, dynamic> || value.isEmpty) {
      throw const FormatException('Empty schedule');
    }
    for (final entry in value.entries) {
      final route = entry.value;
      if (!entry.key.startsWith('wonju-bus-') ||
          !entry.key.endsWith('.json') ||
          entry.key.contains('/') ||
          entry.key.contains('\\') ||
          route is! Map<String, dynamic> ||
          route['routeInfo'] is! Map<String, dynamic> ||
          route['routeInfo']['routeNumber'] is! String ||
          (route['routeInfo']['routeNumber'] as String).isEmpty ||
          route['operationInfo'] is! List ||
          (route['operationInfo'] as List).isEmpty) {
        throw const FormatException('Invalid schedule');
      }
      for (final operation in route['operationInfo'] as List) {
        if (operation is! Map<String, dynamic> ||
            operation.values.any((value) => value is! String)) {
          throw const FormatException('Invalid departure');
        }
      }
      if ((route['routeInfo'] as Map).values.any((value) => value is! String)) {
        throw const FormatException('Invalid route');
      }
    }
    return value;
  }
}
