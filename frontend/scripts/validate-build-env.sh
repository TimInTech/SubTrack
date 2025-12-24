#!/bin/bash
# Validation script for Android APK build prerequisites
# This script validates the environment and configuration without building the APK

set -e

echo "🔍 Validating Android APK Build Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track success/failure
ERRORS=0

# Function to check if a file exists
check_file() {
    local file=$1
    local name=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $name exists: $file"
        return 0
    else
        echo -e "${RED}❌${NC} $name missing: $file"
        ERRORS=$((ERRORS+1))
        return 1
    fi
}

# Function to validate PNG
validate_png() {
    local file=$1
    
    if ! file "$file" | grep -q "PNG image data"; then
        echo -e "${RED}❌${NC} Not a valid PNG: $file"
        ERRORS=$((ERRORS+1))
        return 1
    fi
    
    # Check for Git LFS pointer
    if head -c 100 "$file" | grep -q "version https://git-lfs.github.com"; then
        echo -e "${RED}❌${NC} Git LFS pointer detected: $file"
        ERRORS=$((ERRORS+1))
        return 1
    fi
    
    return 0
}

echo "1️⃣  Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅${NC} Node.js: $NODE_VERSION"
    
    # Check against .nvmrc if it exists
    if [ -f "../.nvmrc" ]; then
        REQUIRED_VERSION=$(cat ../.nvmrc)
        if [[ "$NODE_VERSION" =~ ^v${REQUIRED_VERSION%%.*}\. ]]; then
            echo -e "${GREEN}✅${NC} Node version matches .nvmrc requirement"
        else
            echo -e "${YELLOW}⚠️${NC}  Node version ($NODE_VERSION) doesn't match .nvmrc ($REQUIRED_VERSION)"
        fi
    fi
else
    echo -e "${RED}❌${NC} Node.js not found"
    ERRORS=$((ERRORS+1))
fi
echo ""

echo "2️⃣  Checking Yarn..."
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo -e "${GREEN}✅${NC} Yarn: $YARN_VERSION"
else
    echo -e "${RED}❌${NC} Yarn not found"
    ERRORS=$((ERRORS+1))
fi
echo ""

echo "3️⃣  Checking package files..."
check_file "package.json" "package.json"
check_file "yarn.lock" "yarn.lock"
check_file "app.json" "app.json"
echo ""

echo "4️⃣  Checking required image assets..."
check_file "assets/images/icon.png" "Icon"
check_file "assets/images/adaptive-icon.png" "Adaptive Icon"
check_file "assets/images/splash-icon.png" "Splash Icon"
check_file "assets/images/favicon.png" "Favicon"
echo ""

echo "5️⃣  Validating PNG files..."
for png in assets/images/icon.png assets/images/adaptive-icon.png assets/images/splash-icon.png assets/images/favicon.png; do
    if [ -f "$png" ]; then
        if validate_png "$png"; then
            dimensions=$(file "$png" | grep -oP '\d+ x \d+')
            echo -e "${GREEN}✅${NC} Valid PNG: $png ($dimensions)"
        fi
    fi
done
echo ""

echo "6️⃣  Validating Expo configuration..."
if command -v npx &> /dev/null; then
    if npx expo config --type public > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Expo config is valid"
    else
        echo -e "${RED}❌${NC} Expo config is invalid"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  npx not available, skipping expo config check"
fi
echo ""

echo "7️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules exists"
else
    echo -e "${YELLOW}⚠️${NC}  node_modules not found - run 'yarn install'"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "You can proceed with building the APK:"
    echo "  1. export NODE_ENV=development"
    echo "  2. npx expo prebuild -p android --clean"
    echo "  3. cd android && ./gradlew :app:assembleDebug"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before building."
    exit 1
fi
