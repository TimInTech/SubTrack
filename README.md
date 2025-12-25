# Abo-Tracker - Abonnement & Fixkosten Verwaltung

Eine Cross-Platform Mobile App zur Verwaltung von Abonnements und wiederkehrenden Fixkosten.

## Tech Stack

- **Frontend**: Expo/React Native (TypeScript)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

---

## Voraussetzungen

| Tool | Version |
|------|---------|
| Node.js | 20.19.6 |
| Yarn | 1.22.22 |
| JDK | 17 |
| Android SDK | platforms;android-35, build-tools;35.0.0 |

---

## Fresh Install & Build Debug APK

Folge diesen Schritten für einen sauberen Build von Grund auf:

### 1. Repository klonen

```bash
git clone <repo-url>
cd <repo-name>
```

### 2. Node Version setzen (mit nvm)

```bash
nvm install 20.19.6
nvm use 20.19.6
```

### 3. Clean State (optional, bei Problemen)

```bash
cd frontend
rm -rf node_modules android ios .expo
```

### 4. Dependencies installieren

```bash
cd frontend
yarn install --frozen-lockfile
```

### 5. Android Projekt generieren (Expo Prebuild)

```bash
export NODE_ENV=development
npx expo prebuild --platform android --clean --no-install
```

### 6. Debug APK bauen

```bash
cd android
chmod +x ./gradlew
./gradlew :app:assembleDebug
```

### 7. APK finden

```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Development Server

### Backend starten

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend (Expo Dev Server)

```bash
cd frontend
yarn start
```

---

## GitHub Actions

Bei jedem Push auf `main`, `master` oder `conflict_251225_1038` wird automatisch eine Debug-APK gebaut.

- Workflow: `.github/workflows/android.yml`
- Artifact: `app-debug-apk` (14 Tage Retention)

---

## Features

- Dashboard mit Monats-/Jahresübersicht
- Abonnements verwalten (CRUD)
- Fixkosten verwalten (CRUD)
- Service-Presets (Netflix, Spotify, etc.)
- Kostenverteilungs-Chart
- JSON/CSV Export & Import
- Benachrichtigungen vor Verlängerung
- Einstellungen-Screen

---

## Projektstruktur

```
├── backend/
│   ├── server.py
│   └── requirements.txt
├── frontend/
│   ├── app/               # Expo Router Screens
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── app.json
│   └── package.json
└── .github/workflows/
    └── android.yml
```

---

## Troubleshooting

### MainApplication.kt unresolved references

Stelle sicher, dass `newArchEnabled: false` in `frontend/app.json` gesetzt ist.

### NODE_ENV Fehler

Setze immer `export NODE_ENV=development` vor dem Prebuild/Build.

### Gradle Build Fehler

```bash
rm -rf frontend/android
cd frontend
export NODE_ENV=development
npx expo prebuild -p android --clean --no-install
cd android && ./gradlew :app:assembleDebug
```
