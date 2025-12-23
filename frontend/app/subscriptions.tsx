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

interface Subscription {
  id: string;
  name: string;
  category: string;
  amount_cents: number;
  billing_cycle: 'MONTHLY' | 'YEARLY';
  start_date: string;
  notes?: string;
  cancel_url?: string;
}

const formatCurrency = (cents: number): string => {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
};

const CATEGORIES = [
  'Streaming',
  'Musik',
  'Software',
  'Cloud',
  'Gaming',
  'News',
  'Fitness',
  'Shopping',
  'Sonstiges',
];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Streaming');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
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
      fetchSubscriptions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
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
      notes: notes.trim() || null,
      cancel_url: cancelUrl.trim() || null,
    };

    try {
      const url = editingId
        ? `${API_URL}/api/subscriptions/${editingId}`
        : `${API_URL}/api/subscriptions`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModalVisible(false);
        resetForm();
        fetchSubscriptions();
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

  const deleteSubscription = (id: string, name: string) => {
    Alert.alert(
      'Abo löschen',
      `Möchten Sie "${name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/subscriptions/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                fetchSubscriptions();
              }
            } catch (error) {
              Alert.alert('Fehler', 'Löschen fehlgeschlagen.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Subscription }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => router.push(`/subscription/${item.id}`)}
      onLongPress={() => deleteSubscription(item.id, item.name)}
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
          <Ionicons name="pencil" size={16} color="#4CAF50" />
          <Text style={styles.editButtonText}>Bearbeiten</Text>
        </TouchableOpacity>
        {item.cancel_url && (
          <View style={styles.linkBadge}>
            <Ionicons name="link" size={14} color="#2196F3" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>Keine Abonnements</Text>
          <Text style={styles.emptySubtext}>Tippen Sie auf + um ein Abo hinzuzufügen</Text>
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4CAF50"
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
              {editingId ? 'Abo bearbeiten' : 'Neues Abo'}
            </Text>
            <TouchableOpacity onPress={saveSubscription} disabled={saving}>
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
              placeholder="z.B. Netflix"
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
              placeholder="z.B. 12,99"
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

            <Text style={styles.label}>Startdatum</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="JJJJ-MM-TT"
              placeholderTextColor="#666"
            />

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

            <Text style={styles.label}>Kündigungslink (optional)</Text>
            <TextInput
              style={styles.input}
              value={cancelUrl}
              onChangeText={setCancelUrl}
              placeholder="https://..."
              placeholderTextColor="#666"
              keyboardType="url"
              autoCapitalize="none"
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
    color: '#4CAF50',
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
    color: '#4CAF50',
    fontSize: 14,
  },
  linkBadge: {
    backgroundColor: '#1e3a5f',
    padding: 6,
    borderRadius: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
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
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  cycleButtonText: {
    color: '#888',
    fontSize: 16,
  },
  cycleButtonTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
