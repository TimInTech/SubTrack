#!/usr/bin/env bash
# build_and_deploy_debug.sh
# Minimaler, sicheres Hilfs-Skript für WSL, um eine Debug-APK zu bauen
# - führt optional prebuild aus (nur wenn --prebuild angegeben)
# - führt optional clean aus (wenn --clean angegeben)
# - baut assembleDebug
# - öffnet das APK-Verzeichnis in Windows Explorer (wenn explorer.exe vorhanden)

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PREBUILD=false
CLEAN=false
for arg in "$@"; do
  case "$arg" in
    --prebuild) PREBUILD=true ;;
    --clean) CLEAN=true ;;
    --help|-h) echo "Usage: $0 [--prebuild] [--clean]"; exit 0 ;;
    *) echo "Unknown arg: $arg"; echo "Usage: $0 [--prebuild] [--clean]"; exit 2 ;;
  esac
done

echo "Working directory: $ROOT_DIR"

if [ "$PREBUILD" = true ]; then
  echo "Running: npx expo prebuild --platform android --no-install --clean"
  cd "$ROOT_DIR"
  npx expo prebuild --platform android --no-install --clean
fi

cd "$ROOT_DIR/android"
# ensure gradlew is executable
if [ -f ./gradlew ]; then
  chmod +x ./gradlew || true
fi

if [ "$CLEAN" = true ]; then
  echo "Running: ./gradlew clean"
  ./gradlew clean
fi

echo "Building debug APK (this can take a few minutes)..."
./gradlew :app:assembleDebug --no-daemon

APK_REL_PATH="app/build/outputs/apk/debug/app-debug.apk"
APK_ABS_PATH="$(pwd)/$APK_REL_PATH"

if [ -f "$APK_ABS_PATH" ]; then
  echo "Build erfolgreich. APK gefunden: $APK_ABS_PATH"
  # If explorer.exe is available (WSL on Windows), open the folder in Explorer
  if command -v explorer.exe >/dev/null 2>&1; then
    APK_DIR="$(pwd)/app/build/outputs/apk/debug"
    EXPLORER_PATH="$(wslpath -w "$APK_DIR")"
    echo "Öffne APK-Ordner in Windows Explorer: $EXPLORER_PATH"
    explorer.exe "$EXPLORER_PATH"
  else
    echo "Hinweis: explorer.exe nicht gefunden. APK liegt hier: $APK_ABS_PATH"
  fi
  echo "Hinweis: Zum Installieren auf Gerät bitte Android Studio oder PowerShell (Windows) verwenden. adb unter WSL kann Geräte nicht finden."
  exit 0
else
  echo "Fehler: APK nicht gefunden unter: $APK_ABS_PATH" >&2
  exit 1
fi

