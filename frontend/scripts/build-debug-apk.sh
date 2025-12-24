#!/bin/bash
# Build script for creating a debug APK locally
# This script runs all necessary steps to build an Android debug APK
# from a fresh clone under Linux without EAS or app stores.

set -euo pipefail

# Colors for output
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SubTrack Android Debug APK Build Script${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Change to frontend directory
cd "$FRONTEND_DIR"
echo -e "${YELLOW}➜${NC} Working directory: $(pwd)"
echo ""

# Step 1: Set environment
echo -e "${YELLOW}[1/4]${NC} Setting environment..."
export NODE_ENV=development
echo -e "${GREEN}✓${NC} NODE_ENV=$NODE_ENV"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}[2/4]${NC} Installing dependencies with Yarn..."
if [ ! -d "node_modules" ]; then
    echo "  Running yarn install --frozen-lockfile..."
    yarn install --frozen-lockfile
else
    echo "  node_modules exists, running yarn install --frozen-lockfile to verify..."
    yarn install --frozen-lockfile
fi
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Step 3: Run Expo prebuild
echo -e "${YELLOW}[3/4]${NC} Running Expo prebuild for Android..."
echo "  This generates the native Android project files..."
npx expo prebuild -p android --clean
echo -e "${GREEN}✓${NC} Expo prebuild completed"
echo ""

# Verify android directory was created
if [ ! -d "$FRONTEND_DIR/android" ]; then
    echo -e "${RED}✗${NC} Error: android/ directory was not created by prebuild"
    exit 1
fi

# Step 4: Build APK with Gradle
echo -e "${YELLOW}[4/4]${NC} Building APK with Gradle..."
cd "$FRONTEND_DIR/android"
echo "  Running ./gradlew :app:assembleDebug..."
./gradlew :app:assembleDebug
echo -e "${GREEN}✓${NC} Gradle build completed"
echo ""

# Verify APK was created
echo -e "${YELLOW}➜${NC} Verifying APK..."
APK_PATH="$FRONTEND_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    # Use stat for reliable file size retrieval
    if command -v numfmt &> /dev/null; then
        APK_SIZE=$(stat -c%s "$APK_PATH" | numfmt --to=iec-i --suffix=B)
    else
        # Fallback for systems without numfmt
        APK_SIZE=$(stat -c%s "$APK_PATH" | awk '{printf "%.2f MB", $1/1024/1024}')
    fi
    echo -e "${GREEN}✓${NC} APK successfully created!"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Build Successful!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  APK Location: $APK_PATH"
    echo "  APK Size: $APK_SIZE"
    echo ""
    echo "To install on a device:"
    echo "  adb install \"$APK_PATH\""
    echo ""
else
    echo -e "${RED}✗${NC} Error: APK not found at expected location:"
    echo "  Expected: $APK_PATH"
    exit 1
fi
