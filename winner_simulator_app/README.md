# Winner Simulator 2026

Windows-only Flutter shell for the DEV April Fools challenge.

## What It Does

- Starts a desktop window on Windows
- Embeds the `20260411winner/` challenge into the app bundle
- Materializes the embedded files into a temp folder at launch
- Loads that page inside WebView2

## Requirements

- Windows 10 1809+
- WebView2 Runtime
- Flutter SDK

## Run

```bash
flutter pub get
flutter run -d windows
```

## Build

```bash
flutter build windows --debug
```

## Notes

The HTML challenge lives in `assets/20260411winner/` and is bundled with the app.
The app no longer depends on a sibling folder at runtime, so release builds can ship as a single binary bundle.
