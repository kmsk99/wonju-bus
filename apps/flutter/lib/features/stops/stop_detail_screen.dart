import 'package:flutter/material.dart';

import '../../app_routes.dart';
import '../../data/bus_repository.dart';
import '../../widgets/live_clock.dart';
import '../../widgets/waiting_time_chip.dart';

enum StopDetailTab { all, from, to }

class StopDetailScreen extends StatefulWidget {
  const StopDetailScreen({
    super.key,
    required this.stopName,
  });

  final String stopName;

  @override
  State<StopDetailScreen> createState() => _StopDetailScreenState();
}

class _StopDetailScreenState extends State<StopDetailScreen> {
  final _repository = BusRepository.instance;
  late Future<_StopDetailViewData> _dataFuture;
  StopDetailTab _activeTab = StopDetailTab.all;

  @override
  void initState() {
    super.initState();
    _dataFuture = _loadData();
  }

  Future<_StopDetailViewData> _loadData() async {
    final stopName = widget.stopName;
    final departureRoutes = await _repository.loadRoutesByTerminal(stopName);
    final arrivalRoutes = await _repository.loadRoutesToTerminal(stopName);
    final grouped =
        await _repository.groupDeparturesByRoute(stopName); // includes summary

    return _StopDetailViewData(
      departureRoutes: departureRoutes,
      arrivalRoutes: arrivalRoutes,
      groupedDepartures: Map<String, GroupedDeparture>.from(grouped),
    );
  }

  Future<void> _refresh() async {
    setState(() {
      _dataFuture = _loadData();
    });
    await _dataFuture;
  }

  @override
  Widget build(BuildContext context) {
    final stopName =
        widget.stopName.isEmpty ? '정류장 상세' : widget.stopName;
    return Scaffold(
      appBar: AppBar(
        title: Text(stopName),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined),
            onPressed: () => Navigator.pushNamedAndRemoveUntil(
              context,
              AppRoutes.home,
              (route) => false,
            ),
            tooltip: '홈으로 이동',
          ),
        ],
      ),
      body: SafeArea(
        child: FutureBuilder<_StopDetailViewData>(
          future: _dataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return _ErrorState(
                message: '정류장 정보를 불러오는 중 문제가 발생했습니다.',
                onRetry: _refresh,
              );
            }

            final data = snapshot.data;
            if (data == null ||
                data.groupedDepartures.isEmpty &&
                    data.departureRoutes.isEmpty &&
                    data.arrivalRoutes.isEmpty) {
              return const _EmptyState(
                message: '시간표 정보를 찾을 수 없습니다.',
              );
            }

            return RefreshIndicator(
              onRefresh: _refresh,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _StopHeader(stopName: stopName),
                          const SizedBox(height: 16),
                          _StopDetailTabs(
                            activeTab: _activeTab,
                            departureCount: data.departureRoutes.length,
                            arrivalCount: data.arrivalRoutes.length,
                            onChanged: (tab) {
                              setState(() => _activeTab = tab);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  _DepartureSection(
                    activeTab: _activeTab,
                    data: data,
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Text(
                        '노선 목록',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                  ),
                  _RoutesSummarySection(data: data),
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 24),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _StopHeader extends StatelessWidget {
  const _StopHeader({required this.stopName});

  final String stopName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          stopName,
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '버스 시간표',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 12),
        const LiveClock(),
      ],
    );
  }
}

class _StopDetailTabs extends StatelessWidget {
  const _StopDetailTabs({
    required this.activeTab,
    required this.departureCount,
    required this.arrivalCount,
    required this.onChanged,
  });

  final StopDetailTab activeTab;
  final int departureCount;
  final int arrivalCount;
  final ValueChanged<StopDetailTab> onChanged;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 360;
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _TabChip(
              label: '전체 시간표',
              isActive: activeTab == StopDetailTab.all,
              onTap: () => onChanged(StopDetailTab.all),
              isCompact: isCompact,
            ),
            _TabChip(
              label: '출발 노선 ($departureCount)',
              isActive: activeTab == StopDetailTab.from,
              onTap: () => onChanged(StopDetailTab.from),
              isCompact: isCompact,
            ),
            _TabChip(
              label: '도착 노선 ($arrivalCount)',
              isActive: activeTab == StopDetailTab.to,
              onTap: () => onChanged(StopDetailTab.to),
              isCompact: isCompact,
            ),
          ],
        );
      },
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.isActive,
    required this.onTap,
    this.isCompact = false,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final bool isCompact;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: isCompact ? 16 : 20,
          vertical: 12,
        ),
        decoration: BoxDecoration(
          color: isActive ? Theme.of(context).colorScheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive
                ? Theme.of(context).colorScheme.primary
                : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: isActive ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }
}

class _DepartureSection extends StatelessWidget {
  const _DepartureSection({
    required this.activeTab,
    required this.data,
  });

  final StopDetailTab activeTab;
  final _StopDetailViewData data;

  @override
  Widget build(BuildContext context) {
    final entries = data.groupedDepartures.entries.where((entry) {
      if (activeTab == StopDetailTab.all) return true;
      final isFromTerminal = entry.value.nextDeparture.isFromTerminal;
      if (activeTab == StopDetailTab.from) return isFromTerminal;
      if (activeTab == StopDetailTab.to) return !isFromTerminal;
      return true;
    }).toList()
      ..sort((a, b) {
        // Prioritize operating routes, then time
        if (a.value.operatesToday != b.value.operatesToday) {
          return a.value.operatesToday ? -1 : 1;
        }
        final aMinutes =
            _timeToMinutes(a.value.nextDeparture.departureTime);
        final bMinutes =
            _timeToMinutes(b.value.nextDeparture.departureTime);
        return aMinutes.compareTo(bMinutes);
      });

    if (entries.isEmpty) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: _EmptyState(message: '해당 조건에 맞는 노선이 없습니다.'),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final entry = entries[index];
          final departure = entry.value.nextDeparture;
          final summary = entry.value;
          final isDepartureRoute =
              data.departureRoutes.contains(entry.key);
          final isArrivalRoute = data.arrivalRoutes.contains(entry.key);

          return Padding(
            padding: EdgeInsets.fromLTRB(
              16,
              index == 0 ? 0 : 12,
              16,
              index == entries.length - 1 ? 16 : 0,
            ),
            child: _DepartureCard(
              routeNumber: entry.key,
              departure: departure,
              summary: summary,
              isDepartureRoute: isDepartureRoute,
              isArrivalRoute: isArrivalRoute,
            ),
          );
        },
        childCount: entries.length,
      ),
    );
  }
}

class _DepartureCard extends StatelessWidget {
  const _DepartureCard({
    required this.routeNumber,
    required this.departure,
    required this.summary,
    required this.isDepartureRoute,
    required this.isArrivalRoute,
  });

  final String routeNumber;
  final DepartureRecord departure;
  final GroupedDeparture summary;
  final bool isDepartureRoute;
  final bool isArrivalRoute;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$routeNumber',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              WaitingTimeChip(
                minutes: departure.nextDepartureMinutes,
                isNextDay: departure.isNextDay,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (departure.tripIndex != null)
                _infoChip('회차 ${departure.tripIndex}'),
              _infoChip(departure.isFromTerminal ? '기점' : '경유'),
              if (departure.category.isNotEmpty)
                _infoChip(departure.category),
              if (isDepartureRoute && isArrivalRoute)
                _infoChip('출발 · 도착'),
              if (isDepartureRoute && !isArrivalRoute)
                _infoChip('출발 노선'),
              if (!isDepartureRoute && isArrivalRoute)
                _infoChip('도착 노선'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '출발 ${departure.departureTime}'
                '${departure.isNextDay ? ' • 내일 출발' : ''}',
                style: theme.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                summary.operatesToday
                    ? (summary.remainingCount > 0
                        ? '오늘 남은 운행: ${summary.remainingCount}회'
                        : '오늘 운행 종료')
                    : '오늘 미운행',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: summary.operatesToday
                      ? Colors.green.shade700
                      : Colors.grey.shade500,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F3F8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Color(0xFF37474F),
        ),
      ),
    );
  }
}

class _RoutesSummarySection extends StatelessWidget {
  const _RoutesSummarySection({required this.data});

  final _StopDetailViewData data;

  @override
  Widget build(BuildContext context) {
    final routes = {
      ...data.departureRoutes,
      ...data.arrivalRoutes,
    }.toList()
      ..sort((a, b) => a.compareTo(b));

    if (routes.isEmpty) {
      return const SliverToBoxAdapter(
        child: _EmptyState(message: '노선 정보가 없습니다.'),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final routeNumber = routes[index];
          final summary = data.groupedDepartures[routeNumber];
          final isDeparture = data.departureRoutes.contains(routeNumber);
          final isArrival = data.arrivalRoutes.contains(routeNumber);
          final operatesToday = summary?.operatesToday ?? false;
          final remaining = summary?.remainingCount ?? 0;

          return Padding(
            padding: EdgeInsets.fromLTRB(
              16,
              0,
              16,
              index == routes.length - 1 ? 16 : 12,
            ),
            child: _RouteSummaryCard(
              routeNumber: routeNumber,
              isDeparture: isDeparture,
              isArrival: isArrival,
              operatesToday: operatesToday,
              remainingCount: remaining,
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.busDetail,
                arguments: routeNumber,
              ),
            ),
          );
        },
        childCount: routes.length,
      ),
    );
  }
}

class _RouteSummaryCard extends StatelessWidget {
  const _RouteSummaryCard({
    required this.routeNumber,
    required this.isDeparture,
    required this.isArrival,
    required this.operatesToday,
    required this.remainingCount,
    this.onTap,
  });

  final String routeNumber;
  final bool isDeparture;
  final bool isArrival;
  final bool operatesToday;
  final int remainingCount;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Ink(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Text(
                routeNumber,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (isDeparture)
                        _badge('출발', theme.colorScheme.primary),
                      if (isArrival) _badge('도착', Colors.purple),
                      if (!operatesToday)
                        _badge('오늘 미운행', Colors.grey.shade500),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    operatesToday
                        ? (remainingCount > 0
                            ? '오늘 남은 운행: $remainingCount회'
                            : '오늘 운행 종료')
                        : '오늘 미운행',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: operatesToday
                          ? Colors.green.shade700
                          : Colors.grey.shade600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.info_outline, size: 36, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Colors.redAccent),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('다시 시도'),
            ),
          ],
        ),
      ),
    );
  }
}

int _timeToMinutes(String time) {
  final parts = time.split(':');
  if (parts.length != 2) {
    return 0;
  }
  final hours = int.tryParse(parts[0]) ?? 0;
  final minutes = int.tryParse(parts[1]) ?? 0;
  return hours * 60 + minutes;
}

class _StopDetailViewData {
  const _StopDetailViewData({
    required this.departureRoutes,
    required this.arrivalRoutes,
    required this.groupedDepartures,
  });

  final List<String> departureRoutes;
  final List<String> arrivalRoutes;
  final Map<String, GroupedDeparture> groupedDepartures;
}
