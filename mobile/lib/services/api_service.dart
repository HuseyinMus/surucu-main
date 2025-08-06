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

  // Token yenileme
  static Future<bool> refreshToken() async {
    try {
      final userProfile = await getSavedUserProfile();
      if (userProfile == null) return false;
      
      final tc = userProfile['tcNumber'];
      if (tc == null) return false;
      
      print('Token yenileniyor - TC: $tc');
      final result = await login(tc);
      if (result != null) {
        print('Token başarıyla yenilendi');
        return true;
      }
      print('Token yenileme başarısız');
      return false;
    } catch (e) {
      print('Token yenileme hatası: $e');
      return false;
    }
  }

  // API isteği yapma (token kontrolü ile)
  static Future<http.Response> makeAuthenticatedRequest(
    String method, 
    String endpoint, 
    {Map<String, dynamic>? body}
  ) async {
    final headers = await _authenticatedHeaders;
    final uri = Uri.parse('$baseUrl$endpoint');
    
    print('API isteği: $method $endpoint');
    print('Headers: ${headers.keys}');
    
    http.Response response;
    
    try {
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: headers);
          break;
        case 'POST':
          response = await http.post(uri, headers: headers, body: jsonEncode(body));
          break;
        case 'PUT':
          response = await http.put(uri, headers: headers, body: jsonEncode(body));
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: headers);
          break;
        default:
          throw Exception('Geçersiz HTTP metodu: $method');
      }
      
      print('API yanıtı: ${response.statusCode}');
      
      // 401 hatası alırsak token yenilemeyi dene
      if (response.statusCode == 401) {
        print('401 hatası alındı, token yenileniyor...');
        final refreshed = await refreshToken();
        if (refreshed) {
          print('Token yenilendi, istek tekrar deneniyor...');
          // Token yenilendiyse isteği tekrar dene
          final newHeaders = await _authenticatedHeaders;
          switch (method.toUpperCase()) {
            case 'GET':
              response = await http.get(uri, headers: newHeaders);
              break;
            case 'POST':
              response = await http.post(uri, headers: newHeaders, body: jsonEncode(body));
              break;
            case 'PUT':
              response = await http.put(uri, headers: newHeaders, body: jsonEncode(body));
              break;
            case 'DELETE':
              response = await http.delete(uri, headers: newHeaders);
              break;
          }
          print('Yeniden denenen istek yanıtı: ${response.statusCode}');
        } else {
          print('Token yenilenemedi, kullanıcı çıkış yapılmalı');
          await clearToken(); // Token'ı temizle
        }
      }
      
      return response;
    } catch (e) {
      print('API isteği hatası: $e');
      rethrow;
    }
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
      print('Login denemesi - TC: $tc');
      print('Login URL: $baseUrl/auth/login-tc');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login-tc'),
        headers: _headers,
        body: jsonEncode({
          'TcNumber': tc,
        }),
      );

      print('Login API response status: ${response.statusCode}');
      print('Login API response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          print('Token alındı, kaydediliyor...');
          await saveToken(data['token']);
          
          // Kullanıcı bilgilerini de kaydet
          final userProfile = {
            'id': data['userId'],
            'fullName': data['fullName'],
            'email': data['email'],
            'role': data['role'],
            'drivingSchoolId': data['drivingSchoolId'],
            'tcNumber': tc,
            'createdAt': DateTime.now().toIso8601String(),
          };
          await saveUserProfile(userProfile);
          print('Kullanıcı profili kaydedildi: ${userProfile['fullName']}');
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
      final response = await makeAuthenticatedRequest('GET', '/courses');

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
      final response = await makeAuthenticatedRequest('GET', '/courses/$courseId');

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
      final response = await makeAuthenticatedRequest('GET', '/quizzes');

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

  // QUIZ SORULARINI GETİR
  static Future<List<Map<String, dynamic>>?> getQuizQuestions(String quizId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/quizzes/$quizId/questions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) {
          return List<Map<String, dynamic>>.from(data);
        }
        return [];
      }
      print('Quiz questions API response status: ${response.statusCode}');
      return null;
    } catch (e) {
      print('Quiz questions hatası: $e');
      return null;
    }
  }

  // ÖĞRENCİ PROGRESS
  static Future<Map<String, dynamic>?> getStudentProgress(String studentId, String courseId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/studentprogress/course/$studentId/$courseId'),
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
      print('API bağlantı testi başlatılıyor...');
      print('Test URL: $baseUrl/health');
      
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: _headers,
      );
      
      print('API test yanıtı: ${response.statusCode}');
      print('API test body: ${response.body}');
      
      return response.statusCode == 200;
    } catch (e) {
      print('API bağlantı testi hatası: $e');
      return false;
    }
  }

  // HEALTH CHECK WITH DATABASE
  static Future<Map<String, dynamic>?> healthCheck() async {
    try {
      print('Health check başlatılıyor...');
      print('Health check URL: $baseUrl/health');
      
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: _headers,
      );
      
      print('Health check yanıtı: ${response.statusCode}');
      print('Health check body: ${response.body}');
      
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
        Uri.parse('$baseUrl/studentprogress/course/$studentId/$courseId'),
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
  static Future<Map<String, dynamic>?> getCourseProgress(String studentId, String courseId) async {
    try {
      final response = await makeAuthenticatedRequest('GET', '/studentprogress/course/$courseId');

      if (response.statusCode == 200) {
        // Backend tek bir obje döndürüyor, liste değil
        return jsonDecode(response.body);
      }
      print('Course progress API response status: ${response.statusCode}');
      print('Course progress API response body: ${response.body}');
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
        Uri.parse('$baseUrl/quizzes/progress/$studentId/$quizId'),
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
      final response = await makeAuthenticatedRequest('GET', '/studentprogress/dashboard');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      print('Dashboard progress API response status: ${response.statusCode}');
      print('Dashboard progress API response body: ${response.body}');
      return null;
    } catch (e) {
      print('Dashboard progress hatası: $e');
      return null;
    }
  }

  // Ders tamamlama
  static Future<bool> completeLesson(String studentId, String courseId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/studentprogress/complete-lesson'),
        headers: headers,
        body: jsonEncode({
          'courseId': courseId,
          'timeSpent': 0,
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
        Uri.parse('$baseUrl/quizzes/$quizId/submit'),
        headers: headers,
        body: jsonEncode({
          'score': score,
          'totalQuestions': 10, // Şimdilik sabit
          'correctAnswers': (score / 10).round(), // Şimdilik basit hesaplama
          'timeSpent': 0,
          'answers': [],
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Quiz sonucu kaydetme hatası: $e');
      return false;
    }
  }

  // Progress güncelleme
  static Future<bool> updateProgress(String studentId, String courseId, int progress, int timeSpent) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/studentprogress/update'),
        headers: headers,
        body: jsonEncode({
          'courseId': courseId,
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
        Uri.parse('$baseUrl/studentprogress/course/$studentId/$courseId'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Progress bilgisini hesapla
        if (data is Map<String, dynamic> && data.containsKey('progress')) {
          return double.tryParse(data['progress'].toString());
        }
        return 0.0;
      }
      print('Overall progress API response status: ${response.statusCode}');
      return null;
    } catch (e) {
      print('Overall progress hatası: $e');
      return null;
    }
  }

  // Content progress verisi
  static Future<Map<String, dynamic>?> getContentProgress(String studentId, String courseId, String contentId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/studentprogress/content/$studentId/$courseId/$contentId'),
        headers: headers,
      );

      print('Content progress API response status: ${response.statusCode}');
      print('Content progress API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      } else if (response.statusCode == 404) {
        print('Content progress bulunamadı, yeni kayıt oluşturulacak');
        return null;
      }
      return null;
    } catch (e) {
      print('Content progress hatası: $e');
      return null;
    }
  }

  // Content progress güncelleme
  static Future<Map<String, dynamic>?> updateContentProgress(String studentId, String courseId, String contentId, int progress, int timeSpent) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/studentprogress/content/$studentId/$courseId/$contentId/update'),
        headers: headers,
        body: jsonEncode({
          'progress': progress,
          'timeSpent': timeSpent,
          'isCompleted': progress >= 100,
        }),
      );

      print('Update content progress API response status: ${response.statusCode}');
      print('Update content progress API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      }
      return null;
    } catch (e) {
      print('Update content progress hatası: $e');
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

  // EĞİTMEN GİRİŞİ VE YÖNETİMİ

  // Eğitmen TC ile giriş
  static Future<Map<String, dynamic>?> loginInstructorWithTc(String tc) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login-instructor-tc'),
        headers: _headers,
        body: jsonEncode({
          'TcNumber': tc,
        }),
      );

      print('Instructor login API response status: ${response.statusCode}');
      print('Instructor login API response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          await saveToken(data['token']);
          
          // Eğitmen bilgilerini kaydet
          final instructorProfile = {
            'id': data['userId'],
            'instructorId': data['instructorId'],
            'fullName': data['fullName'],
            'email': data['email'],
            'role': data['role'],
            'drivingSchoolId': data['drivingSchoolId'],
            'specialization': data['specialization'],
            'experience': data['experience'],
            'tcNumber': tc,
            'drivingSchool': data['drivingSchool'],
            'createdAt': DateTime.now().toIso8601String(),
          };
          await saveUserProfile(instructorProfile);
        }
        return data;
      } else {
        print('Instructor login failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Instructor login hatası: $e');
      return null;
    }
  }

  // Eğitmenin öğrencilerini getir
  static Future<Map<String, dynamic>?> getMyStudents() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/instructors/my-students'),
        headers: headers,
      );

      print('My students API response status: ${response.statusCode}');
      print('My students API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('My students API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('My students hatası: $e');
      return null;
    }
  }

  // Öğrenci detaylarını getir
  static Future<Map<String, dynamic>?> getStudentDetails(String studentId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/instructors/student/$studentId'),
        headers: headers,
      );

      print('Student details API response status: ${response.statusCode}');
      print('Student details API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Student details API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Student details hatası: $e');
      return null;
    }
  }

  // Öğrenci için randevu oluştur
  static Future<Map<String, dynamic>?> scheduleStudentLesson(String studentId, Map<String, dynamic> scheduleData) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/instructors/student/$studentId/schedule'),
        headers: headers,
        body: jsonEncode(scheduleData),
      );

      print('Schedule lesson API response status: ${response.statusCode}');
      print('Schedule lesson API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Schedule lesson API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Schedule lesson hatası: $e');
      return null;
    }
  }

  // Eğitmenin randevularını getir
  static Future<Map<String, dynamic>?> getMySchedules() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/instructors/my-schedules'),
        headers: headers,
      );

      print('My schedules API response status: ${response.statusCode}');
      print('My schedules API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('My schedules API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('My schedules hatası: $e');
      return null;
    }
  }



  // ÖĞRENCİ RANDEVU YÖNETİMİ

  // Müsait eğitmenleri getir
  static Future<Map<String, dynamic>?> getAvailableInstructors() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/students/available-instructors'),
        headers: headers,
      );

      print('Available instructors API response status: ${response.statusCode}');
      print('Available instructors API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Available instructors API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Available instructors hatası: $e');
      return null;
    }
  }

  // Eğitmenin müsait saatlerini getir
  static Future<Map<String, dynamic>?> getAvailableSlots(String instructorId, DateTime date) async {
    try {
      final headers = await _authenticatedHeaders;
      final dateString = date.toIso8601String().split('T')[0]; // YYYY-MM-DD formatı
      final response = await http.get(
        Uri.parse('$baseUrl/students/available-slots/$instructorId?date=$dateString'),
        headers: headers,
      );

      print('Available slots API response status: ${response.statusCode}');
      print('Available slots API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Available slots API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Available slots hatası: $e');
      return null;
    }
  }

  // Ders randevusu al
  static Future<Map<String, dynamic>?> bookLesson(Map<String, dynamic> lessonData) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.post(
        Uri.parse('$baseUrl/students/book-lesson'),
        headers: headers,
        body: jsonEncode(lessonData),
      );

      print('Book lesson API response status: ${response.statusCode}');
      print('Book lesson API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Book lesson API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Book lesson hatası: $e');
      return null;
    }
  }

  // Öğrencinin randevularını getir
  static Future<Map<String, dynamic>?> getStudentSchedules() async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.get(
        Uri.parse('$baseUrl/students/my-schedules'),
        headers: headers,
      );

      print('Student schedules API response status: ${response.statusCode}');
      print('Student schedules API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Student schedules API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Student schedules hatası: $e');
      return null;
    }
  }

  // Randevu iptal et
  static Future<Map<String, dynamic>?> cancelSchedule(String scheduleId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.put(
        Uri.parse('$baseUrl/students/schedule/$scheduleId/cancel'),
        headers: headers,
      );

      print('Cancel schedule API response status: ${response.statusCode}');
      print('Cancel schedule API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Cancel schedule API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Cancel schedule hatası: $e');
      return null;
    }
  }

  // EĞİTMEN RANDEVU YÖNETİMİ

  // Randevu onayla
  static Future<Map<String, dynamic>?> approveSchedule(String scheduleId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.put(
        Uri.parse('$baseUrl/instructors/schedule/$scheduleId/approve'),
        headers: headers,
      );

      print('Approve schedule API response status: ${response.statusCode}');
      print('Approve schedule API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Approve schedule API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Approve schedule hatası: $e');
      return null;
    }
  }

  // Randevu reddet
  static Future<Map<String, dynamic>?> rejectSchedule(String scheduleId, String reason) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.put(
        Uri.parse('$baseUrl/instructors/schedule/$scheduleId/reject'),
        headers: headers,
        body: jsonEncode({'reason': reason}),
      );

      print('Reject schedule API response status: ${response.statusCode}');
      print('Reject schedule API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Reject schedule API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Reject schedule hatası: $e');
      return null;
    }
  }

  // Randevu tamamla
  static Future<Map<String, dynamic>?> completeSchedule(String scheduleId) async {
    try {
      final headers = await _authenticatedHeaders;
      final response = await http.put(
        Uri.parse('$baseUrl/instructors/schedule/$scheduleId/complete'),
        headers: headers,
      );

      print('Complete schedule API response status: ${response.statusCode}');
      print('Complete schedule API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Complete schedule API response error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Complete schedule hatası: $e');
      return null;
    }
  }

} 