import 'package:flutter/material.dart';
import 'pages/login_page.dart';
import 'pages/dashboard_page.dart';
import 'pages/instructor_dashboard_page.dart';
import 'pages/instructor_students_page.dart';
import 'pages/instructor_schedules_page.dart';
import 'pages/instructor_profile_page.dart';
import 'pages/instructor_reports_page.dart';
import 'pages/instructor_settings_page.dart';
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
      if (isLoggedIn) {
        // Kullanıcı bilgilerini al
        final userProfile = await ApiService.getSavedUserProfile();
        final role = userProfile?['role'] ?? 'Student';
        
        setState(() {
          if (role == 'Instructor') {
            _initialPage = const InstructorDashboardPage();
          } else {
            _initialPage = const DashboardPage();
          }
        });
      } else {
        setState(() {
          _initialPage = const LoginPage();
        });
      }
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
        '/instructor-dashboard': (context) => const InstructorDashboardPage(),
        '/instructor-students': (context) => const InstructorStudentsPage(),
        '/instructor-schedules': (context) => const InstructorSchedulesPage(),
        '/instructor-profile': (context) => const InstructorProfilePage(),
        '/instructor-reports': (context) => const InstructorReportsPage(),
        '/instructor-settings': (context) => const InstructorSettingsPage(),
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


