import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  Map<String, dynamic>? dashboardData;
  Map<String, dynamic>? schoolInfo;
  Map<String, dynamic>? userProfile;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadDashboardData();
  }

  Future<void> loadDashboardData() async {
    try {
      setState(() {
        isLoading = true;
      });

      // Kullanıcı bilgilerini al
      final userProfileData = await ApiService.getSavedUserProfile();
      final studentId = userProfileData?['id']?.toString() ?? '';

      // Sürücü kursu bilgilerini al
      final schoolInfoData = await ApiService.getDrivingSchoolInfo();
      
      print('School info data: $schoolInfoData');
      if (schoolInfoData != null) {
        print('Logo URL: ${schoolInfoData['logoUrl']}');
        print('School Name: ${schoolInfoData['name']}');
        print('Full school data: $schoolInfoData');
      } else {
        print('School info data is null!');
      }

      if (studentId.isNotEmpty) {
        // Dashboard progress verilerini API'den al
        final progressData = await ApiService.getDashboardProgress(studentId);
        setState(() {
          dashboardData = progressData;
          schoolInfo = schoolInfoData;
          userProfile = userProfileData;
          isLoading = false;
        });
      } else {
        setState(() {
          schoolInfo = schoolInfoData;
          userProfile = userProfileData;
          isLoading = false;
        });
      }
    } catch (e) {
      print('Dashboard veri yükleme hatası: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  String _getUserInitials() {
    if (userProfile == null) return 'AY';
    
    final fullName = userProfile!['fullName'] ?? '';
    if (fullName.isEmpty) return 'AY';
    
    final nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      return '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase();
    } else if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    }
    
    return 'AY';
  }

  String _getUserName() {
    if (userProfile == null) return 'Ana Sayfa';
    
    final fullName = userProfile!['fullName'] ?? '';
    if (fullName.isEmpty) return 'Ana Sayfa';
    
    final nameParts = fullName.split(' ');
    return nameParts[0]; // Sadece ilk ismi göster
  }

  String _getFullLogoUrl(String logoUrl) {
    // Eğer URL zaten tam ise (http ile başlıyorsa) olduğu gibi döndür
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }
    
    // Eğer sadece path ise (örn: /uploads/logo.png), server URL'ini ekle
    if (logoUrl.startsWith('/')) {
      return '${ApiService.serverUrl}$logoUrl';
    }
    
    // Diğer durumlar için server URL'ini ekle
    return '${ApiService.serverUrl}/$logoUrl';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Hoş geldin, ${_getUserName()}'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          GestureDetector(
            onTap: () {
              Navigator.pushNamed(context, '/profile');
            },
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              child: CircleAvatar(
                backgroundColor: Colors.white.withOpacity(0.2),
                child: Text(
                  _getUserInitials(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Kurum logosu ve adı
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.blue[600]!, Colors.blue[700]!],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.blue.withOpacity(0.3),
                          spreadRadius: 2,
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        // Kurum Logosu
                        schoolInfo?['logoUrl'] != null && schoolInfo!['logoUrl'].toString().isNotEmpty
                            ? Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.network(
                                    _getFullLogoUrl(schoolInfo!['logoUrl']),
                                    fit: BoxFit.cover,
                                    loadingBuilder: (context, child, loadingProgress) {
                                      if (loadingProgress == null) return child;
                                      return Container(
                                        color: Colors.white.withOpacity(0.2),
                                        child: const Center(
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2,
                                          ),
                                        ),
                                      );
                                    },
                                    errorBuilder: (context, error, stackTrace) {
                                      print('Logo yükleme hatası: $error');
                                      print('Logo URL: ${_getFullLogoUrl(schoolInfo!['logoUrl'])}');
                                      return _buildFallbackLogo();
                                    },
                                  ),
                                ),
                              )
                            : _buildFallbackLogo(),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                schoolInfo?['name'] ?? 'ESEN SÜRÜCÜ KURSU',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                schoolInfo?['slogan'] ?? 'Güvenli sürücüler yetiştiriyoruz',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white.withOpacity(0.9),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Hoş Geldiniz!',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.white.withOpacity(0.9),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 30),
                  
                  Text(
                    'Menü',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Menü kartları
                  Expanded(
                    child: GridView.count(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      children: [
                        _buildMenuCard(
                          context,
                          icon: Icons.book,
                          title: 'Kurslar',
                          subtitle: 'Ders içeriklerini görüntüle',
                          color: Colors.blue,
                          onTap: () {
                            Navigator.pushNamed(context, '/courses');
                          },
                        ),
                        _buildMenuCard(
                          context,
                          icon: Icons.quiz,
                          title: 'Sınavlar',
                          subtitle: 'Test ve sınavlar',
                          color: Colors.green,
                          onTap: () {
                            Navigator.pushNamed(context, '/quizzes');
                          },
                        ),
                        _buildMenuCard(
                          context,
                          icon: Icons.trending_up,
                          title: 'İlerleme',
                          subtitle: 'Gelişim raporları',
                          color: Colors.purple,
                          onTap: () {
                            Navigator.pushNamed(context, '/progress');
                          },
                        ),
                        _buildMenuCard(
                          context,
                          icon: Icons.notifications,
                          title: 'Bildirimler',
                          subtitle: 'Duyuru ve mesajlar',
                          color: Colors.orange,
                          onTap: () {
                            Navigator.pushNamed(context, '/notifications');
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildFallbackLogo() {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.directions_car,
              color: Colors.white,
              size: 24,
            ),
            SizedBox(height: 2),
            Text(
              'ESEN',
              style: TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required MaterialColor color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 2,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color[100],
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 30,
                color: color[700],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
} 