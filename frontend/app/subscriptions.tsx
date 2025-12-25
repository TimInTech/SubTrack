import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { GlassCard, FAB } from '../src/components/ui';
import { useSubscriptions } from '../src/hooks/useApi';
import { formatCurrency, getBillingCycleShort } from '../src/utils/format';
import { SERVICE_PRESETS, SUBSCRIPTION_CATEGORIES } from '../src/constants/presets';
import { Subscription, BillingCycle, ServicePreset, PlanOption } from '../src/types';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { subscriptions, loading, fetch, create, update, remove, setLoading } = useSubscriptions();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Streaming');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

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

  const resetForm = () => {
    setName('');
    setCategory('Streaming');
    setAmount('');
    setBillingCycle('MONTHLY');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setCancelUrl('');
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openPresetModal = () => {
    setPresetModalVisible(true);
  };

  const selectPreset = (preset: ServicePreset, plan: PlanOption) => {
    setName(plan.name);
    setCategory(preset.category);
    setAmount((plan.amount_cents / 100).toString().replace('.', ','));
    setBillingCycle(plan.billing_cycle);
    setPresetModalVisible(false);
    setModalVisible(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingId(sub.id);
    setName(sub.name);
    setCategory(sub.category);
    setAmount((sub.amount_cents / 100).toString().replace('.', ','));
    setBillingCycle(sub.billing_cycle);
    setStartDate(sub.start_date);
    setNotes(sub.notes || '');
    setCancelUrl(sub.cancel_url || '');
    setModalVisible(true);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Namen ein.');
      return false;
    }
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Betrag ein (> 0).');
      return false;
    }
    if (cancelUrl.trim() && !cancelUrl.startsWith('http://') && !cancelUrl.startsWith('https://')) {
      Alert.alert('Fehler', 'Die URL muss mit http:// oder https:// beginnen.');
      return false;
    }
    return true;
  };

  const saveSubscription = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const amountCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);

    const payload = {
      name: name.trim(),
      category,
      amount_cents: amountCents,
      billing_cycle: billingCycle,
      start_date: startDate,
      notes: notes.trim() || undefined,
      cancel_url: cancelUrl.trim() || undefined,
    };

    let success = false;
    if (editingId) {
      success = await update(editingId, payload);
    } else {
      success = await create(payload);
    }

    if (success) {
      setModalVisible(false);
      resetForm();
    }
    setSaving(false);
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
              onPress={() => openEditModal(item)}
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
          contentContainerStyle={styles.listContent}
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

      {/* FAB with two options */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.presetFab} onPress={openPresetModal}>
          <MaterialCommunityIcons name="star" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <FAB onPress={openAddModal} icon="plus" />
      </View>

      {/* Preset Selection Modal */}
      <Modal
        visible={presetModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPresetModalVisible(false)}
      >
        <View style={styles.presetModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPresetModalVisible(false)}>
              <Text style={styles.cancelButton}>Schließen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Beliebte Dienste</Text>
            <View style={{ width: 70 }} />
          </View>

          <ScrollView style={styles.presetList} showsVerticalScrollIndicator={false}>
            {SERVICE_PRESETS.map((preset) => (
              <View key={preset.id} style={styles.presetSection}>
                <View style={styles.presetHeader}>
                  <View style={[styles.presetIcon, { backgroundColor: preset.color }]}>
                    <MaterialCommunityIcons name={preset.icon as any} size={24} color="#fff" />
                  </View>
                  <Text style={styles.presetName}>{preset.name}</Text>
                </View>
                <View style={styles.plansList}>
                  {preset.plans.map((plan, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.planItem}
                      onPress={() => selectPreset(preset, plan)}
                    >
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.planPrice}>
                        <Text style={styles.planAmount}>{formatCurrency(plan.amount_cents)}</Text>
                        <Text style={styles.planCycle}>{getBillingCycleShort(plan.billing_cycle)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingId ? 'Abo bearbeiten' : 'Neues Abo'}
            </Text>
            <TouchableOpacity onPress={saveSubscription} disabled={saving}>
              <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                {saving ? 'Speichert...' : 'Speichern'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="z.B. Netflix"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Kategorie</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text style={styles.pickerButtonText}>{category}</Text>
              <MaterialCommunityIcons
                name={showCategories ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            {showCategories && (
              <View style={styles.categoriesList}>
                {SUBSCRIPTION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      category === cat && styles.categoryItemActive,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategories(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        category === cat && styles.categoryItemTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Betrag (EUR) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="z.B. 12,99"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Abrechnungszyklus</Text>
            <View style={styles.cycleContainer}>
              <TouchableOpacity
                style={[
                  styles.cycleButton,
                  billingCycle === 'MONTHLY' && styles.cycleButtonActive,
                ]}
                onPress={() => setBillingCycle('MONTHLY')}
              >
                <Text
                  style={[
                    styles.cycleButtonText,
                    billingCycle === 'MONTHLY' && styles.cycleButtonTextActive,
                  ]}
                >
                  Monatlich
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cycleButton,
                  billingCycle === 'YEARLY' && styles.cycleButtonActive,
                ]}
                onPress={() => setBillingCycle('YEARLY')}
              >
                <Text
                  style={[
                    styles.cycleButtonText,
                    billingCycle === 'YEARLY' && styles.cycleButtonTextActive,
                  ]}
                >
                  Jährlich
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Startdatum</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="JJJJ-MM-TT"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Notizen</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optionale Notizen..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Kündigungslink (optional)</Text>
            <TextInput
              style={styles.input}
              value={cancelUrl}
              onChangeText={setCancelUrl}
              placeholder="https://..."
              placeholderTextColor={COLORS.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'center',
    gap: SPACING.md,
    zIndex: 1000,
    elevation: 10,
  },
  presetFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  // Preset Modal
  presetModalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  presetList: {
    flex: 1,
    padding: SPACING.md,
  },
  presetSection: {
    marginBottom: SPACING.lg,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  presetName: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  plansList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  planName: {
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  planAmount: {
    fontSize: FONTS.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  planCycle: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  // Form Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  cancelButton: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
  },
  saveButton: {
    color: COLORS.primary,
    fontSize: FONTS.md,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    color: COLORS.textMuted,
  },
  formContainer: {
    padding: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.md,
  },
  categoriesList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  categoryItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryItemActive: {
    backgroundColor: `${COLORS.primary}20`,
  },
  categoryItemText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.md,
  },
  categoryItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  cycleContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cycleButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cycleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  cycleButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
  },
  cycleButtonTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
