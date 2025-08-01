import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InstructorProfilePage extends StatefulWidget {
  const InstructorProfilePage({super.key});

  @override
  State<InstructorProfilePage> createState() => _InstructorProfilePageState();
}

class _InstructorProfilePageState extends State<InstructorProfilePage> {
  Map<String, dynamic>? instructorData;
  Map<String, dynamic>? schoolInfo;
  bool isLoading = true;
  bool isEditing = false;

  // Form controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _specializationController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadProfileData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _specializationController.dispose();
    super.dispose();
  }

  Future<void> loadProfileData() async {
    try {
      setState(() {
        isLoading = true;
      });

      final userProfile = await ApiService.getSavedUserProfile();
      final schoolInfoData = await ApiService.getDrivingSchoolInfo();

      setState(() {
        instructorData = userProfile;
        schoolInfo = schoolInfoData;
        isLoading = false;
      });

      // Form alanlarını doldur
      _nameController.text = userProfile?['fullName'] ?? '';
      _emailController.text = userProfile?['email'] ?? '';
      _phoneController.text = userProfile?['phone'] ?? '';
      _specializationController.text = userProfile?['specialization'] ?? '';
    } catch (e) {
      print('Profil veri yükleme hatası: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _saveProfile() async {
    try {
      // Profil güncelleme API'si henüz yok, şimdilik sadece UI güncellemesi yapıyoruz
      setState(() {
        isEditing = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profil güncellendi'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Hata: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _logout() async {
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
          TextButton(
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Profil'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (!isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                setState(() {
                  isEditing = true;
                });
              },
            ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profil başlığı
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.green[600]!, Colors.green[700]!],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: Text(
                            _getUserInitials(),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          instructorData?['fullName'] ?? 'Eğitmen',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          instructorData?['specialization'] ?? 'Eğitmen',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Eğitmen',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.9),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  // Sürücü kursu bilgileri
                  if (schoolInfo != null) ...[
                    Text(
                      'Sürücü Kursu',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
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
                            leading: Icon(Icons.school, color: Colors.green[600]),
                            title: Text(schoolInfo!['name'] ?? 'Sürücü Kursu'),
                            subtitle: const Text('Kurum Adı'),
                          ),
                          ListTile(
                            leading: Icon(Icons.location_on, color: Colors.green[600]),
                            title: Text(schoolInfo!['address'] ?? 'Adres bilgisi yok'),
                            subtitle: const Text('Adres'),
                          ),
                          ListTile(
                            leading: Icon(Icons.phone, color: Colors.green[600]),
                            title: Text(schoolInfo!['phone'] ?? 'Telefon bilgisi yok'),
                            subtitle: const Text('Telefon'),
                          ),
                          ListTile(
                            leading: Icon(Icons.email, color: Colors.green[600]),
                            title: Text(schoolInfo!['email'] ?? 'E-posta bilgisi yok'),
                            subtitle: const Text('E-posta'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 30),
                  ],

                  // Kişisel bilgiler
                  Text(
                    'Kişisel Bilgiler',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
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
                        if (isEditing) ...[
                          TextField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              labelText: 'Ad Soyad',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _emailController,
                            decoration: const InputDecoration(
                              labelText: 'E-posta',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _phoneController,
                            decoration: const InputDecoration(
                              labelText: 'Telefon',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _specializationController,
                            decoration: const InputDecoration(
                              labelText: 'Uzmanlık Alanı',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _saveProfile,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green[600],
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Kaydet'),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () {
                                    setState(() {
                                      isEditing = false;
                                    });
                                    loadProfileData(); // Form alanlarını sıfırla
                                  },
                                  child: const Text('İptal'),
                                ),
                              ),
                            ],
                          ),
                        ] else ...[
                          ListTile(
                            leading: Icon(Icons.person, color: Colors.green[600]),
                            title: Text(instructorData?['fullName'] ?? 'Bilgi yok'),
                            subtitle: const Text('Ad Soyad'),
                          ),
                          ListTile(
                            leading: Icon(Icons.email, color: Colors.green[600]),
                            title: Text(instructorData?['email'] ?? 'Bilgi yok'),
                            subtitle: const Text('E-posta'),
                          ),
                          ListTile(
                            leading: Icon(Icons.phone, color: Colors.green[600]),
                            title: Text(instructorData?['phone'] ?? 'Bilgi yok'),
                            subtitle: const Text('Telefon'),
                          ),
                          ListTile(
                            leading: Icon(Icons.work, color: Colors.green[600]),
                            title: Text(instructorData?['specialization'] ?? 'Bilgi yok'),
                            subtitle: const Text('Uzmanlık Alanı'),
                          ),
                          ListTile(
                            leading: Icon(Icons.star, color: Colors.green[600]),
                            title: Text('${instructorData?['experience'] ?? 0} yıl'),
                            subtitle: const Text('Deneyim'),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  // Hesap işlemleri
                  Text(
                    'Hesap İşlemleri',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 16),
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
                          leading: Icon(Icons.lock, color: Colors.orange[600]),
                          title: const Text('Şifre Değiştir'),
                          trailing: const Icon(Icons.arrow_forward_ios),
                          onTap: () {
                            // Şifre değiştirme sayfasına yönlendir
                          },
                        ),
                        ListTile(
                          leading: Icon(Icons.notifications, color: Colors.blue[600]),
                          title: const Text('Bildirim Ayarları'),
                          trailing: const Icon(Icons.arrow_forward_ios),
                          onTap: () {
                            // Bildirim ayarları sayfasına yönlendir
                          },
                        ),
                        ListTile(
                          leading: Icon(Icons.logout, color: Colors.red[600]),
                          title: const Text('Çıkış Yap'),
                          onTap: _logout,
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

  String _getUserInitials() {
    if (instructorData == null) return 'EY';
    
    final fullName = instructorData!['fullName'] ?? '';
    if (fullName.isEmpty) return 'EY';
    
    final nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      return '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase();
    } else if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    }
    
    return 'EY';
  }
} 