import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InstructorSchedulesPage extends StatefulWidget {
  const InstructorSchedulesPage({super.key});

  @override
  State<InstructorSchedulesPage> createState() => _InstructorSchedulesPageState();
}

class _InstructorSchedulesPageState extends State<InstructorSchedulesPage> {
  List<Map<String, dynamic>> schedules = [];
  bool isLoading = true;
  String selectedFilter = 'all'; // all, today, upcoming, completed

  @override
  void initState() {
    super.initState();
    loadSchedules();
  }

  Future<void> loadSchedules() async {
    try {
      setState(() {
        isLoading = true;
      });

      final schedulesData = await ApiService.getMySchedules();
      
      setState(() {
        schedules = schedulesData?['schedules']?.cast<Map<String, dynamic>>() ?? [];
        isLoading = false;
      });
    } catch (e) {
      print('Randevu listesi yükleme hatası: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get filteredSchedules {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    switch (selectedFilter) {
      case 'today':
        return schedules.where((schedule) {
          final scheduledDate = DateTime.parse(schedule['scheduledDate']);
          final scheduleDay = DateTime(scheduledDate.year, scheduledDate.month, scheduledDate.day);
          return scheduleDay.isAtSameMomentAs(today);
        }).toList();
      case 'upcoming':
        return schedules.where((schedule) {
          final scheduledDate = DateTime.parse(schedule['scheduledDate']);
          return scheduledDate.isAfter(now) && schedule['status'] == 'Scheduled';
        }).toList();
      case 'completed':
        return schedules.where((schedule) {
          return schedule['status'] == 'Done';
        }).toList();
      default:
        return schedules;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'Scheduled':
        return 'Planlandı';
      case 'Done':
        return 'Tamamlandı';
      case 'Cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Scheduled':
        return Colors.blue;
      case 'Done':
        return Colors.green;
      case 'Cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getLessonTypeText(String lessonType) {
    switch (lessonType) {
      case 'Theory':
        return 'Teori';
      case 'Practice':
        return 'Pratik';
      case 'Exam':
        return 'Sınav';
      case 'Review':
        return 'Tekrar';
      default:
        return lessonType;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Randevularım'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.pushNamed(context, '/instructor-schedule-new');
            },
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Filtre butonları
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
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
                        child: _buildFilterChip('upcoming', 'Yaklaşan'),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildFilterChip('completed', 'Tamamlanan'),
                      ),
                    ],
                  ),
                ),
                
                // İstatistik kartı
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green[600],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.calendar_today,
                        color: Colors.white,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Toplam Randevu',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            schedules.length.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Bugün: ${schedules.where((s) {
                              final scheduledDate = DateTime.parse(s['scheduledDate']);
                              final today = DateTime.now();
                              return scheduledDate.day == today.day && 
                                     scheduledDate.month == today.month && 
                                     scheduledDate.year == today.year;
                            }).length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            'Yaklaşan: ${schedules.where((s) {
                              final scheduledDate = DateTime.parse(s['scheduledDate']);
                              return scheduledDate.isAfter(DateTime.now()) && s['status'] == 'Scheduled';
                            }).length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Randevu listesi
                Expanded(
                  child: filteredSchedules.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.calendar_today_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                selectedFilter == 'all' 
                                    ? 'Henüz randevu bulunmuyor'
                                    : 'Bu kategoride randevu bulunamadı',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredSchedules.length,
                          itemBuilder: (context, index) {
                            final schedule = filteredSchedules[index];
                            return _buildScheduleCard(schedule);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterChip(String filter, String label) {
    final isSelected = selectedFilter == filter;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedFilter = filter;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.green[600] : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? Colors.green[600]! : Colors.grey[300]!,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey[700],
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildScheduleCard(Map<String, dynamic> schedule) {
    final scheduledDate = DateTime.parse(schedule['scheduledDate']);
    final isToday = scheduledDate.day == DateTime.now().day && 
                   scheduledDate.month == DateTime.now().month && 
                   scheduledDate.year == DateTime.now().year;
    
    String dateText = '';
    if (isToday) {
      dateText = 'Bugün';
    } else if (scheduledDate.day == DateTime.now().add(const Duration(days: 1)).day) {
      dateText = 'Yarın';
    } else {
      dateText = '${scheduledDate.day}/${scheduledDate.month}';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _getStatusColor(schedule['status']).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            Icons.calendar_today,
            color: _getStatusColor(schedule['status']),
            size: 20,
          ),
        ),
        title: Text(
          schedule['student']['fullName'] ?? 'Öğrenci',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: 14,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Text(
                  '$dateText ${scheduledDate.hour.toString().padLeft(2, '0')}:${scheduledDate.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.timer,
                  size: 14,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Text(
                  '${schedule['duration']} dakika',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getLessonTypeText(schedule['lessonType']),
                    style: TextStyle(
                      color: Colors.blue[700],
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getStatusColor(schedule['status']).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getStatusText(schedule['status']),
                    style: TextStyle(
                      color: _getStatusColor(schedule['status']),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            if (schedule['notes'] != null && schedule['notes'].toString().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                'Not: ${schedule['notes']}',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'edit') {
              Navigator.pushNamed(
                context,
                '/instructor-schedule-edit',
                arguments: schedule['id'],
              );
            } else if (value == 'complete') {
              _completeSchedule(schedule['id']);
            } else if (value == 'cancel') {
              _cancelSchedule(schedule['id']);
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit, size: 16),
                  SizedBox(width: 8),
                  Text('Düzenle'),
                ],
              ),
            ),
            if (schedule['status'] == 'Scheduled') ...[
              const PopupMenuItem(
                value: 'complete',
                child: Row(
                  children: [
                    Icon(Icons.check, size: 16),
                    SizedBox(width: 8),
                    Text('Tamamla'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'cancel',
                child: Row(
                  children: [
                    Icon(Icons.cancel, size: 16),
                    SizedBox(width: 8),
                    Text('İptal Et'),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _completeSchedule(String scheduleId) async {
    try {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Randevu Tamamla'),
          content: const Text('Bu randevuyu tamamlandı olarak işaretlemek istediğinizden emin misiniz?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('İptal'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
              child: const Text('Tamamla'),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        final result = await ApiService.completeSchedule(scheduleId);
        if (!mounted) return;
        
        if (result != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Randevu başarıyla tamamlandı'),
              backgroundColor: Colors.green,
            ),
          );
          loadSchedules(); // Listeyi yenile
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Randevu tamamlanırken hata oluştu'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Hata: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _cancelSchedule(String scheduleId) async {
    try {
      final reasonController = TextEditingController();
      
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Randevu İptal Et'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Bu randevuyu iptal etmek istediğinizden emin misiniz?'),
              const SizedBox(height: 16),
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(
                  labelText: 'İptal Nedeni (Opsiyonel)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('İptal'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('İptal Et'),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        final result = await ApiService.rejectSchedule(scheduleId, reasonController.text);
        if (!mounted) return;
        
        if (result != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Randevu başarıyla iptal edildi'),
              backgroundColor: Colors.orange,
            ),
          );
          loadSchedules(); // Listeyi yenile
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Randevu iptal edilirken hata oluştu'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Hata: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
} 