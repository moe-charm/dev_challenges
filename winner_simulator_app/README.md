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

## Release

To distribute the app, package the entire `build/windows/x64/runner/Release/` folder as a ZIP.

Published release:
[Winner Simulator 2026 (Windows)](https://github.com/moe-charm/dev_challenges/releases/tag/winner-simulator-20260411)

The ZIP should include:

- `winner_simulator_app.exe`
- `data/`
- `webview_windows_plugin.dll`
- `WebView2Loader.dll`
- any other files in the Release folder

## Runtime Notes

- The app still needs the Microsoft WebView2 Runtime installed on the target machine.
- Because the HTML challenge is embedded, there is no separate content folder to ship.

## Notes

The HTML challenge lives in `assets/20260411winner/` and is bundled with the app.
The app no longer depends on a sibling folder at runtime, so release builds can ship as a single binary bundle.
