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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Expense {
  id: string;
  name: string;
  category: string;
  amount_cents: number;
  billing_cycle: 'MONTHLY' | 'YEARLY';
  notes?: string;
}

const formatCurrency = (cents: number): string => {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
};

const CATEGORIES = [
  'Wohnen',
  'Versicherung',
  'Kommunikation',
  'Mobilität',
  'Gesundheit',
  'Bildung',
  'Sonstiges',
];

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wohnen');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/expenses`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
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
      notes: notes.trim() || null,
    };

    try {
      const url = editingId
        ? `${API_URL}/api/expenses/${editingId}`
        : `${API_URL}/api/expenses`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModalVisible(false);
        resetForm();
        fetchExpenses();
      } else {
        const error = await response.json();
        Alert.alert('Fehler', error.detail || 'Speichern fehlgeschlagen.');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Verbindungsfehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = (id: string, name: string) => {
    Alert.alert(
      'Fixkosten löschen',
      `Möchten Sie "${name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/expenses/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                fetchExpenses();
              }
            } catch (error) {
              Alert.alert('Fehler', 'Löschen fehlgeschlagen.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => router.push(`/expense/${item.id}`)}
      onLongPress={() => deleteExpense(item.id, item.name)}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
        <View style={styles.itemAmount}>
          <Text style={styles.amountValue}>{formatCurrency(item.amount_cents)}</Text>
          <Text style={styles.amountCycle}>
            {item.billing_cycle === 'MONTHLY' ? '/Monat' : '/Jahr'}
          </Text>
        </View>
      </View>
      <View style={styles.itemFooter}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={16} color="#FF9800" />
          <Text style={styles.editButtonText}>Bearbeiten</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>Keine Fixkosten</Text>
          <Text style={styles.emptySubtext}>Tippen Sie auf + um Fixkosten hinzuzufügen</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF9800"
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

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

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="z.B. Miete"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Kategorie</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                {CATEGORIES.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} color="#fff" />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Betrag (EUR) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="z.B. 850,00"
              placeholderTextColor="#666"
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
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
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
    padding: 32,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemCategory: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  amountCycle: {
    fontSize: 12,
    color: '#888',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    color: '#FF9800',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    color: '#666',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
  },
  cycleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cycleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  cycleButtonActive: {
    borderColor: '#FF9800',
    backgroundColor: '#3a2a1a',
  },
  cycleButtonText: {
    color: '#888',
    fontSize: 16,
  },
  cycleButtonTextActive: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
});
