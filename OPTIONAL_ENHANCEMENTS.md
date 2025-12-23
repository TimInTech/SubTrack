# Optionale Erweiterungen für SubTrack

## 1. Benachrichtigungs-System Verbesserungen

### Aktueller Status
✅ Basis-Implementierung vorhanden:
- Push-Benachrichtigungen für Verlängerungen
- Einstellbare Erinnerungszeiten
- Web- und Mobile-Support

### Vorgeschlagene Erweiterungen

#### 1.1 Intelligente Benachrichtigungen
```typescript
interface SmartNotificationSettings {
  // Verschiedene Benachrichtigungstypen
  renewalReminders: boolean;
  priceChanges: boolean;
  trialEnding: boolean;
  unusedSubscriptions: boolean; // Abos, die länger nicht genutzt wurden
  
  // Benachrichtigungskanäle
  pushNotifications: boolean;
  email: boolean;
  inApp: boolean;
  
  // Zeitfenster
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}
```

#### 1.2 Benachrichtigungs-Historie
```typescript
interface NotificationHistory {
  id: string;
  type: 'renewal' | 'trial' | 'price_change' | 'unused';
  subscriptionId: string;
  title: string;
  message: string;
  sentAt: Date;
  read: boolean;
  actionTaken?: 'dismissed' | 'cancelled' | 'renewed';
}

// Neuer Endpoint
@api_router.get("/notifications/history")
async def get_notification_history():
    """Verlauf aller Benachrichtigungen"""
    ...
```

#### 1.3 Trial-Tracking
```typescript
interface SubscriptionWithTrial extends Subscription {
  trial_end_date?: string;
  trial_amount_cents?: number; // Preis nach Trial
  is_trial: boolean;
}

// Automatische Benachrichtigung 3 Tage vor Trial-Ende
```

#### 1.4 Preisänderungs-Tracking
```typescript
interface PriceHistory {
  subscription_id: string;
  old_price: number;
  new_price: number;
  changed_at: Date;
  reason?: string;
}

// Backend-Funktion
async def track_price_change(subscription_id: str, old_price: int, new_price: int):
    """Speichert Preisänderung und sendet Benachrichtigung"""
    ...
```

## 2. Backup & Export Erweiterungen

### Aktueller Status
✅ Basis-Implementierung vorhanden:
- JSON Export/Import
- CSV Export
- Manueller Backup

### Vorgeschlagene Erweiterungen

#### 2.1 Automatische Backups
```typescript
interface AutoBackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  destination: 'local' | 'cloud';
  keepLast: number; // Anzahl der Backups aufbewahren
  lastBackup?: Date;
}

// Implementierung mit Expo FileSystem + Expo Sharing
async function scheduleAutoBackup(settings: AutoBackupSettings) {
  // Backup-Task registrieren
  await BackgroundFetch.registerTaskAsync('AUTO_BACKUP', {
    minimumInterval: settings.frequency === 'daily' ? 86400 : 
                     settings.frequency === 'weekly' ? 604800 : 2592000,
  });
}
```

#### 2.2 Cloud-Backup Integration
```typescript
interface CloudBackupProvider {
  type: 'google-drive' | 'icloud' | 'dropbox';
  authenticated: boolean;
  lastSync?: Date;
}

// Google Drive Integration
import * as Google from 'expo-auth-session/providers/google';
import * as GoogleDrive from '@react-native-google-signin/google-signin';

async function backupToGoogleDrive(data: ExportData) {
  // Upload zu Google Drive
  ...
}
```

#### 2.3 Verschlüsselte Backups
```typescript
import * as Crypto from 'expo-crypto';

interface EncryptedBackup {
  version: string;
  encrypted: true;
  data: string; // AES-256 verschlüsselt
  salt: string;
  iv: string;
}

async function createEncryptedBackup(
  data: ExportData,
  password: string
): Promise<EncryptedBackup> {
  const salt = await Crypto.getRandomBytesAsync(16);
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + salt
  );
  // Verschlüsseln mit AES-256
  ...
}
```

#### 2.4 Import-Validierung
```typescript
interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    subscriptions: number;
    expenses: number;
    duplicates: number;
  };
}

async function validateImport(file: File): Promise<ImportValidationResult> {
  // Validiere Format, Datenintegrität, Duplikate
  ...
}
```

#### 2.5 Backup-Wiederherstellung mit Preview
```typescript
interface BackupPreview {
  version: string;
  createdAt: Date;
  subscriptionCount: number;
  expenseCount: number;
  totalMonthly: number;
  categories: string[];
}

async function getBackupPreview(file: File): Promise<BackupPreview> {
  // Zeige Backup-Inhalt vor Wiederherstellung
  ...
}
```

## 3. Diagramme und Visualisierungen

### Vorgeschlagene Erweiterungen

#### 3.1 Erweiterte Dashboard-Charts
```typescript
// Monatlicher Kostenverlauf
interface MonthlyTrend {
  month: string;
  subscriptions: number;
  expenses: number;
  total: number;
}

// Line Chart für 12-Monats-Übersicht
<LineChart
  data={{
    labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
    datasets: [{
      data: monthlyTotals,
      color: () => COLORS.primary,
    }]
  }}
/>
```

#### 3.2 Kategorie-Analyse
```typescript
interface CategoryAnalysis {
  category: string;
  totalMonthly: number;
  itemCount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  topItems: Array<{
    name: string;
    amount: number;
  }>;
}

// Stacked Bar Chart für Kategorien
```

#### 3.3 Kostenprognose
```typescript
interface CostForecast {
  currentMonth: number;
  nextMonth: number;
  next3Months: number;
  next6Months: number;
  next12Months: number;
  upcomingRenewals: Array<{
    date: string;
    name: string;
    amount: number;
  }>;
}

// Zeige voraussichtliche Kosten basierend auf Verlängerungen
```

#### 3.4 Einsparungspotential
```typescript
interface SavingsAnalysis {
  unusedSubscriptions: Array<{
    id: string;
    name: string;
    monthlyCost: number;
    lastUsed?: Date;
  }>;
  alternatives: Array<{
    current: string;
    alternative: string;
    saving: number;
  }>;
  totalPotentialSavings: number;
}

// Analysiere selten genutzte Abos
```

#### 3.5 Vergleichscharts
```typescript
// Jahresvergleich
interface YearComparison {
  currentYear: {
    monthly: number[];
    total: number;
  };
  previousYear: {
    monthly: number[];
    total: number;
  };
  difference: number;
  percentageChange: number;
}
```

## 4. Weitere Feature-Ideen

### 4.1 Erinnerungen und Tasks
```typescript
interface Reminder {
  id: string;
  type: 'cancel_subscription' | 'review_price' | 'custom';
  subscriptionId?: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  notes?: string;
}
```

### 4.2 Budgetplanung
```typescript
interface Budget {
  id: string;
  name: string;
  monthlyLimit: number;
  categories: string[];
  alerts: {
    at75Percent: boolean;
    at90Percent: boolean;
    atLimit: boolean;
  };
}
```

### 4.3 Familienaccounts
```typescript
interface FamilyAccount {
  id: string;
  members: Array<{
    id: string;
    name: string;
    role: 'admin' | 'member';
  }>;
  sharedSubscriptions: string[];
  splitExpenses: boolean;
}
```

### 4.4 Währungsunterstützung
```typescript
interface CurrencySettings {
  primary: 'EUR' | 'USD' | 'GBP' | 'CHF';
  displayFormat: 'symbol' | 'code';
  exchangeRates?: Record<string, number>;
  autoUpdate: boolean;
}
```

### 4.5 Tags und Filter
```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Subscription {
  // ... existing fields
  tags: string[];
}

// Erweiterte Filteroptionen
interface FilterOptions {
  categories: string[];
  tags: string[];
  priceRange: { min: number; max: number };
  billingCycle: BillingCycle[];
  dateRange: { start: Date; end: Date };
}
```

### 4.6 Notizen und Anhänge
```typescript
interface SubscriptionNote {
  id: string;
  subscriptionId: string;
  content: string;
  createdAt: Date;
  attachments?: Array<{
    filename: string;
    uri: string;
    type: string;
  }>;
}
```

### 4.7 Zahlungsmethoden-Tracking
```typescript
interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'bank_transfer' | 'other';
  name: string;
  lastFourDigits?: string;
  expiryDate?: string;
}

interface Subscription {
  // ... existing fields
  paymentMethodId?: string;
}
```

## Implementierungsreihenfolge (Empfehlung)

### Phase 1 (Höchste Priorität)
1. ✅ Code-Qualität Verbesserungen (bereits implementiert)
2. Automatische Backups
3. Erweiterte Dashboard-Charts

### Phase 2 (Mittlere Priorität)
4. Trial-Tracking
5. Benachrichtigungs-Historie
6. Kategorie-Analyse

### Phase 3 (Niedrige Priorität)
7. Cloud-Backup Integration
8. Budgetplanung
9. Tags und Filter
10. Einsparungsanalyse

### Phase 4 (Optional)
11. Familienaccounts
12. Währungsunterstützung
13. Zahlungsmethoden-Tracking
14. Notizen und Anhänge

## Technische Anforderungen für Erweiterungen

### Benötigte Packages
```json
{
  "dependencies": {
    // Charts
    "react-native-chart-kit": "^6.12.0",
    "victory-native": "^36.9.1",
    
    // Background Tasks
    "expo-background-fetch": "^12.0.1",
    "expo-task-manager": "^12.0.1",
    
    // Cloud Storage
    "@react-native-google-signin/google-signin": "^10.0.1",
    "react-native-icloud-storage": "^2.0.0",
    
    // Verschlüsselung
    "expo-crypto": "~13.0.2",
    "react-native-aes-crypto": "^2.1.0",
    
    // Network Status
    "@react-native-community/netinfo": "^11.0.0"
  }
}
```

### Backend Dependencies
```txt
# requirements.txt additions
schedule>=1.2.0  # Automatische Tasks
cryptography>=42.0.8  # Verschlüsselung (bereits vorhanden)
python-dotenv>=1.0.1  # Umgebungsvariablen (bereits vorhanden)
```

## Geschätzte Entwicklungszeit

- Automatische Backups: 2-3 Tage
- Cloud-Integration: 3-5 Tage
- Erweiterte Charts: 2-3 Tage
- Trial-Tracking: 1-2 Tage
- Benachrichtigungs-Erweiterungen: 2-3 Tage
- Budgetplanung: 3-4 Tage
- Tags und Filter: 2-3 Tage

**Gesamt für alle Features: ca. 4-6 Wochen**
