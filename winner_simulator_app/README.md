# Winner Simulator 2026

Windows-only Flutter shell for the DEV April Fools challenge.

## What It Does

- Starts a desktop window on Windows
- Serves the HTML challenge from the sibling `20260411winner/` folder
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

If the app cannot find the HTML folder, keep `winner_simulator_app/` next to `20260411winner/` in the repository root.
