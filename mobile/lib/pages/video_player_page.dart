import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class LearningPage extends StatefulWidget {
  final Map<String, dynamic> content;
  final Map<String, dynamic> course;

  const LearningPage({
    super.key,
    required this.content,
    required this.course,
  });

  @override
  State<LearningPage> createState() => _LearningPageState();
}

class _LearningPageState extends State<LearningPage> {
  VideoPlayerController? _videoController;
  List<Map<String, dynamic>> courseContents = [];
  int currentIndex = 0;
  bool isLoading = true;
  bool isVideoLoading = false;
  double progress = 0.0;
  bool isCompleted = false;

  @override
  void initState() {
    super.initState();
    _loadCourseContents();
  }

  @override
  void dispose() {
    _videoController?.removeListener(_videoListener);
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _loadCourseContents() async {
    try {
      setState(() => isLoading = true);
      
      final courseId = widget.course['id'];
      if (courseId != null) {
        final courseDetail = await ApiService.getCourseDetail(courseId);
        
        if (courseDetail != null && courseDetail['courseContents'] != null) {
          final contents = (courseDetail['courseContents'] as List).map((content) {
            print('Backend Content: ${content.toString()}'); // DEBUG
            return {
              'id': content['id'],
              'title': content['title'] ?? 'Başlıksız',
              'description': content['description'] ?? '',
              'contentType': content['contentType'] ?? 0,
              'contentUrl': content['contentUrl'] ?? '',
              'duration': content['duration'] ?? (content['contentType'] == 0 ? '00:15:00' : '00:05:00'), // Video için 15dk, diğerleri için 5dk
              'order': content['order'] ?? 0,
            };
          }).toList();
          
          contents.sort((a, b) => (a['order'] as int).compareTo(b['order'] as int));
          
          final currentIndex = contents.indexWhere((c) => 
            c['id'] == widget.content['id'] || c['title'] == widget.content['title']);
          
          setState(() {
            courseContents = contents;
            this.currentIndex = currentIndex >= 0 ? currentIndex : 0;
            isLoading = false;
          });
          
          _initializeContent();
        }
      }
    } catch (e) {
      setState(() {
        courseContents = [{
          'id': widget.content['id'] ?? 'fallback',
          'title': widget.content['title'] ?? 'Başlıksız',
          'description': widget.content['description'] ?? '',
          'contentType': widget.content['contentType'] ?? widget.content['type'] == 'video' ? 0 : 1,
          'contentUrl': widget.content['contentUrl'] ?? '',
          'duration': widget.content['duration'] ?? '00:15:00',
          'order': 0,
        }];
        currentIndex = 0;
        isLoading = false;
      });
      _initializeContent();
    }
  }

  void _initializeContent() {
    if (courseContents.isNotEmpty) {
      final currentContent = courseContents[currentIndex];
      final contentType = currentContent['contentType'] ?? 0;
      
      if (contentType == 0) { // Video
        _initializeVideo(currentContent['contentUrl']);
      }
    }
  }

  void _videoListener() {
    if (_videoController != null && _videoController!.value.isInitialized) {
      final position = _videoController!.value.position;
      final duration = _videoController!.value.duration;
      
      if (duration.inMilliseconds > 0) {
        final newProgress = position.inMilliseconds / duration.inMilliseconds;
        setState(() {
          progress = newProgress.clamp(0.0, 1.0);
        });
        
        // Video bittiyse tamamlama dialogu göster
        if (newProgress >= 0.95 && !isCompleted) {
          setState(() {
            progress = 1.0;
            isCompleted = true;
          });
          _showCompletionDialog();
        }
      }
    }
  }

    void _initializeVideo(String? videoUrl) {
    _videoController?.removeListener(_videoListener);
    _videoController?.dispose();
    
    print('🎬 Original Video URL: "$videoUrl"'); 
    
    // API Service'teki helper fonksiyonu kullan
    final fullVideoUrl = ApiService.getFullMediaUrl(videoUrl);
    print('🌐 Full Video URL: "$fullVideoUrl"');
    
    if (fullVideoUrl.isNotEmpty) {
      // Gerçek video URL varsa
      print('Gerçek video yükleniyor: $fullVideoUrl');
      setState(() {
        isVideoLoading = true;
      });
      
      try {
        _videoController = VideoPlayerController.networkUrl(
          Uri.parse(fullVideoUrl),
          httpHeaders: {
            'Accept': 'video/mp4,video/*,*/*',
            'Range': 'bytes=0-',
            'User-Agent': 'Flutter Video Player',
            'Cache-Control': 'no-cache',
          },
        );
        
        _videoController!.initialize().then((_) {
          if (mounted) {
            _videoController!.addListener(_videoListener);
            setState(() {
              isVideoLoading = false;
            });
            print('✅ Video başarıyla yüklendi: $fullVideoUrl');
            print('📱 Video duration: ${_videoController!.value.duration}');
            print('📐 Video size: ${_videoController!.value.size}');
          }
        }).catchError((error) {
          print('❌ Video yüklenemedi: $error');
          print('❌ Video URL: $fullVideoUrl');
          print('❌ Error Type: ${error.runtimeType}');
          if (mounted) {
            setState(() {
              isVideoLoading = false;
            });
            // Error durumunda demo video dene
            _tryDemoVideo();
          }
        });
      } catch (e) {
        print('❌ Video controller oluşturma hatası: $e');
        if (mounted) {
          setState(() {
            isVideoLoading = false;
          });
          _createMockVideo();
        }
      }
    } else {
      // Video URL yok, demo video dene
      print('Video URL boş, demo video deniyor...');
      _tryDemoVideo();
    }
  }

  void _tryDemoVideo() {
    const demoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    print('Demo URL: $demoUrl');
    
    setState(() {
      isVideoLoading = true;
    });
    
    try {
      _videoController = VideoPlayerController.networkUrl(
        Uri.parse(demoUrl),
        httpHeaders: {
          'Accept': 'video/mp4,video/*,*/*',
          'User-Agent': 'Flutter Video Player',
        },
      );
      
      final urlForLogging = demoUrl;
      _videoController!.initialize().then((_) {
        if (mounted) {
          _videoController!.addListener(_videoListener);
          setState(() {
            isVideoLoading = false;
          });
          print('✅ Demo video başarıyla yüklendi: $urlForLogging');
          print('Video duration: ${_videoController!.value.duration}');
          print('Video size: ${_videoController!.value.size}');
        }
      }).catchError((error) {
        print('❌ Demo video de yüklenemedi: $error');
        if (mounted) {
          setState(() {
            isVideoLoading = false;
          });
          _createMockVideo();
        }
      });
    } catch (e) {
      print('❌ Demo video controller oluşturma hatası: $e');
      if (mounted) {
        setState(() {
          isVideoLoading = false;
        });
        _createMockVideo();
      }
    }
  }

  void _createMockVideo() {
    // Mock video için başlangıç durumu
    setState(() {
      progress = 0.0;
    });
    print('Mock video modu - Play butonuna basın');
  }

  ContentType _getContentType() {
    if (courseContents.isEmpty) return ContentType.video;
    final contentType = courseContents[currentIndex]['contentType'] ?? 0;
    switch (contentType) {
      case 0: return ContentType.video;
      case 1: return ContentType.text;
      case 2: return ContentType.pdf;
      default: return ContentType.video;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Yükleniyor...'),
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: Column(
        children: [
          // Modern AppBar
          _buildAppBar(),
          
          // Ana İçerik
          Expanded(
            child: _buildMainContent(),
          ),
          
          // Alt Navigation
          _buildBottomNavigation(),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    final currentContent = courseContents.isNotEmpty ? courseContents[currentIndex] : widget.content;
    
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top,
        left: 16,
        right: 16,
        bottom: 16,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.grey[100],
                  foregroundColor: Colors.grey[700],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      currentContent['title'] ?? 'İçerik',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1A1A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      widget.course['title'] ?? 'Kurs',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              _buildContentTypeChip(),
            ],
          ),
          const SizedBox(height: 12),
          // Progress Bar
          Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${currentIndex + 1}/${courseContents.length} İçerik',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '${(progress * 100).toInt()}%',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF4285F4),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              LinearProgressIndicator(
                value: progress,
                backgroundColor: const Color(0xFFE8F0FE),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4285F4)),
                minHeight: 4,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContentTypeChip() {
    final contentType = _getContentType();
    late IconData icon;
    late String label;
    late Color color;
    
    switch (contentType) {
      case ContentType.video:
        icon = Icons.play_circle_filled;
        label = 'Video';
        color = const Color(0xFFEA4335);
        break;
      case ContentType.text:
        icon = Icons.article;
        label = 'Metin';
        color = const Color(0xFF4285F4);
        break;
      case ContentType.pdf:
        icon = Icons.picture_as_pdf;
        label = 'PDF';
        color = const Color(0xFFFBBC04);
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    if (courseContents.isEmpty) {
      return const Center(child: Text('İçerik bulunamadı'));
    }

    final contentType = _getContentType();
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ana İçerik Kartı
          _buildContentCard(contentType),
          
          const SizedBox(height: 24),
          
          // İçerik Listesi
          _buildContentList(),
        ],
      ),
    );
  }

  Widget _buildContentCard(ContentType contentType) {
    switch (contentType) {
      case ContentType.video:
        return _buildVideoCard();
      case ContentType.text:
        return _buildTextCard();
      case ContentType.pdf:
        return _buildPdfCard();
    }
  }

  Widget _buildVideoCard() {
    final currentContent = courseContents[currentIndex];
    final hasRealVideo = _videoController?.value.isInitialized ?? false;
    final hasError = _videoController?.value.hasError ?? false;
    
    print('🎬 Building Video Card:');
    print('- Has Controller: ${_videoController != null}');
    print('- Is Initialized: $hasRealVideo');
    print('- Has Error: $hasError');
    print('- Content URL: ${currentContent['contentUrl']}');
    print('- Progress: $progress');
    
    if (hasError) {
      print('🚨 Video Error: ${_videoController?.value.errorDescription}');
    }
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Video Player
          Container(
            height: 220,
            decoration: const BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
                         child: Stack(
               children: [
                 // Video Content
                 if (isVideoLoading)
                   // Loading State
                   const Center(
                     child: Column(
                       mainAxisAlignment: MainAxisAlignment.center,
                       children: [
                         CircularProgressIndicator(
                           valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                         ),
                         SizedBox(height: 12),
                         Text(
                           'Video yükleniyor...',
                           style: TextStyle(
                             color: Colors.white,
                             fontSize: 16,
                             fontWeight: FontWeight.w500,
                           ),
                         ),
                       ],
                     ),
                   )
                 else if (hasRealVideo)
                   // Real Video Player
                   ClipRRect(
                     borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                     child: SizedBox.expand(
                       child: VideoPlayer(_videoController!),
                     ),
                   )
                 else if (hasError)
                   // Error State
                   Center(
                     child: Column(
                       mainAxisAlignment: MainAxisAlignment.center,
                       children: [
                         Container(
                           padding: const EdgeInsets.all(16),
                           decoration: BoxDecoration(
                             color: Colors.red.withOpacity(0.1),
                             shape: BoxShape.circle,
                           ),
                           child: Icon(
                             Icons.error_outline,
                             size: 40,
                             color: Colors.red[600],
                           ),
                         ),
                         const SizedBox(height: 12),
                         Text(
                           'Video yüklenemedi',
                           style: TextStyle(
                             color: Colors.red[600],
                             fontSize: 16,
                             fontWeight: FontWeight.w500,
                           ),
                         ),
                         const SizedBox(height: 8),
                         Text(
                           'Lütfen internet bağlantınızı kontrol edin',
                           style: TextStyle(
                             color: Colors.grey[400],
                             fontSize: 12,
                           ),
                         ),
                         const SizedBox(height: 16),
                         TextButton.icon(
                           onPressed: () {
                             // Videoyu yeniden yüklemeyi dene
                             final currentContent = courseContents[currentIndex];
                             _initializeVideo(currentContent['contentUrl']);
                           },
                           icon: const Icon(Icons.refresh, size: 16),
                           label: const Text('Yeniden Dene'),
                           style: TextButton.styleFrom(
                             foregroundColor: Colors.blue[600],
                           ),
                         ),
                       ],
                     ),
                   )
                 else
                   // Mock Video Player
                   Center(
                     child: Column(
                       mainAxisAlignment: MainAxisAlignment.center,
                       children: [
                         Container(
                           padding: const EdgeInsets.all(16),
                           decoration: BoxDecoration(
                             color: Colors.white.withOpacity(0.1),
                             shape: BoxShape.circle,
                           ),
                           child: const Icon(
                             Icons.play_arrow,
                             size: 32,
                             color: Colors.white,
                           ),
                         ),
                         const SizedBox(height: 12),
                         Column(
                           children: [
                             const Text(
                               'Video player sorunu\nTarayıcıda açılsın mı?',
                               style: TextStyle(
                                 color: Colors.white,
                                 fontSize: 16,
                                 fontWeight: FontWeight.w500,
                               ),
                               textAlign: TextAlign.center,
                             ),
                             const SizedBox(height: 12),
                             ElevatedButton.icon(
                               onPressed: () {
                                 final videoUrl = courseContents[currentIndex]['contentUrl'];
                                 if (videoUrl != null && videoUrl.isNotEmpty) {
                                   final serverUrl = 'http://192.168.1.78:5068';
                                   final fullUrl = videoUrl.startsWith('http') 
                                       ? videoUrl 
                                       : '$serverUrl$videoUrl';
                                   _openUrl(fullUrl);
                                 }
                               },
                               icon: const Icon(Icons.open_in_browser, size: 16),
                               label: const Text('Tarayıcıda Aç'),
                               style: ElevatedButton.styleFrom(
                                 backgroundColor: Colors.blue[600],
                                 foregroundColor: Colors.white,
                                 padding: const EdgeInsets.symmetric(
                                   horizontal: 16, vertical: 8
                                 ),
                               ),
                             ),
                           ],
                         ),
                       ],
                     ),
                   ),
                
                                 // Play/Pause Button (sadece loading olmadığında göster)
                 if (!isVideoLoading)
                   Center(
                     child: GestureDetector(
                       onTap: _togglePlayPause,
                       child: Container(
                         padding: const EdgeInsets.all(16),
                         decoration: BoxDecoration(
                           color: const Color(0xFF4285F4).withOpacity(0.9),
                           shape: BoxShape.circle,
                           boxShadow: [
                             BoxShadow(
                               color: Colors.black.withOpacity(0.3),
                               blurRadius: 8,
                               offset: const Offset(0, 2),
                             ),
                           ],
                         ),
                         child: Icon(
                           hasRealVideo && (_videoController?.value.isPlaying ?? false)
                               ? Icons.pause
                               : Icons.play_arrow,
                           size: 40,
                           color: Colors.white,
                         ),
                       ),
                     ),
                   ),
                
                // Progress Bar (Video)
                if (hasRealVideo)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: VideoProgressIndicator(
                      _videoController!,
                      allowScrubbing: true,
                      colors: const VideoProgressColors(
                        playedColor: Color(0xFF4285F4),
                        backgroundColor: Color(0x33FFFFFF),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Video Info
          Padding(
            padding: const EdgeInsets.all(16),
            child: _buildContentInfo(currentContent),
          ),
        ],
      ),
    );
  }

  Widget _buildTextCard() {
    final currentContent = courseContents[currentIndex];
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4285F4).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.article,
                    color: Color(0xFF4285F4),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Metin İçeriği',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildContentInfo(currentContent),
            const SizedBox(height: 16),
            if (currentContent['contentUrl'] != null && 
                currentContent['contentUrl'].toString().isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _openUrl(currentContent['contentUrl']),
                  icon: const Icon(Icons.open_in_browser),
                  label: const Text('Metni Oku'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4285F4),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPdfCard() {
    final currentContent = courseContents[currentIndex];
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBBC04).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.picture_as_pdf,
                    color: Color(0xFFFBBC04),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'PDF Dökümanı',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildContentInfo(currentContent),
            const SizedBox(height: 16),
            if (currentContent['contentUrl'] != null && 
                currentContent['contentUrl'].toString().isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _openUrl(currentContent['contentUrl']),
                  icon: const Icon(Icons.open_in_browser),
                  label: const Text('PDF\'i Aç'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFBBC04),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentInfo(Map<String, dynamic> content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          content['title'] ?? 'Başlıksız',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
          ),
        ),
        if (content['description'] != null && 
            content['description'].toString().isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            content['description'],
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
        const SizedBox(height: 12),
        // Duration Badge
        if (content['duration'] != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  _formatDuration(content['duration']),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildContentList() {
    if (courseContents.length <= 1) return Container();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Kurs İçerikleri',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 12),
        ...courseContents.asMap().entries.map((entry) {
          final index = entry.key;
          final content = entry.value;
          final isCurrent = index == currentIndex;
          
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              selected: isCurrent,
              selectedTileColor: const Color(0xFFE8F0FE),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(
                  color: isCurrent ? const Color(0xFF4285F4) : Colors.grey[200]!,
                ),
              ),
              leading: _buildContentTypeIcon(content['contentType'] ?? 0, isCurrent),
              title: Text(
                content['title'] ?? 'Başlıksız',
                style: TextStyle(
                  fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w500,
                  color: isCurrent ? const Color(0xFF1A1A1A) : Colors.grey[700],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: content['duration'] != null
                  ? Text(_formatDuration(content['duration']))
                  : null,
              trailing: isCurrent
                  ? const Icon(Icons.play_arrow, color: Color(0xFF4285F4))
                  : null,
              onTap: () => _goToContent(index),
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildContentTypeIcon(int contentType, bool isCurrent) {
    late IconData icon;
    late Color color;
    
    switch (contentType) {
      case 0:
        icon = Icons.play_circle_outline;
        color = const Color(0xFFEA4335);
        break;
      case 1:
        icon = Icons.article_outlined;
        color = const Color(0xFF4285F4);
        break;
      case 2:
        icon = Icons.picture_as_pdf_outlined;
        color = const Color(0xFFFBBC04);
        break;
      default:
        icon = Icons.help_outline;
        color = Colors.grey;
    }
    
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: isCurrent ? color.withOpacity(0.2) : color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        icon,
        size: 20,
        color: color,
      ),
    );
  }

  Widget _buildBottomNavigation() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 4,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Önceki
          Expanded(
            child: OutlinedButton.icon(
              onPressed: currentIndex > 0 ? _gotoPrevious : null,
              icon: const Icon(Icons.arrow_back),
              label: const Text('Önceki'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF4285F4),
                side: const BorderSide(color: Color(0xFF4285F4)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Tamamla/Sonraki
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: _completeAndNext,
              icon: Icon(
                currentIndex < courseContents.length - 1 
                    ? Icons.arrow_forward 
                    : Icons.check,
              ),
              label: Text(
                currentIndex < courseContents.length - 1 
                    ? 'Sonraki' 
                    : 'Tamamla',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4285F4),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _togglePlayPause() {
    if (_videoController?.value.isInitialized ?? false) {
      if (_videoController!.value.isPlaying) {
        _videoController!.pause();
      } else {
        _videoController!.play();
      }
      setState(() {});
    } else {
      // Mock video için sadece buton basılınca simüle et
      if (progress == 0.0) {
        _simulateProgress();
      }
      setState(() {});
    }
  }

  void _simulateProgress() {
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted && progress < 1.0) {
        setState(() {
          progress += 0.02; // %2 artır (50 adımda tamamlansın)
        });
        if (progress < 1.0) {
          _simulateProgress();
        } else {
          setState(() {
            progress = 1.0;
            isCompleted = true;
          });
          _showCompletionDialog();
        }
      }
    });
  }

  void _goToContent(int index) {
    if (index == currentIndex) return;
    
    // Video progress'i reset et
    _videoController?.removeListener(_videoListener);
    _videoController?.pause();
    
    setState(() {
      currentIndex = index;
      progress = 0.0;
      isCompleted = false;
    });
    
    _initializeContent();
    print('Content değişti: ${courseContents[index]['title']}');
  }

  void _gotoPrevious() {
    if (currentIndex > 0) {
      _goToContent(currentIndex - 1);
    }
  }

  void _completeAndNext() {
    if (!isCompleted) {
      setState(() {
        progress = 1.0;
        isCompleted = true;
      });
    }
    
    if (currentIndex < courseContents.length - 1) {
      _goToContent(currentIndex + 1);
    } else {
      _showCourseCompletedDialog();
    }
  }

  Future<void> _openUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _showUrlDialog(url);
      }
    } catch (e) {
      _showUrlDialog(url);
    }
  }

  void _showUrlDialog(String url) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('İçerik URL\'i'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Bu URL\'i kopyalayıp tarayıcınızda açabilirsiniz:'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: SelectableText(url),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Kapat'),
          ),
        ],
      ),
    );
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.celebration, color: Color(0xFF34A853)),
            SizedBox(width: 8),
            Text('Tebrikler!'),
          ],
        ),
        content: const Text('Bu içeriği başarıyla tamamladınız!'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Kapat'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _completeAndNext();
            },
            child: const Text('Sonraki İçerik'),
          ),
        ],
      ),
    );
  }

  void _showCourseCompletedDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.celebration, color: Color(0xFF34A853)),
            SizedBox(width: 8),
            Text('Kurs Tamamlandı!'),
          ],
        ),
        content: const Text('Bu kursun tüm içeriklerini başarıyla tamamladınız!'),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Kurslara Dön'),
          ),
        ],
      ),
    );
  }

  String _formatDuration(dynamic duration) {
    if (duration == null) return '15dk'; // Varsayılan süre
    
    // String formatı: "01:30:00" veya "1.05:30:00" 
    if (duration is String) {
      if (duration.contains(':')) {
        final parts = duration.split(':');
        if (parts.length >= 3) {
          // HH:MM:SS formatı
          final hours = int.tryParse(parts[0]) ?? 0;
          final minutes = int.tryParse(parts[1]) ?? 0;
          
          if (hours > 0) {
            return '${hours}s ${minutes}dk';
          } else {
            return '${minutes}dk';
          }
        } else if (parts.length == 2) {
          // MM:SS formatı
          final minutes = int.tryParse(parts[0]) ?? 0;
          return '${minutes}dk';
        }
      }
      
      // "1.05:30:00" gibi TimeSpan formatı
      if (duration.contains('.')) {
        final timeSpanParts = duration.split('.');
        if (timeSpanParts.length >= 2) {
          final days = int.tryParse(timeSpanParts[0]) ?? 0;
          final timePart = timeSpanParts[1];
          final timeParts = timePart.split(':');
          
          if (timeParts.length >= 2) {
            final hours = int.tryParse(timeParts[0]) ?? 0;
            final minutes = int.tryParse(timeParts[1]) ?? 0;
            final totalHours = (days * 24) + hours;
            
            if (totalHours > 0) {
              return '${totalHours}s ${minutes}dk';
            } else {
              return '${minutes}dk';
            }
          }
        }
      }
      
      return duration.isNotEmpty ? duration : '15dk';
    } 
    
    // Integer formatı (saniye cinsinden)
    else if (duration is int) {
      final hours = duration ~/ 3600;
      final minutes = (duration % 3600) ~/ 60;
      
      if (hours > 0) {
        return '${hours}s ${minutes}dk';
      } else {
        return '${minutes > 0 ? minutes : 15}dk';
      }
    }
    
    return '15dk';
  }
}

enum ContentType {
  video,
  text,
  pdf,
} 