#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${EXPO_PUBLIC_API_URL:?Informe EXPO_PUBLIC_API_URL com a URL acessível no celular, incluindo /api}"
export NODE_ENV=production
export EXPO_NO_TELEMETRY=1
npx expo prebuild --platform android --no-install
(
  cd android
  ./gradlew :app:assembleRelease --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
)
cp android/app/build/outputs/apk/release/app-release.apk ../AsTorres-Mobile.apk
(cd .. && sha256sum AsTorres-Mobile.apk > AsTorres-Mobile.apk.sha256)
echo 'APK criado na pasta mãe: AsTorres-Mobile.apk'
