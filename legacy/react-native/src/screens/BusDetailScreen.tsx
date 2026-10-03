import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {loadBusData} from '../entities/bus/api/loadBusData';
import {BusData, DayType} from '../entities/bus/model/types';
import {borderRadius, colors, fontSize, shadow, spacing} from '../shared/theme';
import type {RootStackParamList} from '../navigation/AppNavigator';

type BusDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BusDetail'>;
  route: RouteProp<RootStackParamList, 'BusDetail'>;
};

export function BusDetailScreen({navigation, route}: BusDetailScreenProps) {
  const {routeNumber} = route.params;

  const [busData, setBusData] = useState<BusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DayType>('평일');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const data = loadBusData(routeNumber);
      if (data) {
        setBusData(data);
        if (data.operationInfo.length > 0) {
          const categories = new Set(data.operationInfo.map(op => op.category));
          if (categories.has('평일')) {
            setActiveTab('평일');
          } else if (categories.has('토요일')) {
            setActiveTab('토요일');
          } else if (categories.has('일요일')) {
            setActiveTab('일요일');
          } else if (categories.has('공통')) {
            setActiveTab('공통');
          }
        }
      } else {
        setError(`${routeNumber}번 노선 데이터를 찾을 수 없습니다.`);
      }
    } catch (err) {
      setError('버스 노선 데이터를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [routeNumber]);

  const filteredOperations = useMemo(
    () =>
      busData?.operationInfo.filter(
        op =>
          op.category === activeTab ||
          (activeTab === '평일' && op.category === '공통'),
      ) || [],
    [busData, activeTab],
  );

  const availableTabs: DayType[] = useMemo(
    () =>
      (['평일', '토요일', '일요일', '공통'] as DayType[]).filter(tab => {
        if (tab === '공통') {
          return true;
        }
        return busData?.operationInfo.some(op => op.category === tab);
      }),
    [busData],
  );

  const sortedOperations = useMemo(
    () =>
      [...filteredOperations].sort(
        (a, b) => parseInt(a.operationNumber) - parseInt(b.operationNumber),
      ),
    [filteredOperations],
  );

  function getTimeStatus(timeStr: string): 'past' | 'current' | 'future' {
    if (timeStr === '-') {
      return 'future';
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0);
    const diffMinutes = Math.floor(
      (timeDate.getTime() - currentTime.getTime()) / (60 * 1000),
    );
    if (diffMinutes >= -30 && diffMinutes <= 30) {
      return 'current';
    }
    return timeDate < currentTime ? 'past' : 'future';
  }

  function getOperationStatus(
    departureTime: string,
    arrivalTime: string,
  ): 'current' | 'past' | 'future' {
    const depStatus = getTimeStatus(departureTime);
    const arrStatus = getTimeStatus(arrivalTime);
    if (depStatus === 'current' || arrStatus === 'current') {
      return 'current';
    }
    if (depStatus === 'past' && arrStatus === 'future') {
      return 'current';
    }
    if (depStatus === 'past' && arrStatus === 'past') {
      return 'past';
    }
    return 'future';
  }

  function calculateTravelTime(dep: string, arr: string): string {
    if (dep === '-' || arr === '-') {
      return '-';
    }
    const [dH, dM] = dep.split(':').map(Number);
    const [aH, aM] = arr.split(':').map(Number);
    let diff = aH * 60 + aM - (dH * 60 + dM);
    if (diff < 0) {
      diff += 24 * 60;
    }
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
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

  if (!busData) {
    return null;
  }

  return (
    <ScrollView
      testID="bus-detail-screen"
      style={styles.container}
      contentContainerStyle={styles.content}>
      {/* Route Info Card */}
      <View testID="route-info-card" style={styles.infoCard}>
        <Text style={styles.infoTitle}>노선 정보</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>출발 종점</Text>
            <Text style={styles.infoValue}>{busData.routeInfo.origin}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>도착 종점</Text>
            <Text style={styles.infoValue}>
              {busData.routeInfo.destination}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>첫차</Text>
            <Text style={styles.infoValue}>
              {busData.routeInfo.firstBusTime}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>막차</Text>
            <Text style={styles.infoValue}>
              {busData.routeInfo.lastBusTime}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>운행 횟수</Text>
            <Text style={styles.infoValue}>
              {busData.routeInfo.operationCount}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>배차 간격</Text>
            <Text style={styles.infoValue}>{busData.routeInfo.interval}</Text>
          </View>
        </View>
      </View>

      {/* Day Type Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          {availableTabs.map(tab => (
            <TouchableOpacity
              key={tab}
              testID={`day-tab-${tab}`}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Timetable */}
      <Text style={styles.sectionTitle}>운행 시간표 ({activeTab})</Text>

      {sortedOperations.length === 0 ? (
        <Text style={styles.emptyText}>
          이 날짜에는 운행 정보가 없습니다.
        </Text>
      ) : (
        sortedOperations.map((op, index) => {
          const status = getOperationStatus(op.departureTime, op.arrivalTime);
          const depStatus = getTimeStatus(op.departureTime);
          const arrStatus = getTimeStatus(op.arrivalTime);
          const isExpanded = expandedCard === index;

          return (
            <TouchableOpacity
              key={index}
              testID={`operation-card-${op.operationNumber}`}
              style={[
                styles.opCard,
                status === 'current' && styles.opCardCurrent,
                status === 'past' && styles.opCardPast,
              ]}
              onPress={() => setExpandedCard(isExpanded ? null : index)}
              activeOpacity={0.8}>
              {/* Header */}
              <View style={styles.opHeader}>
                <View style={styles.opHeaderLeft}>
                  <Text style={styles.opNumber}>
                    회차 {op.operationNumber}
                  </Text>
                  <Text style={styles.expandIcon}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    status === 'current' && styles.statusCurrent,
                    status === 'past' && styles.statusPast,
                    status === 'future' && styles.statusFuture,
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      status === 'future' && styles.statusTextFuture,
                    ]}>
                    {status === 'current'
                      ? '현재 운행 중'
                      : status === 'past'
                        ? '운행 완료'
                        : '운행 예정'}
                  </Text>
                </View>
              </View>

              {/* Departure */}
              <View style={styles.stopRow}>
                <View style={styles.depIcon}>
                  <Text style={styles.depIconText}>↑</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopLabel}>출발</Text>
                  <View style={styles.stopDetail}>
                    <TouchableOpacity
                      onPress={() => {
                        if (op.departureName !== '-') {
                          navigation.navigate('StopDetail', {
                            stopName: op.departureName,
                          });
                        }
                      }}>
                      <Text
                        style={[
                          styles.stopName,
                          op.departureName !== '-' && styles.stopNameLink,
                        ]}>
                        {op.departureName !== '-'
                          ? op.departureName
                          : '정보 없음'}
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.timeText,
                        depStatus === 'current' && styles.timeTextCurrent,
                        depStatus === 'past' && styles.timeTextPast,
                      ]}>
                      {op.departureTime !== '-' ? op.departureTime : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Connector */}
              <View style={styles.connector}>
                <View style={styles.connectorLine} />
              </View>

              {/* Arrival */}
              <View style={styles.stopRow}>
                <View style={styles.arrIcon}>
                  <Text style={styles.arrIconText}>↓</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopLabel}>도착</Text>
                  <View style={styles.stopDetail}>
                    <TouchableOpacity
                      onPress={() => {
                        if (op.arrivalName !== '-') {
                          navigation.navigate('StopDetail', {
                            stopName: op.arrivalName,
                          });
                        }
                      }}>
                      <Text
                        style={[
                          styles.stopName,
                          op.arrivalName !== '-' && styles.arrStopNameLink,
                        ]}>
                        {op.arrivalName !== '-'
                          ? op.arrivalName
                          : '정보 없음'}
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.timeText,
                        arrStatus === 'current' && styles.timeTextCurrent,
                        arrStatus === 'past' && styles.timeTextPast,
                      ]}>
                      {op.arrivalTime !== '-' ? op.arrivalTime : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Note */}
              {op.note && (isExpanded || op.note.length < 20) ? (
                <View style={styles.noteContainer}>
                  <Text style={styles.noteText}>
                    <Text style={styles.noteBold}>비고:</Text> {op.note}
                  </Text>
                </View>
              ) : null}

              {/* Expanded Info */}
              {isExpanded && (
                <View testID="expanded-info" style={styles.expandedContainer}>
                  <View style={styles.expandedGrid}>
                    <View style={styles.expandedItem}>
                      <Text style={styles.expandedLabel}>소요 시간</Text>
                      <Text style={styles.expandedValue}>
                        {op.departureTime !== '-' && op.arrivalTime !== '-'
                          ? calculateTravelTime(
                              op.departureTime,
                              op.arrivalTime,
                            )
                          : '-'}
                      </Text>
                    </View>
                    <View style={styles.expandedItem}>
                      <Text style={styles.expandedLabel}>카테고리</Text>
                      <Text style={styles.expandedValue}>
                        {op.category || '-'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {/* Legend */}
      <View testID="status-legend" style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: colors.green500}]} />
          <Text style={styles.legendText}>현재 운행 중 (±30분)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: colors.blue100}]} />
          <Text style={styles.legendText}>운행 예정</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: colors.gray400}]} />
          <Text style={styles.legendText}>운행 완료</Text>
        </View>
      </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  infoTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
    color: colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray700,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: 2,
  },
  tabsContainer: {
    marginBottom: spacing.md,
  },
  tabsContent: {
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.gray700,
  },
  activeTabText: {
    color: colors.white,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
    color: colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.md,
    paddingVertical: spacing.xl,
  },
  opCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.blue200,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  opCardCurrent: {
    borderColor: '#4ade80',
    backgroundColor: '#f0fdf4',
  },
  opCardPast: {
    borderColor: colors.gray200,
    backgroundColor: colors.gray50,
  },
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  opHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  opNumber: {
    fontWeight: '700',
    fontSize: fontSize.md,
    color: colors.text,
  },
  expandIcon: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusCurrent: {
    backgroundColor: colors.green500,
  },
  statusPast: {
    backgroundColor: colors.gray400,
  },
  statusFuture: {
    backgroundColor: colors.blue100,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  statusTextFuture: {
    color: colors.blue800,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  depIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.blue100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  depIconText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  arrIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.red100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  arrIconText: {
    color: colors.red600,
    fontWeight: '700',
    fontSize: 14,
  },
  stopInfo: {
    flex: 1,
  },
  stopLabel: {
    fontSize: fontSize.sm,
    color: colors.gray600,
    marginBottom: 2,
  },
  stopDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    fontSize: fontSize.md,
    color: colors.gray400,
  },
  stopNameLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  arrStopNameLink: {
    color: colors.red600,
    fontWeight: '500',
  },
  timeText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.gray900,
  },
  timeTextCurrent: {
    color: colors.green700,
  },
  timeTextPast: {
    color: colors.gray400,
  },
  connector: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md + 16,
  },
  connectorLine: {
    width: 2,
    height: 20,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray300,
  },
  noteContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  noteBold: {
    fontWeight: '600',
  },
  expandedContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  expandedGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  expandedItem: {
    flex: 1,
  },
  expandedLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  expandedValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xl,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
});
