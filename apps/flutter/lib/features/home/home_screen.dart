import 'package:flutter/material.dart';
import '../../app_routes.dart';
import '../../widgets/live_clock.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('원주버스'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pushNamed(context, AppRoutes.buses),
            child: const Text('노선 찾기'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFF122D37),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'WONJU · DEPARTURES',
                          style: TextStyle(
                            color: Color(0xFFB9D5CF),
                            fontSize: 12,
                            letterSpacing: 1.4,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Divider(color: Color(0xFF3C555D), height: 1),
                        ),
                        Semantics(
                          header: true,
                          child: const Text(
                            '다음 버스,\n몇 시에 출발할까요?',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              height: 1.3,
                              letterSpacing: -1,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          '출발할 종점이나 버스 번호를 선택하세요.\n오늘의 시간표와 남은 시간을 알려드려요.',
                          style: TextStyle(
                            color: Color(0xFFC3D3D5),
                            fontSize: 14,
                            height: 1.7,
                          ),
                        ),
                        const SizedBox(height: 28),
                        const Text(
                          '현재 시각 · 한국',
                          style: TextStyle(
                            color: Color(0xFFB9D5CF),
                            fontSize: 12,
                          ),
                        ),
                        const LiveClock(onDark: true),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  Semantics(
                    header: true,
                    child: Text(
                      '시간표 찾기',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _Choice(
                    number: '01',
                    title: '종점으로 찾기',
                    subtitle: '출발 장소별 버스를 확인하세요.',
                    icon: Icons.place_outlined,
                    onTap: () => Navigator.pushNamed(context, AppRoutes.stops),
                  ),
                  const SizedBox(height: 14),
                  _Choice(
                    number: '02',
                    title: '노선 번호로 찾기',
                    subtitle: '버스의 출발 시간을 확인하세요.',
                    icon: Icons.directions_bus_outlined,
                    onTap: () => Navigator.pushNamed(context, AppRoutes.buses),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAF0ED),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '공식 시간표를 모아두었어요',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        SizedBox(height: 8),
                        Text(
                          '매주 월요일 시간표 업데이트\n연결이 끊겨도 저장된 시간표를 볼 수 있어요.\n남은 시간은 시간표 기준이며, 실시간 위치 정보는 아닙니다.',
                          style: TextStyle(
                            color: Color(0xFF4C655E),
                            fontSize: 13,
                            height: 1.8,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    '원주시 ITS 시간표 기준\n도로 상황에 따라 실제 출발 시간이 달라질 수 있습니다.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF526970),
                      fontSize: 12,
                      height: 1.7,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Choice extends StatelessWidget {
  const _Choice({
    required this.number,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });
  final String number, title, subtitle;
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(18),
      side: const BorderSide(color: Color(0xFFDCE5E1)),
    ),
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ExcludeSemantics(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFE7F3EE),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: const Color(0xFF086B64), size: 24),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFF526970),
                      fontSize: 13,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const ExcludeSemantics(
              child: Icon(
                Icons.arrow_forward,
                size: 18,
                color: Color(0xFF086B64),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
