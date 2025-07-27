import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // IP adresini bilgisayarınızın IP'si ile değiştirin
  // Android Emulator için: 10.0.2.2
  // Gerçek cihaz için: bilgisayarınızın IP'si (örn: 192.168.1.100)
  static const String baseUrl = 'http://10.0.2.2:5068/api';
  static const String serverUrl = 'http://10.0.2.2:5068'; // Video dosyaları için
  
  // HTTP Headers
  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Token ile birlikte headers
  static Future<Map<String, String>> get _authenticatedHeaders async {
    final token = await getToken();
    return {
      ..._headers,
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Token kaydetme
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  // Kullanıcı bilgilerini kaydetme
  static Future<void> saveUserProfile(Map<String, dynamic> userProfile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_profile', jsonEncode(userProfile));
  }

  // Kullanıcı bilgilerini okuma
  static Future<Map<String, dynamic>?> getSavedUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final profileJson = prefs.getString('user_profile');
    if (profileJson != null) {
      return jsonDecode(profileJson);
    }
    return null;
  }

  // Token okuma
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Token silme
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_profile'); // Profil bilgilerini de temizle
  }

  // LOGIN
  static Future<Map<String, dynamic>?> login(String tc) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login-tc'), // Gerçek endpoint'i kullan
        headers: _headers,
        body: jsonEncode({
          'TcNumber': tc, // TC numarası ile login
        }),
      );

      print('Login API response status: ${response.statusCode}');
      print('Login API response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          await saveToken(data['token']);
          
          // Kullanıcı bilgilerini de kaydet
          final userProfile = {
            'id': data['userId'],
            'fullName': data['fullName'],
            'email': data['email'],
            'role': data['role'],
            'drivingSchoolId': data['drivingSchoolId'],
            'tcNumber': tc, // TC'yi de ekle
            'createdAt': DateTime.now().toIso8601String(), // Şimdilik
          };
          await saveUserProfile(userProfile);
        }
        return data;
      } else {
        print('Login failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Login hatası: $e');
      return null;
    }
  }

  // TEST KULLANICI OLUŞTUR
  static Future<Map<String, dynamic>?> createTestUser() async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/create-test-user'),
        headers: _headers,
      );

      print('Create test user API response status: ${response.statusCode}');
      print('Create test user API response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        print('Create test user failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Create test user hatası: $e');
      return null;
    }
  }

  // TEST API BAĞLANTISI
  static Future<Map<String, dynamic>?> testApiConnection() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/test'),
        headers: _headers,
      );

      print('Test API response status: ${response.statusCode}');
      print('Test API response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        print('Test API failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Test API hatası: $e');
      return null;
    }
  }

  // DEBUG: KULLANICILARI LİSTELE
  static Future<Map<String, dynamic>?> debugUsers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/debug-users'),
        headers: _headers,
      );

      print('Debug users API response status: ${response.statusCode}');
      print('Debug users API response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        print('Debug users failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Debug users hatası: $e');
      return null;
    }
  }

  // ÖĞRENCİ TC NUMARALARINI DÜZELT
  static Future<Map<String, dynamic>?> fixStudentTc() async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/students/fix-student-tc'),
        headers: _headers,
      );

      print('Fix student TC API response status: ${response.statusCode}');
      print('Fix student TC API response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        print('Fix student TC failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Fix student TC hatası: $e');
      return null;
    }
  }

  // LOGOUT
  static Future<bool> logout() async {
    try {
      await clearToken();
      return true;
    } catch (e) {
      print('Logout hatası: $e');
      return false;
    }
  }

  // KURSLAR
  static Future<List<Map<String, dynamic>>?> getCourses() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/courses'), // Asıl endpoint'i kullan
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      print('Courses API response status: ${response.statusCode}');
      print('Courses API response body: ${response.body}');
      return null;
    } catch (e) {
      print('Kurs getirme hatası: $e');
      return null;
    }
  }

  // KURS DETAYI
  static Future<Map<String, dynamic>?> getCourseDetail(dynamic courseId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/courses/$courseId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      print('Course detail API response status: ${response.statusCode}');
      print('Course detail API response body: ${response.body}');
      return null;
    } catch (e) {
      print('Kurs detay hatası: $e');
      return null;
    }
  }

  // QUIZLER
  static Future<List<Map<String, dynamic>>?> getQuizzes() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/quizzes'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      return null;
    } catch (e) {
      print('Quiz getirme hatası: $e');
      return null;
    }
  }

  // QUIZ DETAYI
  static Future<Map<String, dynamic>?> getQuizDetail(int quizId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/quizzes/$quizId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Quiz detay hatası: $e');
      return null;
    }
  }

  // QUIZ BAŞLAT
  static Future<Map<String, dynamic>?> startQuiz(int quizId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/quizzes/$quizId/start'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Quiz başlatma hatası: $e');
      return null;
    }
  }

  // QUIZ TAMAMLA
  static Future<Map<String, dynamic>?> submitQuiz(int quizId, List<Map<String, dynamic>> answers) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/quizzes/$quizId/submit'),
        headers: headers,
        body: jsonEncode({
          'answers': answers,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Quiz gönderme hatası: $e');
      return null;
    }
  }

  // ÖĞRENCİ PROGRESS
  static Future<Map<String, dynamic>?> getStudentProgress(String studentId, String courseId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/progress/summary/$studentId/$courseId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Progress getirme hatası: $e');
      return null;
    }
  }

  // BİLDİRİMLER
  static Future<List<Map<String, dynamic>>?> getNotifications() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/notifications/student'),
        headers: headers,
      );

      print('Notifications API response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        print('Notifications API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Bildirim getirme hatası: $e');
      return null;
    }
  }

  // BİLDİRİM OKUNDU OLARAK İŞARETLE
  static Future<bool> markNotificationAsRead(int notificationId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.patch(
        Uri.parse('$baseUrl/notifications/$notificationId/read'),
        headers: headers,
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Bildirim güncelleme hatası: $e');
      return false;
    }
  }

  // USER PROFİL
  static Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      // Önce kaydedilmiş profil bilgilerini kontrol et
      final savedProfile = await getSavedUserProfile();
      if (savedProfile != null) {
        print('Kaydedilmiş profil bilgileri kullanılıyor: ${savedProfile['fullName']}');
        return savedProfile;
      }

      final token = await getToken();
      if (token == null) {
        print('Token bulunamadı');
        return null;
      }

      print('Profil için token: ${token.substring(0, 20)}...');
      
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/auth/profile'),
        headers: headers,
      );

      print('Profile API response status: ${response.statusCode}');
      print('Profile API response body: ${response.body}');

      if (response.statusCode == 200) {
        final profile = jsonDecode(response.body);
        await saveUserProfile(profile); // Başarılı response'u kaydet
        return profile;
      } else {
        print('Profile API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Profil getirme hatası: $e');
      
      // Hata olursa kaydedilmiş profili dene
      final savedProfile = await getSavedUserProfile();
      if (savedProfile != null) {
        return savedProfile;
      }
      
      return null;
    }
  }

  // TOKEN CONTROL
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  // API TEST
  static Future<bool> testConnection() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: _headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      print('API bağlantı testi hatası: $e');
      return false;
    }
  }

  // HEALTH CHECK WITH DATABASE
  static Future<Map<String, dynamic>?> healthCheck() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Health check hatası: $e');
      return null;
    }
  }

  // Video/media URL'ini tam URL'ye çevir
  static String getFullMediaUrl(String? relativeUrl) {
    if (relativeUrl == null || relativeUrl.isEmpty) return '';
    
    if (relativeUrl.startsWith('http')) {
      // Zaten tam URL
      return relativeUrl;
    } else if (relativeUrl.startsWith('/')) {
      // Relative path, server URL'i ekle
      return '$serverUrl$relativeUrl';
    } else {
      // Belirsiz format, uploads klasörü varsay
      return '$serverUrl/uploads/$relativeUrl';
    }
  }

  // PROGRESS API FONKSİYONLARI

  // Öğrenci genel progress özeti
  static Future<Map<String, dynamic>?> getStudentProgressSummary(String studentId, String courseId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/progress/summary/$studentId/$courseId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      print('Progress summary API response status: ${response.statusCode}');
      print('Progress summary API response body: ${response.body}');
      return null;
    } catch (e) {
      print('Progress summary hatası: $e');
      return null;
    }
  }

  // Kurs progress detayı
  static Future<List<Map<String, dynamic>>?> getCourseProgress(String studentId, String courseId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/progress/lessons/$studentId/$courseId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      print('Course progress API response status: ${response.statusCode}');
      return null;
    } catch (e) {
      print('Course progress hatası: $e');
      return null;
    }
  }

  // Quiz progress bilgisi
  static Future<Map<String, dynamic>?> getQuizProgress(String studentId, String quizId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/progress/quiz/$studentId/$quizId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      print('Quiz progress API response status: ${response.statusCode}');
      return null;
    } catch (e) {
      print('Quiz progress hatası: $e');
      return null;
    }
  }

  // Dashboard progress özeti
  static Future<Map<String, dynamic>?> getDashboardProgress(String studentId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/progress/analytics/$studentId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      print('Dashboard progress API response status: ${response.statusCode}');
      return null;
    } catch (e) {
      print('Dashboard progress hatası: $e');
      return null;
    }
  }

  // Ders tamamlama
  static Future<bool> completeLesson(String studentId, String courseContentId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/progress/complete-lesson'),
        headers: headers,
        body: jsonEncode({
          'studentId': studentId,
          'courseContentId': courseContentId,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Ders tamamlama hatası: $e');
      return false;
    }
  }

  // Quiz sonucu kaydetme
  static Future<bool> submitQuizResult(String studentId, String quizId, int score) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/progress/quiz-result'),
        headers: headers,
        body: jsonEncode({
          'studentId': studentId,
          'quizId': quizId,
          'score': score,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Quiz sonucu kaydetme hatası: $e');
      return false;
    }
  }

  // Progress güncelleme
  static Future<bool> updateProgress(String studentId, String courseContentId, int progress, int timeSpent) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/progress/update'),
        headers: headers,
        body: jsonEncode({
          'studentId': studentId,
          'courseContentId': courseContentId,
          'progress': progress,
          'timeSpent': timeSpent,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Progress güncelleme hatası: $e');
      return false;
    }
  }

  // Genel progress yüzdesi
  static Future<double?> getOverallProgress(String studentId, String courseId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/progress/overall-progress/$studentId/$courseId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return double.tryParse(response.body);
      }
      print('Overall progress API response status: ${response.statusCode}');
      return null;
    } catch (e) {
      print('Overall progress hatası: $e');
      return null;
    }
  }

  // Quiz sorularını getir
  static Future<List<Map<String, dynamic>>?> getQuizQuestions(String quizId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/quizzes/$quizId/questions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      print('Quiz questions API response status: ${response.statusCode}');
      print('Quiz questions API response body: ${response.body}');
      return null;
    } catch (e) {
      print('Quiz questions hatası: $e');
      return null;
    }
  }

  // SÜRÜCÜ KURSU BİLGİLERİ
  static Future<Map<String, dynamic>?> getDrivingSchoolInfo() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/drivingschools/student'),
        headers: headers,
      );

      print('Driving school API response status: ${response.statusCode}');
      print('Driving school API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('Parsed driving school data: $data');
        return data;
      } else {
        print('Driving school API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Driving school bilgileri hatası: $e');
      return null;
    }
  }
} 