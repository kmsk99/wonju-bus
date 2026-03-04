import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useDayTypeStore} from '../entities/bus/model/dayTypeState';
import {borderRadius, colors, fontSize, shadow, spacing} from '../shared/theme';

export interface RouteInfo {
  routeNumber: string;
  isDeparture?: boolean;
  isArrival?: boolean;
  remainingCount?: number;
  operatesToday?: boolean;
}

interface RoutesListProps {
  routes: RouteInfo[];
  onRoutePress?: (routeNumber: string) => void;
}

export function RoutesList({routes, onRoutePress}: RoutesListProps) {
  const {dayTypeText} = useDayTypeStore();

  const sortedRoutes = [...routes].sort((a, b) => {
    if (a.operatesToday !== b.operatesToday) {
      return a.operatesToday ? -1 : 1;
    }
    if (a.operatesToday) {
      const aIsActive = a.remainingCount !== undefined && a.remainingCount > 0;
      const bIsActive = b.remainingCount !== undefined && b.remainingCount > 0;
      if (aIsActive !== bIsActive) {
        return aIsActive ? -1 : 1;
      }
    }
    return a.routeNumber.localeCompare(b.routeNumber);
  });

  if (routes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          이 종점을 지나는 노선이 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View testID="routes-list" style={styles.grid}>
      {sortedRoutes.map(route => (
        <TouchableOpacity
          key={route.routeNumber}
          testID={`route-card-${route.routeNumber}`}
          style={[
            styles.card,
            route.operatesToday ? styles.cardActive : styles.cardInactive,
          ]}
          onPress={() => onRoutePress?.(route.routeNumber)}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.routeNumber,
              !route.operatesToday && styles.routeNumberInactive,
            ]}>
            {route.routeNumber}번
          </Text>
          <View style={styles.badgesRow}>
            {route.isDeparture && (
              <View style={styles.departureBadge}>
                <Text style={styles.departureBadgeText}>출발</Text>
              </View>
            )}
            {route.isArrival && (
              <View style={styles.arrivalBadge}>
                <Text style={styles.arrivalBadgeText}>도착</Text>
              </View>
            )}
            {!route.operatesToday && (
              <View style={styles.offBadge}>
                <Text style={styles.offBadgeText}>오늘 미운행</Text>
              </View>
            )}
          </View>
          {route.operatesToday && route.remainingCount !== undefined && (
            <Text style={styles.remainingText}>
              오늘 남은 운행: {route.remainingCount}회
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadow.sm,
  },
  cardActive: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  cardInactive: {
    backgroundColor: colors.white,
    borderColor: colors.gray100,
    opacity: 0.7,
  },
  routeNumber: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  routeNumberInactive: {
    color: colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  departureBadge: {
    backgroundColor: colors.blue100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  departureBadgeText: {
    fontSize: fontSize.sm,
    color: colors.blue700,
  },
  arrivalBadge: {
    backgroundColor: colors.purple100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  arrivalBadgeText: {
    fontSize: fontSize.sm,
    color: colors.purple700,
  },
  offBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  offBadgeText: {
    fontSize: fontSize.sm,
    color: colors.gray700,
  },
  remainingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
