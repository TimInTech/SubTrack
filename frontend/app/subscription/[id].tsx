import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/ui';
import { useSubscriptions } from '../../src/hooks/useApi';
import { formatCurrency, formatDate, getBillingCycleLabel } from '../../src/utils/format';
import { Subscription } from '../../src/types';

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fetchOne, remove } = useSubscriptions();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, [id]);

  const loadSubscription = async () => {
    if (!id) return;
    const data = await fetchOne(id);
    if (data) {
      setSubscription(data);
    } else {
      Alert.alert('Fehler', 'Abonnement nicht gefunden.');
      router.back();
    }
    setLoading(false);
  };

  const openCancelUrl = async () => {
    if (subscription?.cancel_url) {
      const supported = await Linking.canOpenURL(subscription.cancel_url);
      if (supported) {
        await Linking.openURL(subscription.cancel_url);
      } else {
        Alert.alert('Fehler', 'Diese URL kann nicht geöffnet werden.');
      }
    }
  };

  const deleteSubscription = () => {
    Alert.alert(
      'Abo löschen',
      `Möchten Sie "${subscription?.name}" wirklich löschen?`,
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

  const getServiceIcon = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    if (name.includes('netflix')) return 'netflix';
    if (name.includes('spotify')) return 'spotify';
    if (name.includes('amazon')) return 'amazon';
    if (name.includes('disney')) return 'movie-star';
    if (name.includes('youtube')) return 'youtube';
    if (name.includes('apple')) return 'apple';
    if (name.includes('microsoft') || name.includes('office')) return 'microsoft';
    if (name.includes('icloud') || name.includes('cloud')) return 'cloud';
    return 'credit-card';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Abonnement nicht gefunden</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <LinearGradient
          colors={COLORS.gradientPurple as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name={getServiceIcon(subscription.name) as any}
              size={40}
              color="#fff"
            />
          </View>
          <Text style={styles.name}>{subscription.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{subscription.category}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(subscription.amount_cents)}</Text>
            <Text style={styles.cycle}>
              {subscription.billing_cycle === 'MONTHLY' ? 'pro Monat' : 'pro Jahr'}
            </Text>
          </View>
        </LinearGradient>

        {/* Details Card */}
        <GlassCard style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: `${COLORS.secondary}20` }]}>
              <MaterialCommunityIcons name="calendar" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Startdatum</Text>
              <Text style={styles.detailValue}>{formatDate(subscription.start_date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: `${COLORS.info}20` }]}>
              <MaterialCommunityIcons name="repeat" size={20} color={COLORS.info} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Abrechnungszyklus</Text>
              <Text style={styles.detailValue}>
                {getBillingCycleLabel(subscription.billing_cycle)}
              </Text>
            </View>
          </View>

          {subscription.billing_cycle === 'YEARLY' && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${COLORS.success}20` }]}>
                <MaterialCommunityIcons name="calculator" size={20} color={COLORS.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pro Monat (umgerechnet)</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(Math.round(subscription.amount_cents / 12))}
                </Text>
              </View>
            </View>
          )}

          {subscription.billing_cycle === 'MONTHLY' && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${COLORS.success}20` }]}>
                <MaterialCommunityIcons name="calculator" size={20} color={COLORS.success} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pro Jahr (hochgerechnet)</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(subscription.amount_cents * 12)}
                </Text>
              </View>
            </View>
          )}

          {subscription.notes && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <MaterialCommunityIcons name="text" size={20} color={COLORS.accent} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notizen</Text>
                <Text style={styles.detailValue}>{subscription.notes}</Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Cancel URL Button */}
        {subscription.cancel_url && (
          <TouchableOpacity activeOpacity={0.8} onPress={openCancelUrl}>
            <LinearGradient
              colors={COLORS.gradientCyan as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cancelUrlButton}
            >
              <MaterialCommunityIcons name="open-in-new" size={20} color="#fff" />
              <Text style={styles.cancelUrlText}>Kündigungslink öffnen</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={deleteSubscription}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Abo löschen</Text>
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
  cancelUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cancelUrlText: {
    color: '#fff',
    fontSize: FONTS.md,
    fontWeight: 'bold',
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
