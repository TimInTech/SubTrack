# GitHub Issues to Create

Erstelle diese Issues manuell auf: https://github.com/TimInTech/SubTrack/issues/new

---

## Issue #1: [BUG][P0] Kein Plus-Button zum Hinzufügen von Abos

**Labels:** `bug`, `P0`, `blocker`

**Beschreibung:**
Die App zeigt keinen Button/Symbol zum Hinzufügen neuer Abonnements. Ohne diese Funktion ist die App nicht nutzbar.

**Priorität:** P0 - BLOCKER für v1.0 Release

**Schritte zum Reproduzieren:**
1. App öffnen
2. Auf "Subscriptions" Tab navigieren
3. Suche nach einem "+" oder "Add" Button
4. ❌ Kein Button sichtbar

**Erwartetes Verhalten:**
- Ein Plus-Button (+) sollte sichtbar sein (z.B. floating action button rechts unten)
- Tippen auf den Button öffnet ein Formular zum Hinzufügen eines neuen Abos

**Tatsächliches Verhalten:**
- Kein Button zum Hinzufügen vorhanden
- Keine Möglichkeit, neue Abos anzulegen

**Gerät/Umgebung:**
- Gerät: Samsung A52 5G
- Android Version: Android 13+
- App Version: 1.0.0 (Release-APK)
- Build: app-release.apk vom 2025-12-25

**Mögliche Ursachen:**
1. Button fehlt komplett im Code
2. Button ist vorhanden, aber unsichtbar (z-index/styling Problem)
3. Navigation/Routing-Problem

**Next Steps:**
1. Frontend Code durchsuchen nach "Add"/"+" Buttons
2. Navigation-Komponente prüfen
3. Falls fehlend: Button + Formular implementieren

---

## Issue #2: [TASK] Custom App Icon erstellen

**Labels:** `enhancement`, `design`, `branding`

**Beschreibung:**
Aktuell nutzt die App das Standard-Expo-Icon. Für einen professionellen Eindruck brauchen wir ein einzigartiges Icon.

**Design-Anforderungen:**
- Minimal, modernes Design
- Thema: Abonnement-Tracking / Finanzen
- Farben: Blau/Grün (Vertrauen, Finanzen)
- Symbol-Ideen: Kalender + Euro-Symbol, Wiederkehr-Symbol

**Deliverables:**
- [ ] Icon 1024x1024 (Expo Asset)
- [ ] Android Adaptive Icon (Foreground + Background)
- [ ] iOS App Icon (alle Größen)
- [ ] Integration in app.json

**Tools:**
- Figma / Adobe Illustrator
- Oder: Expo Icon Generator

---

## Issue #3: [TASK] About/Settings Screen mit rechtlichen Infos

**Labels:** `enhancement`, `legal`, `P1`

**Beschreibung:**
App benötigt einen Settings/About-Screen mit:
- App-Version
- Entwickler-Info (Name, Email, GitHub)
- Privacy Policy Link
- Terms of Service Link
- Open Source Licenses

**Technische Umsetzung:**
- Neuer Screen: `app/(tabs)/settings.tsx`
- Navigation: Tab-Bar erweitern
- External Links: `Linking.openURL()`

**Inhalt:**
```
SubTrack v1.0.0

Entwickelt von: TIM.©.B
Support: gummiflip@outlook.de
GitHub: https://github.com/TimInTech/SubTrack

[Datenschutzerklärung]
[Nutzungsbedingungen]
[Open Source Lizenzen]
```

---

## Issue #4: [LEGAL] Datenschutzerklärung (Privacy Policy) erstellen

**Labels:** `legal`, `documentation`, `P1`

**Beschreibung:**
DSGVO-konforme Datenschutzerklärung für die App.

**Inhaltliche Punkte:**
- Welche Daten werden gespeichert? (Abos, Kosten → lokal auf Gerät)
- Werden Daten geteilt? (Nein, keine Cloud-Sync in v1.0)
- Analytics/Tracking? (Falls ja: welche Tools?)
- Nutzerrechte (Daten löschen, exportieren)
- Kontakt für Datenschutzanfragen

**Sprachen:** DE + EN

**Hosting:**
- Option 1: GitHub Pages (privacy-policy.html)
- Option 2: In-App als Markdown

---

## Issue #5: [LEGAL] Nutzungsbedingungen (Terms of Service)

**Labels:** `legal`, `documentation`, `P1`

**Inhalt:**
- Haftungsausschluss
- "As-is" Software
- Keine Garantie für Richtigkeit der Daten
- Nutzung auf eigene Verantwortung

**Sprachen:** DE + EN

---

## Issue #6: [TASK] Production Keystore generieren

**Labels:** `infrastructure`, `release`, `P1`

**Beschreibung:**
Für Google Play Store Release benötigen wir einen Production Keystore (aktuell: Debug-Keystore).

**Steps:**
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore subtrack-release.keystore \
  -alias subtrack \
  -keyalg RSA -keysize 2048 -validity 10000
```

**Wichtig:**
- Keystore & Passwort sicher speichern (1Password, etc.)
- **NIEMALS** in Git committen
- Backup erstellen

**Integration:**
- `android/app/build.gradle` anpassen
- `gradle.properties` (lokal, nicht in Git)

---

## Issue #7: [FEATURE] Benachrichtigungen vor Abo-Verlängerung

**Labels:** `enhancement`, `feature`, `v1.0`

**Beschreibung:**
Nutzer sollen Benachrichtigungen erhalten, bevor ein Abo verlängert wird (z.B. 3 Tage vorher).

**Technische Umsetzung:**
- Expo Notifications API
- Local Notifications (kein Backend nötig)
- User kann Zeitpunkt konfigurieren (1/3/7 Tage vorher)

**Permissions:**
- Android: SCHEDULE_EXACT_ALARM

---

## Issue #8: [FEATURE] Statistiken & Dashboard

**Labels:** `enhancement`, `feature`, `v1.0`

**Beschreibung:**
Übersichts-Screen mit:
- Gesamtausgaben pro Monat/Jahr
- Teuerste Abos (Top 5)
- Anzahl aktiver Abos
- Chart/Graph (optional)

**Libraries:**
- react-native-chart-kit
- oder: react-native-svg

---

## Issue #9: [TASK] CI/CD Pipeline (GitHub Actions)

**Labels:** `infrastructure`, `automation`, `nice-to-have`

**Beschreibung:**
Automatischer Build-Prozess für:
- Pull Requests: Linting, Tests
- Merges to main: Release-APK als Artifact

**Workflow:**
```yaml
name: Android Build
on: [push, pull_request]
jobs:
  build:
    - Setup Node
    - Install dependencies
    - Run tests
    - Build APK
    - Upload artifact
```

---

## Issue #10: [BUG] Smoke-Tests durchführen

**Labels:** `testing`, `P1`

**Checklist:**
- [ ] App startet ohne Crash
- [ ] Navigation zwischen Tabs funktioniert
- [ ] Abo hinzufügen (falls + Button implementiert)
- [ ] Abo bearbeiten
- [ ] Abo löschen
- [ ] Daten persistieren nach App-Neustart
- [ ] Performance auf älteren Geräten (API 24+)

**Test-Geräte:**
- Samsung A52 5G (aktuell getestet)
- Emulator: Android 10, 11, 13, 14

---

## Anleitung: Issues erstellen

1. Gehe zu https://github.com/TimInTech/SubTrack/issues
2. Klicke "New Issue"
3. Wähle Template (Bug Report / Feature Request) oder "Open a blank issue"
4. Kopiere Titel und Beschreibung aus diesem Dokument
5. Füge Labels hinzu (bug, P0, enhancement, etc.)
6. Klicke "Submit new issue"

**Oder:** GitHub Projects Board erstellen und Issues dort organisieren
- https://github.com/TimInTech/SubTrack/projects
