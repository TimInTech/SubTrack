# Frontend — Lokales Android Debug Build (WSL → Windows)

## Zweck

Reproduzierbarer Debug-Build ohne EAS/Cloud. Baue in WSL, installiere/teste auf Windows/Android Studio (Device: Samsung A52 5G).

## Voraussetzungen

* Node/Yarn in WSL
* Expo CLI (global oder via npx) in WSL
* Android SDK, adb und Android Studio auf Windows (Install/Run auf Gerät)
* adb/Installation bevorzugt unter Windows (WSL sieht Devices oft nicht)

## Schnelles Setup (VS Code, WSL)

```bash
cd /home/ubu/src/SubTrack
code .
```

## Debug-Build (WSL)

### Option A — Hilfs-Skript (empfohlen)

```bash
cd /home/ubu/src/SubTrack/frontend/scripts
chmod +x build_and_deploy_debug.sh

./build_and_deploy_debug.sh
./build_and_deploy_debug.sh --clean
./build_and_deploy_debug.sh --prebuild
```

Hinweis: `--prebuild` nur bei nativen Änderungen.

### Option B — direkter Gradle-Build

```bash
cd /home/ubu/src/SubTrack/frontend/android
./gradlew :app:assembleDebug --no-daemon
```

APK:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

## WICHTIG: Debug vs. Standalone APK

**Debug-APK** (Option A/B oben):
* Benötigt Metro Bundler auf dem Entwicklungsrechner
* Zeigt "Unable to load script" Fehler ohne Metro
* Für Live-Development gedacht

**Standalone-APK** (empfohlen für Tests):
* Funktioniert ohne Metro Bundler
* JavaScript-Bundle ist in APK eingebettet
* Nutze Release-Build in WSL

## Standalone APK bauen (für Tests ohne Metro)

In WSL Ubuntu:

```bash
cd /home/ubu/src/SubTrack/frontend/android

# local.properties erstellen (einmalig)
echo "sdk.dir=/mnt/c/Users/gummi/AppData/Local/Android/Sdk" > local.properties

# Release-APK bauen
./gradlew :app:assembleRelease --no-daemon
```

APK-Pfad:
`frontend/android/app/build/outputs/apk/release/app-release.apk`

## Debug-APK mit Metro nutzen (Live-Development)

Falls du Debug-APK nutzen willst:

**1. Metro Bundler starten (WSL):**
```bash
cd /home/ubu/src/SubTrack/frontend
npx expo start
```

**2. Port forwarding (Windows PowerShell):**
```powershell
adb reverse tcp:8081 tcp:8081
```

**3. App auf Gerät öffnen** → RELOAD (R, R)

## APK nach Windows bringen & installieren

In WSL (Pfad ggf. anpassen):

```bash
# Für Standalone (empfohlen)
APK="/home/ubu/src/SubTrack/frontend/android/app/build/outputs/apk/release/app-release.apk"

# Für Debug mit Metro
# APK="/home/ubu/src/SubTrack/frontend/android/app/build/outputs/apk/debug/app-debug.apk"

ls -lh "$APK"
explorer.exe "$(wslpath -w "$(dirname "$APK")")"
```

In Windows PowerShell:

```powershell
adb devices
adb install -r C:\path\to\app-release.apk
```

Oder Android Studio:

* Open Project: `frontend/android`
* Run (Device: Samsung A52 5G)

## Smoke-Test (empfohlen)

* Installiere Debug-APK auf A52 5G
* Start → kein Crash
* Navigation: „Expenses", „Subscriptions"
* CRUD: Eintrag anlegen/bearbeiten
* Logcat bei Fehlern (Windows PowerShell):

```powershell
adb logcat -v time *:S ReactNative:V ReactNativeJS:V
```

## Wichtige Hinweise

* Kein EAS/Cloud nötig
* `expo prebuild` nur bei nativen Änderungen
* WSL für Build, Windows/Android Studio für adb/Device
* Release erst nach stabilem Debug

## Optional: CI / Automatisierung

Wenn Debug stabil ist, kann eine minimale GitHub Action eine Debug-APK als Artifact bauen.
