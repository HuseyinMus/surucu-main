import 'package:flutter/material.dart';
import 'video_player_page.dart';
import '../services/api_service.dart';

class CourseDetailPage extends StatefulWidget {
  final Map<String, dynamic> course;
  
  const CourseDetailPage({super.key, required this.course});

  @override
  State<CourseDetailPage> createState() => _CourseDetailPageState();
}

class _CourseDetailPageState extends State<CourseDetailPage> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  
  String selectedTab = 'İçerik';
  final List<String> tabs = ['İçerik', 'Hakkında', 'Yorumlar'];

  // Backend verilerini tutacak değişkenler
  Map<String, dynamic>? courseDetail;
  List<Map<String, dynamic>> lessons = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );
    _fadeController.forward();
    
    loadCourseDetail();
  }

  Future<void> loadCourseDetail() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final courseId = widget.course['id'];
      if (courseId != null) {
        final detail = await ApiService.getCourseDetail(courseId);
        
        if (detail != null) {
          setState(() {
            courseDetail = detail;
            lessons = _mapCourseContents(detail['courseContents'] ?? []);
            isLoading = false;
          });
        } else {
          throw Exception('Kurs detayları yüklenemedi');
        }
      } else {
        throw Exception('Kurs ID bulunamadı');
      }
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Kurs detayları yüklenirken hata oluştu: ${e.toString()}';
      });
      print('Kurs detay hatası: $e');
    }
  }

  List<Map<String, dynamic>> _mapCourseContents(List<dynamic> contents) {
    return contents.asMap().entries.map((entry) {
      int index = entry.key;
      var content = entry.value;
      
      return {
        'id': content['id'],
        'title': content['title'] ?? 'Başlıksız İçerik',
        'description': content['description'] ?? '',
        'duration': _formatDuration(content['duration']),
        'isCompleted': false, // TODO: Progress API'den gelecek
        'isLocked': index > 2, // İlk 3 ders açık, diğerleri kilitli
        'type': _mapContentType(content['contentType']),
        'contentUrl': content['contentUrl'],
        'order': content['order'] ?? index,
      };
    }).toList()..sort((a, b) => (a['order'] as int).compareTo(b['order'] as int));
  }

  String _formatDuration(dynamic duration) {
    if (duration == null) return '5:00';
    
    if (duration is String) {
      // Backend'den string olarak gelirse parse et
      final parts = duration.split(':');
      if (parts.length >= 2) {
        final minutes = int.tryParse(parts[1]) ?? 0;
        return '$minutes:00';
      }
    } else if (duration is int) {
      // Saniye cinsinden gelirse dakikaya çevir
      final minutes = (duration / 60).round();
      return '$minutes:00';
    }
    
    return '5:00'; // Varsayılan
  }

  String _mapContentType(dynamic contentType) {
    if (contentType == null) return 'video';
    
    final typeStr = contentType.toString().toLowerCase();
    switch (typeStr) {
      case '0':
      case 'video':
        return 'video';
      case '1':
      case 'text':
        return 'text';
      case '2':
      case 'quiz':
        return 'quiz';
      default:
        return 'video';
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }



  // Yorumlar
  final List<Map<String, dynamic>> reviews = [
    {
      'name': 'Ahmet K.',
      'rating': 5,
      'comment': 'Çok açıklayıcı bir kurs. Tüm trafik işaretlerini öğrendim.',
      'date': '2 gün önce',
      'avatar': 'AK',
    },
    {
      'name': 'Zeynep M.',
      'rating': 4,
      'comment': 'Videolar kaliteli ve anlaşılır. Tavsiye ederim.',
      'date': '1 hafta önce',
      'avatar': 'ZM',
    },
    {
      'name': 'Mehmet S.',
      'rating': 5,
      'comment': 'Bu kurs sayesinde sınavı geçtim. Çok teşekkürler!',
      'date': '2 hafta önce',
      'avatar': 'MS',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: Colors.grey[50],
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: isLoading 
                ? _buildLoadingState()
                : errorMessage != null
                    ? _buildErrorState()
                    : Column(
                        children: [
                          // Modern AppBar
                          _buildModernAppBar(),
                          
                          // Course Header
                          _buildCourseHeader(),
                          
                          // Tab Selector
                          _buildTabSelector(),
                          
                          // Content
                          Expanded(
                            child: _buildTabContent(),
                          ),
                          
                          // Bottom Action Button
                          _buildBottomActionButton(),
                        ],
                      ),
          ),
        ),
      ),
    );
  }

  Widget _buildModernAppBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.grey[800]),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: Text(
              'Kurs Detayları',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
          ),
          IconButton(
            icon: Icon(Icons.bookmark_border, color: Colors.grey[600]),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Favorilere eklendi')),
              );
            },
          ),
          IconButton(
            icon: Icon(Icons.share, color: Colors.grey[600]),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Kurs paylaşıldı')),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCourseHeader() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            spreadRadius: 0,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  widget.course['icon'],
                  color: Colors.blue[600],
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      courseDetail?['title'] ?? widget.course['title'],
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      courseDetail?['category'] ?? widget.course['category'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.blue[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Progress
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'İlerleme',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              Text(
                '%${widget.course['progress']}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue[600],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: widget.course['progress'] / 100,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
              minHeight: 6,
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Stats
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.play_circle_outline,
                  label: 'Süre',
                  value: widget.course['duration'],
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.assignment_outlined,
                  label: 'Dersler',
                  value: '${lessons.length} ders',
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.star_outline,
                  label: 'Puan',
                  value: '4.8/5',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({required IconData icon, required String label, required String value}) {
    return Column(
      children: [
        Icon(icon, color: Colors.grey[600], size: 22),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildTabSelector() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: tabs.map((tab) {
          final isSelected = selectedTab == tab;
          
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  selectedTab = tab;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isSelected ? Colors.blue[600]! : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Text(
                  tab,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    color: isSelected ? Colors.blue[600] : Colors.grey[600],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (selectedTab) {
      case 'İçerik':
        return _buildLessonsList();
      case 'Hakkında':
        return _buildAboutSection();
      case 'Yorumlar':
        return _buildReviewsSection();
      default:
        return _buildLessonsList();
    }
  }

  Widget _buildLessonsList() {
    if (lessons.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.video_library_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Bu kursta henüz ders bulunmuyor',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Dersler eklendiğinde burada görünecek',
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
      itemCount: lessons.length,
      itemBuilder: (context, index) {
        return _buildLessonCard(lessons[index], index);
      },
    );
  }

  Widget _buildLessonCard(Map<String, dynamic> lesson, int index) {
    final isLocked = lesson['isLocked'];
    final isCompleted = lesson['isCompleted'];
    final isQuiz = lesson['type'] == 'quiz';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: () {
          if (isLocked) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Bu ders henüz açılmamış!')),
            );
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => LearningPage(
                  content: lesson,
                  course: widget.course,
                ),
              ),
            );
          }
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: isCompleted ? Border.all(color: Colors.green[400]!, width: 1) : Border.all(color: Colors.grey[200]!, width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                spreadRadius: 0,
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Stack(
            children: [
              if (isLocked)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                ),
              
              Row(
                children: [
                  // Index number
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: isCompleted 
                          ? Colors.green[100] 
                          : isLocked 
                              ? Colors.grey[200] 
                              : Colors.blue[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: isCompleted
                          ? Icon(Icons.check, color: Colors.green[600], size: 20)
                          : isLocked
                              ? Icon(Icons.lock, color: Colors.grey[500], size: 20)
                              : Text(
                                  '${index + 1}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.blue[600],
                                  ),
                                ),
                    ),
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lesson['title'],
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: isLocked ? Colors.grey[500] : Colors.grey[800],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              isQuiz ? Icons.quiz : Icons.play_circle_outline,
                              size: 16,
                              color: isLocked ? Colors.grey[400] : Colors.grey[600],
                            ),
                            const SizedBox(width: 4),
                            Text(
                              lesson['duration'],
                              style: TextStyle(
                                fontSize: 14,
                                color: isLocked ? Colors.grey[400] : Colors.grey[600],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isQuiz ? Colors.orange[100] : Colors.blue[100],
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                isQuiz ? 'Quiz' : 'Video',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isQuiz ? Colors.orange[700] : Colors.blue[700],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  // Status icon
                  if (!isLocked)
                    Icon(
                      isCompleted ? Icons.check_circle : Icons.play_arrow,
                      color: isCompleted ? Colors.green[600] : Colors.blue[600],
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAboutSection() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Kurs açıklaması
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  spreadRadius: 1,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Kurs Hakkında',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Bu kurs, trafik kuralları konusunda temel bilgileri kapsamlı bir şekilde öğretmeyi amaçlamaktadır. Video dersler ve interaktif quizler ile desteklenen kurs, ehliyet sınavına hazırlık sürecinde size yardımcı olacaktır.\n\nKursun sonunda tüm trafik işaretlerini tanıyacak, temel kavşak kurallarını öğrenecek ve güvenli sürüş tekniklerini kavrayacaksınız.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Eğitmen bilgisi
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  spreadRadius: 1,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.blue[50],
                  child: Text(
                    'MK',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.blue[600],
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Mehmet Kaya',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Trafik Eğitmeni',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.star, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            '4.9 • 15 yıl deneyim',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
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
        ],
      ),
    );
  }

  Widget _buildReviewsSection() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: reviews.length + 1, // +1 for header
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildReviewsHeader();
        }
        return _buildReviewCard(reviews[index - 1]);
      },
    );
  }

  Widget _buildReviewsHeader() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(
                '4.8',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    Icons.star,
                    color: index < 4 ? Colors.amber : Colors.grey[300],
                    size: 16,
                  );
                }),
              ),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${reviews.length} Değerlendirme',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Öğrenciler bu kursu çok seviyor',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.blue[50],
                child: Text(
                  review['avatar'],
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.blue[600],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review['name'],
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[800],
                      ),
                    ),
                    Row(
                      children: [
                        Row(
                          children: List.generate(5, (index) {
                            return Icon(
                              Icons.star,
                              color: index < review['rating'] ? Colors.amber : Colors.grey[300],
                              size: 14,
                            );
                          }),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          review['date'],
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            review['comment'],
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionButton() {
    final isCompleted = widget.course['progress'] == 100;
    final isStarted = widget.course['progress'] > 0;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: () {
            // İlk dersi başlat
            final firstLesson = lessons.isNotEmpty ? lessons[0] : {
              'title': 'İlk Ders',
              'duration': '12:30',
              'type': 'video',
            };
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => LearningPage(
                  content: firstLesson,
                  course: widget.course,
                ),
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
          child: Text(
            isCompleted 
                ? 'Tekrar İzle' 
                : isStarted 
                    ? 'Devam Et' 
                    : 'Kursu Başlat',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Kurs detayları yükleniyor...'),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
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
            'Kurs detayları yüklenemedi',
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
            onPressed: loadCourseDetail,
            child: const Text('Tekrar Dene'),
          ),
        ],
      ),
    );
  }
} 