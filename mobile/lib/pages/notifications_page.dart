import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // Backend verilerini tutacak değişkenler
  List<Map<String, dynamic>> notifications = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );
    _fadeController.forward();
    
    loadNotifications();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> loadNotifications() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final notificationsData = await ApiService.getNotifications();
      
      if (notificationsData != null) {
        setState(() {
          notifications = notificationsData.map((notification) => {
            'id': notification['id'],
            'title': notification['title'] ?? 'Bildirim',
            'message': notification['message'] ?? notification['content'] ?? '',
            'type': _mapNotificationType(notification['type']),
            'time': _formatTime(notification['createdAt']),
            'isRead': notification['isRead'] ?? false,
            'icon': _getNotificationIcon(notification['type']),
            'color': _getNotificationColor(notification['type']),
          }).toList();
          isLoading = false;
        });
      } else {
        throw Exception('Bildirimler yüklenemedi');
      }
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = 'Bildirimler yüklenirken hata oluştu: ${e.toString()}';
      });
      print('Bildirimler yükleme hatası: $e');
    }
  }

  String _mapNotificationType(dynamic type) {
    if (type == null) return 'Genel';
    
    final typeStr = type.toString().toLowerCase();
    switch (typeStr) {
      case 'course':
      case 'kurs':
        return 'Kurs';
      case 'quiz':
      case 'exam':
      case 'sinav':
        return 'Sınav';
      case 'announcement':
      case 'duyuru':
        return 'Duyuru';
      case 'system':
      case 'sistem':
        return 'Sistem';
      default:
        return 'Genel';
    }
  }

  String _formatTime(dynamic createdAt) {
    if (createdAt == null) return 'Bilinmiyor';
    
    try {
      DateTime date = DateTime.parse(createdAt.toString());
      DateTime now = DateTime.now();
      Duration difference = now.difference(date);
      
      if (difference.inMinutes < 60) {
        return '${difference.inMinutes} dakika önce';
      } else if (difference.inHours < 24) {
        return '${difference.inHours} saat önce';
      } else {
        return '${difference.inDays} gün önce';
      }
    } catch (e) {
      return 'Bilinmiyor';
    }
  }

  IconData _getNotificationIcon(dynamic type) {
    final typeStr = _mapNotificationType(type);
    switch (typeStr) {
      case 'Kurs':
        return Icons.book_outlined;
      case 'Sınav':
        return Icons.quiz_outlined;
      case 'Duyuru':
        return Icons.campaign_outlined;
      case 'Sistem':
        return Icons.settings_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  MaterialColor _getNotificationColor(dynamic type) {
    final typeStr = _mapNotificationType(type);
    switch (typeStr) {
      case 'Kurs':
        return Colors.blue;
      case 'Sınav':
        return Colors.green;
      case 'Duyuru':
        return Colors.red;
      case 'Sistem':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  int get unreadCount {
    return notifications.where((notif) => !notif['isRead']).length;
  }

  void markAsRead(int id) {
    setState(() {
      final index = notifications.indexWhere((notif) => notif['id'] == id);
      if (index != -1) {
        notifications[index]['isRead'] = true;
      }
    });
    
    // Backend'e bildir
    ApiService.markNotificationAsRead(id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: isLoading 
              ? _buildLoadingState()
              : errorMessage != null
                  ? _buildErrorState()
                  : Column(
                      children: [
                        // AppBar
                        _buildAppBar(),
                        
                        // Content
                        Expanded(
                          child: RefreshIndicator(
                            onRefresh: loadNotifications,
                            child: _buildNotificationsContent(),
                          ),
                        ),
                      ],
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
          Text('Bildirimler yükleniyor...'),
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
            'Bildirimler yüklenemedi',
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
            onPressed: loadNotifications,
            child: const Text('Tekrar Dene'),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
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
                const Text(
                  'Bildirimler',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  isLoading 
                      ? 'Yükleniyor...' 
                      : unreadCount > 0 
                          ? '$unreadCount okunmamış bildirim'
                          : 'Tüm bildirimler okundu',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          if (unreadCount > 0)
            GestureDetector(
              onTap: () {
                // Tümünü okundu olarak işaretle
                for (var notification in notifications) {
                  if (!notification['isRead']) {
                    markAsRead(notification['id']);
                  }
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Tümünü Okundu İşaretle',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildNotificationsContent() {
    if (notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_off_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Henüz bildirim yok',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Yeni bildirimler burada görünecek',
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
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        return _buildNotificationCard(notifications[index]);
      },
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    final isRead = notification['isRead'];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: () {
          if (!isRead) {
            markAsRead(notification['id']);
          }
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isRead ? Colors.white : notification['color'][50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isRead ? Colors.grey[200]! : notification['color'][200],
              width: isRead ? 1 : 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                spreadRadius: 1,
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: notification['color'][600],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  notification['icon'],
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification['title'],
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: isRead ? FontWeight.w500 : FontWeight.w600,
                              color: Colors.grey[800],
                            ),
                          ),
                        ),
                        if (!isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: notification['color'][600],
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification['message'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: notification['color'][100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            notification['type'],
                            style: TextStyle(
                              fontSize: 11,
                              color: notification['color'][700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          notification['time'],
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
        ),
      ),
    );
  }
} 