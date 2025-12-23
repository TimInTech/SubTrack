/**
 * Improved API hooks with better error handling and TypeScript support
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { DashboardData, Subscription, Expense } from '../types';
import { apiGet, apiPost, apiPut, apiDelete, SubTrackApiError, logError } from '../utils/api';

/**
 * Ensure error is a SubTrackApiError
 */
function ensureApiError(error: unknown): SubTrackApiError {
  if (error instanceof SubTrackApiError) {
    return error;
  }
  return new SubTrackApiError(String(error));
}

/**
 * Show error alert to user
 */
function showErrorAlert(error: SubTrackApiError, context: string): void {
  logError(error, context);
  Alert.alert('Fehler', error.getUserMessage());
}

// ===== Dashboard Hook =====
export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SubTrackApiError | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const dashboardData = await apiGet<DashboardData>('/api/dashboard');
      setData(dashboardData);
    } catch (err) {
      const apiError = ensureApiError(err);
      setError(apiError);
      logError(apiError, 'Dashboard fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDemoData = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      await apiPost('/api/demo-data');
      await fetch();
      return true;
    } catch (err) {
      const apiError = ensureApiError(err);
      logError(apiError, 'Demo data load');
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
  const [error, setError] = useState<SubTrackApiError | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiGet<Subscription[]>('/api/subscriptions');
      setSubscriptions(data);
    } catch (err) {
      const apiError = ensureApiError(err);
      setError(apiError);
      logError(apiError, 'Subscriptions fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: string): Promise<Subscription | null> => {
    try {
      return await apiGet<Subscription>(`/api/subscriptions/${id}`);
    } catch (err) {
      const apiError = ensureApiError(err);
      logError(apiError, `Subscription fetch: ${id}`);
      return null;
    }
  }, []);

  const create = useCallback(async (data: Omit<Subscription, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      await apiPost<Subscription>('/api/subscriptions', data);
      await fetch();
      return true;
    } catch (err) {
      const apiError = ensureApiError(err);
      showErrorAlert(apiError, 'Subscription create');
      return false;
    }
  }, [fetch]);

  const update = useCallback(async (id: string, data: Partial<Subscription>): Promise<boolean> => {
    try {
      await apiPut<Subscription>(`/api/subscriptions/${id}`, data);
      await fetch();
      return true;
    } catch (err) {
      const apiError = ensureApiError(err);
      showErrorAlert(apiError, 'Subscription update');
      return false;
    }
  }, [fetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiDelete(`/api/subscriptions/${id}`);
      await fetch();
      return true;
    } catch (err) {
      const apiError = ensureApiError(err);
      showErrorAlert(apiError, 'Subscription delete');
      return false;
    }
  }, [fetch]);

  return { subscriptions, loading, error, fetch, fetchOne, create, update, remove, setLoading };
};

// ===== Expenses Hook =====
export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SubTrackApiError | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiGet<Expense[]>('/api/expenses');
      setExpenses(data);
    } catch (err) {
      const apiError = ensureApiError(err);
      setError(apiError);
      logError(apiError, 'Expenses fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: string): Promise<Expense | null> => {
    try {
      return await apiGet<Expense>(`/api/expenses/${id}`);
    } catch (err) {
      const apiError = ensureApiError(err);
      logError(apiError, `Expense fetch: ${id}`);
      return null;
    }
  }, []);

  const create = useCallback(async (data: Omit<Expense, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      await apiPost<Expense>('/api/expenses', data);
      await fetch();
      return true;
    } catch (err) {
      const apiError = ensureApiError(err);
      showErrorAlert(apiError, 'Expense create');
      return false;
    }
  }, [fetch]);

  const update = useCallback(async (id: string, data: Partial<Expense>): Promise<boolean> => {
    try {
      await apiPut<Expense>(`/api/expenses/${id}`, data);
      await fetch();
      return true;
    } catch (err) {
      const apiError = ensureApiError(err);
      showErrorAlert(apiError, 'Expense update');
      return false;
    }
  }, [fetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiDelete(`/api/expenses/${id}`);
      await fetch();
      return true;
    } catch (err) {
      const apiError = ensureApiError(err);
      showErrorAlert(apiError, 'Expense delete');
      return false;
    }
  }, [fetch]);

  return { expenses, loading, error, fetch, fetchOne, create, update, remove, setLoading };
};
