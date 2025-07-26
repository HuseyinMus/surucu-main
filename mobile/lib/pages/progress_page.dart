import 'package:flutter/material.dart';

class ProgressPage extends StatefulWidget {
  const ProgressPage({super.key});

  @override
  State<ProgressPage> createState() => _ProgressPageState();
}

class _ProgressPageState extends State<ProgressPage> with TickerProviderStateMixin {
  String selectedPeriod = 'Bu Hafta';
  final List<String> periods = ['Bu Hafta', 'Bu Ay', 'Son 3 Ay', 'Tüm Zamanlar'];
  
  late AnimationController _progressController;
  late AnimationController _fadeController;
  late Animation<double> _progressAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _progressController, curve: Curves.easeInOut),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );
    
    _fadeController.forward();
    _progressController.forward();
  }

  @override
  void dispose() {
    _progressController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  // İlerleme verileri
  final Map<String, dynamic> progressData = {
    'totalProgress': 68,
    'coursesCompleted': 3,
    'totalCourses': 5,
    'hoursStudied': 42,
    'streak': 7,
    'weeklyGoal': 80,
    'weeklyProgress': 65,
  };

  final List<Map<String, dynamic>> achievements = [
    {
      'title': 'İlk Adım',
      'description': 'İlk kursu tamamladı',
      'icon': Icons.flag,
      'color': Colors.green,
      'isUnlocked': true,
    },
    {
      'title': 'Azimli Öğrenci',
      'description': '7 gün üst üste çalış',
      'icon': Icons.local_fire_department,
      'color': Colors.orange,
      'isUnlocked': true,
    },
    {
      'title': 'Sınav Ustası',
      'description': '3 sınavdan 80+ al',
      'icon': Icons.star,
      'color': Colors.purple,
      'isUnlocked': true,
    },
    {
      'title': 'Hız Canavarı',
      'description': '20 saat çalışma',
      'icon': Icons.speed,
      'color': Colors.blue,
      'isUnlocked': true,
    },
    {
      'title': 'Mükemmeliyetçi',
      'description': 'Tüm kursları bitir',
      'icon': Icons.emoji_events,
      'color': Colors.amber,
      'isUnlocked': false,
    },
    {
      'title': 'Efsane',
      'description': '30 günlük seri',
      'icon': Icons.military_tech,
      'color': Colors.red,
      'isUnlocked': false,
    },
  ];

  final List<Map<String, dynamic>> weeklyData = [
    {'day': 'Pzt', 'hours': 6, 'percentage': 75},
    {'day': 'Sal', 'hours': 4, 'percentage': 50},
    {'day': 'Çar', 'hours': 8, 'percentage': 100},
    {'day': 'Per', 'hours': 5, 'percentage': 62},
    {'day': 'Cum', 'hours': 7, 'percentage': 87},
    {'day': 'Cmt', 'hours': 3, 'percentage': 37},
    {'day': 'Paz', 'hours': 9, 'percentage': 95},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.deepPurple[50]!,
              Colors.white,
              Colors.pink[50]!,
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
                
                // Period Filter
                _buildPeriodFilter(),
                
                // Progress Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Overall Progress Card
                        _buildOverallProgressCard(),
                        
                        const SizedBox(height: 20),
                        
                        // Weekly Chart
                        _buildWeeklyChart(),
                        
                        const SizedBox(height: 20),
                        
                        // Achievements Section
                        _buildAchievementsSection(),
                        
                        const SizedBox(height: 20),
                        
                        // Course Progress
                        _buildCourseProgress(),
                      ],
                    ),
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
          colors: [Colors.deepPurple[600]!, Colors.pink[600]!],
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
                const Text(
                  'İlerleme Takibi',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Gelişimini takip et',
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
              Icons.analytics,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodFilter() {
    return Container(
      height: 50,
      margin: const EdgeInsets.all(16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: periods.length,
        itemBuilder: (context, index) {
          final period = periods[index];
          final isSelected = selectedPeriod == period;
          
          return Container(
            margin: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  selectedPeriod = period;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? LinearGradient(colors: [Colors.deepPurple[600]!, Colors.pink[600]!])
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
                  period,
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

  Widget _buildOverallProgressCard() {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Genel İlerleme',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green[100],
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Text(
                  '%${progressData['totalProgress']}',
                  style: TextStyle(
                    color: Colors.green[700],
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Circular Progress
          AnimatedBuilder(
            animation: _progressAnimation,
            builder: (context, child) {
              return SizedBox(
                height: 120,
                width: 120,
                child: Stack(
                  children: [
                    Center(
                      child: SizedBox(
                        height: 120,
                        width: 120,
                        child: CircularProgressIndicator(
                          value: (progressData['totalProgress'] / 100) * _progressAnimation.value,
                          strokeWidth: 12,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.deepPurple[600]!),
                        ),
                      ),
                    ),
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '${(progressData['totalProgress'] * _progressAnimation.value).toInt()}%',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[800],
                            ),
                          ),
                          Text(
                            'Tamamlandı',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          
          const SizedBox(height: 20),
          
          // Stats Row
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  '${progressData['coursesCompleted']}/${progressData['totalCourses']}',
                  'Kurslar',
                  Icons.book,
                  Colors.blue,
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  '${progressData['hoursStudied']}h',
                  'Çalışma',
                  Icons.schedule,
                  Colors.green,
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  '${progressData['streak']} gün',
                  'Seri',
                  Icons.local_fire_department,
                  Colors.orange,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
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

  Widget _buildWeeklyChart() {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Haftalık Aktivite',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              Text(
                '${progressData['weeklyProgress']}%',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.deepPurple[600],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
                     // Chart
           SizedBox(
             height: 150,
             child: Row(
               mainAxisAlignment: MainAxisAlignment.spaceEvenly,
               crossAxisAlignment: CrossAxisAlignment.end,
               children: weeklyData.map((data) {
                 return AnimatedBuilder(
                   animation: _progressAnimation,
                   builder: (context, child) {
                     // Bar yüksekliğini maksimum 100 piksel ile sınırla
                     double barHeight = ((data['percentage'] / 100) * 100 * _progressAnimation.value);
                     barHeight = barHeight > 100 ? 100 : barHeight;
                     
                     return Column(
                       mainAxisAlignment: MainAxisAlignment.end,
                       children: [
                         Text(
                           '${data['hours']}h',
                           style: TextStyle(
                             fontSize: 12,
                             fontWeight: FontWeight.w600,
                             color: Colors.grey[700],
                           ),
                         ),
                         const SizedBox(height: 4),
                         Container(
                           width: 25,
                           height: barHeight,
                           decoration: BoxDecoration(
                             gradient: LinearGradient(
                               begin: Alignment.bottomCenter,
                               end: Alignment.topCenter,
                               colors: [
                                 Colors.deepPurple[600]!,
                                 Colors.pink[400]!,
                               ],
                             ),
                             borderRadius: BorderRadius.circular(12),
                           ),
                         ),
                         const SizedBox(height: 8),
                         Text(
                           data['day'],
                           style: TextStyle(
                             fontSize: 12,
                             color: Colors.grey[600],
                           ),
                         ),
                       ],
                     );
                   },
                 );
               }).toList(),
             ),
           ),
        ],
      ),
    );
  }

  Widget _buildAchievementsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Başarılar',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          
          const SizedBox(height: 16),
          
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: achievements.map((achievement) {
              return _buildAchievementBadge(achievement);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAchievementBadge(Map<String, dynamic> achievement) {
    final isUnlocked = achievement['isUnlocked'];
    
    return Container(
      width: (MediaQuery.of(context).size.width - 80) / 3,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isUnlocked ? achievement['color'][50] : Colors.grey[100],
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: isUnlocked ? achievement['color'][200] : Colors.grey[300]!,
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isUnlocked ? achievement['color'] : Colors.grey[400],
              shape: BoxShape.circle,
            ),
            child: Icon(
              achievement['icon'],
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            achievement['title'],
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isUnlocked ? achievement['color'][700] : Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            achievement['description'],
            style: TextStyle(
              fontSize: 10,
              color: isUnlocked ? Colors.grey[600] : Colors.grey[500],
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildCourseProgress() {
    final List<Map<String, dynamic>> courseProgress = [
      {'name': 'Trafik Kuralları', 'progress': 100, 'color': Colors.green},
      {'name': 'Direksiyon Teknikleri', 'progress': 75, 'color': Colors.blue},
      {'name': 'Park Etme', 'progress': 90, 'color': Colors.orange},
      {'name': 'Motor Bilgisi', 'progress': 45, 'color': Colors.purple},
      {'name': 'Güvenli Sürüş', 'progress': 20, 'color': Colors.red},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Kurs İlerlemesi',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          
          const SizedBox(height: 16),
          
          ...courseProgress.map((course) {
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        course['name'],
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[700],
                        ),
                      ),
                      Text(
                        '%${course['progress']}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: course['color'],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  AnimatedBuilder(
                    animation: _progressAnimation,
                    builder: (context, child) {
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: (course['progress'] / 100) * _progressAnimation.value,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(course['color']),
                          minHeight: 8,
                        ),
                      );
                    },
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }
} 