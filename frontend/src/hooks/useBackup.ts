import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ExportData {
  version: string;
  app_name: string;
  exported_at: string;
  subscriptions: any[];
  expenses: any[];
  settings: any;
}

interface CSVExportData {
  subscriptions_csv: string;
  expenses_csv: string;
  exported_at: string;
}

export const useBackup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export as JSON
  const exportJSON = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/export/json`);
      if (!response.ok) throw new Error('Export fehlgeschlagen');

      const data: ExportData = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `abo-tracker-backup-${timestamp}.json`;

      if (Platform.OS === 'web') {
        // Web: Download via blob
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Save to file system and share
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Backup exportieren',
        });
      }

      return true;
    } catch (err) {
      setError('Export fehlgeschlagen');
      console.error('Export error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export as CSV
  const exportCSV = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/export/csv`);
      if (!response.ok) throw new Error('CSV Export fehlgeschlagen');

      const data: CSVExportData = await response.json();
      const timestamp = new Date().toISOString().split('T')[0];

      if (Platform.OS === 'web') {
        // Download subscriptions CSV
        const subBlob = new Blob([data.subscriptions_csv], { type: 'text/csv' });
        const subUrl = URL.createObjectURL(subBlob);
        const subA = document.createElement('a');
        subA.href = subUrl;
        subA.download = `abonnements-${timestamp}.csv`;
        document.body.appendChild(subA);
        subA.click();
        document.body.removeChild(subA);
        URL.revokeObjectURL(subUrl);

        // Download expenses CSV
        setTimeout(() => {
          const expBlob = new Blob([data.expenses_csv], { type: 'text/csv' });
          const expUrl = URL.createObjectURL(expBlob);
          const expA = document.createElement('a');
          expA.href = expUrl;
          expA.download = `fixkosten-${timestamp}.csv`;
          document.body.appendChild(expA);
          expA.click();
          document.body.removeChild(expA);
          URL.revokeObjectURL(expUrl);
        }, 500);
      } else {
        // Mobile: Save and share subscriptions CSV
        const subUri = `${FileSystem.documentDirectory}abonnements-${timestamp}.csv`;
        await FileSystem.writeAsStringAsync(subUri, data.subscriptions_csv);
        await Sharing.shareAsync(subUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Abonnements exportieren',
        });

        // Then share expenses CSV
        const expUri = `${FileSystem.documentDirectory}fixkosten-${timestamp}.csv`;
        await FileSystem.writeAsStringAsync(expUri, data.expenses_csv);
        await Sharing.shareAsync(expUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Fixkosten exportieren',
        });
      }

      return true;
    } catch (err) {
      setError('CSV Export fehlgeschlagen');
      console.error('CSV Export error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Import from JSON
  const importJSON = useCallback(async (merge: boolean = false): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return false;
      }

      const file = result.assets[0];
      let jsonContent: string;

      if (Platform.OS === 'web') {
        // Web: Read file content
        const response = await fetch(file.uri);
        jsonContent = await response.text();
      } else {
        // Mobile: Read from file system
        jsonContent = await FileSystem.readAsStringAsync(file.uri);
      }

      const data = JSON.parse(jsonContent);

      // Validate data structure
      if (!data.subscriptions && !data.expenses) {
        throw new Error('Ungültiges Backup-Format');
      }

      // Send to API
      const response = await fetch(`${API_URL}/api/import/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptions: data.subscriptions,
          expenses: data.expenses,
          merge: merge,
        }),
      });

      if (!response.ok) throw new Error('Import fehlgeschlagen');

      const importResult = await response.json();
      Alert.alert(
        'Import erfolgreich',
        `${importResult.subscriptions_imported} Abos und ${importResult.expenses_imported} Fixkosten importiert.`
      );

      return true;
    } catch (err) {
      setError('Import fehlgeschlagen');
      console.error('Import error:', err);
      Alert.alert('Fehler', 'Import fehlgeschlagen. Bitte überprüfen Sie das Dateiformat.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete all data
  const deleteAllData = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/data/all`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen');
      return true;
    } catch (err) {
      setError('Löschen fehlgeschlagen');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportJSON,
    exportCSV,
    importJSON,
    deleteAllData,
  };
};
