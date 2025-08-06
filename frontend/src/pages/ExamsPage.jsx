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
  AlertCircle,
  Upload
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
          questionCount: exam.questionCount || 0,
          totalPoints: exam.totalPoints || 100,
          courseId: exam.courseId || null,
          course: null // Kurs bilgisi ayrı olarak eklenecek
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
          
          // Kurs bilgilerini sınavlara ekle
          setExams(prevExams => prevExams.map(exam => ({
            ...exam,
            course: exam.courseId ? data.find(c => c.id === exam.courseId) : null
          })));
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

      // Backend'in beklediği formata uygun veri hazırla
      const examData = {
        title: newExam.title,
        description: newExam.description,
        totalPoints: newExam.totalPoints,
        status: newExam.status,
        duration: newExam.duration,
        courseId: selectedCourseId || null
      };

      console.log("Gönderilen sınav verisi:", examData);

      const res = await fetch(buildApiUrl(API_ENDPOINTS.QUIZZES), {
        method: "POST",
        headers,
        body: JSON.stringify(examData)
      });

      if (res.ok) {
        const newExamData = await res.json();
        
        // Yeni sınavı listeye ekle
        const formattedNewExam = {
          id: newExamData.id,
          title: newExamData.title || "İsimsiz Sınav",
          description: newExamData.description || "",
          status: newExamData.status || "active",
          startDate: newExamData.startDate || newExamData.createdAt || new Date(),
          duration: newExamData.duration || 60,
          participantCount: 0,
          questionCount: 0,
          totalPoints: newExamData.totalPoints || 100,
          courseId: newExamData.courseId || null,
          course: selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null
        };
        
        setExams([...exams, formattedNewExam]);
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
        const errorText = await res.text();
        console.error("Backend hatası:", errorText);
        throw new Error(`Sınav eklenemedi: ${errorText}`);
      }
    } catch (error) {
      console.error("Sınav ekleme hatası:", error);
      setError(`Sınav eklenirken hata oluştu: ${error.message}`);
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
        
        // Şık verilerini doğru formata dönüştür
        const formattedQuestions = questionsData.map(question => ({
          ...question,
          options: question.options ? question.options.map(option => ({
            text: option.optionText || option.text || "",
            isCorrect: option.isCorrect || false
          })) : []
        }));
        
        console.log("Formatlanmış sorular:", formattedQuestions);
        setQuestions(formattedQuestions);
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
      
      // Debug: Form verilerini kontrol et
      console.log("Soru ekleme - Form verileri:", {
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        mediaType: newQuestion.mediaType,
        mediaUrl: newQuestion.mediaUrl,
        mediaFile: newQuestion.mediaFile,
        options: newQuestion.options
      });
      
      // FormData kullanarak dosya yükleme
      const formData = new FormData();
      formData.append('questionText', newQuestion.questionText);
      formData.append('questionType', newQuestion.questionType);
      formData.append('mediaType', newQuestion.mediaType);
      
      if (newQuestion.mediaUrl) {
        formData.append('mediaUrl', newQuestion.mediaUrl);
        console.log("Media URL eklendi:", newQuestion.mediaUrl);
      }
      
      if (newQuestion.mediaFile) {
        formData.append('mediaFile', newQuestion.mediaFile);
        console.log("Media dosyası eklendi:", newQuestion.mediaFile.name, "Boyut:", newQuestion.mediaFile.size);
      }
      
      // Seçenekleri JSON olarak ekle
      const options = newQuestion.options.filter(opt => opt.text.trim() !== "");
      formData.append('options', JSON.stringify(options));
      console.log("Seçenekler eklendi:", options);
      
      // Doğru şık kontrolü
      const correctOptions = options.filter(opt => opt.isCorrect);
      console.log("Doğru şık sayısı:", correctOptions.length);
      console.log("Doğru şıklar:", correctOptions.map((opt, index) => `${index + 1}. ${opt.text}`));
      
      if (correctOptions.length === 0) {
        alert("En az bir doğru şık seçmelisiniz!");
        return;
      }

      const headers = {
        "Authorization": `Bearer ${token}`
        // Content-Type header'ını kaldırdık çünkü FormData otomatik olarak multipart/form-data olarak ayarlar
      };

      console.log("API endpoint:", buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions`));
      console.log("Headers:", headers);

      const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions`), {
        method: "POST",
        headers,
        body: formData
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      if (res.ok) {
        const newQuestionData = await res.json();
        console.log("Başarılı response:", newQuestionData);
        
        // Yeni soruyu doğru formatta state'e ekle
        const formattedNewQuestion = {
          id: newQuestionData.id,
          questionText: newQuestionData.questionText || "",
          questionType: newQuestionData.questionType || "MultipleChoice",
          mediaType: newQuestionData.mediaType || "none",
          mediaUrl: newQuestionData.mediaUrl || "",
          options: newQuestionData.options ? newQuestionData.options.map(option => ({
            text: option.optionText || option.text || "",
            isCorrect: option.isCorrect || false
          })) : []
        };
        
        setQuestions([...questions, formattedNewQuestion]);
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
        alert("Soru başarıyla eklendi!");
      } else {
        const errorText = await res.text();
        console.error("Backend hatası:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Soru ekleme hatası:", error);
      setError("Soru eklenirken hata oluştu: " + error.message);
      alert("Soru eklenirken hata oluştu: " + error.message);
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
      options: prev.options.map((option, i) => {
        if (field === 'isCorrect') {
          // isCorrect alanı için: sadece seçilen seçenek true, diğerleri false
          return { ...option, isCorrect: i === index };
        } else {
          // Diğer alanlar için: sadece ilgili seçenek güncellenir
          return i === index ? { ...option, [field]: value } : option;
        }
      })
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
    console.log("Soru düzenleme - Gelen soru verisi:", question);
    console.log("QuestionType değeri:", question.questionType, "Tip:", typeof question.questionType);
    
    // Şık verilerini doğru formata dönüştür
    const formattedOptions = question.options ? question.options.map(option => ({
      text: option.optionText || option.text || "",
      isCorrect: option.isCorrect || false
    })) : [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ];
    
    setEditingQuestion({
      id: question.id,
      questionText: question.questionText || "",
      questionType: question.questionType || "MultipleChoice",
      mediaType: question.mediaType || "none",
      mediaUrl: question.mediaUrl || "",
      mediaFile: null, // Yeni dosya yükleme için
      options: formattedOptions
    });
    setShowEditQuestionModal(true);
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      // Debug: Form verilerini kontrol et
      console.log("Soru güncelleme - Form verileri:", {
        questionText: editingQuestion.questionText,
        questionType: editingQuestion.questionType,
        mediaType: editingQuestion.mediaType,
        mediaUrl: editingQuestion.mediaUrl,
        mediaFile: editingQuestion.mediaFile,
        options: editingQuestion.options
      });

      // Doğru şık kontrolü
      const correctOptions = editingQuestion.options.filter(opt => opt.isCorrect);
      console.log("Doğru şık sayısı:", correctOptions.length);
      console.log("Doğru şıklar:", correctOptions.map((opt, index) => `${index + 1}. ${opt.text}`));
      
      if (correctOptions.length === 0) {
        alert("En az bir doğru şık seçmelisiniz!");
        return;
      }

      // Eğer dosya yükleme varsa FormData kullan, yoksa JSON kullan
      if (editingQuestion.mediaFile) {
        // FormData ile dosya yükleme
        const formData = new FormData();
        formData.append('questionText', editingQuestion.questionText);
        formData.append('questionType', editingQuestion.questionType || "MultipleChoice"); // Fallback değer
        formData.append('mediaType', editingQuestion.mediaType);
        
        if (editingQuestion.mediaUrl) {
          formData.append('mediaUrl', editingQuestion.mediaUrl);
        }
        
        formData.append('mediaFile', editingQuestion.mediaFile);
        
        // Seçenekleri JSON olarak ekle
        const options = editingQuestion.options.filter(opt => opt.text.trim() !== "");
        formData.append('options', JSON.stringify(options));
        
        const headers = {
          "Authorization": `Bearer ${token}`
        };

        console.log("FormData ile güncelleme yapılıyor...");
        console.log("API endpoint:", buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions/${editingQuestion.id}`));

        const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions/${editingQuestion.id}`), {
          method: "PUT",
          headers,
          body: formData
        });

        console.log("Response status:", res.status);

        if (res.ok) {
          const updatedQuestion = await res.json();
          console.log("Backend'den dönen response (FormData):", updatedQuestion);
          
          // Güncellenmiş soruyu doğru formatta state'e ekle
          const formattedUpdatedQuestion = {
            id: updatedQuestion.id,
            questionText: updatedQuestion.questionText || "",
            questionType: updatedQuestion.questionType || "MultipleChoice",
            mediaType: updatedQuestion.mediaType || "none",
            mediaUrl: updatedQuestion.mediaUrl || "",
            options: updatedQuestion.options ? updatedQuestion.options.map(option => ({
              text: option.optionText || option.text || "",
              isCorrect: option.isCorrect || false
            })) : []
          };
          
          console.log("Formatlanmış soru (FormData):", formattedUpdatedQuestion);
          
          setQuestions(questions.map(q => 
            q.id === editingQuestion.id ? formattedUpdatedQuestion : q
          ));
          setShowEditQuestionModal(false);
          setEditingQuestion(null);
          alert("Soru başarıyla güncellendi!");
        } else {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
      } else {
        // JSON ile güncelleme (dosya yoksa)
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        const updateData = {
          questionText: editingQuestion.questionText,
          questionType: editingQuestion.questionType || "MultipleChoice", // Fallback değer
          mediaType: editingQuestion.mediaType,
          mediaUrl: editingQuestion.mediaUrl,
          options: editingQuestion.options
            .filter(option => option.text.trim() !== "") // Boş şıkları filtrele
            .map(option => ({
              text: option.text.trim(),
              isCorrect: option.isCorrect
            }))
        };

        console.log("JSON ile güncelleme yapılıyor...");
        console.log("Gönderilen veri:", updateData);
        console.log("QuestionType değeri:", editingQuestion.questionType, "Tip:", typeof editingQuestion.questionType);
        console.log("JSON string:", JSON.stringify(updateData));
        console.log("URL:", buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions/${editingQuestion.id}`));

        const res = await fetch(buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${selectedExam.id}/questions/${editingQuestion.id}`), {
          method: "PUT",
          headers,
          body: JSON.stringify(updateData)
        });

        console.log("Response status:", res.status);

        if (res.ok) {
          const updatedQuestion = await res.json();
          console.log("Backend'den dönen response (JSON):", updatedQuestion);
          
          // Güncellenmiş soruyu doğru formatta state'e ekle
          const formattedUpdatedQuestion = {
            id: updatedQuestion.id,
            questionText: updatedQuestion.questionText || "",
            questionType: updatedQuestion.questionType || "MultipleChoice",
            mediaType: updatedQuestion.mediaType || "none",
            mediaUrl: updatedQuestion.mediaUrl || "",
            options: updatedQuestion.options ? updatedQuestion.options.map(option => ({
              text: option.optionText || option.text || "",
              isCorrect: option.isCorrect || false
            })) : []
          };
          
          console.log("Formatlanmış soru (JSON):", formattedUpdatedQuestion);
          
          setQuestions(questions.map(q => 
            q.id === editingQuestion.id ? formattedUpdatedQuestion : q
          ));
          setShowEditQuestionModal(false);
          setEditingQuestion(null);
          alert("Soru başarıyla güncellendi!");
        } else {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
      }
    } catch (error) {
      console.error("Soru güncellenirken hata:", error);
      alert("Soru güncellenirken hata oluştu: " + error.message);
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
      options: prev.options.map((option, i) => {
        if (field === 'isCorrect') {
          // isCorrect alanı için: sadece seçilen seçenek true, diğerleri false
          return { ...option, isCorrect: i === index };
        } else {
          // Diğer alanlar için: sadece ilgili seçenek güncellenir
          return i === index ? { ...option, [field]: value } : option;
        }
      })
    }));
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditingQuestion(prev => ({
        ...prev,
        mediaFile: file
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Sınavlar</h1>
              <p className="text-sm text-gray-600 mt-1">Sınav kayıtlarını yönetin</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <Plus size={20} />
              Yeni Sınav
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Sınav ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
            <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Exam Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {exam.title || "İsimsiz Sınav"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {exam.course?.title || "Genel Sınav"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewExam(exam)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Eye size={16} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleEditExam(exam)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Edit size={16} className="text-gray-600" />
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
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Tarih: {formatDate(exam.startDate)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Süre: {exam.duration || 0} dakika
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Katılımcı: {exam.participantCount || 0} kişi
                  </span>
                </div>

                {exam.description && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {exam.description}
                    </p>
                  </div>
                )}

                {/* Question Count */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Soru Sayısı</span>
                    <span className="text-sm font-medium text-gray-900">
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
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sınav bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinize uygun sınav bulunmuyor.</p>
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
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Yeni Soru Ekle</h2>
                    <p className="text-sm text-gray-600">Sınavınıza yeni soru ekleyin</p>
                  </div>
                </div>
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

            <form onSubmit={handleAddQuestion} className="p-6">
              {/* Step 1: Soru Temel Bilgileri */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Soru Temel Bilgileri</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soru Metni <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="questionText"
                      value={newQuestion.questionText}
                      onChange={handleQuestionInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Sorunuzu buraya yazın..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Soru net ve anlaşılır olmalıdır</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Soru Tipi
                      </label>
                      <select
                        name="questionType"
                        value={newQuestion.questionType}
                        onChange={handleQuestionInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="none">Medya Yok</option>
                        <option value="image">Görsel</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Medya Ekleme */}
              {newQuestion.mediaType !== "none" && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">2</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {newQuestion.mediaType === "image" ? "Görsel" : "Video"} Ekleme
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {newQuestion.mediaType === "image" ? "Görsel" : "Video"} URL
                      </label>
                      <input
                        type="url"
                        name="mediaUrl"
                        value={newQuestion.mediaUrl}
                        onChange={handleQuestionInputChange}
                        placeholder={`${newQuestion.mediaType === "image" ? "Görsel" : "Video"} URL'si girin`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="text-center">
                      <span className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">veya</span>
                    </div>
                    
                    <div className="flex justify-center">
                      <label className="cursor-pointer group">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                            {newQuestion.mediaType === "image" ? (
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {newQuestion.mediaType === "image" ? "Görsel" : "Video"} Yükle
                          </p>
                          <p className="text-xs text-gray-500">
                            {newQuestion.mediaType === "image" ? "PNG, JPG, GIF" : "MP4, AVI, MOV"} dosyaları desteklenir
                          </p>
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
                        </div>
                      </label>
                    </div>
                    
                    {newQuestion.mediaFile && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700">
                            {newQuestion.mediaFile.name} seçildi ({(newQuestion.mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Seçenekler */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">3</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Seçenekler</h3>
                </div>
                
                <div className="space-y-4">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className={`bg-gray-50 rounded-lg p-4 ${option.isCorrect ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${option.isCorrect ? 'bg-green-200' : 'bg-gray-200'}`}>
                          <span className={`text-sm font-medium ${option.isCorrect ? 'text-green-700' : 'text-gray-600'}`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          placeholder={`Seçenek ${index + 1}`}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={option.isCorrect}
                            onChange={() => handleOptionChange(index, 'isCorrect', true)}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm font-medium ${option.isCorrect ? 'text-green-700' : 'text-gray-700'}`}>
                            {option.isCorrect ? '✓ Doğru Cevap' : 'Doğru Cevap'}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      En az bir seçenek doğru cevap olarak işaretlenmelidir
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Soru Ekle</span>
                  </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Edit className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Soru Düzenle</h2>
                    <p className="text-sm text-gray-600">Mevcut soruyu güncelleyin</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditQuestionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateQuestion} className="p-6">
              {/* Step 1: Soru Temel Bilgileri */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Soru Temel Bilgileri</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soru Metni <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="questionText"
                      value={editingQuestion.questionText}
                      onChange={handleEditQuestionInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Sorunuzu buraya yazın..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Soru net ve anlaşılır olmalıdır</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Soru Tipi
                      </label>
                      <select
                        name="questionType"
                        value={editingQuestion.questionType}
                        onChange={handleEditQuestionInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="none">Medya Yok</option>
                        <option value="image">Görsel</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Medya Ekleme */}
              {editingQuestion.mediaType !== "none" && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">2</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingQuestion.mediaType === "image" ? "Görsel" : "Video"} Ekleme
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* URL veya Dosya Yükleme Seçimi */}
                    <div className="flex space-x-4 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editMediaSource"
                          value="url"
                          defaultChecked={!editingQuestion.mediaFile}
                          onChange={() => setEditingQuestion(prev => ({ ...prev, mediaFile: null }))}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">URL Kullan</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editMediaSource"
                          value="file"
                          defaultChecked={!!editingQuestion.mediaFile}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Dosya Yükle</span>
                      </label>
                    </div>

                    {/* URL Girişi */}
                    {!editingQuestion.mediaFile && (
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        {editingQuestion.mediaUrl && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700">
                                Medya URL'si mevcut
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dosya Yükleme */}
                    {editingQuestion.mediaFile && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {editingQuestion.mediaType === "image" ? "Görsel" : "Video"} Dosyası
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            accept={editingQuestion.mediaType === "image" ? "image/*" : "video/*"}
                            onChange={handleEditFileChange}
                            className="hidden"
                            id="editMediaFile"
                          />
                          <label htmlFor="editMediaFile" className="cursor-pointer">
                            <div className="flex flex-col items-center space-y-2">
                              <Upload className="w-8 h-8 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Dosya seçmek için tıklayın
                              </span>
                              <span className="text-xs text-gray-500">
                                {editingQuestion.mediaType === "image" ? "PNG, JPG, JPEG" : "MP4, AVI, MOV"} dosyaları desteklenir
                              </span>
                            </div>
                          </label>
                        </div>
                        
                        {editingQuestion.mediaFile && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700">
                                  {editingQuestion.mediaFile.name}
                                </span>
                              </div>
                              <span className="text-xs text-green-600">
                                {(editingQuestion.mediaFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Seçenekler */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">3</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Seçenekler</h3>
                </div>
                
                <div className="space-y-4">
                  {editingQuestion.options.map((option, index) => (
                    <div key={index} className={`bg-gray-50 rounded-lg p-4 ${option.isCorrect ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${option.isCorrect ? 'bg-green-200' : 'bg-gray-200'}`}>
                          <span className={`text-sm font-medium ${option.isCorrect ? 'text-green-700' : 'text-gray-600'}`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleEditOptionChange(index, 'text', e.target.value)}
                          placeholder={`Seçenek ${index + 1}`}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <label className="flex items-center space-x-2 cursor-pointer">
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
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-sm font-medium ${option.isCorrect ? 'text-green-700' : 'text-gray-700'}`}>
                            {option.isCorrect ? '✓ Doğru Cevap' : 'Doğru Cevap'}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      En az bir seçenek doğru cevap olarak işaretlenmelidir
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditQuestionModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <Edit className="w-4 h-4" />
                    <span>Soruyu Güncelle</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 