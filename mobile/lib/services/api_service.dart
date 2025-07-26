import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.1.78:5068/api';
  static const String serverUrl = 'http://192.168.1.78:5068'; // Video dosyaları için
  
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
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: jsonEncode({
          'tcNumber': tc, // TC numarası ile login
        }),
      );

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
      }
      return null;
    } catch (e) {
      print('Login hatası: $e');
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
        Uri.parse('$baseUrl/notifications'),
        headers: headers,
      );

      print('Notifications API response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        // API yoksa mock data döndür
        print('Notifications API çalışmıyor, mock data döndürüyorum');
        return [
          {
            'id': 1,
            'title': 'Yeni Kurs Eklendi',
            'message': 'Güvenli Sürüş kursu artık mevcut. Hemen başla!',
            'type': 'course',
            'isRead': false,
            'createdAt': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
          },
          {
            'id': 2,
            'title': 'Sınav Sonucun Hazır',
            'message': 'Trafik İşaretleri sınavından 92 puan aldın. Tebrikler!',
            'type': 'quiz',
            'isRead': false,
            'createdAt': DateTime.now().subtract(const Duration(hours: 5)).toIso8601String(),
          },
          {
            'id': 3,
            'title': 'Sistem Bildirimi',
            'message': 'Uygulama başarıyla güncellendi.',
            'type': 'system',
            'isRead': true,
            'createdAt': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
          },
        ];
      }
    } catch (e) {
      print('Bildirim getirme hatası: $e');
      // Hata olursa da mock data döndür
      return [
        {
          'id': 1,
          'title': 'Yeni Kurs Eklendi',
          'message': 'Güvenli Sürüş kursu artık mevcut. Hemen başla!',
          'type': 'course',
          'isRead': false,
          'createdAt': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
        },
        {
          'id': 2,
          'title': 'Sınav Sonucun Hazır',
          'message': 'Trafik İşaretleri sınavından 92 puan aldın. Tebrikler!',
          'type': 'quiz',
          'isRead': false,
          'createdAt': DateTime.now().subtract(const Duration(hours: 5)).toIso8601String(),
        },
      ];
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
        Uri.parse('$baseUrl/users/profile'), // Gerçek endpoint deneyalim
        headers: headers,
      );

      print('Profile API response status: ${response.statusCode}');
      print('Profile API response body: ${response.body}');

      if (response.statusCode == 200) {
        final profile = jsonDecode(response.body);
        await saveUserProfile(profile); // Başarılı response'u kaydet
        return profile;
      } else {
        // API yoksa mock data döndür
        print('Profile API çalışmıyor, mock data döndürüyorum');
        return {
          'id': 'user-123',
          'fullName': 'Test Kullanıcı',
          'email': 'test@email.com',
          'role': 'Student',
          'tcNumber': '12345678901',
          'phone': '555-123-4567',
          'drivingSchoolId': 'school-123',
          'createdAt': '2024-10-15T10:30:00Z'
        };
      }
    } catch (e) {
      print('Profil getirme hatası: $e');
      
      // Hata olursa kaydedilmiş profili dene
      final savedProfile = await getSavedUserProfile();
      if (savedProfile != null) {
        return savedProfile;
      }
      
      // Son çare mock data
      return {
        'id': 'user-123',
        'fullName': 'Test Kullanıcı',
        'email': 'test@email.com',
        'role': 'Student',
        'tcNumber': '12345678901',
        'phone': '555-123-4567',
        'drivingSchoolId': 'school-123',
        'createdAt': '2024-10-15T10:30:00Z'
      };
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
} 