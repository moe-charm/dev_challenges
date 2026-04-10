import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
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

  final webview_win.WebviewController _controller =
      webview_win.WebviewController();

  HttpServer? _server;
  Directory? _challengeDirectory;
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
      final challengeDirectory = await _findChallengeDirectory();
      if (challengeDirectory == null) {
        throw StateError(
          'Could not find the $_challengeFolderName folder. '
          'Place the Flutter app next to the HTML challenge folder or '
          'adjust _findChallengeDirectory().',
        );
      }

      _challengeDirectory = challengeDirectory;
      _server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
      _server!.listen((request) {
        unawaited(_serveRequest(challengeDirectory, request));
      });

      _localUrl = 'http://${_server!.address.host}:${_server!.port}/index.html';

      await _controller.initialize();
      await _controller.setBackgroundColor(Colors.black);
      await _controller.setPopupWindowPolicy(webview_win.WebviewPopupWindowPolicy.deny);
      await _controller.loadUrl(_localUrl!);

      if (!mounted) return;
      setState(() => _isLoading = false);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<Directory?> _findChallengeDirectory() async {
    final candidates = <Directory>[
      Directory.current,
      File(Platform.resolvedExecutable).parent,
    ];

    for (final start in candidates) {
      var current = start;
      for (var depth = 0; depth < 8; depth++) {
        final candidate = Directory(
          '${current.path}${Platform.pathSeparator}$_challengeFolderName',
        );
        if (File('${candidate.path}${Platform.pathSeparator}index.html').existsSync()) {
          return candidate;
        }

        final parent = current.parent;
        if (parent.path == current.path) {
          break;
        }
        current = parent;
      }
    }

    return null;
  }

  Future<void> _serveRequest(Directory root, HttpRequest request) async {
    try {
      if (request.method != 'GET' && request.method != 'HEAD') {
        request.response.statusCode = HttpStatus.methodNotAllowed;
        request.response.headers.contentType = ContentType.text;
        request.response.write('Method not allowed');
        await request.response.close();
        return;
      }

      final file = _resolveRequestedFile(root, request.uri.path);
      if (file == null || !file.existsSync()) {
        request.response.statusCode = HttpStatus.notFound;
        request.response.headers.contentType = ContentType.text;
        request.response.write('File not found');
        await request.response.close();
        return;
      }

      request.response.headers.contentType = _contentTypeFor(file.path);
      request.response.headers.set(HttpHeaders.cacheControlHeader, 'no-cache');

      if (request.method == 'HEAD') {
        await request.response.close();
        return;
      }

      await request.response.addStream(file.openRead());
      await request.response.close();
    } catch (error) {
      request.response.statusCode = HttpStatus.internalServerError;
      request.response.headers.contentType = ContentType.text;
      request.response.write('Internal server error: $error');
      await request.response.close();
    }
  }

  File? _resolveRequestedFile(Directory root, String requestPath) {
    final normalizedPath = requestPath.isEmpty || requestPath == '/'
        ? '/index.html'
        : requestPath;
    final cleanPath = normalizedPath.endsWith('/')
        ? '${normalizedPath}index.html'
        : normalizedPath;

    final segments = cleanPath
        .split('/')
        .where((segment) => segment.isNotEmpty)
        .toList(growable: false);

    if (segments.any((segment) => segment == '.' || segment == '..')) {
      return null;
    }

    final absolutePath = <String>[root.path, ...segments].join(Platform.pathSeparator);
    final candidate = File(absolutePath);
    if (candidate.existsSync()) {
      return candidate;
    }

    return null;
  }

  ContentType _contentTypeFor(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.html')) return ContentType.html;
    if (lower.endsWith('.css')) {
      return ContentType('text', 'css', charset: 'utf-8');
    }
    if (lower.endsWith('.js')) {
      return ContentType('application', 'javascript', charset: 'utf-8');
    }
    if (lower.endsWith('.json')) {
      return ContentType('application', 'json', charset: 'utf-8');
    }
    if (lower.endsWith('.svg')) {
      return ContentType('image', 'svg+xml');
    }
    if (lower.endsWith('.png')) {
      return ContentType('image', 'png');
    }
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return ContentType('image', 'jpeg');
    }
    if (lower.endsWith('.ico')) {
      return ContentType('image', 'x-icon');
    }
    if (lower.endsWith('.mp3')) {
      return ContentType('audio', 'mpeg');
    }
    if (lower.endsWith('.wav')) {
      return ContentType('audio', 'wav');
    }
    return ContentType.binary;
  }

  @override
  void dispose() {
    unawaited(_controller.dispose());
    unawaited(_server?.close(force: true));
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
                if (_challengeDirectory != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    'HTML folder: ${_challengeDirectory!.path}',
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
