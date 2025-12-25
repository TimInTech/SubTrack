# SubTrack (BuildKit) – Debug-APK unter WSL (Ubuntu 24.04)

Dieses Repo enthält ein Expo/React-Native-Frontend. Eine „klassische“ APK entsteht hier über **Expo Prebuild** (erzeugt `frontend/android/`) und anschließend **Gradle** (`assembleDebug`).

## Projektstruktur (relevant)
- `SubTrack-main/frontend/` – Expo App (`app.json`, `package.json`)
- `SubTrack-main/frontend/scripts/build-debug-apk.sh` – 1-Command Build
- `SubTrack-main/frontend/APK_BUILD_GUIDE.md` – Build-Guide (vorhanden)

## 1) ZIP von Windows nach WSL & entpacken

### Option A: ZIP liegt in Windows (Desktop)
```powershell
# PowerShell (Windows)
$zip = "C:\Users\gummi\Desktop\SubTrack-main-buildkit.zip"
wsl bash -lc "mkdir -p ~/src/SubTrack-main-buildkit && cd ~/src/SubTrack-main-buildkit && unzip -o '/mnt/c/Users/gummi/Desktop/SubTrack-main-buildkit.zip'"
````

### Option B: Manuell im WSL-Pfad entpacken

```bash
# WSL (Ubuntu)
mkdir -p ~/src/SubTrack-main-buildkit
cd ~/src/SubTrack-main-buildkit
unzip -o /mnt/c/Users/gummi/Desktop/SubTrack-main-buildkit.zip
```

Erwarteter Ordner danach:

```bash
ls -la ~/src/SubTrack-main-buildkit/SubTrack-main
```

## 2) System-Dependencies (WSL)

```bash
sudo apt update
sudo apt install -y unzip zip git curl jq openjdk-17-jdk
```

## 3) Node/Yarn korrekt setzen (wichtig)

**Wichtig:** `npm i -g yarn` führte bei dir zu **EACCES** (global install in `/usr/lib/node_modules` ohne Rechte). Lösung: **Corepack** nutzen (kein sudo, keine global installs).

### 3.1 Node Version per `.nvmrc`

Im Repo existiert eine `.nvmrc` im Root von `SubTrack-main` (bei dir sichtbar). Nutze diese Version:

```bash
# Falls nvm noch fehlt (einmalig)
command -v nvm >/dev/null || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh

cd ~/src/SubTrack-main-buildkit/SubTrack-main
nvm install
nvm use
node -v
npm -v
```

### 3.2 Yarn 1.22.22 via Corepack aktivieren

```bash
cd ~/src/SubTrack-main-buildkit/SubTrack-main/frontend
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

### 3.3 Dependencies installieren (reproduzierbar)

```bash
cd ~/src/SubTrack-main-buildkit/SubTrack-main/frontend
yarn install --frozen-lockfile
```

## 4) Debug-APK bauen (2 Wege)

### Weg A (empfohlen): 1-Command Script

```bash
cd ~/src/SubTrack-main-buildkit/SubTrack-main/frontend
chmod +x ./scripts/build-debug-apk.sh
./scripts/build-debug-apk.sh
```

Das Script macht (kurz):

1. `NODE_ENV=development`
2. `yarn install --frozen-lockfile`
3. `npx expo prebuild -p android --clean`
4. `cd android && ./gradlew :app:assembleDebug`
5. Prüft APK-Pfad

### Weg B: Manuell Schritt für Schritt

```bash
cd ~/src/SubTrack-main-buildkit/SubTrack-main/frontend

export NODE_ENV=development
yarn install --frozen-lockfile

NODE_ENV=development npx expo prebuild -p android --clean

cd android
NODE_ENV=development ./gradlew :app:assembleDebug
```

## 5) Ergebnis: APK-Pfad

```bash
ls -lh ~/src/SubTrack-main-buildkit/SubTrack-main/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Erwarteter Pfad:

* `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

## 6) Installation / Verifikation (adb)

### 6.1 adb installieren (falls fehlt)

```bash
sudo apt install -y android-sdk-platform-tools
adb version
```

### 6.2 APK installieren

```bash
APK=~/src/SubTrack-main-buildkit/SubTrack-main/frontend/android/app/build/outputs/apk/debug/app-debug.apk
adb devices
adb install -r "$APK"
```

### 6.3 App-Start smoke test

Package-Name steht in `frontend/app.json`:

* `com.anonymous.frontend`

```bash
adb shell monkey -p com.anonymous.frontend 1
```

## 7) Android SDK Setup (wenn Gradle meckert)

Wenn `SDK location not found` / `ANDROID_HOME` fehlt:

1. Android Studio (Windows) installieren **oder** Commandline SDK in WSL einrichten.
2. In WSL `ANDROID_HOME` setzen (Beispielpfad!):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator"
```

Persistieren:

```bash
cat >> ~/.bashrc <<'EOF'
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator"
EOF
source ~/.bashrc
```

## 8) Troubleshooting (häufig)

### 8.1 Yarn global install EACCES

Nicht `npm i -g yarn`. Stattdessen:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

### 8.2 Node Version mismatch

```bash
cd SubTrack-main
nvm use
node -v
```

### 8.3 Prebuild-Fehler wegen Assets

Stelle sicher, dass diese Dateien existieren (laut `app.json`):

* `frontend/assets/images/icon.png`
* `frontend/assets/images/adaptive-icon.png`
* `frontend/assets/images/splash-icon.png`
* `frontend/assets/images/favicon.png`

Check:

```bash
cd frontend
ls -la assets/images/{icon.png,adaptive-icon.png,splash-icon.png,favicon.png}
file assets/images/*.png
```

### 8.4 Clean Build

```bash
cd frontend
npx expo prebuild -p android --clean
cd android
./gradlew clean
./gradlew :app:assembleDebug
```

## 9) Output zurück nach Windows kopieren

```bash
cp -v ~/src/SubTrack-main-buildkit/SubTrack-main/frontend/android/app/build/outputs/apk/debug/app-debug.apk /mnt/c/Users/gummi/Desktop/SubTrack-debug.apk
```

## 10) Referenzen im Repo

* `frontend/APK_BUILD_GUIDE.md` (enthält Quickstart + CI Beispiel)
* `frontend/scripts/build-debug-apk.sh` (automatisierter Build)
* `frontend/scripts/validate-build-env.sh` (Prereq-Checks)

```
```
