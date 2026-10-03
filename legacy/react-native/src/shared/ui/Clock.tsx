import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {colors, fontSize} from '../theme';

export function Clock() {
  const [time, setTime] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    return () => clearInterval(interval);
  }, [pulseAnim]);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <View testID="clock-component">
      <Animated.View
        style={[styles.container, {transform: [{scale: pulseAnim}]}]}>
        <Text style={styles.time}>
          {hours}:{minutes}
          <Text style={styles.seconds}>:{seconds}</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  time: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  seconds: {
    fontSize: fontSize.lg,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
});
