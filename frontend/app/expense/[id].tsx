import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui';
import { useExpenses } from '../../src/hooks/useApi';
import { formatCurrency, getBillingCycleLabel } from '../../src/utils/format';
import { Expense } from '../../src/types';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fetchOne, remove } = useExpenses();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    if (!id) return;
    const data = await fetchOne(id);
    if (data) {
      setExpense(data);
    } else {
      Alert.alert('Fehler', 'Fixkosten nicht gefunden.');
      router.back();
    }
    setLoading(false);
  };

  const deleteExpense = () => {
    Alert.alert(
      'Fixkosten löschen',
      `Möchten Sie "${expense?.name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              const success = await remove(id);
              if (success) {
                router.back();
              }
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (cat: string): string => {
    switch (cat) {
      case 'Wohnen': return 'home';
      case 'Versicherung': return 'shield-check';
      case 'Kommunikation': return 'phone';
      case 'Mobilität': return 'car';
      case 'Gesundheit': return 'heart-pulse';
      case 'Bildung': return 'school';
      default: return 'wallet';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Fixkosten nicht gefunden</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <LinearGradient
          colors={COLORS.gradientOrange as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name={getCategoryIcon(expense.category) as any}
              size={40}
              color="#fff"
            />
          </View>
          <Text style={styles.name}>{expense.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{expense.category}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(expense.amount_cents)}</Text>
            <Text style={styles.cycle}>
              {expense.billing_cycle === 'MONTHLY' ? 'pro Monat' : 'pro Jahr'}
            </Text>
          </View>
        </LinearGradient>

        {/* Details Card */}
        <GlassCard style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: `${COLORS.info}20` }]}>
              <MaterialCommunityIcons name="repeat" size={20} color={COLORS.info} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Abrechnungszyklus</Text>
              <Text style={styles.detailValue}>
                {getBillingCycleLabel(expense.billing_cycle)}
              </Text>
            </View>
          </View>

          {expense.billing_cycle === 'YEARLY' && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${COLORS.success}20` }]}>
                <MaterialCommunityIcons name="calculator" size={20} color={COLORS.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pro Monat (umgerechnet)</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(Math.round(expense.amount_cents / 12))}
                </Text>
              </View>
            </View>
          )}

          {expense.billing_cycle === 'MONTHLY' && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${COLORS.success}20` }]}>
                <MaterialCommunityIcons name="calculator" size={20} color={COLORS.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pro Jahr (hochgerechnet)</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(expense.amount_cents * 12)}
                </Text>
              </View>
            </View>
          )}

          {expense.notes && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <MaterialCommunityIcons name="text" size={20} color={COLORS.accent} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notizen</Text>
                <Text style={styles.detailValue}>{expense.notes}</Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={deleteExpense}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Fixkosten löschen</Text>
        </TouchableOpacity>
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
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.lg,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  headerCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: FONTS.xxl,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONTS.sm,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'center',
  },
  price: {
    fontSize: FONTS.display,
    fontWeight: 'bold',
    color: '#fff',
  },
  cycle: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  detailsCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: FONTS.md,
    fontWeight: '500',
  },
});
