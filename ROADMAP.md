# SubTrack Development Roadmap

## 🚨 Critical Issues (Blocker für v1.0)

### P0 - App nicht nutzbar
- [ ] **[BUG] Kein "+" Button zum Hinzufügen von Abos**
  - Beschreibung: App zeigt keine Möglichkeit, neue Abonnements hinzuzufügen
  - Symptom: Kein Plus-Symbol/Button in der UI sichtbar
  - Status: BLOCKER - App ist ohne diese Funktion nicht nutzbar
  - Prio: P0 - Sofort fixen

### P1 - Kern-Funktionalität
- [ ] **Navigation zwischen Screens testen**
  - Expenses-Tab funktioniert?
  - Subscriptions-Tab funktioniert?
  - Wechsel zwischen Tabs reibungslos?

- [ ] **CRUD-Operationen für Abos**
  - [ ] Create: Neues Abo anlegen (braucht + Button)
  - [ ] Read: Abo-Liste anzeigen
  - [ ] Update: Abo bearbeiten
  - [ ] Delete: Abo löschen

## 📱 App Branding & Metadata

### Icon & Visuals
- [ ] **Custom App Icon erstellen**
  - Design: Minimal, modern (Kalender + Euro/Dollar-Symbol)
  - Farben: Blau/Grün für Finanz-Apps
  - Größen: 1024x1024 (Expo Asset), Android adaptive icon

- [ ] **Splash Screen anpassen**
  - Konsistent mit App-Icon
  - Loading-Animation optional

### App-Informationen
- [ ] **App-Metadaten aktualisieren (app.json)**
  - Name: "SubTrack - Subscription Tracker"
  - Beschreibung
  - Version: 1.0.0
  - BundleID/PackageName prüfen

- [ ] **About/Settings Screen erstellen**
  ```
  Inhalte:
  - App-Version
  - Entwickler: TIM.©.B
  - Support: gummiflip@outlook.de
  - GitHub: https://github.com/TimInTech/SubTrack
  - Lizenz
  ```

## ⚖️ Rechtliches & Compliance

### DSGVO & Privacy
- [ ] **Datenschutzerklärung (Privacy Policy)**
  - Welche Daten werden gespeichert? (lokal vs. cloud)
  - Werden Daten geteilt?
  - Nutzerrechte (Löschen, Exportieren)
  - Sprachen: DE + EN

- [ ] **Impressum (falls öffentlich verteilt)**
  - Name, Adresse (falls kommerziell)
  - Kontakt
  - Oder: "Hobby-Projekt, kein kommerzieller Zweck"

- [ ] **Nutzungsbedingungen (Terms of Service)**
  - Haftungsausschluss
  - "As-is" Software

### In-App Rechtstexte
- [ ] **Link zu Privacy Policy in Settings**
- [ ] **Link zu Terms in Settings**
- [ ] **Optional: Cookie/Tracking-Banner** (falls Analytics genutzt wird)

## 🔐 Release-Vorbereitung

### Signing & Distribution
- [ ] **Production Keystore generieren**
  - Aktuell: Debug-Keystore (OK für Private Beta)
  - Für Google Play: Production Keystore erstellen
  - Keystore sicher speichern (Backup!)

- [ ] **Release-Build-Konfiguration**
  - ProGuard/R8 Minification aktivieren?
  - App-Größe optimieren
  - Versionierung (versionCode, versionName)

- [ ] **Release-Channels definieren**
  - Private Beta: Direkte APK-Weitergabe (aktuell)
  - Google Play Internal Testing
  - Google Play Closed Beta
  - Public Release (später)

### Testing
- [ ] **Smoke-Tests dokumentieren**
  - [ ] App startet ohne Crash
  - [ ] Navigation funktioniert
  - [ ] Abo hinzufügen/bearbeiten/löschen
  - [ ] Daten persistieren nach App-Neustart
  - [ ] Performance auf älteren Geräten

- [ ] **Beta-Tester einladen**
  - 3-5 Personen für initiales Feedback
  - Bug-Reports sammeln

## 🚀 Features v1.0 (MVP)

### Must-Have
- [x] Abo-Liste anzeigen
- [ ] Abo hinzufügen (+Button fixen!)
- [ ] Abo bearbeiten
- [ ] Abo löschen
- [ ] Kategorien für Abos (z.B. Streaming, Software, Fitness)
- [ ] Kosten-Übersicht (monatlich/jährlich)

### Should-Have
- [ ] Benachrichtigungen vor Abo-Verlängerung
- [ ] Statistiken (Gesamtausgaben, teuerste Abos)
- [ ] Daten-Export (CSV/JSON)
- [ ] Dark Mode

### Nice-to-Have (v1.1+)
- [ ] Cloud-Sync (optional)
- [ ] Mehrere Währungen
- [ ] Abo-Templates (Netflix, Spotify, etc.)
- [ ] Widget für Home-Screen
- [ ] iOS Version

## 📚 Dokumentation

- [x] README: Lokaler Build-Prozess (WSL → Windows)
- [ ] CONTRIBUTING.md: Wie kann man beitragen?
- [ ] CHANGELOG.md: Versions-Historie
- [ ] User Manual: Wie nutzt man die App?

## 🛠️ Technische Schulden

- [ ] **Backend/Datenbank prüfen**
  - Wie werden Abos aktuell gespeichert? (SQLite, AsyncStorage?)
  - Migration-Strategie bei Schema-Änderungen

- [ ] **Code-Qualität**
  - ESLint-Warnungen beheben
  - TypeScript strict mode?
  - Tests schreiben (Unit, Integration)

- [ ] **Build-Prozess optimieren**
  - Gradle-Build-Zeit reduzieren
  - CI/CD Pipeline (GitHub Actions)

## 📅 Zeitplan (Vorschlag)

### Phase 1: Kritische Bugs (diese Woche)
1. + Button fixen
2. CRUD-Operationen testen/fixen
3. Smoke-Tests durchführen

### Phase 2: Branding & Legal (nächste Woche)
1. Icon & Splash Screen
2. Privacy Policy & Terms erstellen
3. About/Settings Screen

### Phase 3: Release Prep (Woche 3)
1. Production Keystore
2. Beta-Testing
3. Finale Optimierungen

### Phase 4: v1.0 Launch
1. Google Play Store Listing
2. Public Release
3. Marketing/Announcement

---

**Hinweis:** Diese Roadmap ist ein Living Document. Prioritäten können sich ändern basierend auf User-Feedback und technischen Herausforderungen.

**Letzte Aktualisierung:** 2025-12-25
