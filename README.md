# Sürücü Kursu Yönetim Sistemi

Modern ve kapsamlı bir sürücü kursu yönetim sistemi. Backend (.NET), Frontend (React) ve Mobile (Flutter) uygulamalarını içerir.

## 🚀 Özellikler

### Backend (.NET 8.0)
- **Clean Architecture** yapısı
- **JWT Authentication** sistemi
- **Entity Framework Core** ile PostgreSQL veritabanı
- **RESTful API** endpoints
- **Role-based Authorization** (Admin, Instructor, Student)
- **File Upload** sistemi (PDF, Video, Resim)
- **SMS Integration** hazırlığı

### Frontend (React + Vite)
- **Modern UI** (Tailwind CSS)
- **Responsive Design**
- **Real-time** veri güncellemeleri
- **Dashboard** ve **CRM** paneli
- **Student Management**
- **Course Management**
- **Quiz System**

### Mobile (Flutter)
- **Cross-platform** uygulama
- **Offline** çalışma desteği
- **Video Player** entegrasyonu
- **PDF Viewer**
- **Push Notifications**

## 🛠️ Teknolojiler

### Backend
- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- JWT Bearer Token
- BCrypt.Net
- MediatR (CQRS)

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios

### Mobile
- Flutter
- Dart
- HTTP Package

## 📁 Proje Yapısı

```
surucu-main/
├── backend/                 # .NET Backend
│   └── src/
│       ├── Application/     # Business Logic
│       ├── Domain/         # Entities & Interfaces
│       ├── Infrastructure/ # Data Access & External Services
│       └── WebAPI/         # API Controllers
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── pages/         # Page Components
│   │   ├── layouts/       # Layout Components
│   │   └── config/        # Configuration
└── mobile/                 # Flutter Mobile App
    ├── lib/
    │   ├── pages/         # Mobile Pages
    │   └── services/      # API Services
```

## 🚀 Kurulum

### Backend Kurulumu

1. **Veritabanı Kurulumu**
   ```bash
   cd backend/src/WebAPI
   dotnet ef database update
   ```

2. **Backend Çalıştırma**
   ```bash
   cd backend/src/WebAPI
   dotnet run
   ```
   Backend `http://localhost:5068` adresinde çalışacak.

### Frontend Kurulumu

1. **Bağımlılıkları Yükleme**
   ```bash
   cd frontend
   npm install
   ```

2. **Frontend Çalıştırma**
   ```bash
   npm run dev
   ```
   Frontend `http://localhost:5173` adresinde çalışacak.

### Mobile Kurulumu

1. **Flutter Kurulumu**
   ```bash
   cd mobile
   flutter pub get
   ```

2. **Mobile Uygulama Çalıştırma**
   ```bash
   flutter run
   ```

## 🔧 Konfigürasyon

### Backend Konfigürasyonu
`backend/src/WebAPI/appsettings.json` dosyasında:
- PostgreSQL connection string
- JWT settings
- CORS policy

### Frontend Konfigürasyonu
`frontend/src/config/api.js` dosyasında:
- API base URL
- Endpoint configurations

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/forgot-password` - Şifre sıfırlama

### Students
- `GET /api/students` - Öğrenci listesi
- `POST /api/students` - Yeni öğrenci ekleme
- `PUT /api/students/{id}` - Öğrenci güncelleme
- `DELETE /api/students/{id}` - Öğrenci silme

### Courses
- `GET /api/courses` - Kurs listesi
- `POST /api/courses` - Yeni kurs ekleme
- `GET /api/courses/{id}` - Kurs detayı

### Quizzes
- `GET /api/quizzes` - Quiz listesi
- `POST /api/quizzes` - Yeni quiz ekleme
- `POST /api/quizzes/{id}/submit` - Quiz cevaplama

## 🔐 Güvenlik

- **JWT Token** tabanlı authentication
- **Role-based Authorization**
- **Password Hashing** (BCrypt)
- **CORS** policy yapılandırması
- **Input Validation**

## 🐛 Hata Giderme

### CORS Hatası
Backend'de CORS policy'sini kontrol edin:
```csharp
policy.WithOrigins("http://localhost:5173")
      .AllowCredentials()
```

### Veritabanı Bağlantı Hatası
PostgreSQL servisinin çalıştığından emin olun ve connection string'i kontrol edin.

### Login Hatası
BCrypt hash'leri bozuksa `/api/auth/fix-password-hashes` endpoint'ini kullanın.

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 Katkıda Bulunanlar

- Backend Development
- Frontend Development  
- Mobile Development
- UI/UX Design

## 📞 İletişim

Proje hakkında sorularınız için GitHub Issues kullanabilirsiniz. 