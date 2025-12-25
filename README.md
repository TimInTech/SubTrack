# Abo-Tracker - Abonnement & Fixkosten Verwaltung

Eine Cross-Platform Mobile App zur Verwaltung von Abonnements und wiederkehrenden Fixkosten.

## Tech Stack

- **Frontend**: Expo/React Native (TypeScript)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Voraussetzungen

- Node.js 20.19.0 (siehe `.nvmrc`)
- Yarn 1.22.22
- JDK 17 (für Android Build)
- Android SDK mit:
  - platform-tools
  - platforms;android-35
  - build-tools;35.0.0

## Installation

### 1. Repository klonen

```bash
git clone <repo-url>
cd <repo-name>
```

### 2. Node Version setzen (mit nvm)

```bash
nvm install
nvm use
```

### 3. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### 4. Frontend Setup

```bash
cd frontend
yarn install --frozen-lockfile
```

## Development Server starten

### Backend

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend (Expo)

```bash
cd frontend
yarn start
```

## Android APK Build (Fresh Install)

Wenn du eine frische Debug-APK bauen möchtest:

### 1. Clean Build Environment

```bash
cd frontend
rm -rf node_modules android
```

### 2. Dependencies installieren

```bash
yarn install --frozen-lockfile
```

### 3. Android Projekt generieren

```bash
export NODE_ENV=development
npx expo prebuild --platform android --clean --no-install
```

### 4. Debug APK bauen

```bash
cd android
chmod +x ./gradlew
./gradlew :app:assembleDebug
```

### 5. APK finden

Die fertige APK liegt unter:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## GitHub Actions

Bei jedem Push/PR wird automatisch eine Debug-APK gebaut und als Artifact hochgeladen.
Siehe `.github/workflows/android.yml`.

## Features

- ✅ Dashboard mit Monats-/Jahresübersicht
- ✅ Abonnements verwalten (CRUD)
- ✅ Fixkosten verwalten (CRUD)
- ✅ Service-Presets (Netflix, Spotify, etc.)
- ✅ Kostenverteilungs-Chart
- ✅ JSON/CSV Export & Import
- ✅ Benachrichtigungen vor Verlängerung
- ✅ Einstellungen-Screen

## Projektstruktur

```
├── backend/
│   ├── server.py          # FastAPI Server
│   └── requirements.txt
├── frontend/
│   ├── app/               # Expo Router Pages
│   ├── src/
│   │   ├── components/    # UI Komponenten
│   │   ├── constants/     # Theme, Presets
│   │   ├── hooks/         # Custom Hooks
│   │   ├── types/         # TypeScript Types
│   │   └── utils/         # Utility Functions
│   ├── app.json           # Expo Config
│   └── package.json
└── .github/workflows/     # CI/CD
```

## Troubleshooting

### MainApplication.kt Fehler

Stelle sicher, dass `newArchEnabled: false` in `app.json` gesetzt ist.

### NODE_ENV Fehler

Setze immer `export NODE_ENV=development` vor dem Prebuild.

### Gradle Build Fehler

Lösche das Android-Verzeichnis und führe Prebuild erneut aus:
```bash
rm -rf frontend/android
cd frontend && npx expo prebuild -p android --clean --no-install
```
