import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    async function fetchExams() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch("http://192.168.1.78:5068/api/quizzes", { headers });
        if (!res.ok) throw new Error("Sınavlar alınamadı");
        const data = await res.json();
        console.log("Sınav listesi:", data);
        
        // Backend'den gelen veri yapısını frontend'e uygun hale getir
        const formattedExams = data.map(exam => ({
          id: exam.id,
          title: exam.title || "İsimsiz Sınav",
          description: exam.description || "",
          status: exam.status || "active",
          startDate: exam.startDate || exam.createdAt || new Date(),
          duration: exam.duration || 60,
          participantCount: exam.participantCount || 0,
          questionCount: exam.questionCount || 20,
          totalPoints: exam.totalPoints || 100,
          course: {
            title: exam.course?.title || "Genel Sınav"
          }
        }));
        
        setExams(formattedExams);
      } catch {
        setError("Sınav listesi alınamadı.");
      }
      setLoading(false);
    }
    fetchExams();
  }, []);

  const filteredExams = exams.filter(exam =>
    exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active": return <CheckCircle size={16} />;
      case "inactive": return <XCircle size={16} />;
      case "draft": return <AlertCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
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

  return (
    <div className="min-h-screen bg-google-gray-50 font-inter">
      {/* Header */}
      <div className="bg-white border-b border-google-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-semibold text-google-gray-900">Sınavlar</h1>
              <p className="text-sm text-google-gray-600 mt-1">Sınav kayıtlarını yönetin</p>
            </div>
            
            <button
              onClick={() => {/* TODO: Add exam modal */}}
              className="inline-flex items-center gap-2 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
            >
              <Plus size={20} />
              Yeni Sınav
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-google-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-google-gray-400" size={20} />
              <input
                type="text"
                placeholder="Sınav ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
            >
              <option value="">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="draft">Taslak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Exam Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-google-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Exam Header */}
              <div className="p-6 border-b border-google-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-google-gray-900">
                        {exam.title || "İsimsiz Sınav"}
                      </h3>
                      <p className="text-sm text-google-gray-600">
                        {exam.course?.title || "Genel Sınav"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200">
                      <Eye size={16} className="text-google-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200">
                      <Edit size={16} className="text-google-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exam.status)}`}>
                    {getStatusIcon(exam.status)}
                    {exam.status === "active" ? "Aktif" : 
                     exam.status === "inactive" ? "Pasif" : 
                     exam.status === "draft" ? "Taslak" : "Bilinmiyor"}
                  </span>
                </div>
              </div>

              {/* Exam Details */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">
                    Tarih: {formatDate(exam.startDate)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">
                    Süre: {exam.duration || 0} dakika
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">
                    Katılımcı: {exam.participantCount || 0} kişi
                  </span>
                </div>

                {exam.description && (
                  <div className="pt-3 border-t border-google-gray-100">
                    <p className="text-sm text-google-gray-600 line-clamp-2">
                      {exam.description}
                    </p>
                  </div>
                )}

                {/* Question Count */}
                <div className="pt-3 border-t border-google-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-google-gray-600">Soru Sayısı</span>
                    <span className="text-sm font-medium text-google-gray-900">
                      {exam.questionCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredExams.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-google-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-google-gray-900 mb-2">Sınav bulunamadı</h3>
            <p className="text-google-gray-600">Arama kriterlerinize uygun sınav bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
} 