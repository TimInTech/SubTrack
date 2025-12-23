import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';

import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../src/constants/theme';
import { GlassCard } from '../src/components/ui';
import { useBackup } from '../src/hooks/useBackup';
import { useNotifications } from '../src/hooks/useNotifications';
import { useSettings, AppSettings } from '../src/hooks/useSettings';

export default function SettingsScreen() {
  const { 
    loading: backupLoading, 
    exportJSON, 
    exportCSV, 
    importJSON, 
    deleteAllData 
  } = useBackup();
  
  const { 
    permissionGranted, 
    notifications, 
    fetchScheduledNotifications, 
    sendTestNotification,
    registerForPushNotifications,
  } = useNotifications();
  
  const { 
    settings, 
    loading: settingsLoading, 
    fetchSettings, 
    updateSettings 
  } = useSettings();

  const [isExporting, setIsExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
      fetchScheduledNotifications();
    }, [fetchSettings, fetchScheduledNotifications])
  );

  const handleExportJSON = async () => {
    setIsExporting(true);
    const success = await exportJSON();
    setIsExporting(false);
    if (success) {
      Alert.alert('Erfolg', 'Backup wurde erfolgreich exportiert!');
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    const success = await exportCSV();
    setIsExporting(false);
    if (success) {
      Alert.alert('Erfolg', 'CSV-Dateien wurden erfolgreich exportiert!');
    }
  };

  const handleImportJSON = () => {
    Alert.alert(
      'Daten importieren',
      'Wie möchten Sie die Daten importieren?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zusammenführen',
          onPress: () => importJSON(true),
        },
        {
          text: 'Ersetzen',
          style: 'destructive',
          onPress: () => importJSON(false),
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Alle Daten löschen',
      'Diese Aktion kann nicht rückgängig gemacht werden. Möchten Sie wirklich alle Daten löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Alles löschen',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAllData();
            if (success) {
              Alert.alert('Erfolg', 'Alle Daten wurden gelöscht.');
            }
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled && !permissionGranted) {
      const granted = await registerForPushNotifications();
      if (!granted) {
        Alert.alert(
          'Berechtigung erforderlich',
          'Bitte aktivieren Sie Benachrichtigungen in den Geräteeinstellungen.'
        );
        return;
      }
    }
    await updateSettings({ notification_enabled: enabled });
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert('Gesendet', 'Test-Benachrichtigung wurde gesendet!');
  };

  const formatLastBackup = (date: string | null) => {
    if (!date) return 'Nie';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (settingsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>Einstellungen</Text>

        {/* Backup & Export Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cloud-upload" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Backup & Export</Text>
          </View>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleExportJSON}
            disabled={isExporting}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `${COLORS.primary}20` }]}>
                <MaterialCommunityIcons name="code-json" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>JSON Export</Text>
                <Text style={styles.menuItemSubtitle}>Vollständiges Backup</Text>
              </View>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleExportCSV}
            disabled={isExporting}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `${COLORS.success}20` }]}>
                <MaterialCommunityIcons name="file-excel" size={20} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>CSV Export</Text>
                <Text style={styles.menuItemSubtitle}>Für Excel/Numbers</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleImportJSON}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `${COLORS.secondary}20` }]}>
                <MaterialCommunityIcons name="cloud-download" size={20} color={COLORS.secondary} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Backup importieren</Text>
                <Text style={styles.menuItemSubtitle}>JSON-Datei laden</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.backupInfo}>
            <MaterialCommunityIcons name="information" size={16} color={COLORS.textMuted} />
            <Text style={styles.backupInfoText}>
              Letztes Backup: {formatLastBackup(settings.last_backup)}
            </Text>
          </View>
        </GlassCard>

        {/* Notifications Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bell" size={24} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Benachrichtigungen</Text>
          </View>

          <View style={styles.switchItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <MaterialCommunityIcons name="bell-ring" size={20} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Erinnerungen aktivieren</Text>
                <Text style={styles.menuItemSubtitle}>
                  {permissionGranted ? 'Berechtigung erteilt' : 'Berechtigung erforderlich'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notification_enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.border, true: `${COLORS.accent}80` }}
              thumbColor={settings.notification_enabled ? COLORS.accent : COLORS.textMuted}
            />
          </View>

          {settings.notification_enabled && (
            <>
              <View style={styles.notificationDays}>
                <Text style={styles.notificationDaysLabel}>Erinnerung vor Verlängerung:</Text>
                <View style={styles.dayChips}>
                  {[1, 3, 7, 14, 30].map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        settings.notification_days_before.includes(day) && styles.dayChipActive,
                      ]}
                      onPress={() => {
                        const newDays = settings.notification_days_before.includes(day)
                          ? settings.notification_days_before.filter((d) => d !== day)
                          : [...settings.notification_days_before, day];
                        updateSettings({ notification_days_before: newDays });
                      }}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          settings.notification_days_before.includes(day) && styles.dayChipTextActive,
                        ]}
                      >
                        {day}d
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={handleTestNotification}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: `${COLORS.info}20` }]}>
                    <MaterialCommunityIcons name="bell-check" size={20} color={COLORS.info} />
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>Test-Benachrichtigung</Text>
                    <Text style={styles.menuItemSubtitle}>Benachrichtigung testen</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </>
          )}

          {notifications.length > 0 && (
            <View style={styles.upcomingNotifications}>
              <Text style={styles.upcomingTitle}>Anstehende Erinnerungen:</Text>
              {notifications.slice(0, 3).map((notif) => (
                <View key={notif.id} style={styles.notificationItem}>
                  <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.accent} />
                  <Text style={styles.notificationText}>{notif.message}</Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* App Settings Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog" size={24} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>App-Einstellungen</Text>
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `${COLORS.secondary}20` }]}>
                <MaterialCommunityIcons name="currency-eur" size={20} color={COLORS.secondary} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Währung</Text>
                <Text style={styles.menuItemSubtitle}>{settings.currency}</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `${COLORS.primary}20` }]}>
                <MaterialCommunityIcons name="theme-light-dark" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Design</Text>
                <Text style={styles.menuItemSubtitle}>
                  {settings.theme === 'dark' ? 'Dunkel' : 'Hell'}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard style={[styles.section, styles.dangerSection]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="alert" size={24} color={COLORS.error} />
            <Text style={[styles.sectionTitle, { color: COLORS.error }]}>Gefahrenzone</Text>
          </View>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAllData}>
            <MaterialCommunityIcons name="trash-can" size={20} color={COLORS.error} />
            <Text style={styles.dangerButtonText}>Alle Daten löschen</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Abo-Tracker v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 - Alle Rechte vorbehalten</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    fontSize: FONTS.xxxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  backupInfoText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
  },
  notificationDays: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notificationDaysLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  dayChips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  dayChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayChipActive: {
    backgroundColor: `${COLORS.accent}20`,
    borderColor: COLORS.accent,
  },
  dayChipText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
  },
  dayChipTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  upcomingNotifications: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  upcomingTitle: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  notificationText: {
    fontSize: FONTS.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  dangerSection: {
    borderColor: COLORS.error,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: `${COLORS.error}15`,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: FONTS.md,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  appVersion: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
  },
  appCopyright: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
