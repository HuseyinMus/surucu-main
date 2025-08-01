import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InstructorSettingsPage extends StatefulWidget {
  const InstructorSettingsPage({super.key});

  @override
  State<InstructorSettingsPage> createState() => _InstructorSettingsPageState();
}

class _InstructorSettingsPageState extends State<InstructorSettingsPage> {
  bool notificationsEnabled = true;
  bool emailNotifications = true;
  bool smsNotifications = false;
  bool autoAcceptBookings = false;
  String selectedLanguage = 'Türkçe';
  String selectedTheme = 'Sistem';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Ayarlar'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bildirim ayarları
            _buildSectionHeader('Bildirim Ayarları', Icons.notifications),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Bildirimler'),
                    subtitle: const Text('Uygulama bildirimlerini aç/kapat'),
                    value: notificationsEnabled,
                    onChanged: (value) {
                      setState(() {
                        notificationsEnabled = value;
                      });
                    },
                    secondary: Icon(
                      Icons.notifications,
                      color: notificationsEnabled ? Colors.green[600] : Colors.grey,
                    ),
                  ),
                  SwitchListTile(
                    title: const Text('E-posta Bildirimleri'),
                    subtitle: const Text('E-posta ile bildirim al'),
                    value: emailNotifications,
                    onChanged: notificationsEnabled ? (value) {
                      setState(() {
                        emailNotifications = value;
                      });
                    } : null,
                    secondary: Icon(
                      Icons.email,
                      color: emailNotifications ? Colors.blue[600] : Colors.grey,
                    ),
                  ),
                  SwitchListTile(
                    title: const Text('SMS Bildirimleri'),
                    subtitle: const Text('SMS ile bildirim al'),
                    value: smsNotifications,
                    onChanged: notificationsEnabled ? (value) {
                      setState(() {
                        smsNotifications = value;
                      });
                    } : null,
                    secondary: Icon(
                      Icons.sms,
                      color: smsNotifications ? Colors.orange[600] : Colors.grey,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Randevu ayarları
            _buildSectionHeader('Randevu Ayarları', Icons.calendar_today),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Otomatik Randevu Kabul'),
                    subtitle: const Text('Öğrenci randevularını otomatik kabul et'),
                    value: autoAcceptBookings,
                    onChanged: (value) {
                      setState(() {
                        autoAcceptBookings = value;
                      });
                    },
                    secondary: Icon(
                      Icons.auto_awesome,
                      color: autoAcceptBookings ? Colors.green[600] : Colors.grey,
                    ),
                  ),
                  ListTile(
                    title: const Text('Çalışma Saatleri'),
                    subtitle: const Text('Müsait olduğunuz saatleri ayarlayın'),
                    leading: Icon(Icons.access_time, color: Colors.blue[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      // Çalışma saatleri ayarlama sayfasına yönlendir
                    },
                  ),
                  ListTile(
                    title: const Text('Mola Süreleri'),
                    subtitle: const Text('Dersler arası mola sürelerini ayarlayın'),
                    leading: Icon(Icons.coffee, color: Colors.orange[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      // Mola süreleri ayarlama sayfasına yönlendir
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Uygulama ayarları
            _buildSectionHeader('Uygulama Ayarları', Icons.settings),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  ListTile(
                    title: const Text('Dil'),
                    subtitle: Text(selectedLanguage),
                    leading: Icon(Icons.language, color: Colors.green[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      _showLanguageDialog();
                    },
                  ),
                  ListTile(
                    title: const Text('Tema'),
                    subtitle: Text(selectedTheme),
                    leading: Icon(Icons.palette, color: Colors.purple[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      _showThemeDialog();
                    },
                  ),
                  ListTile(
                    title: const Text('Hakkında'),
                    subtitle: const Text('Uygulama bilgileri'),
                    leading: Icon(Icons.info, color: Colors.blue[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      _showAboutDialog();
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Hesap işlemleri
            _buildSectionHeader('Hesap İşlemleri', Icons.account_circle),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  ListTile(
                    title: const Text('Şifre Değiştir'),
                    subtitle: const Text('Hesap şifrenizi güncelleyin'),
                    leading: Icon(Icons.lock, color: Colors.orange[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      _showChangePasswordDialog();
                    },
                  ),
                  ListTile(
                    title: const Text('Hesap Gizliliği'),
                    subtitle: const Text('Gizlilik ayarlarınızı yönetin'),
                    leading: Icon(Icons.privacy_tip, color: Colors.red[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      // Gizlilik ayarları sayfasına yönlendir
                    },
                  ),
                  ListTile(
                    title: const Text('Veri Yedekleme'),
                    subtitle: const Text('Verilerinizi yedekleyin veya geri yükleyin'),
                    leading: Icon(Icons.backup, color: Colors.indigo[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      // Veri yedekleme sayfasına yönlendir
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Tehlikeli işlemler
            _buildSectionHeader('Tehlikeli İşlemler', Icons.warning),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  ListTile(
                    title: const Text('Hesabı Sil'),
                    subtitle: const Text('Hesabınızı kalıcı olarak silin'),
                    leading: Icon(Icons.delete_forever, color: Colors.red[600]),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      _showDeleteAccountDialog();
                    },
                  ),
                  ListTile(
                    title: const Text('Çıkış Yap'),
                    subtitle: const Text('Hesabınızdan çıkış yapın'),
                    leading: Icon(Icons.logout, color: Colors.grey[600]),
                    onTap: () {
                      _showLogoutDialog();
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: Colors.green[600], size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
      ],
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Dil Seçin'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('Türkçe'),
              value: 'Türkçe',
              groupValue: selectedLanguage,
              onChanged: (value) {
                setState(() {
                  selectedLanguage = value!;
                });
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('English'),
              value: 'English',
              groupValue: selectedLanguage,
              onChanged: (value) {
                setState(() {
                  selectedLanguage = value!;
                });
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showThemeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tema Seçin'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('Sistem'),
              value: 'Sistem',
              groupValue: selectedTheme,
              onChanged: (value) {
                setState(() {
                  selectedTheme = value!;
                });
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('Açık'),
              value: 'Açık',
              groupValue: selectedTheme,
              onChanged: (value) {
                setState(() {
                  selectedTheme = value!;
                });
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('Koyu'),
              value: 'Koyu',
              groupValue: selectedTheme,
              onChanged: (value) {
                setState(() {
                  selectedTheme = value!;
                });
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hakkında'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Sürücü Kursu Uygulaması'),
            SizedBox(height: 8),
            Text('Versiyon: 1.0.0'),
            SizedBox(height: 8),
            Text('© 2024 ESEN Sürücü Kursu'),
            SizedBox(height: 8),
            Text('Tüm hakları saklıdır.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Şifre Değiştir'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Mevcut Şifre',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: newPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Yeni Şifre',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: confirmPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Yeni Şifre (Tekrar)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              // Şifre değiştirme işlemi
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Şifre değiştirme özelliği yakında eklenecek'),
                  backgroundColor: Colors.orange,
                ),
              );
            },
            child: const Text('Değiştir'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hesabı Sil'),
        content: const Text(
          'Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Devam etmek istediğinizden emin misiniz?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Hesap silme özelliği yakında eklenecek'),
                  backgroundColor: Colors.orange,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Hesabı Sil'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Çıkış Yap'),
        content: const Text('Çıkış yapmak istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Çıkış Yap'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ApiService.clearToken();
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }
} 