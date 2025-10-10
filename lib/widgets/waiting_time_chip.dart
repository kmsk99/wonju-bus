import 'package:flutter/material.dart';

/// Visual indicator that matches the waiting time badge from the web version.
class WaitingTimeChip extends StatelessWidget {
  const WaitingTimeChip({
    super.key,
    required this.minutes,
    this.isNextDay = false,
  });

  final int minutes;
  final bool isNextDay;

  @override
  Widget build(BuildContext context) {
    final style = _chipStyle(minutes);
    final text = _label(minutes);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: style.background.withOpacity(0.35),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (style.icon != null) ...[
            Icon(
              style.icon,
              size: 16,
              color: style.foreground,
            ),
            const SizedBox(width: 6),
          ],
          Text(
            text,
            style: TextStyle(
              color: style.foreground,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          if (isNextDay) ...[
            const SizedBox(width: 6),
            const Text(
              '(내일)',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }

  _ChipStyle _chipStyle(int minutes) {
    if (minutes < 0) {
      return const _ChipStyle(
        background: Color(0xFFE0E0E0),
        foreground: Colors.black54,
        icon: Icons.check_circle_outline,
      );
    }
    if (minutes == 0) {
      return const _ChipStyle(
        background: Color(0xFFD32F2F),
        foreground: Colors.white,
        icon: Icons.warning_amber_rounded,
      );
    }
    if (minutes < 5) {
      return const _ChipStyle(
        background: Color(0xFFD32F2F),
        foreground: Colors.white,
      );
    }
    if (minutes < 10) {
      return const _ChipStyle(
        background: Color(0xFFFB8C00),
        foreground: Colors.white,
      );
    }
    return const _ChipStyle(
      background: Color(0xFF1E88E5),
      foreground: Colors.white,
    );
  }

  String _label(int minutes) {
    if (minutes < 0) return '출발 완료';
    if (minutes == 0) return '곧 출발';
    return '$minutes분 후';
  }
}

class _ChipStyle {
  const _ChipStyle({
    required this.background,
    required this.foreground,
    this.icon,
  });

  final Color background;
  final Color foreground;
  final IconData? icon;
}
