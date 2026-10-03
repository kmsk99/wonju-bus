import 'dart:async';
import 'package:flutter/material.dart';

class LiveClock extends StatefulWidget {
  const LiveClock({super.key, this.onDark = false});
  final bool onDark;
  @override
  State<LiveClock> createState() => _LiveClockState();
}

class _LiveClockState extends State<LiveClock> {
  DateTime _time = DateTime.now().toUtc().add(const Duration(hours: 9));
  Timer? _timer;
  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => setState(() {
        _time = DateTime.now().toUtc().add(const Duration(hours: 9));
      }),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final text = [
      _time.hour,
      _time.minute,
      _time.second,
    ].map((n) => n.toString().padLeft(2, '0')).join(':');
    return Semantics(
      label: '현재 한국 시각 $text',
      child: ExcludeSemantics(
        child: Text(
          text,
          style: TextStyle(
            color: widget.onDark
                ? const Color(0xFFF7D88C)
                : const Color(0xFF17343D),
            fontSize: 38,
            fontWeight: FontWeight.w600,
            height: 1.5,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ),
    );
  }
}
