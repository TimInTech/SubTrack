import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { DashboardData, Subscription, Expense } from '../types';
import {
  loadAll as loadLocalSubscriptions,
  createLocal,
  updateLocal,
  removeLocal,
  findOne as findLocalSubscription,
} from '../storage/subscriptionsStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.trim() || '';

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

  const loadLocal = useCallback(async () => {
    const data = await loadLocalSubscriptions();
    setSubscriptions(data);
    return data;
  }, []);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      if (!API_URL) {
        await loadLocal();
        return;
      }
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else {
        await loadLocal();
        throw new Error('Failed to load subscriptions');
      }
    } catch (err) {
      setError('Verbindungsfehler');
      console.error('Subscriptions fetch error:', err);
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }, [loadLocal]);

  const fetchOne = useCallback(async (id: string): Promise<Subscription | null> => {
    try {
      if (!API_URL) {
        return await findLocalSubscription(id);
      }
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return await findLocalSubscription(id);
    } catch {
      return await findLocalSubscription(id);
    }
  }, []);

  const create = useCallback(async (data: Omit<Subscription, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      if (!API_URL) {
        const updated = await createLocal(data);
        setSubscriptions(updated);
        return true;
      }
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      const err = await response.json().catch(() => ({}));
      Alert.alert('Fehler', err.detail || 'Speichern fehlgeschlagen, wird lokal gespeichert.');
    } catch {
      // swallow to fallback to local
    }
    const updated = await createLocal(data);
    setSubscriptions(updated);
    return true;
  }, [fetch]);

  const update = useCallback(async (id: string, data: Partial<Subscription>): Promise<boolean> => {
    try {
      if (!API_URL) {
        const updated = await updateLocal(id, data);
        setSubscriptions(updated);
        return true;
      }
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      const err = await response.json().catch(() => ({}));
      Alert.alert('Fehler', err.detail || 'Aktualisieren fehlgeschlagen, wird lokal gespeichert.');
    } catch {
      // swallow to fallback to local
    }
    const updated = await updateLocal(id, data);
    setSubscriptions(updated);
    return true;
  }, [fetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (!API_URL) {
        const updated = await removeLocal(id);
        setSubscriptions(updated);
        return true;
      }
      const response = await globalThis.fetch(`${API_URL}/api/subscriptions/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetch();
        return true;
      }
      Alert.alert('Fehler', 'Löschen fehlgeschlagen, wird lokal entfernt.');
    } catch {
      // swallow to fallback to local
    }
    const updated = await removeLocal(id);
    setSubscriptions(updated);
    return true;
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
