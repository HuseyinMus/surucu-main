import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InstructorDashboardPage extends StatefulWidget {
  const InstructorDashboardPage({super.key});

  @override
  State<InstructorDashboardPage> createState() => _InstructorDashboardPageState();
}

class _InstructorDashboardPageState extends State<InstructorDashboardPage> {
  Map<String, dynamic>? instructorData;
  Map<String, dynamic>? schoolInfo;
  List<Map<String, dynamic>> students = [];
  List<Map<String, dynamic>> schedules = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadInstructorData();
  }

  Future<void> loadInstructorData() async {
    try {
      setState(() {
        isLoading = true;
      });

      // Eğitmen bilgilerini al
      final userProfile = await ApiService.getSavedUserProfile();
      
      // Sürücü kursu bilgilerini al
      final schoolInfoData = await ApiService.getDrivingSchoolInfo();
      
      // Öğrencileri al
      final studentsData = await ApiService.getMyStudents();
      
      // Randevuları al
      final schedulesData = await ApiService.getMySchedules();

      setState(() {
        instructorData = userProfile;
        schoolInfo = schoolInfoData;
        students = studentsData?['students']?.cast<Map<String, dynamic>>() ?? [];
        schedules = schedulesData?['schedules']?.cast<Map<String, dynamic>>() ?? [];
        isLoading = false;
      });
    } catch (e) {
      print('Eğitmen veri yükleme hatası: $e');
      setState(() {
        isLoading = false;
      });
    }
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

  String _getUserName() {
    if (instructorData == null) return 'Eğitmen';
    
    final fullName = instructorData!['fullName'] ?? '';
    if (fullName.isEmpty) return 'Eğitmen';
    
    final nameParts = fullName.split(' ');
    return nameParts[0]; // Sadece ilk ismi göster
  }

  String _getFullLogoUrl(String logoUrl) {
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }
    
    if (logoUrl.startsWith('/')) {
      return '${ApiService.serverUrl}$logoUrl';
    }
    
    return '${ApiService.serverUrl}/$logoUrl';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Hoş geldin, ${_getUserName()}'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          GestureDetector(
            onTap: () {
              Navigator.pushNamed(context, '/instructor-profile');
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
          : RefreshIndicator(
              onRefresh: loadInstructorData,
              child: SingleChildScrollView(
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
                          colors: [Colors.green[600]!, Colors.green[700]!],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.green.withOpacity(0.3),
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
                                  instructorData?['specialization'] ?? 'Eğitmen',
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
                                    'Eğitmen Paneli',
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
                    
                    // İstatistikler
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Öğrenciler',
                            students.length.toString(),
                            Icons.people,
                            Colors.blue,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildStatCard(
                            'Randevular',
                            schedules.length.toString(),
                            Icons.calendar_today,
                            Colors.orange,
                          ),
                        ),
                      ],
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
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      children: [
                        _buildMenuCard(
                          context,
                          icon: Icons.people,
                          title: 'Öğrencilerim',
                          subtitle: 'Öğrenci listesi ve detayları',
                          color: Colors.blue,
                          onTap: () {
                            Navigator.pushNamed(context, '/instructor-students');
                          },
                        ),
                        _buildMenuCard(
                          context,
                          icon: Icons.calendar_today,
                          title: 'Randevularım',
                          subtitle: 'Ders programı ve randevular',
                          color: Colors.green,
                          onTap: () {
                            Navigator.pushNamed(context, '/instructor-schedules');
                          },
                        ),
                        _buildMenuCard(
                          context,
                          icon: Icons.assessment,
                          title: 'Raporlar',
                          subtitle: 'Öğrenci ilerleme raporları',
                          color: Colors.purple,
                          onTap: () {
                            Navigator.pushNamed(context, '/instructor-reports');
                          },
                        ),
                        _buildMenuCard(
                          context,
                          icon: Icons.settings,
                          title: 'Ayarlar',
                          subtitle: 'Profil ve uygulama ayarları',
                          color: Colors.grey,
                          onTap: () {
                            Navigator.pushNamed(context, '/instructor-settings');
                          },
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 30),
                    
                    // Yaklaşan randevular
                    if (schedules.isNotEmpty) ...[
                      Text(
                        'Yaklaşan Randevular',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      ...schedules.take(3).map((schedule) => _buildScheduleCard(schedule)),
                    ],
                  ],
                ),
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
              Icons.school,
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

  Widget _buildStatCard(String title, String value, IconData icon, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(20),
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
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color[100],
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 24,
              color: color[700],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
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

  Widget _buildScheduleCard(Map<String, dynamic> schedule) {
    final scheduledDate = DateTime.parse(schedule['scheduledDate']);
    final isToday = scheduledDate.day == DateTime.now().day;
    final isTomorrow = scheduledDate.day == DateTime.now().add(const Duration(days: 1)).day;
    
    String dateText = '';
    if (isToday) {
      dateText = 'Bugün';
    } else if (isTomorrow) {
      dateText = 'Yarın';
    } else {
      dateText = '${scheduledDate.day}/${scheduledDate.month}';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.calendar_today,
              color: Colors.green[700],
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  schedule['student']['fullName'] ?? 'Öğrenci',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${dateText} ${scheduledDate.hour.toString().padLeft(2, '0')}:${scheduledDate.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  schedule['lessonType'] ?? 'Ders',
                  style: TextStyle(
                    color: Colors.green[700],
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
} 