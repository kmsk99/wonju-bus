import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {
  getAllDepartureTimesFromStop,
  isRouteOperatingToday,
  loadBusData,
  loadRoutesByTerminal,
  loadRoutesToTerminal,
} from '../entities/bus/api/loadBusData';
import {useDayTypeStore} from '../entities/bus/model/dayTypeState';
import {
  BusDepartureInfo,
  BusDepartureTable,
} from '../widgets/BusDepartureTable';
import {RoutesList} from '../widgets/RoutesList';
import {StopDetailHeader} from '../widgets/StopDetailHeader';
import {StopDetailTabs} from '../widgets/StopDetailTabs';
import {colors, fontSize, spacing} from '../shared/theme';
import type {RootStackParamList} from '../navigation/AppNavigator';

type StopDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StopDetail'>;
  route: RouteProp<RootStackParamList, 'StopDetail'>;
};

interface GroupedDeparture {
  nextDeparture: {
    departureTime: string;
    nextDepartureMinutes: number;
    category: string;
    isFromTerminal: boolean;
    isNextDay?: boolean;
    tripIndex?: number;
  };
  remainingCount: number;
  operatesToday: boolean;
}

export function StopDetailScreen({navigation, route}: StopDetailScreenProps) {
  const {stopName} = route.params;
  const {updateDayTypes} = useDayTypeStore();

  const [departureRoutes, setDepartureRoutes] = useState<string[]>([]);
  const [arrivalRoutes, setArrivalRoutes] = useState<string[]>([]);
  const [groupedDepartures, setGroupedDepartures] = useState<
    Record<string, GroupedDeparture>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'from' | 'to'>('all');

  const loadData = useCallback(() => {
    try {
      updateDayTypes();

      const fromRoutes = loadRoutesByTerminal(stopName);
      const toRoutes = loadRoutesToTerminal(stopName);
      setDepartureRoutes(fromRoutes);
      setArrivalRoutes(toRoutes);

      const times = getAllDepartureTimesFromStop(stopName);
      const uniqueRoutes = Array.from(
        new Set(times.map(time => time.routeNumber)),
      );
      const grouped: Record<string, GroupedDeparture> = {};

      for (const routeNumber of uniqueRoutes) {
        const busData = loadBusData(routeNumber);
        if (!busData) {
          continue;
        }

        const routeTimes = times.filter(t => t.routeNumber === routeNumber);
        routeTimes.sort((a, b) => {
          const getMin = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
          };
          return getMin(a.departureTime) - getMin(b.departureTime);
        });

        const remainingTimes = routeTimes.filter(
          t => t.nextDepartureMinutes >= 0 && !t.isNextDay,
        );
        const nextDayTimes = routeTimes.filter(t => t.isNextDay);

        let nextDeparture;
        if (remainingTimes.length > 0) {
          nextDeparture = remainingTimes[0];
        } else if (nextDayTimes.length > 0) {
          nextDeparture = nextDayTimes[0];
        } else {
          nextDeparture = routeTimes[0];
        }

        if (!nextDeparture) {
          continue;
        }

        const operatesToday = isRouteOperatingToday(routeNumber);
        const remainingCount = operatesToday ? remainingTimes.length : 0;

        grouped[routeNumber] = {
          nextDeparture,
          remainingCount,
          operatesToday,
        };
      }

      setGroupedDepartures(grouped);
      setError(null);
    } catch (err) {
      setError('버스 노선 데이터를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [stopName, updateDayTypes]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredDepartures: BusDepartureInfo[] = useMemo(() => {
    return Object.entries(groupedDepartures)
      .filter(([_, data]) => {
        if (activeTab === 'all') {
          return true;
        }
        if (activeTab === 'from') {
          return data.nextDeparture.isFromTerminal;
        }
        return !data.nextDeparture.isFromTerminal;
      })
      .sort((a, b) => {
        if (a[1].operatesToday !== b[1].operatesToday) {
          return a[1].operatesToday ? -1 : 1;
        }
        const getMin = (time: string) => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };
        return (
          getMin(a[1].nextDeparture.departureTime) -
          getMin(b[1].nextDeparture.departureTime)
        );
      })
      .map(([routeNumber, data]) => ({
        routeNumber,
        departureTime: data.nextDeparture.departureTime,
        nextDepartureMinutes: data.nextDeparture.nextDepartureMinutes,
        category: data.nextDeparture.category,
        isFromTerminal: data.nextDeparture.isFromTerminal,
        remainingCount: data.remainingCount,
        operatesToday: data.operatesToday,
        isNextDay: data.nextDeparture.isNextDay,
        tripIndex: data.nextDeparture.tripIndex,
      }));
  }, [groupedDepartures, activeTab]);

  const routeListData = useMemo(() => {
    return Array.from(
      new Set([...departureRoutes, ...arrivalRoutes]),
    ).map(routeNumber => {
      const routeData = groupedDepartures[routeNumber];
      return {
        routeNumber,
        isDeparture: departureRoutes.includes(routeNumber),
        isArrival: arrivalRoutes.includes(routeNumber),
        remainingCount: routeData?.remainingCount || 0,
        operatesToday: routeData?.operatesToday || false,
      };
    });
  }, [departureRoutes, arrivalRoutes, groupedDepartures]);

  return (
    <ScrollView
      testID="stop-detail-screen"
      style={styles.container}
      contentContainerStyle={styles.content}>
      <StopDetailHeader stopName={stopName} />

      <View style={styles.tabsSection}>
        <StopDetailTabs
          activeTab={activeTab}
          departureRoutesCount={departureRoutes.length}
          arrivalRoutesCount={arrivalRoutes.length}
          onTabChange={setActiveTab}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            "{stopName}" 정류장 정보를 불러오는 중입니다.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>다음 출발 시간</Text>
            <BusDepartureTable
              departures={filteredDepartures}
              isLoading={false}
              error={null}
              onRoutePress={routeNumber =>
                navigation.navigate('BusDetail', {routeNumber})
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>노선 목록</Text>
            <RoutesList
              routes={routeListData}
              onRoutePress={routeNumber =>
                navigation.navigate('BusDetail', {routeNumber})
              }
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  tabsSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gray600,
    fontSize: fontSize.md,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
});
