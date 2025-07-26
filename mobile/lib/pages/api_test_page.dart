import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ApiTestPage extends StatefulWidget {
  const ApiTestPage({super.key});

  @override
  State<ApiTestPage> createState() => _ApiTestPageState();
}

class _ApiTestPageState extends State<ApiTestPage> {
  String _status = 'Henüz test edilmedi';
  bool _isLoading = false;

  void _testApiConnection() async {
    setState(() {
      _isLoading = true;
      _status = 'Test ediliyor...';
    });

    try {
      final healthData = await ApiService.healthCheck();
      if (healthData != null) {
        setState(() {
          _status = 'Bağlantı başarılı!\n'
                   'Durum: ${healthData['status']}\n'
                   'Mesaj: ${healthData['message']}\n'
                   'Zaman: ${healthData['timestamp']}';
          _isLoading = false;
        });
      } else {
        setState(() {
          _status = 'Bağlantı başarısız!';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _status = 'Hata: $e';
        _isLoading = false;
      });
    }
  }

  void _testLogin() async {
    setState(() {
      _isLoading = true;
      _status = 'Login test ediliyor...';
    });

    try {
      final result = await ApiService.login('12345678901');
      setState(() {
        _status = result != null ? 'Login başarılı!' : 'Login başarısız!';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _status = 'Login hatası: $e';
        _isLoading = false;
      });
    }
  }

  void _testCourses() async {
    setState(() {
      _isLoading = true;
      _status = 'Kurslar test ediliyor...';
    });

    try {
      final courses = await ApiService.getCourses();
      setState(() {
        _status = courses != null 
            ? 'Kurslar getirildi! (${courses.length} kurs)'
            : 'Kurslar getirilemedi!';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _status = 'Kurs hatası: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('API Test'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Backend URL:',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ApiService.baseUrl,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 30),
            
            Text(
              'Durum:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: _isLoading
                  ? Row(
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.blue[600],
                            strokeWidth: 2,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(_status),
                      ],
                    )
                  : Text(_status),
            ),
            
            const SizedBox(height: 30),
            
            ElevatedButton(
              onPressed: _isLoading ? null : _testApiConnection,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('API Bağlantısını Test Et'),
            ),
            
            const SizedBox(height: 12),
            
            ElevatedButton(
              onPressed: _isLoading ? null : _testLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Login Test Et'),
            ),
            
            const SizedBox(height: 12),
            
            ElevatedButton(
              onPressed: _isLoading ? null : _testCourses,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Kurslar Test Et'),
            ),
            
            const SizedBox(height: 30),
            
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue[600], size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Bilgi',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Backend çalışmıyorsa uygulama mock data ile çalışmaya devam eder.',
                    style: TextStyle(
                      color: Colors.blue[700],
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
} 