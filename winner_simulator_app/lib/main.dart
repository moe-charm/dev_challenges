import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_windows/webview_windows.dart' as webview_win;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const WinnerSimulatorApp());
}

class WinnerSimulatorApp extends StatelessWidget {
  const WinnerSimulatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Winner Simulator 2026',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: Colors.black,
        useMaterial3: true,
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  static const _challengeFolderName = '20260411winner';
  static const _assetRoot = 'assets/20260411winner';
  static const _virtualHost = 'winner.local';
  static const _embeddedAssetPaths = <String>[
    '$_assetRoot/index.html',
    '$_assetRoot/firework.mp3',
    '$_assetRoot/majestic-sky.mp3',
    '$_assetRoot/js/sound.js',
    '$_assetRoot/js/effects.js',
  ];

  final webview_win.WebviewController _controller =
      webview_win.WebviewController();

  Directory? _workingDirectory;
  Directory? _materializedDirectory;
  String? _localUrl;
  String? _errorMessage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    try {
      final materializedDirectory = await _materializeEmbeddedAssets();
      _materializedDirectory = materializedDirectory;

      await _controller.initialize();
      await _controller.setBackgroundColor(Colors.black);
      await _controller.setPopupWindowPolicy(
        webview_win.WebviewPopupWindowPolicy.deny,
      );
      await _controller.addVirtualHostNameMapping(
        _virtualHost,
        materializedDirectory.path,
        webview_win.WebviewHostResourceAccessKind.allow,
      );

      _localUrl = 'https://$_virtualHost/index.html';
      await _controller.loadUrl(_localUrl!);

      if (!mounted) return;
      setState(() => _isLoading = false);
    } catch (error) {
      unawaited(_workingDirectory?.delete(recursive: true));
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<Directory> _materializeEmbeddedAssets() async {
    final tempRoot = await Directory.systemTemp.createTemp('winner_simulator_');
    _workingDirectory = tempRoot;
    final outputRoot = Directory(
      '${tempRoot.path}${Platform.pathSeparator}$_challengeFolderName',
    );
    await outputRoot.create(recursive: true);

    for (final assetPath in _embeddedAssetPaths) {
      final assetData = await rootBundle.load(assetPath);
      final bytes = assetData.buffer.asUint8List(
        assetData.offsetInBytes,
        assetData.lengthInBytes,
      );
      final relativePath = assetPath.substring('$_assetRoot/'.length);
      final targetFile = File(
        '${outputRoot.path}${Platform.pathSeparator}${relativePath.replaceAll('/', Platform.pathSeparator)}',
      );
      await targetFile.parent.create(recursive: true);
      await targetFile.writeAsBytes(bytes, flush: true);
    }

    return outputRoot;
  }

  @override
  void dispose() {
    unawaited(_controller.dispose());
    unawaited(_workingDirectory?.delete(recursive: true));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Colors.amber),
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
                const SizedBox(height: 16),
                const Text(
                  'Winner Simulator failed to start',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70),
                ),
                if (_materializedDirectory != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    'HTML folder: ${_materializedDirectory!.path}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white54),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          webview_win.Webview(
            _controller,
            permissionRequested: (_, __, ___) =>
                Future.value(webview_win.WebviewPermissionDecision.allow),
          ),
        ],
      ),
    );
  }
}
