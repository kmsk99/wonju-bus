import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDayTypeStore} from '../entities/bus/model/dayTypeState';
import {WaitingTime} from '../shared/ui/WaitingTime';
import {borderRadius, colors, fontSize, shadow, spacing} from '../shared/theme';

export interface BusDepartureInfo {
  routeNumber: string;
  departureTime: string;
  nextDepartureMinutes?: number;
  category?: string;
  isFromTerminal?: boolean;
  remainingCount?: number;
  operatesToday?: boolean;
  isNextDay?: boolean;
  tripIndex?: number;
}

interface BusDepartureTableProps {
  departures: BusDepartureInfo[];
  isLoading?: boolean;
  error?: string | null;
  onRoutePress?: (routeNumber: string) => void;
}

export function BusDepartureTable({
  departures,
  isLoading = false,
  error,
  onRoutePress,
}: BusDepartureTableProps) {
  const {dayTypeText} = useDayTypeStore();

  const getTimeMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const sortedDepartures = [...departures].sort((a, b) => {
    if (a.operatesToday !== b.operatesToday) {
      return a.operatesToday ? -1 : 1;
    }
    return getTimeMinutes(a.departureTime) - getTimeMinutes(b.departureTime);
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (departures.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>시간표 정보가 없습니다.</Text>
      </View>
    );
  }

  return (
    <View testID="bus-departure-table">
      {sortedDepartures.map((bus, index) => (
        <TouchableOpacity
          key={`${bus.routeNumber}-${bus.departureTime}-${index}`}
          testID={`departure-row-${bus.routeNumber}`}
          style={[
            styles.row,
            bus.operatesToday ? styles.rowActive : styles.rowInactive,
          ]}
          onPress={() => onRoutePress?.(bus.routeNumber)}
          activeOpacity={0.7}>
          <View style={styles.rowHeader}>
            <View style={styles.badges}>
              <Text
                style={[
                  styles.routeNumber,
                  !bus.operatesToday && styles.routeNumberInactive,
                ]}>
                {bus.routeNumber}번
              </Text>
              {bus.tripIndex != null && (
                <View style={styles.tripBadge}>
                  <Text style={styles.tripBadgeText}>
                    회차 {bus.tripIndex}
                  </Text>
                </View>
              )}
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {bus.isFromTerminal ? '기점' : '경유'}
                </Text>
              </View>
              {bus.category ? (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{bus.category}</Text>
                </View>
              ) : null}
            </View>

            {bus.operatesToday && bus.remainingCount !== undefined && (
              <View
                style={[
                  styles.countBadge,
                  bus.remainingCount > 0
                    ? styles.countBadgeActive
                    : styles.countBadgeInactive,
                ]}>
                <Text
                  style={[
                    styles.countBadgeText,
                    bus.remainingCount > 0
                      ? styles.countBadgeTextActive
                      : styles.countBadgeTextInactive,
                  ]}>
                  {bus.remainingCount > 0
                    ? `${bus.remainingCount}회`
                    : '운행 종료'}
                </Text>
              </View>
            )}
          </View>

          {!bus.operatesToday && (
            <Text style={styles.notOperatingText}>
              ({dayTypeText} 미운행)
            </Text>
          )}

          <View style={styles.rowFooter}>
            <View style={styles.timeInfo}>
              <Text style={styles.label}>출발:</Text>
              <Text
                style={[
                  styles.timeText,
                  !bus.operatesToday && styles.timeTextInactive,
                ]}>
                {bus.departureTime}
              </Text>
              {bus.isNextDay && (
                <Text style={styles.nextDayBadge}>(내일)</Text>
              )}
            </View>

            <View style={styles.waitInfo}>
              <Text style={styles.label}>대기 시간:</Text>
              {bus.nextDepartureMinutes !== undefined ? (
                <View style={styles.waitTimeWrapper}>
                  <WaitingTime minutes={bus.nextDepartureMinutes} />
                  {bus.isNextDay && (
                    <Text style={styles.nextDayBadge}>(내일)</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.noData}>-</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  centerContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  row: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  rowActive: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  rowInactive: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray100,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  routeNumber: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.primary,
  },
  routeNumberInactive: {
    color: colors.textSecondary,
  },
  tripBadge: {
    backgroundColor: colors.blue100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tripBadgeText: {
    fontSize: fontSize.xs,
    color: colors.blue700,
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.gray600,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  countBadgeActive: {
    backgroundColor: colors.green100,
  },
  countBadgeInactive: {
    backgroundColor: colors.gray100,
  },
  countBadgeText: {
    fontSize: fontSize.xs,
  },
  countBadgeTextActive: {
    color: colors.green800,
  },
  countBadgeTextInactive: {
    color: colors.gray600,
  },
  notOperatingText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waitTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray700,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.gray900,
  },
  timeTextInactive: {
    color: colors.textSecondary,
  },
  nextDayBadge: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  noData: {
    color: colors.textSecondary,
  },
});
