import 'package:flutter/material.dart';

import 'app_routes.dart';
import 'features/home/home_screen.dart';
import 'features/routes/bus_detail_screen.dart';
import 'features/routes/bus_list_screen.dart';
import 'features/stops/stop_detail_screen.dart';
import 'features/stops/stops_screen.dart';

class WonjuBusApp extends StatelessWidget {
  const WonjuBusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '원주 버스 시간표',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF086B64)),
        scaffoldBackgroundColor: const Color(0xFFF5F7F6),
        useMaterial3: true,
        textTheme: const TextTheme(
          bodyLarge: TextStyle(
            fontSize: 16,
            height: 1.6,
            color: Color(0xFF17343D),
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            height: 1.6,
            color: Color(0xFF17343D),
          ),
          titleLarge: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Color(0xFF17343D),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.all(16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFDCE5E1)),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 0,
          centerTitle: false,
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(foregroundColor: const Color(0xFF086B64)),
        ),
      ),
      initialRoute: AppRoutes.home,
      onGenerateRoute: _onGenerateRoute,
    );
  }

  Route<dynamic> _onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.home:
        return MaterialPageRoute(
          builder: (_) => const HomeScreen(),
          settings: settings,
        );
      case AppRoutes.stops:
        return MaterialPageRoute(
          builder: (_) => const StopsScreen(),
          settings: settings,
        );
      case AppRoutes.stopDetail:
        final stopName = settings.arguments as String? ?? '';
        return MaterialPageRoute(
          builder: (_) => StopDetailScreen(stopName: stopName),
          settings: settings,
        );
      case AppRoutes.buses:
        return MaterialPageRoute(
          builder: (_) => const BusListScreen(),
          settings: settings,
        );
      case AppRoutes.busDetail:
        final routeNumber = settings.arguments as String? ?? '';
        return MaterialPageRoute(
          builder: (_) => BusDetailScreen(routeNumber: routeNumber),
          settings: settings,
        );
      default:
        return MaterialPageRoute(
          builder: (_) => const _UnknownRouteScreen(),
          settings: settings,
        );
    }
  }
}

class _UnknownRouteScreen extends StatelessWidget {
  const _UnknownRouteScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('페이지를 찾을 수 없습니다')),
      body: const Center(child: Text('요청하신 페이지가 존재하지 않습니다.')),
    );
  }
}
