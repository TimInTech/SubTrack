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

## APK nach Windows bringen & installieren

In WSL (Pfad ggf. anpassen):

```bash
APK="/home/ubu/src/SubTrack/frontend/android/app/build/outputs/apk/debug/app-debug.apk"
ls -lh "$APK"
explorer.exe "$(wslpath -w "$(dirname "$APK")")"
```

In Windows PowerShell:

```powershell
adb devices
adb install -r C:\path\to\app-debug.apk
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
