# SubTrack Agent Instructions

These rules apply to Codex CLI, GitHub Copilot, and Claude.

## Build Policy
- Android builds are LOCAL ONLY.
- No Expo Cloud, no EAS, no third-party CI builds for APKs.
- Native builds must work via:
  frontend/android + Gradle + Android Studio.

## Priority Rules
1. Fix P0 bugs first (Issue #6).
2. UX clarity > feature quantity.
3. Offline-first behavior is mandatory.
4. Reproducibility > clever abstractions.

## UI / UX Rules
- Only ONE primary action button per screen.
- No overlapping floating buttons.
- FAB must never be hidden by tab bars or SafeAreas.
- Remove UI elements that confuse the main flow.

## Data Rules
- App must work without backend.
- AsyncStorage fallback is required.
- No live scraping or external price fetching.

## Git & Issues
- Reference issues in commits when applicable.
- Close issues only after:
  - local Android build succeeds
  - manual smoke test passes

## Local Build Commands
```bash
cd frontend
yarn install
npx expo-doctor
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
