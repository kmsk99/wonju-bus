import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {borderRadius, colors, fontSize, spacing} from '../shared/theme';

type TabType = 'all' | 'from' | 'to';

interface StopDetailTabsProps {
  activeTab: TabType;
  departureRoutesCount: number;
  arrivalRoutesCount: number;
  onTabChange: (tab: TabType) => void;
}

export function StopDetailTabs({
  activeTab,
  departureRoutesCount,
  arrivalRoutesCount,
  onTabChange,
}: StopDetailTabsProps) {
  const tabs: {key: TabType; label: string; count?: number}[] = [
    {key: 'all', label: '전체'},
    {key: 'from', label: '출발 노선', count: departureRoutesCount},
    {key: 'to', label: '도착 노선', count: arrivalRoutesCount},
  ];

  return (
    <View testID="stop-detail-tabs" style={styles.container}>
      {tabs.map(tab => (
        <Pressable
          key={tab.key}
          testID={`tab-${tab.key}`}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}>
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}>
            {tab.label}
            {tab.count !== undefined ? ` (${tab.count})` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray700,
  },
  activeTabText: {
    color: colors.white,
  },
});
