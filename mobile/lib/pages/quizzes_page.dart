import 'package:flutter/material.dart';
import 'quiz_detail_page.dart';
import '../services/api_service.dart';

class QuizzesPage extends StatefulWidget {
  const QuizzesPage({super.key});

  @override
  State<QuizzesPage> createState() => _QuizzesPageState();
}

class _QuizzesPageState extends State<QuizzesPage> with TickerProviderStateMixin {
  String selectedDifficulty = 'Tümü';
  final List<String> difficulties = ['Tümü', 'Kolay', 'Orta', 'Zor'];
  
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  // Backend verilerini tutacak değişkenler
  List<Map<String, dynamic>> quizzes = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.forward();
    
    loadQuizzes();
  }

  Future<void> loadQuizzes() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final quizzesData = await ApiService.getQuizzes();
      
      if (quizzesData != null) {
        setState(() {
          quizzes = quizzesData.map((quiz) => {
            'id': quiz['id'],
            'title': quiz['title'] ?? 'Başlıksız Sınav',
            'description': quiz['description'] ?? '',
            'difficulty': _mapDifficulty(quiz['difficulty']),
            'questions': (quiz['questions'] as List?)?.length ?? quiz['questionCount'] ?? 10,
            'duration': quiz['duration'] ?? 15,
            'bestScore': 0, // TODO: Progress API'den gelecek
            'attempts': 0, // TODO: Progress API'den gelecek
            'color': _getQuizColor(quiz['difficulty']),
            'icon': _getQuizIcon(quiz['category']),
            'isCompleted': false, // TODO: Progress API'den gelecek
            'category': quiz['category'] ?? 'Genel',
            'createdAt': quiz['createdAt'],
          }).toList();
          isLoading = false;
        });
      } else {
        throw Exception('Sınavlar yüklenemedi');
      }
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Sınavlar yüklenirken hata oluştu: ${e.toString()}';
      });
      print('Sınavlar yükleme hatası: $e');
    }
  }

  String _mapDifficulty(dynamic difficulty) {
    if (difficulty == null) return 'Orta';
    
    final diffStr = difficulty.toString().toLowerCase();
    switch (diffStr) {
      case '0':
      case 'easy':
      case 'kolay':
        return 'Kolay';
      case '1':
      case 'medium':
      case 'orta':
        return 'Orta';
      case '2':
      case 'hard':
      case 'zor':
        return 'Zor';
      default:
        return 'Orta';
    }
  }

  MaterialColor _getQuizColor(dynamic difficulty) {
    final diffStr = _mapDifficulty(difficulty);
    switch (diffStr) {
      case 'Kolay':
        return Colors.green;
      case 'Orta':
        return Colors.blue;
      case 'Zor':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  IconData _getQuizIcon(dynamic category) {
    if (category == null) return Icons.quiz;
    
    final catStr = category.toString().toLowerCase();
    switch (catStr) {
      case 'theory':
      case 'teori':
        return Icons.book;
      case 'practice':
      case 'pratik':
        return Icons.drive_eta;
      case 'general':
      case 'genel':
        return Icons.quiz;
      default:
        return Icons.quiz;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }



  List<Map<String, dynamic>> get filteredQuizzes {
    if (selectedDifficulty == 'Tümü') return quizzes;
    return quizzes.where((quiz) => quiz['difficulty'] == selectedDifficulty).toList();
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
              Colors.indigo[50]!,
              Colors.white,
              Colors.cyan[50]!,
            ],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              children: [
                // Modern AppBar
                _buildModernAppBar(),
                
                // Stats Overview
                _buildStatsOverview(),
                
                // Difficulty Filter
                _buildDifficultyFilter(),
                
                // Quizzes List
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: loadQuizzes,
                    child: _buildQuizzesContent(),
                  ),
                ),
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
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.indigo[600]!, Colors.cyan[600]!],
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
                  'Sınavlarım',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  isLoading ? 'Yükleniyor...' : '${quizzes.length} sınav mevcut',
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
              Icons.timer,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsOverview() {
    final completedQuizzes = quizzes.where((q) => q['isCompleted']).length;
    final totalAttempts = quizzes.fold<int>(0, (sum, q) => sum + (q['attempts'] as int));
    final avgScore = quizzes.where((q) => q['bestScore'] > 0).isNotEmpty
        ? quizzes.where((q) => q['bestScore'] > 0).fold<int>(0, (sum, q) => sum + (q['bestScore'] as int)) /
            quizzes.where((q) => q['bestScore'] > 0).length
        : 0.0;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 2,
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Tamamlanan',
              '$completedQuizzes/${quizzes.length}',
              Icons.check_circle_outline,
              Colors.green,
            ),
          ),
          Container(
            width: 1,
            height: 40,
            color: Colors.grey[300],
          ),
          Expanded(
            child: _buildStatCard(
              'Toplam Deneme',
              totalAttempts.toString(),
              Icons.refresh,
              Colors.blue,
            ),
          ),
          Container(
            width: 1,
            height: 40,
            color: Colors.grey[300],
          ),
          Expanded(
            child: _buildStatCard(
              'Ortalama Puan',
              '${avgScore.toInt()}%',
              Icons.trending_up,
              Colors.purple,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          title,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildDifficultyFilter() {
    return Container(
      height: 50,
      margin: const EdgeInsets.only(bottom: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: difficulties.length,
        itemBuilder: (context, index) {
          final difficulty = difficulties[index];
          final isSelected = selectedDifficulty == difficulty;
          
          return Container(
            margin: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  selectedDifficulty = difficulty;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? LinearGradient(colors: [Colors.indigo[600]!, Colors.cyan[600]!])
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
                  difficulty,
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

  Widget _buildQuizCard(Map<String, dynamic> quiz, int index) {
    final isLocked = !quiz['isCompleted'] && quiz['attempts'] == 0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () {
          if (isLocked) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Bu sınav henüz açılmamış!')),
            );
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => QuizDetailPage(quiz: quiz),
                    ),
    );
  }

  Widget _buildQuizzesContent() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Sınavlar yükleniyor...'),
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
              'Sınavlar yüklenemedi',
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
              onPressed: loadQuizzes,
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      );
    }

    if (filteredQuizzes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.quiz_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              selectedDifficulty == 'Tümü' ? 'Henüz sınav bulunmuyor' : 'Bu zorlukta sınav bulunmuyor',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Yeni sınavlar eklendiğinde burada görünecek',
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
      itemCount: filteredQuizzes.length,
      itemBuilder: (context, index) {
        return _buildQuizCard(filteredQuizzes[index], index);
      },
    );
  }
},
        child: AnimatedContainer(
          duration: Duration(milliseconds: 300 + (index * 100)),
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
          child: Stack(
            children: [
              // Lock overlay for unreleased quizzes
              if (isLocked)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.lock,
                        size: 40,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              
              Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [quiz['color'][100], quiz['color'][50]],
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
                            color: quiz['color'][600],
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Icon(
                            quiz['icon'],
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
                                quiz['title'],
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey[800],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  _buildDifficultyChip(quiz['difficulty']),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.grey[600],
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      quiz['category'],
                                      style: const TextStyle(
                                        color: Colors.white,
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
                        if (quiz['bestScore'] > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getScoreColor(quiz['bestScore']),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${quiz['bestScore']}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  
                  // Content
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: _buildQuizStat(
                            Icons.quiz,
                            'Sorular',
                            '${quiz['questions']} soru',
                            quiz['color'][600],
                          ),
                        ),
                        Expanded(
                          child: _buildQuizStat(
                            Icons.timer,
                            'Süre',
                            '${quiz['duration']} dk',
                            quiz['color'][600],
                          ),
                        ),
                        Expanded(
                          child: _buildQuizStat(
                            Icons.refresh,
                            'Deneme',
                            '${quiz['attempts']} kez',
                            quiz['color'][600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDifficultyChip(String difficulty) {
    Color color;
    switch (difficulty) {
      case 'Kolay':
        color = Colors.green;
        break;
      case 'Orta':
        color = Colors.orange;
        break;
      case 'Zor':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        difficulty,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Color _getScoreColor(int score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  Widget _buildQuizStat(IconData icon, String label, String value, Color color) {
    return Column(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(height: 4),
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
    );
  }

  Widget _buildQuizzesContent() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Sınavlar yükleniyor...'),
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
              'Sınavlar yüklenemedi',
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
              onPressed: loadQuizzes,
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      );
    }

    if (filteredQuizzes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.quiz_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              selectedDifficulty == 'Tümü' ? 'Henüz sınav bulunmuyor' : 'Bu zorlukta sınav bulunmuyor',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Yeni sınavlar eklendiğinde burada görünecek',
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
      itemCount: filteredQuizzes.length,
      itemBuilder: (context, index) {
        return _buildQuizCard(filteredQuizzes[index], index);
      },
    );
  }
} 