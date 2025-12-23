import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { GlassCard, AnimatedNumber, ProgressBar } from '../src/components/ui';
import { useDashboard } from '../src/hooks/useApi';
import { formatCurrency } from '../src/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Simple Pie Chart Component
interface PieChartProps {
  data: { value: number; color: string; label: string }[];
  size?: number;
}

const SimplePieChart: React.FC<PieChartProps> = ({ data, size = 140 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  const radius = size / 2;
  const innerRadius = radius * 0.65;
  const strokeWidth = radius - innerRadius;
  const circumference = 2 * Math.PI * (innerRadius + strokeWidth / 2);

  let currentAngle = 0;

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${radius}, ${radius}`}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
          const strokeDashoffset = -circumference * currentAngle;
          currentAngle += percentage;

          return (
            <Circle
              key={index}
              cx={radius}
              cy={radius}
              r={innerRadius + strokeWidth / 2}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
      </G>
    </Svg>
  );
};

export default function DashboardScreen() {
  const { data, loading, fetch, loadDemoData, setLoading } = useDashboard();
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  const handleLoadDemoData = () => {
    Alert.alert(
      'Demo-Daten laden',
      'Möchten Sie Demo-Daten anlegen? Bestehende Daten werden gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Laden',
          onPress: async () => {
            const success = await loadDemoData();
            if (success) {
              Alert.alert('Erfolg', 'Demo-Daten wurden angelegt!');
            } else {
              Alert.alert('Fehler', 'Demo-Daten konnten nicht geladen werden.');
            }
          },
        },
      ]
    );
  };

  // Calculate chart data
  const chartData = React.useMemo(() => {
    if (!data) return [];
    const total = data.monthly_subscriptions + data.monthly_expenses;
    if (total === 0) return [];
    
    return [
      {
        value: data.monthly_subscriptions,
        color: COLORS.primary,
        text: `${Math.round((data.monthly_subscriptions / total) * 100)}%`,
        label: 'Abos',
      },
      {
        value: data.monthly_expenses,
        color: COLORS.accent,
        text: `${Math.round((data.monthly_expenses / total) * 100)}%`,
        label: 'Fixkosten',
      },
    ];
  }, [data]);

  // Budget progress (example: 2000€ monthly budget)
  const MONTHLY_BUDGET = 200000; // 2000€ in cents
  const budgetProgress = data ? Math.min((data.total_monthly / MONTHLY_BUDGET) * 100, 100) : 0;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Lade Daten...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Dieser Monat</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Main Total Card */}
          <LinearGradient
            colors={COLORS.gradientPurple as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalCard}
          >
            <View style={styles.totalCardContent}>
              <Text style={styles.totalLabel}>Gesamtausgaben</Text>
              <AnimatedNumber
                value={data?.total_monthly || 0}
                style={styles.totalValue}
                duration={1200}
              />
              <View style={styles.totalStats}>
                <View style={styles.totalStatItem}>
                  <MaterialCommunityIcons name="credit-card" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.totalStatText}>{data?.subscription_count || 0} Abos</Text>
                </View>
                <View style={styles.totalStatItem}>
                  <MaterialCommunityIcons name="wallet" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.totalStatText}>{data?.expense_count || 0} Fixkosten</Text>
                </View>
              </View>
            </View>
            <View style={styles.totalCardIcon}>
              <MaterialCommunityIcons name="chart-arc" size={80} color="rgba(255,255,255,0.15)" />
            </View>
          </LinearGradient>

          {/* Stats Cards Row */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard} borderColor={COLORS.primary}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.primary}20` }]}>
                <MaterialCommunityIcons name="credit-card-multiple" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.statLabel}>Abonnements</Text>
              <AnimatedNumber
                value={data?.monthly_subscriptions || 0}
                style={[styles.statValue, { color: COLORS.primary }]}
                duration={1000}
              />
            </GlassCard>

            <GlassCard style={styles.statCard} borderColor={COLORS.accent}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <MaterialCommunityIcons name="home-city" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.statLabel}>Fixkosten</Text>
              <AnimatedNumber
                value={data?.monthly_expenses || 0}
                style={[styles.statValue, { color: COLORS.accent }]}
                duration={1000}
              />
            </GlassCard>
          </View>

          {/* Chart Section */}
          {chartData.length > 0 && (
            <GlassCard style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Kostenverteilung</Text>
              <View style={styles.chartContainer}>
                <View style={styles.chartWrapper}>
                  <SimplePieChart data={chartData} size={140} />
                  <View style={styles.chartCenterOverlay}>
                    <MaterialCommunityIcons name="percent" size={24} color={COLORS.textSecondary} />
                  </View>
                </View>
                <View style={styles.chartLegend}>
                  {chartData.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendValue}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </GlassCard>
          )}

          {/* Budget Progress */}
          <GlassCard style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <MaterialCommunityIcons name="target" size={24} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Monatsbudget</Text>
            </View>
            <ProgressBar
              progress={budgetProgress}
              label="Verbraucht"
              value={formatCurrency(data?.total_monthly || 0)}
              gradient={budgetProgress > 80 ? COLORS.gradientOrange : COLORS.gradientCyan}
              height={12}
            />
            <Text style={styles.budgetNote}>
              von {formatCurrency(MONTHLY_BUDGET)} Budget
            </Text>
          </GlassCard>

          {/* Yearly Projection */}
          <GlassCard style={styles.yearlyCard} gradient={COLORS.gradientBlue}>
            <View style={styles.yearlyContent}>
              <View>
                <View style={styles.yearlyHeader}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color="#fff" />
                  <Text style={styles.yearlyLabel}>Jahreshochrechnung</Text>
                </View>
                <AnimatedNumber
                  value={data?.yearly_total || 0}
                  style={styles.yearlyValue}
                  duration={1500}
                />
                <Text style={styles.yearlyNote}>Monatlich × 12 + jährliche Posten</Text>
              </View>
              <MaterialCommunityIcons name="chart-timeline-variant" size={48} color="rgba(255,255,255,0.3)" />
            </View>
          </GlassCard>

          {/* Demo Data Button */}
          <TouchableOpacity style={styles.demoButton} onPress={handleLoadDemoData}>
            <MaterialCommunityIcons name="flask-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.demoButtonText}>Demo-Daten anlegen</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontSize: FONTS.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONTS.xxxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textTransform: 'capitalize',
  },
  totalCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  totalCardContent: {
    flex: 1,
  },
  totalCardIcon: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -40,
  },
  totalLabel: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  totalValue: {
    fontSize: FONTS.display,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  totalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  totalStatText: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONTS.xxl,
    fontWeight: 'bold',
  },
  chartCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  chartWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenterOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLegend: {
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: FONTS.md,
    color: COLORS.textSecondary,
    flex: 1,
  },
  legendValue: {
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  budgetCard: {
    marginBottom: SPACING.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  budgetNote: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'right',
  },
  yearlyCard: {
    marginBottom: SPACING.lg,
  },
  yearlyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  yearlyLabel: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.9)',
  },
  yearlyValue: {
    fontSize: FONTS.xxxl,
    fontWeight: 'bold',
    color: '#fff',
  },
  yearlyNote: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.xs,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoButtonText: {
    color: COLORS.textMuted,
    fontSize: FONTS.md,
  },
});
