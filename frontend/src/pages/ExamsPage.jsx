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
import { buildApiUrl, API_ENDPOINTS } from "../config/api";

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    duration: 60,
    totalPoints: 100,
    status: "active"
  });
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [showExamDetailModal, setShowExamDetailModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "MultipleChoice",
    mediaType: "none", // none, image, video
    mediaUrl: "",
    mediaFile: null,
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]
  });

  useEffect(() => {
    async function fetchExams() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch(buildApiUrl(API_ENDPOINTS.QUIZZES), { headers });
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
      } catch (error) {
        console.error("Sınav listesi hatası:", error);
        setError("Sınav listesi alınamadı. Lütfen internet bağlantınızı kontrol edin.");
      }
      setLoading(false);
    }
    fetchExams();
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch(buildApiUrl(API_ENDPOINTS.COURSES), { headers });
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (error) {
        console.error("Kurslar yüklenemedi:", error);
      }
    }
    fetchCourses();
  }, []);

  const filteredExams = exams.filter(exam =>
    exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('tr-TR');
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

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const examData = {
        ...newExam,
        courseId: selectedCourseId || null,
        duration: newExam.duration
      };

      const res = await fetch(buildApiUrl(API_ENDPOINTS.QUIZZES), {
        method: "POST",
        headers,
        body: JSON.stringify(examData)
      });

      if (res.ok) {
        const newExamData = await res.json();
        setExams([...exams, newExamData]);
        setShowAddModal(false);
        setNewExam({
          title: "",
          description: "",
          duration: 60,
          totalPoints: 100,
          status: "active"
        });
        setSelectedCourseId("");
      } else {
        throw new Error("Sınav eklenemedi");
      }
    } catch (error) {
      console.error("Sınav ekleme hatası:", error);
      setError("Sınav eklenirken hata oluştu. Lütfen tüm alanları kontrol edin.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExam(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewExam = async (exam) => {
    setSelectedExam(exam);
    setShowExamDetailModal(true);
    
    // Sınav sorularını yükle
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${exam.id}/questions`), { headers });
      if (res.ok) {
        const questionsData = await res.json();
        setQuestions(questionsData);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error("Sorular yüklenemedi:", error);
      setQuestions([]);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      // FormData kullanarak dosya yükleme
      const formData = new FormData();
      formData.append('questionText', newQuestion.questionText);
      formData.append('questionType', newQuestion.questionType);
      formData.append('mediaType', newQuestion.mediaType);
      
      if (newQuestion.mediaUrl) {
        formData.append('mediaUrl', newQuestion.mediaUrl);
      }
      
      if (newQuestion.mediaFile) {
        formData.append('mediaFile', newQuestion.mediaFile);
      }
      
      // Seçenekleri JSON olarak ekle
      const options = newQuestion.options.filter(opt => opt.text.trim() !== "");
      formData.append('options', JSON.stringify(options));

      const headers = {
        "Authorization": `Bearer ${token}`
        // Content-Type header'ını kaldırdık çünkü FormData otomatik olarak multipart/form-data olarak ayarlar
      };

      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions`), {
        method: "POST",
        headers,
        body: formData
      });

      if (res.ok) {
        const newQuestionData = await res.json();
        setQuestions([...questions, newQuestionData]);
        setShowAddQuestionModal(false);
        setNewQuestion({
          questionText: "",
          questionType: "MultipleChoice",
          mediaType: "none",
          mediaUrl: "",
          mediaFile: null,
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
          ]
        });
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      setError("Soru eklenirken hata oluştu: " + error.message);
    }
  };

  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleEditExam = (exam) => {
    setEditingExam({
      id: exam.id,
      title: exam.title || "",
      description: exam.description || "",
      duration: exam.duration || 60,
      totalPoints: exam.totalPoints || 100,
      status: exam.status || "active",
      courseId: exam.course?.id || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      // courseId boşsa null olarak gönder
      const updateData = {
        ...editingExam,
        courseId: editingExam.courseId === "" ? null : editingExam.courseId
      };

      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${editingExam.id}`), {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const updatedExam = await res.json();
        setExams(exams.map(exam => 
          exam.id === editingExam.id ? {
            ...exam,
            title: updatedExam.title,
            description: updatedExam.description,
            duration: updatedExam.duration,
            totalPoints: updatedExam.totalPoints,
            status: updatedExam.status,
            course: updatedExam.courseId ? {
              id: updatedExam.courseId,
              title: courses.find(c => c.id === updatedExam.courseId)?.title || "Bilinmeyen Kurs"
            } : null
          } : exam
        ));
        setShowEditModal(false);
        setEditingExam(null);
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Sınav güncellenirken hata:", error);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Bu sınavı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${examId}`), {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setExams(exams.filter(exam => exam.id !== examId));
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Sınav silinirken hata:", error);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingExam(prev => ({
      ...prev,
      [name]: name === "courseId" && value === "" ? null : value
    }));
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      mediaType: question.mediaType || "none",
      mediaUrl: question.mediaUrl || "",
      options: question.options || []
    });
    setShowEditQuestionModal(true);
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      // Backend'in beklediği formata uygun veri hazırla
      const updateData = {
        questionText: editingQuestion.questionText,
        questionType: editingQuestion.questionType,
        mediaType: editingQuestion.mediaType,
        mediaUrl: editingQuestion.mediaUrl,
        options: editingQuestion.options.map(option => ({
          text: option.text,
          isCorrect: option.isCorrect
        }))
      };

      console.log("Gönderilen veri:", updateData);
      console.log("URL:", buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions/${editingQuestion.id}`));

      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions/${editingQuestion.id}`), {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData)
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      if (res.ok) {
        const updatedQuestion = await res.json();
        setQuestions(questions.map(q => 
          q.id === editingQuestion.id ? {
            ...q,
            questionText: updatedQuestion.questionText,
            questionType: updatedQuestion.questionType,
            mediaType: updatedQuestion.mediaType,
            mediaUrl: updatedQuestion.mediaUrl,
            options: updatedQuestion.options
          } : q
        ));
        setShowEditQuestionModal(false);
        setEditingQuestion(null);
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Soru güncellenirken hata:", error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Bu soruyu silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions/${questionId}`), {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Soru silinirken hata:", error);
    }
  };

  const handleEditQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setEditingQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditOptionChange = (index, field, value) => {
    setEditingQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
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
              onClick={() => setShowAddModal(true)}
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
                    <button 
                      onClick={() => handleViewExam(exam)}
                      className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Eye size={16} className="text-google-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleEditExam(exam)}
                      className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Edit size={16} className="text-google-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                    >
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

      {/* Exam Detail Modal */}
      {showExamDetailModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedExam.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedExam.description}</p>
                </div>
                <button
                  onClick={() => setShowExamDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Sınav Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Süre</h4>
                  <p className="text-gray-600">{selectedExam.duration || 60} dakika</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Toplam Puan</h4>
                  <p className="text-gray-600">{selectedExam.totalPoints || 100} puan</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Soru Sayısı</h4>
                  <p className="text-gray-600">{questions.length} soru</p>
                </div>
              </div>

              {/* Sorular Bölümü */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Sorular</h3>
                  <button
                    onClick={() => setShowAddQuestionModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Yeni Soru</span>
                  </button>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz soru eklenmemiş</h3>
                    <p className="text-gray-600">Bu sınav için henüz soru eklenmemiş.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            {index + 1}. {question.questionText}
                          </h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditQuestion(question)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <Edit size={14} className="text-gray-600" />
                            </button>
                            <button 
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Medya Gösterimi */}
                        {question.mediaUrl && (
                          <div className="mb-3">
                            {question.mediaType === "image" ? (
                              <img
                                src={question.mediaUrl}
                                alt="Soru görseli"
                                className="max-w-full h-auto rounded-lg border border-gray-200"
                                style={{ maxHeight: "200px" }}
                              />
                            ) : question.mediaType === "video" ? (
                              <video
                                controls
                                className="max-w-full h-auto rounded-lg border border-gray-200"
                                style={{ maxHeight: "200px" }}
                              >
                                <source src={question.mediaUrl} type="video/mp4" />
                                Tarayıcınız video oynatmayı desteklemiyor.
                              </video>
                            ) : null}
                          </div>
                        )}
                        {question.options && question.options.length > 0 && (
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  option.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                }`}></div>
                                <span className={`text-sm ${option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                                  {option.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Yeni Soru Ekle</h2>
                <button
                  onClick={() => setShowAddQuestionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddQuestion} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soru Metni *
                </label>
                <textarea
                  name="questionText"
                  value={newQuestion.questionText}
                  onChange={handleQuestionInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Soruyu girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soru Tipi
                </label>
                <select
                  name="questionType"
                  value={newQuestion.questionType}
                  onChange={handleQuestionInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MultipleChoice">Çoktan Seçmeli</option>
                  <option value="TrueFalse">Doğru/Yanlış</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medya Ekle
                </label>
                <select
                  name="mediaType"
                  value={newQuestion.mediaType}
                  onChange={handleQuestionInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">Medya Yok</option>
                  <option value="image">Görsel</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {newQuestion.mediaType !== "none" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {newQuestion.mediaType === "image" ? "Görsel" : "Video"} {newQuestion.mediaType === "image" ? "URL" : "URL"}
                  </label>
                  <div className="space-y-3">
                    <input
                      type="url"
                      name="mediaUrl"
                      value={newQuestion.mediaUrl}
                      onChange={handleQuestionInputChange}
                      placeholder={`${newQuestion.mediaType === "image" ? "Görsel" : "Video"} URL'si girin`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-center">
                      <span className="text-sm text-gray-500">veya</span>
                    </div>
                    <div className="flex justify-center">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="file"
                          accept={newQuestion.mediaType === "image" ? "image/*" : "video/*"}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setNewQuestion(prev => ({
                                ...prev,
                                mediaFile: file
                              }));
                            }
                          }}
                          className="hidden"
                        />
                        <span className="text-sm text-gray-700">
                          {newQuestion.mediaType === "image" ? "Görsel" : "Video"} Yükle
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seçenekler *
                </label>
                <div className="space-y-3">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                        placeholder={`Seçenek ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.isCorrect}
                          onChange={() => handleOptionChange(index, 'isCorrect', true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Doğru</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Soru Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Yeni Sınav Ekle</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddExam} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınav Başlığı *
                </label>
                <input
                  type="text"
                  name="title"
                  value={newExam.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sınav başlığını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={newExam.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sınav açıklamasını girin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Süre (dakika) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={newExam.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplam Puan *
                  </label>
                  <input
                    type="number"
                    name="totalPoints"
                    value={newExam.totalPoints}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kurs (Opsiyonel)
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Kurs seçin</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  name="status"
                  value={newExam.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sınav Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditModal && editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Sınav Düzenle</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateExam} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınav Başlığı *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editingExam.title}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sınav başlığını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={editingExam.description}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sınav açıklamasını girin"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Süre (dakika) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={editingExam.duration}
                    onChange={handleEditInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplam Puan *
                  </label>
                  <input
                    type="number"
                    name="totalPoints"
                    value={editingExam.totalPoints}
                    onChange={handleEditInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kurs (Opsiyonel)
                </label>
                <select
                  name="courseId"
                  value={editingExam.courseId}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Kurs seçin</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  name="status"
                  value={editingExam.status}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Soru Düzenle</h2>
              <button
                onClick={() => setShowEditQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateQuestion} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soru Metni *
                </label>
                <textarea
                  name="questionText"
                  value={editingQuestion.questionText}
                  onChange={handleEditQuestionInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Soruyu girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soru Tipi
                </label>
                <select
                  name="questionType"
                  value={editingQuestion.questionType}
                  onChange={handleEditQuestionInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MultipleChoice">Çoktan Seçmeli</option>
                  <option value="TrueFalse">Doğru/Yanlış</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medya Ekle
                </label>
                <select
                  name="mediaType"
                  value={editingQuestion.mediaType}
                  onChange={handleEditQuestionInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">Medya Yok</option>
                  <option value="image">Görsel</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {editingQuestion.mediaType !== "none" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingQuestion.mediaType === "image" ? "Görsel" : "Video"} URL
                  </label>
                  <input
                    type="url"
                    name="mediaUrl"
                    value={editingQuestion.mediaUrl}
                    onChange={handleEditQuestionInputChange}
                    placeholder={`${editingQuestion.mediaType === "image" ? "Görsel" : "Video"} URL'si girin`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seçenekler *
                </label>
                <div className="space-y-3">
                  {editingQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleEditOptionChange(index, 'text', e.target.value)}
                        placeholder={`Seçenek ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.isCorrect}
                          onChange={() => {
                            setEditingQuestion(prev => ({
                              ...prev,
                              options: prev.options.map((opt, i) => ({
                                ...opt,
                                isCorrect: i === index
                              }))
                            }));
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Doğru</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditQuestionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 