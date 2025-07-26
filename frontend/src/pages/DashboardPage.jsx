import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Bell, 
  TrendingUp, 
  Calendar,
  Eye,
  Clock,
  BarChart3,
  Activity,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState([
    { label: "Toplam Öğrenci", value: 0, icon: Users, color: "bg-blue-500" },
    { label: "Toplam Kurs", value: 0, icon: BookOpen, color: "bg-green-500" },
    { label: "Toplam Eğitmen", value: 0, icon: GraduationCap, color: "bg-purple-500" },
    { label: "Gönderilen Bildirim", value: 0, icon: Bell, color: "bg-orange-500" },
  ]);
  const [latestStudents, setLatestStudents] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Kullanıcı rolünü localStorage'dan al
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}
  const role = user?.role;

  useEffect(() => {
    if (role === "Student") {
      navigate("/students", { replace: true });
      return;
    }
    if (role !== "Admin" && role !== "Instructor") {
      setLoading(false);
      setError("Bu sayfaya erişim yetkiniz yok.");
      return;
    }
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        // Öğrenciler
        const studentsRes = await fetch("http://192.168.1.78:5068/api/students", { credentials: "include", headers });
        const students = await studentsRes.json();
        // Kurslar
        const coursesRes = await fetch("http://192.168.1.78:5068/api/courses", { credentials: "include", headers });
        const courses = await coursesRes.json();
        // Eğitmenler
        const instructorsRes = await fetch("http://192.168.1.78:5068/api/instructors", { credentials: "include", headers });
        const instructors = await instructorsRes.json();
        // Bildirimler
        const notificationsRes = await fetch("http://192.168.1.78:5068/api/notifications", { credentials: "include", headers });
        const notifications = await notificationsRes.json();
        // Sınavlar
        const quizzesRes = await fetch("http://192.168.1.78:5068/api/quizzes", { credentials: "include", headers });
        const quizzes = await quizzesRes.json();

        setSummary([
          { label: "Toplam Öğrenci", value: students.length, icon: Users, color: "bg-blue-500" },
          { label: "Toplam Kurs", value: courses.length, icon: BookOpen, color: "bg-green-500" },
          { label: "Toplam Eğitmen", value: instructors.length, icon: GraduationCap, color: "bg-purple-500" },
          { label: "Gönderilen Bildirim", value: notifications.length, icon: Bell, color: "bg-orange-500" },
        ]);
        setLatestStudents(students.slice(0, 5));
        // Yaklaşan sınavlar: bugünden sonraki ilk 3 sınav
        const now = new Date();
        const upcoming = quizzes
          .filter(q => new Date(q.date) > now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3)
          .map(q => ({
            course: q.courseTitle || q.title || "-",
            date: q.date ? q.date.slice(0, 10) : "-",
            participants: q.participants || q.participantCount || "-"
          }));
        setUpcomingQuizzes(upcoming);
      } catch (err) {
        setError("Veriler alınırken hata oluştu.");
      }
      setLoading(false);
    }
    fetchData();
  }, [role, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-google-gray-50 font-inter">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-google-blue"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-google-gray-50 font-inter">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-google-gray-900 mb-2">Hata</h3>
            <p className="text-google-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-google-gray-50 font-inter">
      {/* Header */}
      <div className="bg-white border-b border-google-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-semibold text-google-gray-900">Kontrol Paneli</h1>
              <p className="text-sm text-google-gray-600 mt-1">Sistem genel bakışı</p>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-google-gray-400" />
              <span className="text-sm text-google-gray-600">Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summary.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.label}
                className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-google-gray-600 mb-1">{item.label}</p>
                    <p className="text-3xl font-bold text-google-gray-900">{item.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-google-gray-900">Aktivite Grafiği</h3>
              <BarChart3 className="w-5 h-5 text-google-gray-400" />
            </div>
            <div className="h-64 flex items-center justify-center bg-google-gray-50 rounded-lg">
              <div className="text-center">
                <Activity size={48} className="mx-auto text-google-gray-300 mb-2" />
                <p className="text-google-gray-500">Grafik verisi yakında eklenecek</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <h3 className="text-lg font-semibold text-google-gray-900 mb-6">Hızlı İstatistikler</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">Bu Ay Kayıt</p>
                  <p className="text-2xl font-bold text-blue-600">24</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Başarı Oranı</p>
                  <p className="text-2xl font-bold text-green-600">%87</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-900">Aktif Kurslar</p>
                  <p className="text-2xl font-bold text-purple-600">12</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Students */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-google-gray-900">Son Kayıt Olan Öğrenciler</h3>
              <Users className="w-5 h-5 text-google-gray-400" />
            </div>
            
            {latestStudents.length > 0 ? (
              <div className="space-y-4">
                {latestStudents.map((student, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-google-gray-50 rounded-lg transition-colors duration-200">
                    <div className="w-10 h-10 bg-google-blue rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {student.user?.fullName?.charAt(0) || student.ad?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-google-gray-900">
                        {student.user?.fullName || `${student.ad} ${student.soyad}`}
                      </p>
                      <p className="text-sm text-google-gray-600">
                        {student.user?.email || student.email}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200">
                      <Eye size={16} className="text-google-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-google-gray-300 mb-2" />
                <p className="text-google-gray-500">Henüz öğrenci kaydı yok</p>
              </div>
            )}
          </div>

          {/* Upcoming Quizzes */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-google-gray-900">Yaklaşan Sınavlar</h3>
              <Calendar className="w-5 h-5 text-google-gray-400" />
            </div>
            
            {upcomingQuizzes.length > 0 ? (
              <div className="space-y-4">
                {upcomingQuizzes.map((quiz, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-google-gray-50 rounded-lg transition-colors duration-200">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-google-gray-900">{quiz.course}</p>
                      <p className="text-sm text-google-gray-600">
                        {formatDate(quiz.date)} • {quiz.participants} katılımcı
                      </p>
                    </div>
                    <button className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200">
                      <Eye size={16} className="text-google-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto text-google-gray-300 mb-2" />
                <p className="text-google-gray-500">Yaklaşan sınav yok</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 