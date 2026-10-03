import 'dart:async';

import 'package:flutter/material.dart';

import '../../app_routes.dart';
import '../../data/holiday_calendar.dart';
import '../../utils/schedule.dart';
import '../../utils/day_type_utils.dart';
import '../../data/bus_repository.dart';
import '../../models/bus_models.dart';
import '../../widgets/live_clock.dart';

class BusDetailScreen extends StatefulWidget {
  const BusDetailScreen({super.key, required this.routeNumber});

  final String routeNumber;

  @override
  State<BusDetailScreen> createState() => _BusDetailScreenState();
}

class _BusDetailScreenState extends State<BusDetailScreen> {
  final _repository = BusRepository.instance;
  late Future<_BusDetailViewData> _dataFuture;
  DateTime _currentTime = DateTime.now();
  Timer? _timer;
  String? _activeTab;

  @override
  void initState() {
    super.initState();
    _dataFuture = _loadData();
    _timer = Timer.periodic(
      const Duration(minutes: 1),
      (_) => setState(() {
        _currentTime = DateTime.now();
        _dataFuture = _loadData();
      }),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<_BusDetailViewData> _loadData() async {
    final busData = await _repository.loadBusData(widget.routeNumber);
    if (busData == null) {
      throw Exception('노선 정보를 찾을 수 없습니다.');
    }

    final categories = _extractCategories(busData);
    final defaultTab = _activeTab != null && categories.contains(_activeTab)
        ? _activeTab!
        : _chooseDefaultCategory(categories);
    _activeTab = defaultTab;

    return _BusDetailViewData(
      busData: busData,
      categories: categories,
      defaultTab: defaultTab,
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
    final routeNumber = widget.routeNumber.isEmpty
        ? '노선 상세'
        : widget.routeNumber;
    return Scaffold(
      appBar: AppBar(
        title: Text(routeNumber),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.list_alt_outlined),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.buses),
            tooltip: '노선 목록',
          ),
        ],
      ),
      body: SafeArea(
        child: FutureBuilder<_BusDetailViewData>(
          future: _dataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return _ErrorState(
                message: '노선 정보를 불러오는 중 문제가 발생했습니다.',
                onRetry: _refresh,
              );
            }

            final data = snapshot.data;
            if (data == null) {
              return const _EmptyState(message: '노선 정보를 찾을 수 없습니다.');
            }

            final activeTab = _activeTab ?? data.defaultTab;
            final operations = _filterOperations(
              data.busData.operationInfo,
              activeTab,
            );

            final hasOperations = operations.isNotEmpty;

            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                itemCount: hasOperations ? 4 + operations.length : 5,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _HeaderSection(currentTime: _currentTime);
                  }
                  if (index == 1) {
                    return _RouteInfoCard(routeInfo: data.busData.routeInfo);
                  }
                  if (index == 2) {
                    return _CategoryChips(
                      categories: data.categories,
                      activeTab: activeTab,
                      onChanged: (tab) {
                        setState(() {
                          _activeTab = tab;
                        });
                      },
                    );
                  }
                  if (index == 3) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(
                        '운행 시간표 ($activeTab)',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  }
                  if (!hasOperations && index == 4) {
                    return const _EmptyState(
                      message: '선택한 카테고리에 대한 운행 정보가 없습니다.',
                    );
                  }

                  final operation = operations[index - 4];
                  final status =
                      operationApplies(data.busData, operation, _currentTime)
                      ? _operationStatus(operation, _currentTime)
                      : OperationStatus.future;
                  return _OperationCard(
                    operationInfo: operation,
                    status: status,
                    appliesToday: operationApplies(
                      data.busData,
                      operation,
                      _currentTime,
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }

  List<BusOperationInfo> _filterOperations(
    List<BusOperationInfo> operations,
    String activeTab,
  ) {
    final list =
        operations.where((op) {
          if (activeTab == '공통') {
            return op.category.trim() == activeTab;
          }
          if (activeTab != '공통') {
            return op.category.trim() == activeTab ||
                op.category.trim() == '공통';
          }
          return op.category.trim() == activeTab;
        }).toList()..sort(
          (a, b) => _parseOperationNumber(
            a.operationNumber,
          ).compareTo(_parseOperationNumber(b.operationNumber)),
        );

    if (list.isEmpty && activeTab != '공통') {
      // fallback to all operations
      return operations.toList()..sort(
        (a, b) => _parseOperationNumber(
          a.operationNumber,
        ).compareTo(_parseOperationNumber(b.operationNumber)),
      );
    }
    return list;
  }

  OperationStatus _operationStatus(BusOperationInfo operation, DateTime now) {
    final statuses = [operation.departureTime, operation.arrivalTime]
        .map((time) => _parseTime(time, now))
        .whereType<DateTime>()
        .map((time) => _timeStatus(time, now))
        .toList();
    if (statuses.contains(OperationStatus.current)) {
      return OperationStatus.current;
    }
    if (statuses.isNotEmpty &&
        statuses.every((s) => s == OperationStatus.past)) {
      return OperationStatus.past;
    }
    return OperationStatus.future;
  }
}

class _HeaderSection extends StatelessWidget {
  const _HeaderSection({required this.currentTime});

  final DateTime currentTime;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const LiveClock(),
        const SizedBox(height: 12),
        Text(
          '현재 시간: ${_formatTime(currentTime)}',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _RouteInfoCard extends StatelessWidget {
  const _RouteInfoCard({required this.routeInfo});

  final BusRouteInfo routeInfo;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = [
      _RouteInfoItem(label: '출발 종점', value: routeInfo.origin),
      _RouteInfoItem(label: '반대 종점', value: routeInfo.destination),
      _RouteInfoItem(label: '첫차', value: routeInfo.firstBusTime),
      _RouteInfoItem(label: '막차', value: routeInfo.lastBusTime),
      _RouteInfoItem(label: '운행 횟수', value: routeInfo.operationCount),
      _RouteInfoItem(label: '배차 간격', value: routeInfo.interval),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '노선 정보',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final maxWidth = constraints.maxWidth;
              final itemWidth = maxWidth > 420 ? (maxWidth - 12) / 2 : maxWidth;
              return Wrap(
                spacing: 12,
                runSpacing: 12,
                children: items
                    .map((item) => SizedBox(width: itemWidth, child: item))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _RouteInfoItem extends StatelessWidget {
  const _RouteInfoItem({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
        ),
        const SizedBox(height: 4),
        Text(
          value.isEmpty ? '-' : value,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({
    required this.categories,
    required this.activeTab,
    required this.onChanged,
  });

  final List<String> categories;
  final String activeTab;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: categories
          .map(
            (category) => ChoiceChip(
              label: Text(category),
              selected: activeTab == category,
              onSelected: (_) => onChanged(category),
            ),
          )
          .toList(),
    );
  }
}

class _OperationCard extends StatefulWidget {
  const _OperationCard({
    required this.operationInfo,
    required this.status,
    required this.appliesToday,
  });

  final BusOperationInfo operationInfo;
  final OperationStatus status;
  final bool appliesToday;

  @override
  State<_OperationCard> createState() => _OperationCardState();
}

class _OperationCardState extends State<_OperationCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final op = widget.operationInfo;

    Color statusColor;
    String statusLabel;
    switch (widget.status) {
      case OperationStatus.current:
        statusColor = Colors.green;
        statusLabel = '5분 내 출발 예정';
        break;
      case OperationStatus.past:
        statusColor = Colors.grey;
        statusLabel = '출발 시각 지남';
        break;
      case OperationStatus.future:
        statusColor = theme.colorScheme.primary;
        statusLabel = widget.appliesToday ? '시간표' : '오늘 미운행';
        break;
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          if (widget.status == OperationStatus.current)
            BoxShadow(
              color: statusColor.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text(
                        '회차 ${op.operationNumber}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Icon(
                    _expanded
                        ? Icons.expand_less_rounded
                        : Icons.expand_more_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _StopInfoRow(
                icon: Icons.departure_board,
                label: '출발',
                stopName: op.departureName,
                time: op.departureTime,
                status: widget.status,
              ),
              const SizedBox(height: 12),
              _StopInfoRow(
                icon: Icons.flag_rounded,
                label: '반대 종점 출발',
                stopName: op.arrivalName,
                time: op.arrivalTime,
                status: widget.status,
              ),
              if (op.note.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF9C4),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 18,
                        color: Color(0xFF827717),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          op.note,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF827717),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (_expanded) ...[
                const SizedBox(height: 12),
                Divider(color: Colors.grey.shade200),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    _DetailChip(
                      icon: Icons.category_outlined,
                      label: op.category.isEmpty ? '카테고리 없음' : op.category,
                    ),
                    if (op.departureTime != '-' && op.arrivalTime != '-')
                      _DetailChip(
                        icon: Icons.timelapse,
                        label: '${op.departureTime} → ${op.arrivalTime}',
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StopInfoRow extends StatelessWidget {
  const _StopInfoRow({
    required this.icon,
    required this.label,
    required this.stopName,
    required this.time,
    required this.status,
  });

  final IconData icon;
  final String label;
  final String stopName;
  final String time;
  final OperationStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canNavigate = stopName.isNotEmpty && stopName != '-';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: theme.colorScheme.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 4),
              GestureDetector(
                onTap: canNavigate
                    ? () => Navigator.pushNamed(
                        context,
                        AppRoutes.stopDetail,
                        arguments: stopName,
                      )
                    : null,
                child: Text(
                  canNavigate ? stopName : '정보 없음',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: canNavigate
                        ? theme.colorScheme.primary
                        : Colors.grey.shade500,
                    decoration: canNavigate
                        ? TextDecoration.underline
                        : TextDecoration.none,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Text(
          time == '-' ? '' : time,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: status == OperationStatus.past
                ? Colors.grey.shade500
                : Colors.black,
          ),
        ),
      ],
    );
  }
}

class _DetailChip extends StatelessWidget {
  const _DetailChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F3F8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade700),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade800,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
        ),
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
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.redAccent),
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

class _BusDetailViewData {
  const _BusDetailViewData({
    required this.busData,
    required this.categories,
    required this.defaultTab,
  });

  final BusData busData;
  final List<String> categories;
  final String defaultTab;
}

enum OperationStatus { past, current, future }

List<String> _extractCategories(BusData busData) {
  final categories = busData.operationInfo
      .map((op) => op.category.trim())
      .where((category) => category.isNotEmpty)
      .toSet()
      .toList();
  categories.sort(
    (a, b) => _categoryPriority(a).compareTo(_categoryPriority(b)),
  );
  return categories;
}

String _chooseDefaultCategory(List<String> categories) {
  for (final day in getCurrentDayTypes()) {
    if (categories.contains(day)) return day;
  }
  return categories.isEmpty ? '공통' : categories.first;
}

int _categoryPriority(String category) {
  switch (category) {
    case '평일':
      return 0;
    case '공통':
      return 1;
    case '토요일':
      return 2;
    case '일요일':
      return 3;
    case '공휴일':
      return 4;
    case '휴일':
      return 5;
    case '방학':
      return 6;
    default:
      return 99;
  }
}

String _formatTime(DateTime time) {
  time = koreaTime(time);
  final hours = time.hour.toString().padLeft(2, '0');
  final minutes = time.minute.toString().padLeft(2, '0');
  return '$hours:$minutes';
}

DateTime? _parseTime(String time, DateTime reference) {
  final minutes = timeMinutes(time);
  return minutes == null
      ? null
      : koreaDayStart(reference).add(Duration(minutes: minutes));
}

OperationStatus _timeStatus(DateTime? time, DateTime now) {
  if (time == null) return OperationStatus.future;
  final delta = time.difference(now).inMilliseconds;
  if (delta < 0) return OperationStatus.past;
  return delta <= 300000 ? OperationStatus.current : OperationStatus.future;
}

int _parseOperationNumber(String value) {
  return int.tryParse(value.trim()) ?? 0;
}
