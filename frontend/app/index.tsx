import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DashboardData {
  monthly_subscriptions: number;
  monthly_expenses: number;
  total_monthly: number;
  yearly_total: number;
  subscription_count: number;
  expense_count: number;
}

const formatCurrency = (cents: number): string => {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
};

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
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
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const loadDemoData = async () => {
    Alert.alert(
      'Demo-Daten laden',
      'Möchten Sie Demo-Daten anlegen? Bestehende Daten werden gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Laden',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${API_URL}/api/demo-data`, {
                method: 'POST',
              });
              if (response.ok) {
                Alert.alert('Erfolg', 'Demo-Daten wurden angelegt!');
                fetchDashboard();
              }
            } catch (error) {
              Alert.alert('Fehler', 'Demo-Daten konnten nicht geladen werden.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Lade Daten...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
          />
        }
      >
        <Text style={styles.header}>Dieser Monat</Text>

        {/* Summary Cards */}
        <View style={styles.cardContainer}>
          <View style={[styles.card, styles.subscriptionCard]}>
            <View style={styles.cardIcon}>
              <Ionicons name="card" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.cardLabel}>Abonnements</Text>
            <Text style={styles.cardValue}>
              {data ? formatCurrency(data.monthly_subscriptions) : '0,00 €'}
            </Text>
            <Text style={styles.cardCount}>
              {data?.subscription_count || 0} Abos
            </Text>
          </View>

          <View style={[styles.card, styles.expenseCard]}>
            <View style={styles.cardIcon}>
              <Ionicons name="wallet" size={28} color="#FF9800" />
            </View>
            <Text style={styles.cardLabel}>Fixkosten</Text>
            <Text style={styles.cardValue}>
              {data ? formatCurrency(data.monthly_expenses) : '0,00 €'}
            </Text>
            <Text style={styles.cardCount}>
              {data?.expense_count || 0} Posten
            </Text>
          </View>
        </View>

        {/* Total Monthly */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Gesamt pro Monat</Text>
          <Text style={styles.totalValue}>
            {data ? formatCurrency(data.total_monthly) : '0,00 €'}
          </Text>
        </View>

        {/* Yearly Projection */}
        <View style={styles.yearlyCard}>
          <View style={styles.yearlyHeader}>
            <Ionicons name="calendar" size={24} color="#2196F3" />
            <Text style={styles.yearlyLabel}>Hochrechnung pro Jahr</Text>
          </View>
          <Text style={styles.yearlyValue}>
            {data ? formatCurrency(data.yearly_total) : '0,00 €'}
          </Text>
          <Text style={styles.yearlyNote}>
            Monatliche Kosten × 12 + jährliche Posten
          </Text>
        </View>

        {/* Demo Data Button */}
        <TouchableOpacity style={styles.demoButton} onPress={loadDemoData}>
          <Ionicons name="flask" size={20} color="#888" />
          <Text style={styles.demoButtonText}>Demo-Daten anlegen</Text>
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
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  cardContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  subscriptionCard: {
    borderColor: '#4CAF50',
  },
  expenseCard: {
    borderColor: '#FF9800',
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  totalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  totalLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  yearlyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  yearlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  yearlyLabel: {
    fontSize: 16,
    color: '#888',
  },
  yearlyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  yearlyNote: {
    fontSize: 12,
    color: '#666',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  demoButtonText: {
    color: '#888',
    fontSize: 14,
  },
});
