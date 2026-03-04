import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {borderRadius, colors, fontSize} from '../theme';

interface WaitingTimeProps {
  minutes: number;
}

export function WaitingTime({minutes}: WaitingTimeProps) {
  if (minutes === -1) {
    return (
      <Text testID="waiting-time" style={styles.completed}>
        출발 완료
      </Text>
    );
  }

  if (minutes === 0) {
    return (
      <View testID="waiting-time" style={styles.urgentBadge}>
        <Text style={styles.urgentDot}>●</Text>
        <Text style={styles.urgentText}>곧 출발</Text>
      </View>
    );
  }

  if (minutes < 5) {
    return (
      <View testID="waiting-time" style={styles.urgentBadge}>
        <Text style={styles.urgentText}>{minutes}분 후</Text>
      </View>
    );
  }

  if (minutes < 10) {
    return (
      <View testID="waiting-time" style={styles.warningBadge}>
        <Text style={styles.badgeText}>{minutes}분 후</Text>
      </View>
    );
  }

  return (
    <View testID="waiting-time" style={styles.normalBadge}>
      <Text style={styles.badgeText}>{minutes}분 후</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  completed: {
    color: colors.gray400,
    fontSize: fontSize.sm,
  },
  urgentBadge: {
    backgroundColor: colors.red500,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentDot: {
    color: colors.white,
    fontSize: fontSize.xs,
  },
  urgentText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  warningBadge: {
    backgroundColor: colors.orange500,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  normalBadge: {
    backgroundColor: colors.blue500,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
});
