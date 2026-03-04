import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {loadAllBusData} from '../entities/bus/api/loadBusData';
import {BusData} from '../entities/bus/model/types';
import {borderRadius, colors, fontSize, shadow, spacing} from '../shared/theme';
import type {RootStackParamList} from '../navigation/AppNavigator';

type BusListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BusList'>;
};

export function BusListScreen({navigation}: BusListScreenProps) {
  const [routes, setRoutes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const busDataList = loadAllBusData();
      if (busDataList && busDataList.length > 0) {
        const routeNumbers = busDataList.map(
          (bus: BusData) => bus.routeInfo.routeNumber,
        );
        const uniqueRoutes = Array.from(new Set(routeNumbers));
        setRoutes(uniqueRoutes);
      } else {
        setError('노선 데이터를 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('노선 데이터를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredRoutes = useMemo(
    () =>
      routes.filter(route =>
        route.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [routes, searchTerm],
  );

  const renderRouteCard = useCallback(
    ({item, index}: {item: string; index: number}) => (
      <TouchableOpacity
        testID={`route-card-${item}`}
        style={styles.routeCard}
        onPress={() => navigation.navigate('BusDetail', {routeNumber: item})}
        activeOpacity={0.7}>
        <View style={styles.routeBadge}>
          <Text style={styles.routeBadgeText}>{item}</Text>
        </View>
        <Text style={styles.routeLabel}>{item}번</Text>
        <View style={styles.detailBadge}>
          <Text style={styles.detailBadgeText}>상세 정보</Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    <View testID="bus-list-screen" style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="노선 번호 검색..."
            placeholderTextColor={colors.gray400}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              testID="clear-search"
              onPress={() => setSearchTerm('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.countText}>
          총 {routes.length}개 노선 중 {filteredRoutes.length}개 노선이
          검색되었습니다.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredRoutes.length === 0 ? (
        <View testID="empty-results" style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😔</Text>
          <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
          <Text style={styles.emptySubtitle}>
            다른 노선 번호로 검색해보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          testID="routes-flatlist"
          data={filteredRoutes}
          renderItem={renderRouteCard}
          keyExtractor={item => item}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  clearBtn: {
    fontSize: 16,
    color: colors.gray400,
    padding: spacing.xs,
  },
  countText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  columnWrapper: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  routeCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  routeBadge: {
    backgroundColor: colors.blue100,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  routeBadgeText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  routeLabel: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailBadge: {
    backgroundColor: colors.blue100,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  detailBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.blue800,
  },
});
