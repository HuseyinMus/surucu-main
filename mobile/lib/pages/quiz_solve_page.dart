import 'package:flutter/material.dart';
import 'dart:async';

class QuizSolvePage extends StatefulWidget {
  final Map<String, dynamic> quiz;

  const QuizSolvePage({super.key, required this.quiz});

  @override
  State<QuizSolvePage> createState() => _QuizSolvePageState();
}

class _QuizSolvePageState extends State<QuizSolvePage> {
  int currentQuestionIndex = 0;
  int? selectedAnswer;
  int correctAnswers = 0;
  int totalSeconds = 0;
  Timer? timer;
  bool isCompleted = false;

  // Örnek sorular
  final List<Map<String, dynamic>> questions = [
    {
      'question': 'Trafik ışığında sarı ışık ne anlama gelir?',
      'options': [
        'Hızlanabilirsiniz',
        'Dikkatli geçebilirsiniz', 
        'Durmanız gerekir',
        'Geri gidebilirsiniz'
      ],
      'correctAnswer': 2,
      'image': null,
    },
    {
      'question': 'Yaşlılara yol verme zorunluluğu hangi durumda vardır?',
      'options': [
        'Sadece yaya geçidinde',
        'Her durumda',
        'Sadece park yerinde',
        'Hiçbir zaman'
      ],
      'correctAnswer': 1,
      'image': null,
    },
    {
      'question': 'Şehir içinde maksimum hız limiti kaç km/saat\'tir?',
      'options': [
        '30 km/s',
        '50 km/s', 
        '70 km/s',
        '90 km/s'
      ],
      'correctAnswer': 1,
      'image': null,
    },
    {
      'question': 'Kırmızı ışıkta geçmek için ne yapmalısınız?',
      'options': [
        'Hızla geçerim',
        'Durur beklerim',
        'Kornaya basarım',
        'Sağa dönebilirim'
      ],
      'correctAnswer': 1,
      'image': null,
    },
    {
      'question': 'Alkollü araç kullanmak yasak mıdır?',
      'options': [
        'Hayır, az miktarda içilebilir',
        'Evet, tamamen yasaktır',
        'Sadece gece yasaktır',
        'Sadece otoyolda yasaktır'
      ],
      'correctAnswer': 1,
      'image': null,
    },
  ];

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        totalSeconds++;
      });
    });
  }

  void _selectAnswer(int index) {
    setState(() {
      selectedAnswer = index;
    });
  }

  void _nextQuestion() {
    if (selectedAnswer == null) return;

    // Cevabı kontrol et
    if (selectedAnswer == questions[currentQuestionIndex]['correctAnswer']) {
      correctAnswers++;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setState(() {
        currentQuestionIndex++;
        selectedAnswer = null;
      });
    } else {
      _completeQuiz();
    }
  }

  void _completeQuiz() {
    timer?.cancel();
    setState(() {
      isCompleted = true;
    });
  }

  String _formatTime(int seconds) {
    int minutes = seconds ~/ 60;
    int remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  double get progressPercentage {
    return (currentQuestionIndex + 1) / questions.length;
  }

  double get scorePercentage {
    return (correctAnswers / questions.length) * 100;
  }

  @override
  Widget build(BuildContext context) {
    if (isCompleted) {
      return _buildResultScreen();
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('${widget.quiz['title']}'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            _showExitDialog();
          },
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.timer, size: 16),
                const SizedBox(width: 4),
                Text(
                  _formatTime(totalSeconds),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // İlerleme çubuğu
          _buildProgressBar(),
          
          // Soru alanı
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Soru kartı
                  _buildQuestionCard(),
                  
                  const SizedBox(height: 20),
                  
                  // Cevap seçenekleri
                  Expanded(child: _buildAnswerOptions()),
                  
                  // İleri butonu
                  _buildNextButton(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Soru ${currentQuestionIndex + 1}/${questions.length}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
              Text(
                '${(progressPercentage * 100).toInt()}% Tamamlandı',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: progressPercentage,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
            minHeight: 6,
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard() {
    final question = questions[currentQuestionIndex];
    
    return Container(
      width: double.infinity,
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
        children: [
          // Soru metni
          Text(
            question['question'],
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
          
          // Soru görseli (varsa)
          if (question['image'] != null) ...[
            const SizedBox(height: 20),
            Container(
              height: 120,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Icon(
                  Icons.image,
                  size: 40,
                  color: Colors.grey,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAnswerOptions() {
    final question = questions[currentQuestionIndex];
    
    return ListView.separated(
      itemCount: question['options'].length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final isSelected = selectedAnswer == index;
        
        return GestureDetector(
          onTap: () => _selectAnswer(index),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isSelected ? Colors.blue[50] : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? Colors.blue[600]! : Colors.grey[200]!,
                width: isSelected ? 2 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  spreadRadius: 0,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected ? Colors.blue[600] : Colors.transparent,
                    border: Border.all(
                      color: isSelected ? Colors.blue[600]! : Colors.grey[400]!,
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 16,
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '${String.fromCharCode(65 + index)}) ${question['options'][index]}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: isSelected ? Colors.blue[700] : Colors.grey[800],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildNextButton() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 20),
      child: ElevatedButton(
        onPressed: selectedAnswer != null ? _nextQuestion : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blue[600],
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: Text(
          currentQuestionIndex < questions.length - 1 ? 'Sonraki Soru' : 'Sınavı Bitir',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildResultScreen() {
    final isPassed = scorePercentage >= 70;
    
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Sonuç ikonu
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isPassed ? Colors.green[50] : Colors.red[50],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPassed ? Icons.check_circle : Icons.cancel,
                  size: 80,
                  color: isPassed ? Colors.green[600] : Colors.red[600],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Başlık
              Text(
                isPassed ? 'Tebrikler!' : 'Tekrar Deneyin',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: isPassed ? Colors.green[700] : Colors.red[700],
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                isPassed ? 'Sınavı başarıyla geçtiniz!' : 'Sınavı geçemediniz',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Sonuç kartı
              Container(
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
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Doğru Cevap:',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          '$correctAnswers/${questions.length}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[800],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Puan:',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          '${scorePercentage.toInt()}%',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: isPassed ? Colors.green[600] : Colors.red[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Süre:',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          _formatTime(totalSeconds),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[800],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Butonlar
              Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        // Tekrar dene
                        setState(() {
                          currentQuestionIndex = 0;
                          selectedAnswer = null;
                          correctAnswers = 0;
                          totalSeconds = 0;
                          isCompleted = false;
                        });
                        _startTimer();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[600],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Tekrar Dene',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey[700],
                        side: BorderSide(color: Colors.grey[300]!),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Ana Sayfaya Dön',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
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

  void _showExitDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          title: Text(
            'Sınavdan Çık',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
          content: Text(
            'Sınavdan çıkmak istediğinizden emin misiniz? İlerlemeniz kaybedilecek.',
            style: TextStyle(
              color: Colors.grey[700],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Devam Et',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[600],
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Çık'),
            ),
          ],
        );
      },
    );
  }
} 