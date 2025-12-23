import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { DashboardData, Subscription, Expense } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// ===== Dashboard Hook =====
export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const response = await globalThis.fetch(`${API_URL}/api/dashboard`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else {
        throw new Error('Failed to load dashboard');
      }
    } catch (err) {
      setError('Verbindungsfehler');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDemoData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await globalThis.fetch(`${API_URL}/api/demo-data`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  return { data, loading, error, fetch, loadDemoData, setLoading };
};

// ===== Subscriptions Hook =====
export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else {
        throw new Error('Failed to load subscriptions');
      }
    } catch (err) {
      setError('Verbindungsfehler');
      console.error('Subscriptions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: string): Promise<Subscription | null> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const create = useCallback(async (data: Omit<Subscription, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      const err = await response.json();
      Alert.alert('Fehler', err.detail || 'Speichern fehlgeschlagen');
      return false;
    } catch {
      Alert.alert('Fehler', 'Verbindungsfehler beim Speichern');
      return false;
    }
  }, [fetch]);

  const update = useCallback(async (id: string, data: Partial<Subscription>): Promise<boolean> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      const err = await response.json();
      Alert.alert('Fehler', err.detail || 'Aktualisieren fehlgeschlagen');
      return false;
    } catch {
      Alert.alert('Fehler', 'Verbindungsfehler beim Aktualisieren');
      return false;
    }
  }, [fetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      return false;
    } catch {
      Alert.alert('Fehler', 'Löschen fehlgeschlagen');
      return false;
    }
  }, [fetch]);

  return { subscriptions, loading, error, fetch, fetchOne, create, update, remove, setLoading };
};

// ===== Expenses Hook =====
export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const response = await globalThis.fetch(`${API_URL}/api/expenses`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else {
        throw new Error('Failed to load expenses');
      }
    } catch (err) {
      setError('Verbindungsfehler');
      console.error('Expenses fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: string): Promise<Expense | null> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/expenses/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const create = useCallback(async (data: Omit<Expense, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      const err = await response.json();
      Alert.alert('Fehler', err.detail || 'Speichern fehlgeschlagen');
      return false;
    } catch {
      Alert.alert('Fehler', 'Verbindungsfehler beim Speichern');
      return false;
    }
  }, [fetch]);

  const update = useCallback(async (id: string, data: Partial<Expense>): Promise<boolean> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      const err = await response.json();
      Alert.alert('Fehler', err.detail || 'Aktualisieren fehlgeschlagen');
      return false;
    } catch {
      Alert.alert('Fehler', 'Verbindungsfehler beim Aktualisieren');
      return false;
    }
  }, [fetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await globalThis.fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      return false;
    } catch {
      Alert.alert('Fehler', 'Löschen fehlgeschlagen');
      return false;
    }
  }, [fetch]);

  return { expenses, loading, error, fetch, fetchOne, create, update, remove, setLoading };
};
