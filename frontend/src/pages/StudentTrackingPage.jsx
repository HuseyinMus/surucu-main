import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  BookOpen, 
  Car, 
  GraduationCap,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Camera,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { buildApiUrl, API_ENDPOINTS } from "../config/api";

export default function StudentTrackingPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterExam, setFilterExam] = useState("all");

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterStatus, filterPayment, filterExam]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      
      const response = await fetch(buildApiUrl(API_ENDPOINTS.STUDENT_TRACKING), { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        setError("Öğrenci listesi alınamadı");
      }
    } catch (err) {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.tcNumber.includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (filterStatus !== "all") {
      filtered = filtered.filter(student => student.currentStage === filterStatus);
    }

    // Ödeme filtresi
    if (filterPayment !== "all") {
      filtered = filtered.filter(student => student.paymentStatus === filterPayment);
    }

    // Sınav filtresi
    if (filterExam !== "all") {
      filtered = filtered.filter(student => student.examStatus === filterExam);
    }

    setFilteredStudents(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Registered": return "bg-blue-100 text-blue-800";
      case "Theory": return "bg-purple-100 text-purple-800";
      case "Practice": return "bg-orange-100 text-orange-800";
      case "Exam": return "bg-yellow-100 text-yellow-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "Partial": return "bg-yellow-100 text-yellow-800";
      case "Pending": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getExamStatusColor = (status) => {
    switch (status) {
      case "Passed": return "bg-green-100 text-green-800";
      case "Failed": return "bg-red-100 text-red-800";
      case "Scheduled": return "bg-blue-100 text-blue-800";
      case "NotScheduled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
      case "Passed":
        return <CheckCircle size={16} className="text-green-600" />;
      case "Pending":
      case "Scheduled":
        return <Clock size={16} className="text-yellow-600" />;
      case "Failed":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
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
              <h1 className="text-2xl font-semibold text-google-gray-900">Öğrenci Takip Sistemi</h1>
              <p className="text-sm text-google-gray-600 mt-1">Öğrenci durumları, ödemeler ve sınavlar</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/panel/student-tracking/report")}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <TrendingUp size={16} />
                Rapor
              </button>
              <button
                onClick={() => navigate("/panel/student-tracking/add")}
                className="flex items-center gap-2 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-google-blue-dark transition-colors"
              >
                <Plus size={16} />
                Yeni Öğrenci
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Arama */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-google-gray-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-google-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-transparent"
              />
            </div>

            {/* Durum Filtresi */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-google-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="Registered">Kayıtlı</option>
              <option value="Theory">Teorik</option>
              <option value="Practice">Pratik</option>
              <option value="Exam">Sınav</option>
              <option value="Completed">Tamamlandı</option>
              <option value="Failed">Başarısız</option>
            </select>

            {/* Ödeme Filtresi */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 border border-google-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-transparent"
            >
              <option value="all">Tüm Ödemeler</option>
              <option value="Completed">Tamamlandı</option>
              <option value="Partial">Kısmi</option>
              <option value="Pending">Bekliyor</option>
            </select>

            {/* Sınav Filtresi */}
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="px-3 py-2 border border-google-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-transparent"
            >
              <option value="all">Tüm Sınavlar</option>
              <option value="Passed">Geçti</option>
              <option value="Failed">Kaldı</option>
              <option value="Scheduled">Planlandı</option>
              <option value="NotScheduled">Planlanmadı</option>
            </select>

            {/* Temizle */}
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterPayment("all");
                setFilterExam("all");
              }}
              className="px-4 py-2 text-google-gray-600 border border-google-gray-300 rounded-lg hover:bg-google-gray-50 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-google-gray-600 mb-1">Toplam Öğrenci</p>
                <p className="text-3xl font-bold text-google-gray-900">{students.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-google-gray-600 mb-1">Toplam Gelir</p>
                <p className="text-3xl font-bold text-google-gray-900">
                  ₺{students.reduce((sum, s) => sum + s.paidAmount, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-google-gray-600 mb-1">Bekleyen Ödemeler</p>
                <p className="text-3xl font-bold text-google-gray-900">
                  {students.filter(s => s.paymentStatus === "Pending").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-google-gray-600 mb-1">Yaklaşan Sınavlar</p>
                <p className="text-3xl font-bold text-google-gray-900">
                  {students.filter(s => s.examStatus === "Scheduled").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Öğrenci Listesi */}
        <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-google-gray-200">
            <h3 className="text-lg font-semibold text-google-gray-900">
              Öğrenci Listesi ({filteredStudents.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-google-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-500 uppercase tracking-wider">
                    Öğrenci
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-500 uppercase tracking-wider">
                    Ödeme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-500 uppercase tracking-wider">
                    Sınav
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-500 uppercase tracking-wider">
                    Dersler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-500 uppercase tracking-wider">
                    Son Aktivite
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-google-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-google-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-google-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.photoUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={buildApiUrl(student.photoUrl)}
                              alt={student.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-google-blue flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {student.fullName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-google-gray-900">
                            {student.fullName}
                          </div>
                          <div className="text-sm text-google-gray-500">
                            {student.tcNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.currentStage)}`}>
                        {getStatusIcon(student.currentStage)}
                        <span className="ml-1">
                          {student.currentStage === "Registered" && "Kayıtlı"}
                          {student.currentStage === "Theory" && "Teorik"}
                          {student.currentStage === "Practice" && "Pratik"}
                          {student.currentStage === "Exam" && "Sınav"}
                          {student.currentStage === "Completed" && "Tamamlandı"}
                          {student.currentStage === "Failed" && "Başarısız"}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-google-gray-900">
                          ₺{student.paidAmount.toLocaleString()} / ₺{student.totalFee.toLocaleString()}
                        </div>
                        <div className="text-sm text-google-gray-500">
                          Kalan: ₺{student.remainingDebt.toLocaleString()}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getPaymentStatusColor(student.paymentStatus)}`}>
                          {student.paymentStatus === "Completed" && "Tamamlandı"}
                          {student.paymentStatus === "Partial" && "Kısmi"}
                          {student.paymentStatus === "Pending" && "Bekliyor"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {student.examDate ? (
                          <div className="text-sm font-medium text-google-gray-900">
                            {new Date(student.examDate).toLocaleDateString('tr-TR')}
                          </div>
                        ) : (
                          <div className="text-sm text-google-gray-500">Planlanmadı</div>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getExamStatusColor(student.examStatus)}`}>
                          {student.examStatus === "Passed" && "Geçti"}
                          {student.examStatus === "Failed" && "Kaldı"}
                          {student.examStatus === "Scheduled" && "Planlandı"}
                          {student.examStatus === "NotScheduled" && "Planlanmadı"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-google-gray-900">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen size={14} className="text-purple-600" />
                          <span>Teorik: {student.theoryLessonsCompleted}/{student.totalTheoryLessons}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car size={14} className="text-orange-600" />
                          <span>Pratik: {student.practiceLessonsCompleted}/{student.totalPracticeLessons}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-google-gray-500">
                      {student.lastActivityDate 
                        ? new Date(student.lastActivityDate).toLocaleDateString('tr-TR')
                        : "Bilgi yok"
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/panel/student-tracking/${student.id}`)}
                          className="p-2 text-google-blue hover:bg-google-blue hover:text-white rounded-lg transition-colors"
                          title="Detay Görüntüle"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/panel/student-tracking/${student.id}/edit`)}
                          className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/panel/student-tracking/${student.id}/photo`)}
                          className="p-2 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-colors"
                          title="Fotoğraf Yükle"
                        >
                          <Camera size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-google-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-google-gray-900 mb-2">Öğrenci Bulunamadı</h3>
              <p className="text-google-gray-500">
                {searchTerm || filterStatus !== "all" || filterPayment !== "all" || filterExam !== "all"
                  ? "Filtrelerinizi değiştirmeyi deneyin"
                  : "Henüz öğrenci kaydı yok"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 