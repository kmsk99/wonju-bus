import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {getRouteCountForTerminal} from '../entities/bus/api/loadBusData';
import {borderRadius, colors, fontSize, shadow, spacing} from '../shared/theme';

interface TerminalCardProps {
  name: string;
  onPress: () => void;
}

export function TerminalCard({name, onPress}: TerminalCardProps) {
  const routeCount = getRouteCountForTerminal(name);

  return (
    <TouchableOpacity
      testID={`terminal-card-${name}`}
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚏</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {routeCount > 0 && (
            <Text style={styles.routeCount}>노선 {routeCount}개</Text>
          )}
        </View>
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.blue100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray800,
  },
  routeCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    marginLeft: spacing.sm,
  },
  arrowText: {
    fontSize: 24,
    color: colors.gray400,
    fontWeight: '300',
  },
});
