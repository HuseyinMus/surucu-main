import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InstructorStudentsPage extends StatefulWidget {
  const InstructorStudentsPage({super.key});

  @override
  State<InstructorStudentsPage> createState() => _InstructorStudentsPageState();
}

class _InstructorStudentsPageState extends State<InstructorStudentsPage> {
  List<Map<String, dynamic>> students = [];
  bool isLoading = true;
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    loadStudents();
  }

  Future<void> loadStudents() async {
    try {
      setState(() {
        isLoading = true;
      });

      final studentsData = await ApiService.getMyStudents();
      
      setState(() {
        students = studentsData?['students']?.cast<Map<String, dynamic>>() ?? [];
        isLoading = false;
      });
    } catch (e) {
      print('Öğrenci listesi yükleme hatası: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get filteredStudents {
    if (searchQuery.isEmpty) {
      return students;
    }
    return students.where((student) {
      final fullName = student['fullName']?.toString().toLowerCase() ?? '';
      final tcNumber = student['tcNumber']?.toString().toLowerCase() ?? '';
      final query = searchQuery.toLowerCase();
      return fullName.contains(query) || tcNumber.contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Öğrencilerim'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Arama kutusu
                Container(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    onChanged: (value) {
                      setState(() {
                        searchQuery = value;
                      });
                    },
                    decoration: InputDecoration(
                      hintText: 'Öğrenci ara...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                    ),
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
                        Icons.people,
                        color: Colors.white,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Toplam Öğrenci',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            students.length.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Öğrenci listesi
                Expanded(
                  child: filteredStudents.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.people_outline,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                searchQuery.isEmpty
                                    ? 'Henüz öğrenci bulunmuyor'
                                    : 'Arama sonucu bulunamadı',
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
                          itemCount: filteredStudents.length,
                          itemBuilder: (context, index) {
                            final student = filteredStudents[index];
                            return _buildStudentCard(student);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildStudentCard(Map<String, dynamic> student) {
    final progress = student['progress'] ?? {};
    final overallProgress = progress['overallProgress']?.toDouble() ?? 0.0;
    
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
        leading: CircleAvatar(
          backgroundColor: Colors.green[100],
          child: Text(
            _getStudentInitials(student['fullName'] ?? ''),
            style: TextStyle(
              color: Colors.green[700],
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          student['fullName'] ?? 'İsimsiz Öğrenci',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              'TC: ${student['tcNumber'] ?? ''}',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: LinearProgressIndicator(
                    value: overallProgress / 100,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      overallProgress >= 80 ? Colors.green : 
                      overallProgress >= 50 ? Colors.orange : Colors.red,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${overallProgress.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: overallProgress >= 80 ? Colors.green : 
                           overallProgress >= 50 ? Colors.orange : Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Aşama: ${student['currentStage'] ?? 'Bilinmiyor'}',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.arrow_forward_ios),
          onPressed: () {
            Navigator.pushNamed(
              context,
              '/instructor-student-detail',
              arguments: student['id'],
            );
          },
        ),
        onTap: () {
          Navigator.pushNamed(
            context,
            '/instructor-student-detail',
            arguments: student['id'],
          );
        },
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