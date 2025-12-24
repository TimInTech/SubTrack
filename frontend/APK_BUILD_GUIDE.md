# Android APK Build Guide

This guide explains how to build a debug APK locally for the SubTrack app.

## Quick Start

For a one-command build process:

```bash
cd frontend
./scripts/build-debug-apk.sh
```

This automated script handles all steps from dependency installation to APK creation.

## Prerequisites

- **Node.js**: v20.0.0 or higher (recommended: v20.19.6 LTS)
- **Yarn**: v1.22.22 (Classic)
- **Java Development Kit (JDK)**: version 17 or 21
- **Android SDK**: Install via Android Studio or command line tools

## Environment Setup

### 1. Install Node.js

We recommend using `nvm` (Node Version Manager) to manage Node.js versions:

```bash
# Install nvm (if not already installed)
# Official installation: https://github.com/nvm-sh/nvm#installing-and-updating
# Alternatively, install via your package manager:
# - macOS: brew install nvm
# - Linux: Check your distribution's package manager

# For direct installation (verify the latest version at https://github.com/nvm-sh/nvm):
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Use the pinned Node version
nvm use
# or explicitly: nvm install 20.19.6 && nvm use 20.19.6
```

### 2. Enable Corepack and Install Yarn

We use Corepack to ensure the correct Yarn version (1.22.22) is used:

```bash
cd frontend

# Enable Corepack (built into Node.js 20+)
corepack enable

# Prepare and activate the exact Yarn version
corepack prepare yarn@1.22.22 --activate
```

**Note:** The exact Yarn version is specified in `package.json` via `packageManager` field and `engines.yarn`.

### 3. Install Dependencies

From the `frontend` directory:

```bash
yarn install --frozen-lockfile
```

This will install all dependencies exactly as specified in `yarn.lock`, ensuring reproducible builds.

## Building the Debug APK

### Step 1: Set Environment

```bash
export NODE_ENV=development
```

**Important:** Setting `NODE_ENV=development` is required for proper asset handling during prebuild and Gradle build.

### Step 2: Run Expo Prebuild

This generates native Android project files:

```bash
cd frontend
NODE_ENV=development npx expo prebuild -p android --clean
```

**What this does:**
- Generates the `android/` directory with native code
- Configures app icons, splash screens, and other native assets
- Uses the configuration from `app.json`

**Expected output:** Should complete without errors. The `android/` directory will be created.

### Step 3: Build the APK with Gradle

```bash
cd android
NODE_ENV=development ./gradlew :app:assembleDebug
```

**What this does:**
- Compiles the Android app
- Bundles JavaScript with Metro
- Creates a debug APK

**Expected output:** Build succeeds with message like:
```
BUILD SUCCESSFUL in 2m 15s
```

### Step 4: Locate the APK

The debug APK will be located at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

You can verify it exists:

```bash
ls -lh android/app/build/outputs/apk/debug/app-debug.apk
```

## Installing the APK

### On Physical Device

1. Enable "Developer Options" and "USB Debugging" on your Android device
2. Connect via USB
3. Install the APK:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### On Emulator

```bash
adb -e install android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Issue: "jimp-compact Crc error" during prebuild

**Solution:** This was caused by missing `splash-icon.png`. This file has been added to the repository.

### Issue: "resource drawable/splashscreen_logo not found"

**Solution:** Ensure all image assets referenced in `app.json` exist:
- `assets/images/icon.png`
- `assets/images/adaptive-icon.png`
- `assets/images/splash-icon.png`
- `assets/images/favicon.png`

### Issue: Node version mismatch

**Solution:** Use the version specified in `.nvmrc`:
```bash
nvm use
```

### Issue: Gradle build fails

**Common causes:**
1. Java version mismatch - use JDK 17 or 21
2. Android SDK not configured - set `ANDROID_HOME` environment variable
3. Insufficient memory - increase Gradle memory in `android/gradle.properties`

**Check Java version:**
```bash
java -version
```

**Set ANDROID_HOME (example for macOS/Linux):**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Clean Build

If you encounter issues, try a clean build:

```bash
# Clean Expo cache
cd frontend
npx expo prebuild -p android --clean

# Clean Gradle cache
cd android
./gradlew clean
./gradlew :app:assembleDebug
```

## Full Build Script

For convenience, we provide an automated build script that performs all steps:

```bash
cd frontend
./scripts/build-debug-apk.sh
```

This script will:
1. Set `NODE_ENV=development`
2. Install dependencies with `yarn install --frozen-lockfile`
3. Run `npx expo prebuild -p android --clean`
4. Build the APK with `./gradlew :app:assembleDebug`
5. Verify the APK was created and show its location

The script uses `set -euo pipefail` for proper error handling and will exit immediately if any step fails.

### Manual Build (Step-by-Step)

If you prefer to run the commands manually, here's the complete sequence:

```bash
#!/bin/bash
set -e

# Navigate to frontend directory
cd frontend

# Set environment
export NODE_ENV=development

# Install dependencies
echo "Installing dependencies..."
yarn install --frozen-lockfile

# Prebuild native projects
echo "Running expo prebuild..."
NODE_ENV=development npx expo prebuild -p android --clean

# Build APK
echo "Building APK..."
cd android
NODE_ENV=development ./gradlew :app:assembleDebug

# Show APK location
echo "✅ Build successful!"
echo "APK location: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

Save this as `build-apk.sh`, make it executable (`chmod +x build-apk.sh`), and run it.

## Continuous Integration

For CI builds, ensure:
1. Node.js 20 LTS is installed (use `.nvmrc` to specify version)
2. JDK 17 or 21 is available
3. Android SDK is configured
4. Use `corepack enable && corepack prepare yarn@1.22.22 --activate` to set up Yarn
5. Use `yarn install --frozen-lockfile` for reproducible builds
6. Set `NODE_ENV=development` for all build steps

### Example CI Configuration (GitHub Actions)

```yaml
name: Build Android APK

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      
      - name: Enable Corepack and set up Yarn
        run: |
          cd frontend
          corepack enable
          corepack prepare yarn@1.22.22 --activate
      
      - name: Install dependencies
        run: |
          cd frontend
          yarn install --frozen-lockfile
      
      - name: Run Expo prebuild
        run: |
          cd frontend
          NODE_ENV=development npx expo prebuild -p android --clean
      
      - name: Build debug APK
        run: |
          cd frontend/android
          NODE_ENV=development ./gradlew :app:assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Additional Resources

- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [Android Gradle Plugin](https://developer.android.com/build)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
