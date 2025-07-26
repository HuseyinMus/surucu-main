import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { 
  BarChart3, 
  Clock, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Calendar,
  Play,
  CheckCircle,
  Target,
  Activity
} from "lucide-react";

export default function ProgressTrackingPage() {
  const { courseId } = useParams();
  const { token, user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [dailyProgress, setDailyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(7); // 7, 30, 90 gün

  useEffect(() => {
    if (!courseId || !user?.id) return;
    
    fetchProgressData();
  }, [courseId, user?.id, selectedPeriod]);

  const fetchProgressData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      // Ana ilerleme özeti
      const summaryRes = await fetch(
        `http://192.168.1.78:5068/api/progress/summary/${user.id}/${courseId}`,
        { headers }
      );
      const summary = await summaryRes.json();
      setProgressData(summary);

      // Ders bazlı ilerleme
      const lessonsRes = await fetch(
        `http://192.168.1.78:5068/api/progress/lessons/${user.id}/${courseId}`,
        { headers }
      );
      const lessons = await lessonsRes.json();
      setLessonProgress(lessons);

      // Günlük ilerleme
      const dailyRes = await fetch(
        `http://192.168.1.78:5068/api/progress/daily/${user.id}/${courseId}?days=${selectedPeriod}`,
        { headers }
      );
      const daily = await dailyRes.json();
      setDailyProgress(daily);

    } catch {
      setError("İlerleme verileri alınamadı");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}s ${minutes}dk`;
    }
    return `${minutes}dk`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-google-gray-50 font-inter">
      {/* Header */}
      <div className="bg-white border-b border-google-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-google-gray-900">
              İlerleme Takibi
            </h1>
            <p className="text-sm text-google-gray-600 mt-1">
              {progressData?.courseTitle}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Genel İlerleme */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-google-blue" />
              </div>
              <span className={`text-lg font-semibold ${getProgressColor(progressData?.overallProgress || 0)}`}>
                {Math.round(progressData?.overallProgress || 0)}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-google-gray-900 mb-1">Genel İlerleme</h3>
            <div className="w-full bg-google-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressBarColor(progressData?.overallProgress || 0)}`}
                style={{ width: `${progressData?.overallProgress || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Tamamlanan Dersler */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-lg font-semibold text-google-gray-900">
                {progressData?.completedLessons || 0}/{progressData?.totalLessons || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-google-gray-900 mb-1">Tamamlanan Dersler</h3>
            <p className="text-xs text-google-gray-600">
              {progressData?.totalLessons || 0} dersten {progressData?.completedLessons || 0} tanesi tamamlandı
            </p>
          </div>

          {/* Toplam Süre */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-lg font-semibold text-google-gray-900">
                {formatTime(progressData?.totalTimeSpent || 0)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-google-gray-900 mb-1">Toplam Süre</h3>
            <p className="text-xs text-google-gray-600">
              Kurs için harcanan toplam süre
            </p>
          </div>

          {/* Quiz Ortalaması */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-lg font-semibold text-google-gray-900">
                {Math.round(progressData?.averageQuizScore || 0)}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-google-gray-900 mb-1">Quiz Ortalaması</h3>
            <p className="text-xs text-google-gray-600">
              {progressData?.completedQuizzes || 0} quiz tamamlandı
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Günlük İlerleme Grafiği */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-google-gray-900">Günlük Aktivite</h2>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="px-3 py-1 border border-google-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-google-blue focus:border-transparent"
              >
                <option value={7}>Son 7 gün</option>
                <option value={30}>Son 30 gün</option>
                <option value={90}>Son 90 gün</option>
              </select>
            </div>
            
            <div className="space-y-4">
              {dailyProgress.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-xs text-google-gray-600">
                    {formatDate(day.date)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-google-blue rounded-full"></div>
                      <span className="text-xs text-google-gray-600">
                        {formatTime(day.timeSpent)} • {day.lessonsCompleted} ders • {day.quizzesTaken} quiz
                      </span>
                    </div>
                    <div className="w-full bg-google-gray-200 rounded-full h-1">
                      <div 
                        className="h-1 bg-google-blue rounded-full"
                        style={{ 
                          width: `${Math.min((day.timeSpent / 3600) * 10, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ders Bazlı İlerleme */}
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <h2 className="text-lg font-semibold text-google-gray-900 mb-6">Ders İlerlemesi</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {lessonProgress.map((lesson, index) => (
                <div key={index} className="border border-google-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-google-gray-900 text-sm">
                      {lesson.title}
                    </h3>
                    <span className={`text-sm font-semibold ${getProgressColor(lesson.progress)}`}>
                      {lesson.progress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-google-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressBarColor(lesson.progress)}`}
                      style={{ width: `${lesson.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-google-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(lesson.timeSpent)}</span>
                    </div>
                    {lesson.isCompleted && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Tamamlandı</span>
                      </div>
                    )}
                    {lesson.quizScore > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{lesson.quizScore} puan</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Son Aktivite */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
          <h2 className="text-lg font-semibold text-google-gray-900 mb-4">Son Aktivite</h2>
          <div className="flex items-center gap-3 text-sm text-google-gray-600">
            <Activity className="w-4 h-4" />
            <span>
              Son aktivite: {progressData?.lastActivity ? 
                new Date(progressData.lastActivity).toLocaleString('tr-TR') : 
                'Henüz aktivite yok'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 