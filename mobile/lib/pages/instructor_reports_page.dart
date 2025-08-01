import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InstructorReportsPage extends StatefulWidget {
  const InstructorReportsPage({super.key});

  @override
  State<InstructorReportsPage> createState() => _InstructorReportsPageState();
}

class _InstructorReportsPageState extends State<InstructorReportsPage> {
  List<Map<String, dynamic>> students = [];
  List<Map<String, dynamic>> schedules = [];
  bool isLoading = true;
  String selectedFilter = 'all'; // all, today, week, month

  @override
  void initState() {
    super.initState();
    loadReportData();
  }

  Future<void> loadReportData() async {
    try {
      setState(() {
        isLoading = true;
      });

      // Öğrencileri al
      final studentsData = await ApiService.getMyStudents();
      
      // Randevuları al
      final schedulesData = await ApiService.getMySchedules();

      setState(() {
        students = studentsData?['students']?.cast<Map<String, dynamic>>() ?? [];
        schedules = schedulesData?['schedules']?.cast<Map<String, dynamic>>() ?? [];
        isLoading = false;
      });
    } catch (e) {
      print('Rapor veri yükleme hatası: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> getFilteredSchedules() {
    final now = DateTime.now();
    
    switch (selectedFilter) {
      case 'today':
        return schedules.where((schedule) {
          final scheduledDate = DateTime.parse(schedule['scheduledDate']);
          return scheduledDate.day == now.day && 
                 scheduledDate.month == now.month && 
                 scheduledDate.year == now.year;
        }).toList();
      case 'week':
        final weekAgo = now.subtract(const Duration(days: 7));
        return schedules.where((schedule) {
          final scheduledDate = DateTime.parse(schedule['scheduledDate']);
          return scheduledDate.isAfter(weekAgo);
        }).toList();
      case 'month':
        final monthAgo = DateTime(now.year, now.month - 1, now.day);
        return schedules.where((schedule) {
          final scheduledDate = DateTime.parse(schedule['scheduledDate']);
          return scheduledDate.isAfter(monthAgo);
        }).toList();
      default:
        return schedules;
    }
  }

  Map<String, dynamic> calculateStats() {
    final filteredSchedules = getFilteredSchedules();
    final completedSchedules = filteredSchedules.where((s) => s['status'] == 'Completed').length;
    final cancelledSchedules = filteredSchedules.where((s) => s['status'] == 'Cancelled').length;
    final pendingSchedules = filteredSchedules.where((s) => s['status'] == 'Pending').length;

    return {
      'total': filteredSchedules.length,
      'completed': completedSchedules,
      'cancelled': cancelledSchedules,
      'pending': pendingSchedules,
      'completionRate': filteredSchedules.isEmpty ? 0 : (completedSchedules / filteredSchedules.length * 100).round(),
    };
  }

  @override
  Widget build(BuildContext context) {
    final stats = calculateStats();
    final filteredSchedules = getFilteredSchedules();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Raporlar'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: loadReportData,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadReportData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Filtre seçenekleri
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
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Filtre',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[800],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _buildFilterChip('all', 'Tümü'),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildFilterChip('today', 'Bugün'),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildFilterChip('week', 'Bu Hafta'),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildFilterChip('month', 'Bu Ay'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // İstatistikler
                    Text(
                      'İstatistikler',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 16),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.2,
                      children: [
                        _buildStatCard(
                          'Toplam Randevu',
                          stats['total'].toString(),
                          Icons.calendar_today,
                          Colors.blue,
                        ),
                        _buildStatCard(
                          'Tamamlanan',
                          stats['completed'].toString(),
                          Icons.check_circle,
                          Colors.green,
                        ),
                        _buildStatCard(
                          'Bekleyen',
                          stats['pending'].toString(),
                          Icons.schedule,
                          Colors.orange,
                        ),
                        _buildStatCard(
                          'İptal Edilen',
                          stats['cancelled'].toString(),
                          Icons.cancel,
                          Colors.red,
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Tamamlanma oranı
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.green[600]!, Colors.green[700]!],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Tamamlanma Oranı',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '%${stats['completionRate']}',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 12),
                          LinearProgressIndicator(
                            value: stats['completionRate'] / 100,
                            backgroundColor: Colors.white.withOpacity(0.3),
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Öğrenci performansı
                    Text(
                      'Öğrenci Performansı',
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
                        children: students.take(5).map((student) => _buildStudentPerformanceCard(student)).toList(),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Son randevular
                    Text(
                      'Son Randevular',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...filteredSchedules.take(5).map((schedule) => _buildScheduleCard(schedule)),

                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = selectedFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedFilter = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.green[600] : Colors.grey[200],
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey[700],
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, MaterialColor color) {
    return Container(
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
              fontSize: 12,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildStudentPerformanceCard(Map<String, dynamic> student) {
    final progress = student['progress'] ?? 0;
    final completedLessons = student['completedLessons'] ?? 0;
    final totalLessons = student['totalLessons'] ?? 1;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey[200]!,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Colors.green[100],
            child: Text(
              _getStudentInitials(student['fullName'] ?? ''),
              style: TextStyle(
                color: Colors.green[700],
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['fullName'] ?? 'Öğrenci',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$completedLessons/$totalLessons ders tamamlandı',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: progress / 100,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.green[600]!),
                ),
                const SizedBox(height: 4),
                Text(
                  '%$progress tamamlandı',
                  style: TextStyle(
                    color: Colors.green[600],
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

  Widget _buildScheduleCard(Map<String, dynamic> schedule) {
    final scheduledDate = DateTime.parse(schedule['scheduledDate']);
    final status = schedule['status'] ?? 'Pending';
    
    Color statusColor;
    IconData statusIcon;
    String statusText;
    
    switch (status) {
      case 'Completed':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = 'Tamamlandı';
        break;
      case 'Cancelled':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusText = 'İptal Edildi';
        break;
      default:
        statusColor = Colors.orange;
        statusIcon = Icons.schedule;
        statusText = 'Bekliyor';
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
           color: statusColor.withOpacity(0.1),
           borderRadius: BorderRadius.circular(8),
         ),
         child: Icon(
           statusIcon,
           color: statusColor,
           size: 20,
         ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  schedule['student']?['fullName'] ?? 'Öğrenci',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${scheduledDate.day}/${scheduledDate.month}/${scheduledDate.year} ${scheduledDate.hour.toString().padLeft(2, '0')}:${scheduledDate.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      schedule['lessonType'] ?? 'Ders',
                      style: TextStyle(
                        color: Colors.green[700],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Spacer(),
                                         Container(
                       padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                       decoration: BoxDecoration(
                         color: statusColor.withOpacity(0.1),
                         borderRadius: BorderRadius.circular(12),
                       ),
                       child: Text(
                         statusText,
                         style: TextStyle(
                           color: statusColor,
                           fontSize: 10,
                           fontWeight: FontWeight.w500,
                         ),
                       ),
                     ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getStudentInitials(String fullName) {
    if (fullName.isEmpty) return 'Ö';
    
    final nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      return '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase();
    } else if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    }
    
    return 'Ö';
  }
} 