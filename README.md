# Moments Bridge companion

Moments Studio remains a website. This small companion app handles only the final handoff: it receives a short-lived link, fetches the finished JPEG from the website, and passes it to Instagram Stories using Meta's native sharing interface. Instagram opens with the image; the user reviews it and taps Share.

## Build prerequisites

Node.js, a Vercel deployment of Moments Studio with its private Blob bridge configured, a Meta developer App ID, Android Studio for Android, and macOS with Xcode for iPhone.

## Setup

1. Set `www/bridge-config.js` to the deployed Moments Studio origin, for example `https://moments-studio.vercel.app`.
2. Set `YOUR_META_APP_ID` in `native/android/strings-additions.xml` and `native/ios/Info-plist-additions.xml`.
3. Run `npm install`, then `npx cap add android` and `npx cap add ios`.
4. Run `npx cap sync`.
5. Android: copy `native/android/InstagramStoriesPlugin.java` into `android/app/src/main/java/com/momentsbridge/app/`; register it using `native/android/MainActivity-registration.java`; merge `native/android/AndroidManifest-additions.xml` into the existing manifest (provider in `<application>`, deep-link filter inside `.MainActivity`); copy `native/android/res/xml/instagram_story_paths.xml` into `android/app/src/main/res/xml/`; add the `facebook_app_id` string from `native/android/strings-additions.xml` into `android/app/src/main/res/values/strings.xml`.
6. iPhone: add `native/ios/InstagramStoriesPlugin.swift` to the App target; register it through the app's Capacitor bridge using `native/ios/InstagramStoriesPlugin-registration.swift`; merge `native/ios/Info-plist-additions.xml` into `ios/App/App/Info.plist`.
7. Run `npx cap sync` and build/install both platform apps. On iPhone, distribute the helper through TestFlight or another installed build; Android can use a locally installed APK for a test.

The website opens `momentsbridge://share?token=...`. Install the companion first. If it is missing or the Vercel storage is not configured, the website falls back to the normal phone share sheet.

This ZIP contains source starter files, not signed app binaries. App IDs, platform signing, and a real-device handoff test are still required before everyday use.
