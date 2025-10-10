import 'package:flutter/material.dart';

import '../../app_routes.dart';
import '../../data/bus_repository.dart';
import '../../widgets/live_clock.dart';
import '../../widgets/terminal_card.dart';

/// Lists all bus terminals and provides search/filter functionality.
class StopsScreen extends StatefulWidget {
  const StopsScreen({super.key});

  @override
  State<StopsScreen> createState() => _StopsScreenState();
}

class _StopsScreenState extends State<StopsScreen> {
  final _repository = BusRepository.instance;
  final _searchController = TextEditingController();
  late Future<List<String>> _stopsFuture;
  String _searchText = '';

  @override
  void initState() {
    super.initState();
    _stopsFuture = _repository.loadTerminals();
    _searchController.addListener(() {
      setState(() {
        _searchText = _searchController.text;
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('원주 버스 종점'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const LiveClock(),
                  const SizedBox(height: 16),
                  _buildSearchField(context),
                ],
              ),
            ),
            Expanded(
              child: FutureBuilder<List<String>>(
                future: _stopsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  }

                  if (snapshot.hasError) {
                    return _ErrorState(
                      message: '종점 목록을 불러오는 중 문제가 발생했습니다.',
                      onRetry: () {
                        setState(() {
                          _stopsFuture = _repository.loadTerminals();
                        });
                      },
                    );
                  }

                  final stops = snapshot.data ?? [];
                  final filtered = stops
                      .where(
                        (name) =>
                            name.toLowerCase().contains(_searchText.toLowerCase()),
                      )
                      .toList();

                  if (filtered.isEmpty) {
                    return const _EmptyState(message: '검색 결과가 없습니다.');
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final stopName = filtered[index];
                      final routeCount =
                          _repository.getRouteCountForTerminal(stopName);
                      return TerminalCard(
                        name: stopName,
                        routeCount: routeCount,
                        onTap: () => Navigator.pushNamed(
                          context,
                          AppRoutes.stopDetail,
                          arguments: stopName,
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchField(BuildContext context) {
    return TextField(
      controller: _searchController,
      decoration: InputDecoration(
        prefixIcon: const Icon(Icons.search),
        suffixIcon: _searchText.isEmpty
            ? null
            : IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _searchController.clear();
                },
              ),
        hintText: '종점 이름 검색...',
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
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
    return Center(
      child: Text(
        message,
        style: Theme.of(context)
            .textTheme
            .bodyMedium
            ?.copyWith(color: Colors.grey.shade600),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
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
          ElevatedButton(
            onPressed: onRetry,
            child: const Text('다시 시도'),
          ),
        ],
      ),
    );
  }
}
