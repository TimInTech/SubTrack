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
import { useExpenses } from '../src/hooks/useApi';
import { formatCurrency, getBillingCycleShort } from '../src/utils/format';
import { EXPENSE_CATEGORIES } from '../src/constants/presets';
import { Expense, BillingCycle } from '../src/types';

export default function ExpensesScreen() {
  const router = useRouter();
  const { expenses, loading, fetch, create, update, remove, setLoading } = useExpenses();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wohnen');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [notes, setNotes] = useState('');
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
    setCategory('Wohnen');
    setAmount('');
    setBillingCycle('MONTHLY');
    setNotes('');
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingId(exp.id);
    setName(exp.name);
    setCategory(exp.category);
    setAmount((exp.amount_cents / 100).toString().replace('.', ','));
    setBillingCycle(exp.billing_cycle);
    setNotes(exp.notes || '');
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
    return true;
  };

  const saveExpense = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const amountCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);

    const payload = {
      name: name.trim(),
      category,
      amount_cents: amountCents,
      billing_cycle: billingCycle,
      notes: notes.trim() || undefined,
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

  const deleteExpense = (id: string, itemName: string) => {
    Alert.alert(
      'Fixkosten löschen',
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

  const renderItem = ({ item, index }: { item: Expense; index: number }) => (
    <Animated.View>
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => router.push(`/expense/${item.id}`)}
        onLongPress={() => deleteExpense(item.id, item.name)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.surface, COLORS.surfaceLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.itemGradient}
        >
          <View style={styles.itemHeader}>
            <View style={[styles.itemIcon, { backgroundColor: `${COLORS.accent}20` }]}>
              <MaterialCommunityIcons
                name={getCategoryIcon(item.category) as any}
                size={24}
                color={COLORS.accent}
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
              <MaterialCommunityIcons name="pencil" size={16} color={COLORS.accent} />
              <Text style={styles.editButtonText}>Bearbeiten</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={COLORS.gradientOrange as [string, string]}
            style={styles.emptyIcon}
          >
            <MaterialCommunityIcons name="wallet-plus" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyText}>Keine Fixkosten</Text>
          <Text style={styles.emptySubtext}>Tippen Sie auf + um Fixkosten hinzuzufügen</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
        />
      )}

      {/* FAB */}
      <FAB onPress={openAddModal} icon="plus" gradient={COLORS.gradientOrange} />

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
              {editingId ? 'Fixkosten bearbeiten' : 'Neue Fixkosten'}
            </Text>
            <TouchableOpacity onPress={saveExpense} disabled={saving}>
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
              placeholder="z.B. Miete"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Kategorie</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategories(!showCategories)}
            >
              <View style={styles.pickerButtonContent}>
                <MaterialCommunityIcons
                  name={getCategoryIcon(category) as any}
                  size={20}
                  color={COLORS.accent}
                />
                <Text style={styles.pickerButtonText}>{category}</Text>
              </View>
              <MaterialCommunityIcons
                name={showCategories ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            {showCategories && (
              <View style={styles.categoriesList}>
                {EXPENSE_CATEGORIES.map((cat) => (
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
                    <MaterialCommunityIcons
                      name={getCategoryIcon(cat) as any}
                      size={20}
                      color={category === cat ? COLORS.accent : COLORS.textSecondary}
                    />
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
              placeholder="z.B. 850,00"
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
    color: COLORS.accent,
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
    color: COLORS.accent,
    fontSize: FONTS.sm,
    fontWeight: '500',
  },
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
    color: COLORS.accent,
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
  pickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryItemActive: {
    backgroundColor: `${COLORS.accent}15`,
  },
  categoryItemText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.md,
  },
  categoryItemTextActive: {
    color: COLORS.accent,
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
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}15`,
  },
  cycleButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
  },
  cycleButtonTextActive: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
});
