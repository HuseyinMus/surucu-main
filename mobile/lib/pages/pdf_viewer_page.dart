import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../services/api_service.dart';

class PdfViewerPage extends StatefulWidget {
  final String pdfUrl;
  final String title;
  final Map<String, dynamic> content;
  final Map<String, dynamic> course;

  const PdfViewerPage({
    Key? key,
    required this.pdfUrl,
    required this.title,
    required this.content,
    required this.course,
  }) : super(key: key);

  @override
  State<PdfViewerPage> createState() => _PdfViewerPageState();
}

class _PdfViewerPageState extends State<PdfViewerPage> {
  bool isLoading = false;
  bool hasError = false;
  String errorMessage = '';
  String? localPdfPath;
  PDFViewController? pdfViewController;
  int currentPage = 0;
  int totalPages = 0;

  @override
  void initState() {
    super.initState();
    _loadPdf();
  }

  Future<void> _loadPdf() async {
    try {
      setState(() {
        isLoading = true;
        hasError = false;
      });

      // PDF URL'sini tam URL'ye çevir
      String fullUrl = ApiService.getFullMediaUrl(widget.pdfUrl);
      
      print('📄 PDF yükleniyor: $fullUrl');

      // PDF'i indir ve local'e kaydet
      final dio = Dio();
      final tempDir = await getTemporaryDirectory();
      final fileName = 'pdf_${DateTime.now().millisecondsSinceEpoch}.pdf';
      final filePath = '${tempDir.path}/$fileName';

      await dio.download(fullUrl, filePath);

      if (mounted) {
        setState(() {
          localPdfPath = filePath;
          isLoading = false;
        });
        print('✅ PDF başarıyla yüklendi: $filePath');
      }
    } catch (e) {
      print('❌ PDF yükleme hatası: $e');
      if (mounted) {
        setState(() {
          hasError = true;
          errorMessage = 'PDF yüklenirken hata oluştu:\n$e';
          isLoading = false;
        });
      }
    }
  }

  Future<void> _retryLoadPdf() async {
    setState(() {
      hasError = false;
      errorMessage = '';
      localPdfPath = null;
    });
    await _loadPdf();
  }

  Future<void> _openInBrowser() async {
    try {
      String fullUrl = ApiService.getFullMediaUrl(widget.pdfUrl);
      final Uri url = Uri.parse(fullUrl);
      
      if (await canLaunchUrl(url)) {
        await launchUrl(
          url, 
          mode: LaunchMode.externalApplication,
        );
      } else {
        throw Exception('PDF tarayıcıda açılamıyor');
      }
    } catch (e) {
      print('❌ Tarayıcıda açma hatası: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Tarayıcıda açılamadı: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          if (hasError)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _retryLoadPdf,
              tooltip: 'Tekrar Dene',
            ),
          if (localPdfPath != null)
            IconButton(
              icon: const Icon(Icons.open_in_browser),
              onPressed: _openInBrowser,
              tooltip: 'Tarayıcıda Aç',
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('PDF yükleniyor...'),
            SizedBox(height: 8),
            Text(
              'Lütfen bekleyin...',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    if (hasError) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              const Text(
                'PDF Yüklenemedi',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _retryLoadPdf,
                icon: const Icon(Icons.refresh),
                label: const Text('Tekrar Dene'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _openInBrowser,
                icon: const Icon(Icons.open_in_browser),
                label: const Text('Tarayıcıda Aç'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Geri Dön'),
              ),
            ],
          ),
        ),
      );
    }

    if (localPdfPath != null) {
      return Column(
        children: [
          // PDF bilgi çubuğu
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.grey[100],
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Sayfa: ${currentPage + 1} / $totalPages',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.zoom_in),
                      onPressed: () {
                        // Zoom in functionality - PDFView handles zoom automatically
                      },
                      tooltip: 'Yakınlaştır',
                    ),
                    IconButton(
                      icon: const Icon(Icons.zoom_out),
                      onPressed: () {
                        // Zoom out functionality - PDFView handles zoom automatically
                      },
                      tooltip: 'Uzaklaştır',
                    ),
                  ],
                ),
              ],
            ),
          ),
          // PDF viewer
          Expanded(
            child: PDFView(
              filePath: localPdfPath!,
              enableSwipe: true,
              swipeHorizontal: false,
              autoSpacing: true,
              pageFling: true,
              pageSnap: true,
              defaultPage: 0,
              fitPolicy: FitPolicy.BOTH,
              preventLinkNavigation: false,
              onRender: (pages) {
                setState(() {
                  totalPages = pages!;
                });
              },
              onViewCreated: (PDFViewController controller) {
                setState(() {
                  pdfViewController = controller;
                });
              },
              onPageChanged: (page, total) {
                setState(() {
                  currentPage = page!;
                });
              },
              onError: (error) {
                print('PDF görüntüleme hatası: $error');
                setState(() {
                  hasError = true;
                  errorMessage = 'PDF görüntülenirken hata oluştu: $error';
                });
              },
            ),
          ),
        ],
      );
    }

    return const Center(
      child: Text('PDF yükleniyor...'),
    );
  }

  @override
  void dispose() {
    // Geçici PDF dosyasını temizle
    if (localPdfPath != null) {
      try {
        final file = File(localPdfPath!);
        if (file.existsSync()) {
          file.deleteSync();
        }
      } catch (e) {
        print('PDF dosyası silinirken hata: $e');
      }
    }
    super.dispose();
  }
} 