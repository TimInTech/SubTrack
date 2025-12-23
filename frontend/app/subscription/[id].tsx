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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

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
  created_at: string;
}

const formatCurrency = (cents: number): string => {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
};

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        Alert.alert('Fehler', 'Abonnement nicht gefunden.');
        router.back();
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      Alert.alert('Fehler', 'Verbindungsfehler.');
    } finally {
      setLoading(false);
    }
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
            try {
              const response = await fetch(`${API_URL}/api/subscriptions/${id}`, {
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
          <ActivityIndicator size="large" color="#4CAF50" />
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

  let formattedDate = subscription.start_date;
  try {
    formattedDate = format(parseISO(subscription.start_date), 'dd. MMMM yyyy', { locale: de });
  } catch (e) {
    // Keep original if parsing fails
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="card" size={40} color="#4CAF50" />
          </View>
          <Text style={styles.name}>{subscription.name}</Text>
          <Text style={styles.category}>{subscription.category}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(subscription.amount_cents)}</Text>
            <Text style={styles.cycle}>
              {subscription.billing_cycle === 'MONTHLY' ? 'pro Monat' : 'pro Jahr'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#888" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Startdatum</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="repeat" size={20} color="#888" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Abrechnungszyklus</Text>
              <Text style={styles.detailValue}>
                {subscription.billing_cycle === 'MONTHLY' ? 'Monatlich' : 'Jährlich'}
              </Text>
            </View>
          </View>

          {subscription.billing_cycle === 'YEARLY' && (
            <View style={styles.detailRow}>
              <Ionicons name="calculator-outline" size={20} color="#888" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pro Monat (umgerechnet)</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(Math.round(subscription.amount_cents / 12))}
                </Text>
              </View>
            </View>
          )}

          {subscription.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={20} color="#888" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notizen</Text>
                <Text style={styles.detailValue}>{subscription.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Cancel URL Button */}
        {subscription.cancel_url && (
          <TouchableOpacity style={styles.cancelUrlButton} onPress={openCancelUrl}>
            <Ionicons name="open-outline" size={20} color="#fff" />
            <Text style={styles.cancelUrlText}>Kündigungslink öffnen</Text>
          </TouchableOpacity>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={deleteSubscription}>
          <Ionicons name="trash-outline" size={20} color="#f44336" />
          <Text style={styles.deleteButtonText}>Abo löschen</Text>
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
    borderColor: '#4CAF50',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a3a1a',
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
    color: '#4CAF50',
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
  cancelUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelUrlText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
