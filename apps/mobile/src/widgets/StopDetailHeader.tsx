import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Clock} from '../shared/ui/Clock';
import {colors, fontSize, spacing} from '../shared/theme';

interface StopDetailHeaderProps {
  stopName: string;
}

export function StopDetailHeader({stopName}: StopDetailHeaderProps) {
  return (
    <View testID="stop-detail-header" style={styles.container}>
      <Text style={styles.title}>{stopName}</Text>
      <View style={styles.clockWrapper}>
        <Clock />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  clockWrapper: {
    marginTop: spacing.sm,
  },
});
