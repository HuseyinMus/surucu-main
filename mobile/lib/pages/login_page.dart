import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _tcController = TextEditingController();

  @override
  void dispose() {
    _tcController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    print('Giriş denemesi - TC: ${_tcController.text}');

    // Loading göster
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      // API ile giriş yap
      final result = await ApiService.login(_tcController.text);
      
      // Loading kapat
      if (context.mounted) Navigator.pop(context);
      
      if (result != null) {
        print('Giriş başarılı: $result');
        // Başarılı giriş
        if (context.mounted) {
          Navigator.of(context).pushReplacementNamed('/dashboard');
        }
      } else {
        print('Giriş başarısız - result null');
        // Hatalı giriş
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Giriş bilgileri hatalı!'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('Giriş hatası: $e');
      // API bağlantı hatası
      if (context.mounted) Navigator.pop(context);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Giriş yapılırken hata oluştu: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }





  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 80),
                
                // Logo
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.blue[600],
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.school,
                    size: 50,
                    color: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 30),
                
                Text(
                  'Sürücü Kursu',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  'TC Kimlik numaranızla giriş yapın',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
                
                const SizedBox(height: 50),
                
                // TC Kimlik No
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: TextFormField(
                    controller: _tcController,
                    keyboardType: TextInputType.number,
                    maxLength: 11,
                    decoration: InputDecoration(
                      labelText: 'TC Kimlik Numarası',
                      prefixIcon: Icon(Icons.person, color: Colors.grey[600]),
                      border: InputBorder.none,
                      counterText: '',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'TC kimlik numarası gerekli';
                      }
                      if (value.length != 11) {
                        return 'TC kimlik numarası 11 haneli olmalıdır';
                      }
                      return null;
                    },
                  ),
                ),
                
                const SizedBox(height: 40),
                
                // Giriş Yap Butonu
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Giriş Yap',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 30),
                
                // Bilgi kutusu
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue[300]!),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Hoş Geldiniz!',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'TC kimlik numaranız ile giriş yapabilirsiniz.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.blue[700],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
} 