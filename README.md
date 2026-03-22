# FinTrack

A personal finance tracker for Android — built with React Native and Expo.

[![Latest Release](https://img.shields.io/github/v/release/susobhandash/FinTrackExpo?style=flat-square)](https://github.com/susobhandash/FinTrackExpo/releases/latest)
[![License: Non-Commercial](https://img.shields.io/badge/License-Non--Commercial-red.svg?style=flat-square)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/susobhandash/FinTrackExpo/build-debug-apk.yml?branch=main&style=flat-square)](https://github.com/susobhandash/FinTrackExpo/actions)

---

## Download

Grab the latest APK from the [Releases page](https://github.com/susobhandash/FinTrackExpo/releases/latest) and sideload it on your Android device.

> The APK is debug-signed. You may need to enable **"Install from unknown sources"** in your Android settings.

---

## Features

- Track expenses and income with categories
- Weekly spending overview with an animated bar chart
- Swipeable transaction cards
- Fully offline — all data stored locally with SQLite, no account required
- Dark and light mode support

---

## Screenshots

<!-- Add screenshots here -->

---

## Build from Source

**Prerequisites:** Node.js 20+, JDK 17, Android SDK

```bash
# Install dependencies
npm install

# Generate Android project
npx expo prebuild --platform android

# Build debug APK
cd android && ./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)
