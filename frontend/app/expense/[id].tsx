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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Expense {
  id: string;
  name: string;
  category: string;
  amount_cents: number;
  billing_cycle: 'MONTHLY' | 'YEARLY';
  notes?: string;
  created_at: string;
}

const formatCurrency = (cents: number): string => {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
};

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExpense(data);
      } else {
        Alert.alert('Fehler', 'Fixkosten nicht gefunden.');
        router.back();
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      Alert.alert('Fehler', 'Verbindungsfehler.');
    } finally {
      setLoading(false);
    }
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
            try {
              const response = await fetch(`${API_URL}/api/expenses/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                router.back();
              }
            } catch (error) {
              Alert.alert('Fehler', 'Löschen fehlgeschlagen.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="wallet" size={40} color="#FF9800" />
          </View>
          <Text style={styles.name}>{expense.name}</Text>
          <Text style={styles.category}>{expense.category}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(expense.amount_cents)}</Text>
            <Text style={styles.cycle}>
              {expense.billing_cycle === 'MONTHLY' ? 'pro Monat' : 'pro Jahr'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="repeat" size={20} color="#888" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Abrechnungszyklus</Text>
              <Text style={styles.detailValue}>
                {expense.billing_cycle === 'MONTHLY' ? 'Monatlich' : 'Jährlich'}
              </Text>
            </View>
          </View>

          {expense.billing_cycle === 'YEARLY' && (
            <View style={styles.detailRow}>
              <Ionicons name="calculator-outline" size={20} color="#888" />
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
              <Ionicons name="calculator-outline" size={20} color="#888" />
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
              <Ionicons name="document-text-outline" size={20} color="#888" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notizen</Text>
                <Text style={styles.detailValue}>{expense.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={deleteExpense}>
          <Ionicons name="trash-outline" size={20} color="#f44336" />
          <Text style={styles.deleteButtonText}>Fixkosten löschen</Text>
        </TouchableOpacity>
      </ScrollView>
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
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3a2a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  priceContainer: {
    alignItems: 'center',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  cycle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 16,
  },
});
