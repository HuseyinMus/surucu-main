import 'package:flutter/material.dart';
import 'course_detail_page.dart';
import '../services/api_service.dart';

class CoursesPage extends StatefulWidget {
  const CoursesPage({super.key});

  @override
  State<CoursesPage> createState() => _CoursesPageState();
}

class _CoursesPageState extends State<CoursesPage> {
  String selectedCategory = 'Tümü';
  final List<String> categories = ['Tümü', 'Teori', 'Pratik', 'Sınav', 'Video'];

  List<Map<String, dynamic>> courses = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    loadCourses();
  }

  Future<void> loadCourses() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final coursesData = await ApiService.getCourses();
      
      if (coursesData != null) {
        setState(() {
          courses = coursesData.map((course) => {
            'id': course['id'],
            'title': course['title'] ?? 'Başlıksız Kurs',
            'description': course['description'] ?? '',
            'category': _mapCourseCategory(course['category']?.toString() ?? course['courseType']?.toString() ?? ''),
            'progress': _calculateProgress(course),
            'duration': course['duration'] != null ? '${course['duration']} saat' : '2 saat', // Test için varsayılan
            'lessons': (course['courseContents'] as List?)?.length ?? (course['contents'] as List?)?.length ?? 5, // Test için varsayılan
            'color': _getCourseColor(course['category']?.toString() ?? course['courseType']?.toString() ?? ''),
            'icon': _getCourseIcon(course['category']?.toString() ?? course['courseType']?.toString() ?? ''),
            'isCompleted': course['isCompleted'] ?? false,
            'createdAt': course['createdAt'],
          }).toList();
          isLoading = false;
        });
      } else {
        throw Exception('Kurslar yüklenemedi');
      }
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Kurslar yüklenirken hata oluştu: ${e.toString()}';
      });
      print('Kurslar yükleme hatası: $e');
    }
  }

  String _mapCourseCategory(String backendCategory) {
    switch (backendCategory.toLowerCase()) {
      case 'theory':
      case 'teori':
      case '0': // CourseType.Theory
        return 'Teori';
      case 'practical':
      case 'practice':
      case 'pratik':
      case '1': // CourseType.Practice
        return 'Pratik';
      case 'exam':
      case 'sinav':
        return 'Sınav';
      case 'video':
        return 'Video';
      default:
        return 'Teori';
    }
  }

  int _calculateProgress(Map<String, dynamic> course) {
    // Backend'den progress bilgisi geliyorsa onu kullan
    if (course['progress'] != null) {
      return (course['progress'] as num).toInt();
    }
    
    // Yoksa contents'e göre hesapla (örnek)
    final contents = course['contents'] as List?;
    if (contents != null && contents.isNotEmpty) {
      final completedCount = contents.where((c) => c['isCompleted'] == true).length;
      return ((completedCount / contents.length) * 100).toInt();
    }
    
    return 0;
  }

  MaterialColor _getCourseColor(String category) {
    switch (category.toLowerCase()) {
      case 'theory':
      case 'teori':
      case '0': // CourseType.Theory
        return Colors.blue;
      case 'practical':
      case 'practice':
      case 'pratik':
      case '1': // CourseType.Practice
        return Colors.green;
      case 'exam':
      case 'sinav':
        return Colors.purple;
      case 'video':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  IconData _getCourseIcon(String category) {
    switch (category.toLowerCase()) {
      case 'theory':
      case 'teori':
      case '0': // CourseType.Theory
        return Icons.book;
      case 'practical':
      case 'practice':
      case 'pratik':
      case '1': // CourseType.Practice
        return Icons.drive_eta;
      case 'exam':
      case 'sinav':
        return Icons.quiz;
      case 'video':
        return Icons.play_circle;
      default:
        return Icons.book;
    }
  }

  List<Map<String, dynamic>> get filteredCourses {
    if (selectedCategory == 'Tümü') return courses;
    return courses.where((course) => course['category'] == selectedCategory).toList();
  }

  Widget _buildCoursesContent() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Kurslar yükleniyor...'),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Kurslar yüklenemedi',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: loadCourses,
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      );
    }

    if (filteredCourses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.book_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              selectedCategory == 'Tümü' ? 'Henüz kurs bulunmuyor' : 'Bu kategoride kurs bulunmuyor',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Yeni kurslar eklendiğinde burada görünecek',
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredCourses.length,
      itemBuilder: (context, index) {
        return _buildModernCourseCard(filteredCourses[index], index);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.blue[50]!,
              Colors.white,
              Colors.purple[50]!,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Modern AppBar
              _buildModernAppBar(),
              
              // Search Bar
              _buildSearchBar(),
              
              // Category Chips
              _buildCategoryChips(),
              
                              // Courses List
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: loadCourses,
                    child: _buildCoursesContent(),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernAppBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue[600]!, Colors.purple[600]!],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(25),
          bottomRight: Radius.circular(25),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const                 Text(
                  'Kurslarım',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  isLoading ? 'Yükleniyor...' : '${courses.length} kurs mevcut',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.notifications_outlined,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 2,
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Kurs ara...',
          prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
          suffixIcon: Icon(Icons.tune, color: Colors.grey[400]),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildCategoryChips() {
    return Container(
      height: 50,
      margin: const EdgeInsets.only(bottom: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          final isSelected = selectedCategory == category;
          
          return Container(
            margin: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  selectedCategory = category;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? LinearGradient(colors: [Colors.blue[600]!, Colors.purple[600]!])
                      : null,
                  color: isSelected ? null : Colors.white,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.1),
                      spreadRadius: 1,
                      blurRadius: 5,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  category,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[700],
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildModernCourseCard(Map<String, dynamic> course, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () {
          // Kurs detayına git
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CourseDetailPage(course: course),
            ),
          );
        },
        child: Hero(
          tag: 'course_$index',
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  spreadRadius: 2,
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              children: [
                // Header with icon and category
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [course['color'][100], course['color'][50]],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: course['color'][600],
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Icon(
                          course['icon'],
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              course['title'],
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey[800],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: course['color'][600],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                course['category'],
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (course['isCompleted'])
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.green[600],
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                    ],
                  ),
                ),
                
                // Content
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Progress
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'İlerleme',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            '%${course['progress']}',
                            style: TextStyle(
                              color: course['color'][600],
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: course['progress'] / 100,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(course['color'][600]),
                          minHeight: 6,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Stats
                      Row(
                        children: [
                          Expanded(
                            child: _buildStatItem(
                              icon: Icons.play_circle_outline,
                              label: 'Süre',
                              value: course['duration'],
                              color: course['color'][600],
                            ),
                          ),
                          Expanded(
                            child: _buildStatItem(
                              icon: Icons.book_outlined,
                              label: 'Ders',
                              value: '${course['lessons']} bölüm',
                              color: course['color'][600],
                            ),
                          ),
                        ],
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

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
          ],
        ),
      ],
    );
  }
} 