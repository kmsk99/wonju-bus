import React, {useEffect, useMemo, useState} from 'react';
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
import {loadTerminals} from '../entities/bus/api/loadBusData';
import {TerminalCard} from '../widgets/TerminalCard';
import {borderRadius, colors, fontSize, shadow, spacing} from '../shared/theme';
import type {RootStackParamList} from '../navigation/AppNavigator';

type StopsListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StopsList'>;
};

export function StopsListScreen({navigation}: StopsListScreenProps) {
  const [stops, setStops] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const data = loadTerminals();
      setStops(data);
    } catch (err) {
      setError('종점 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredStops = useMemo(
    () =>
      stops.filter(stop =>
        stop.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [stops, searchTerm],
  );

  return (
    <View testID="stops-list-screen" style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="종점 이름 검색..."
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
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setIsLoading(true);
              setError(null);
              try {
                setStops(loadTerminals());
              } catch (e) {
                setError('종점 목록을 불러오는 중 오류가 발생했습니다.');
              } finally {
                setIsLoading(false);
              }
            }}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : filteredStops.length === 0 ? (
        <View testID="empty-results" style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          testID="stops-flatlist"
          data={filteredStops}
          renderItem={({item}) => (
            <TerminalCard
              name={item}
              onPress={() =>
                navigation.navigate('StopDetail', {stopName: item})
              }
            />
          )}
          keyExtractor={item => item}
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
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.red500,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});
