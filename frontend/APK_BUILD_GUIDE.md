# Android APK Build Guide

This guide explains how to build a debug APK locally for the SubTrack app.

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

### 2. Install Yarn

```bash
npm install -g yarn@1.22.22
```

### 3. Install Dependencies

From the `frontend` directory:

```bash
cd frontend
yarn install
```

This will install all dependencies as specified in `yarn.lock`.

## Building the Debug APK

### Step 1: Set Environment

```bash
export NODE_ENV=development
```

### Step 2: Run Expo Prebuild

This generates native Android project files:

```bash
npx expo prebuild -p android --clean
```

**What this does:**
- Generates the `android/` directory with native code
- Configures app icons, splash screens, and other native assets
- Uses the configuration from `app.json`

**Expected output:** Should complete without errors. The `android/` directory will be created.

### Step 3: Build the APK with Gradle

```bash
cd android
./gradlew :app:assembleDebug
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

Here's a complete script to build from scratch:

```bash
#!/bin/bash
set -e

# Navigate to frontend directory
cd frontend

# Set environment
export NODE_ENV=development

# Install dependencies
echo "Installing dependencies..."
yarn install

# Prebuild native projects
echo "Running expo prebuild..."
npx expo prebuild -p android --clean

# Build APK
echo "Building APK..."
cd android
./gradlew :app:assembleDebug

# Show APK location
echo "✅ Build successful!"
echo "APK location: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

Save this as `build-apk.sh`, make it executable (`chmod +x build-apk.sh`), and run it.

## Continuous Integration

For CI builds, ensure:
1. Node.js 20 LTS is installed
2. JDK 17 or 21 is available
3. Android SDK is configured
4. Use `yarn install --frozen-lockfile` for reproducible builds

## Additional Resources

- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [Android Gradle Plugin](https://developer.android.com/build)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
