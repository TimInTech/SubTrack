import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { FAB } from '../src/components/ui';
import { useSubscriptions } from '../src/hooks/useApi';
import { formatCurrency, getBillingCycleShort } from '../src/utils/format';
import { Subscription } from '../src/types';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { subscriptions, loading, fetch, remove } = useSubscriptions();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

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

  const deleteSubscription = (id: string, itemName: string) => {
    Alert.alert(
      'Abo löschen',
      `Möchten Sie "${itemName}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => remove(id),
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: Subscription; index: number }) => (
    <Animated.View>
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => router.push(`/subscription/${item.id}`)}
        onLongPress={() => deleteSubscription(item.id, item.name)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.surface, COLORS.surfaceLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.itemGradient}
        >
          <View style={styles.itemHeader}>
            <View style={[styles.itemIcon, { backgroundColor: `${COLORS.primary}20` }]}>
              <MaterialCommunityIcons
                name={getServiceIcon(item.name)}
                size={24}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
            <View style={styles.itemAmount}>
              <Text style={styles.amountValue}>{formatCurrency(item.amount_cents)}</Text>
              <Text style={styles.amountCycle}>{getBillingCycleShort(item.billing_cycle)}</Text>
            </View>
          </View>
          <View style={styles.itemFooter}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/subscription/${item.id}`)}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Bearbeiten</Text>
            </TouchableOpacity>
            {item.cancel_url && (
              <View style={styles.linkBadge}>
                <MaterialCommunityIcons name="link" size={14} color={COLORS.secondary} />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={COLORS.gradientPurple as [string, string]}
              style={styles.emptyIcon}
            >
              <MaterialCommunityIcons name="credit-card-plus" size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyText}>Keine Abonnements</Text>
            <Text style={styles.emptySubtext}>Tippen Sie auf + um ein Abo hinzuzufügen</Text>
          </View>
        ) : (
          <FlatList
            data={subscriptions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 160 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
      </SafeAreaView>

      <FAB onPress={() => router.push('/subscription/add')} icon="plus" testID="add-subscription-fab" />
    </>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xl,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.md,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  itemCard: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  itemGradient: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemCategory: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: FONTS.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  amountCycle: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sm,
    fontWeight: '500',
  },
  linkBadge: {
    backgroundColor: `${COLORS.secondary}20`,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
});
