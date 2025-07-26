import 'package:flutter/material.dart';
import 'pages/login_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/courses_page.dart';
import 'pages/quizzes_page.dart';
import 'pages/progress_page.dart';
import 'pages/notifications_page.dart';
import 'pages/profile_page.dart';
import 'pages/settings_page.dart';
import 'pages/api_test_page.dart';
import 'services/api_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  Widget? _initialPage;

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  void _checkLoginStatus() async {
    try {
      final isLoggedIn = await ApiService.isLoggedIn();
      setState(() {
        _initialPage = isLoggedIn ? const DashboardPage() : const LoginPage();
      });
    } catch (e) {
      setState(() {
        _initialPage = const LoginPage();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_initialPage == null) {
      return MaterialApp(
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: Colors.blue[600]),
                const SizedBox(height: 16),
                Text(
                  'ESEN SÜRÜCÜ KURSU',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Yükleniyor...',
                  style: TextStyle(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return MaterialApp(
      title: 'Sürücü Kursu',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: _initialPage,
      routes: {
        '/dashboard': (context) => const DashboardPage(),
        '/courses': (context) => const CoursesPage(),
        '/quizzes': (context) => const QuizzesPage(),
        '/progress': (context) => const ProgressPage(),
        '/notifications': (context) => const NotificationsPage(),
        '/profile': (context) => const ProfilePage(),
        '/settings': (context) => const SettingsPage(),
        '/api-test': (context) => const ApiTestPage(),
      },
    );
  }
}


