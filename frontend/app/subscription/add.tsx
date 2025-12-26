import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/theme';
import { SUBSCRIPTION_CATEGORIES } from '../../src/constants/presets';
import { useSubscriptions } from '../../src/hooks/useApi';
import { BillingCycle } from '../../src/types';

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { create } = useSubscriptions();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Streaming');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

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
    const url = cancelUrl.trim();
    if (url && !(url.startsWith('http://') || url.startsWith('https://'))) {
      Alert.alert('Fehler', 'Die URL muss mit http:// oder https:// beginnen.');
      return false;
    }
    return true;
  };

  const saveSubscription = async () => {
    if (!validateForm()) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      category,
      amount_cents: Math.round(parseFloat(amount.replace(',', '.')) * 100),
      billing_cycle: billingCycle,
      start_date: startDate,
      notes: notes.trim() || undefined,
      cancel_url: cancelUrl.trim() || undefined,
    };

    const success = await create(payload);
    setSaving(false);
    if (success) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Neues Abo hinzufügen</Text>
          <Text style={styles.subtitle}>Alle Felder können später bearbeitet werden.</Text>

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

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveSubscription}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Speichert...' : 'Speichern'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONTS.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    marginBottom: SPACING.lg,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
  },
  saveButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: FONTS.md,
    fontWeight: '700',
  },
});
