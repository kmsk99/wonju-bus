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
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1976D2)),
        scaffoldBackgroundColor: const Color(0xFFF4F6FA),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 0,
          centerTitle: true,
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: const Color(0xFF1976D2),
          ),
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
      body: const Center(
        child: Text('요청하신 페이지가 존재하지 않습니다.'),
      ),
    );
  }
}
