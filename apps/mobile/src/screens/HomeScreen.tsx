import React, {useEffect, useRef} from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Clock} from '../shared/ui/Clock';
import {colors, borderRadius, fontSize, shadow, spacing} from '../shared/theme';
import type {RootStackParamList} from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({navigation}: HomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardsFade = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(20)).current;
  const infoFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardsFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cardsSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(infoFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, cardsFade, cardsSlide, infoFade]);

  return (
    <ScrollView
      testID="home-screen"
      style={styles.container}
      contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <Animated.View
        style={[
          styles.hero,
          {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
        ]}>
        <View style={styles.heroWave} />
        <Text style={styles.heroTitle}>원주시 버스 종점 출발 시간</Text>
        <Text style={styles.heroSubtitle}>
          원주시 버스의 종점 출발 시간을 확인하고{'\n'}대기 시간을 실시간으로
          파악해보세요
        </Text>
        <View style={styles.clockContainer}>
          <Clock />
        </View>
      </Animated.View>

      {/* Navigation Cards */}
      <Animated.View
        style={[
          styles.cardsContainer,
          {opacity: cardsFade, transform: [{translateY: cardsSlide}]},
        ]}>
        <TouchableOpacity
          testID="nav-card-stops"
          style={styles.navCard}
          onPress={() => navigation.navigate('StopsList')}
          activeOpacity={0.8}>
          <View style={styles.navCardIcon}>
            <Text style={styles.navCardEmoji}>📍</Text>
          </View>
          <Text style={styles.navCardTitle}>종점별 조회</Text>
          <Text style={styles.navCardDesc}>
            출발지 종점별로 버스 노선을 조회하여 원하는 지역의 모든 버스 정보를
            확인할 수 있습니다.
          </Text>
          <Text style={styles.navCardLink}>자세히 보기 →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="nav-card-buses"
          style={styles.navCard}
          onPress={() => navigation.navigate('BusList')}
          activeOpacity={0.8}>
          <View style={styles.navCardIcon}>
            <Text style={styles.navCardEmoji}>🚌</Text>
          </View>
          <Text style={styles.navCardTitle}>노선별 조회</Text>
          <Text style={styles.navCardDesc}>
            버스 노선별로 시간표를 조회하여 특정 버스의 모든 출발 시간 정보를
            확인할 수 있습니다.
          </Text>
          <Text style={styles.navCardLink}>자세히 보기 →</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Info Banner */}
      <Animated.View style={[styles.infoBanner, {opacity: infoFade}]}>
        <Text testID="info-banner" style={styles.infoTitle}>
          데이터 최신화 정보
        </Text>
        <Text style={styles.infoText}>
          버스 시간표 데이터는{' '}
          <Text style={styles.infoBold}>매주 월요일</Text> 자동으로 갱신됩니다.
        </Text>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 원주시 버스 종점 정보 서비스
        </Text>
        <Text style={styles.footerLink}>@kmsk99</Text>
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
    paddingBottom: spacing.xxxl,
  },
  hero: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  heroTitle: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  clockContainer: {
    marginTop: spacing.sm,
  },
  cardsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    gap: spacing.md,
  },
  navCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadow.lg,
  },
  navCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.blue100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navCardEmoji: {
    fontSize: 22,
  },
  navCardTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.gray800,
    marginBottom: spacing.sm,
  },
  navCardDesc: {
    fontSize: fontSize.md,
    color: colors.gray600,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  navCardLink: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  infoBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.blue50,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.blue800,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.blue700,
    lineHeight: 22,
  },
  infoBold: {
    fontWeight: '700',
  },
  footer: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
});
