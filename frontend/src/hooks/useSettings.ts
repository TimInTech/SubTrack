import { useState, useCallback } from 'react';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface AppSettings {
  currency: string;
  notification_enabled: boolean;
  notification_time: string;
  notification_days_before: number[];
  theme: string;
  backup_interval: string;
  last_backup: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'EUR',
  notification_enabled: true,
  notification_time: '09:00',
  notification_days_before: [1, 3, 7],
  theme: 'dark',
  backup_interval: 'weekly',
  last_backup: null,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (err) {
      setError('Einstellungen konnten nicht geladen werden');
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        return true;
      }
      return false;
    } catch (err) {
      setError('Einstellungen konnten nicht gespeichert werden');
      console.error('Settings update error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [settings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
  };
};
