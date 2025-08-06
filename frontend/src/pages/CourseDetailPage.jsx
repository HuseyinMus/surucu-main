import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { buildApiUrl, API_ENDPOINTS } from "../config/api";
import { 
  Play, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  ChevronRight, 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  CheckCircle,
  Video,
  File,
  Type,
  Calendar,
  Share2,
  Bookmark,
  BookmarkPlus
} from "lucide-react";

export default function CourseDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showAddContentForm, setShowAddContentForm] = useState(false);
  const [progress, setProgress] = useState({});
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    contentType: 0,
    contentUrl: "",
    duration: "",
    order: 0
  });
  const [contentInputType, setContentInputType] = useState("url"); // "url" veya "file"
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editCourse, setEditCourse] = useState({
    title: "",
    description: "",
    courseType: 0,
    category: "",
    tags: ""
  });


  const isAdminOrInstructor = user && (user.role === "Admin" || user.role === "Instructor");

  useEffect(() => {
    fetchCourseDetails();
  }, [id, token, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      
      // Kurs detaylarını al
      const courseRes = await fetch(buildApiUrl(`/api/courses/${id}`), { headers });
      if (!courseRes.ok) throw new Error("Kurs bulunamadı");
      const courseData = await courseRes.json();
      setCourse(courseData);

      // Kurs içeriklerini al
      const contentsRes = await fetch(buildApiUrl(`/api/courses/${id}/contents`), { headers });
      if (contentsRes.ok) {
        const contentsData = await contentsRes.json();
        setContents(contentsData);
      }

      // Öğrenci ilerlemesini al (eğer öğrenci ise)
      if (user?.role === "Student") {
        const progressRes = await fetch(buildApiUrl(`/api/students/progress/${id}`), { headers });
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData);
        }
      }

    } catch {
      setError("Kurs detayları yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = (content) => {
    setSelectedContent(content);
    setShowContentModal(true);
  };

  const handleAddContent = () => {
    setShowAddContentForm(true);
  };

  const handleEditCourse = () => {
    setEditCourse({
      title: course.title || "",
      description: course.description || "",
      courseType: course.courseType || 0,
      category: course.category || "",
      tags: course.tags || ""
    });
    setShowEditModal(true);
  };

  const handleDeleteCourse = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCourse = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/courses/${id}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        navigate("/panel/courses");
      } else {
        const errorData = await response.json();
        alert(`Kurs silinemedi: ${errorData.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Kurs silinirken hata oluştu");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // JWT'den DrivingSchoolId bul
      const jwtPayload = JSON.parse(atob(token.split('.')[1]));
      const drivingSchoolId = jwtPayload.DrivingSchoolId || jwtPayload.drivingSchoolId;

      const courseData = {
        title: editCourse.title,
        description: editCourse.description,
        courseType: editCourse.courseType === 0 ? "Theory" : "Practice",
        category: editCourse.category || "",
        tags: editCourse.tags,
        drivingSchoolId: drivingSchoolId,
        videoUrl: course?.videoUrl || "",
        imageUrl: course?.imageUrl || "",
        pdfUrl: course?.pdfUrl || ""
      };

      const response = await fetch(buildApiUrl(`/api/courses/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchCourseDetails(); // Kurs bilgilerini yenile
             } else {
         const errorData = await response.json();
         console.error("Backend hata detayı:", errorData);
         alert(`Kurs güncellenemedi: ${errorData.message || errorData.title || 'Bilinmeyen hata'}`);
       }
    } catch (error) {
      console.error("Hata:", error);
      alert("Kurs güncellenirken hata oluştu");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditCourse(prev => ({
      ...prev,
      [name]: name === "courseType" ? parseInt(value) : value
    }));
  };



  const handleContentSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalContentUrl = newContent.contentUrl;

      // Eğer dosya seçilmişse, önce dosyayı yükle
      if (selectedFile) {
        const uploadedUrl = await handleFileUpload(selectedFile);
        if (uploadedUrl) {
          finalContentUrl = uploadedUrl;
        } else {
          return; // Dosya yükleme başarısız
        }
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const contentData = {
        ...newContent,
        contentUrl: finalContentUrl
      };

      const response = await fetch(buildApiUrl(`/api/courses/${id}/contents`), {
        method: "POST",
        headers,
        body: JSON.stringify(contentData)
      });

      if (response.ok) {
        setShowAddContentForm(false);
        setNewContent({
          title: "",
          description: "",
          contentType: 0,
          contentUrl: "",
          duration: "",
          order: 0
        });
        setSelectedFile(null);
        setContentInputType("url");
        fetchCourseDetails(); // Kurs içeriklerini yenile
      } else {
        const errorData = await response.json();
        console.error("İçerik eklenemedi:", errorData);
        alert(`İçerik eklenemedi: ${errorData.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setNewContent(prev => ({
      ...prev,
      [name]: name === "contentType" || name === "order" || name === "duration" 
        ? (value === "" ? 0 : parseInt(value) || 0) 
        : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      
      if (newContent.contentType === 0) {
        formData.append('video', file);
      } else if (newContent.contentType === 2) {
        formData.append('pdf', file);
      } else {
        formData.append('image', file);
      }

      const response = await fetch(buildApiUrl('/api/courses/upload-media'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return result.videoUrl || result.pdfUrl || result.imageUrl;
      } else {
        throw new Error('Dosya yükleme başarısız');
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken hata oluştu');
      return null;
    }
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 0: return <Video size={20} className="text-blue-500" />;
      case 1: return <Type size={20} className="text-green-500" />;
      case 2: return <File size={20} className="text-red-500" />;
      default: return <FileText size={20} className="text-gray-500" />;
    }
  };

  const getContentTypeText = (contentType) => {
    switch (contentType) {
      case 0: return "Video";
      case 1: return "Metin";
      case 2: return "PDF";
      default: return "İçerik";
    }
  };

  const formatDuration = (duration) => {
    if (!duration || isNaN(duration) || duration <= 0) return "Süre belirtilmemiş";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return "0 dk";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} sa ${minutes} dk`;
    } else {
      return `${minutes} dk`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Kurs yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kurs bulunamadı</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/panel/courses")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kurslara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/panel/courses")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">Kurs Detayları</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAdminOrInstructor && (
                <>
                  <button 
                    onClick={handleEditCourse}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={20} className="text-gray-600" />
                  </button>
                  <button 
                    onClick={handleDeleteCourse}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} className="text-red-600" />
                  </button>
                </>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <BookmarkPlus size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ana İçerik */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kurs Hero Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-blue-500 to-blue-600">
                                 {course.imageUrl ? (
                   <img
                     src={`http://localhost:5068${course.imageUrl}`}
                     alt={course.title}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen size={64} className="text-white opacity-80" />
                  </div>
                )}
                
                {/* Kurs Türü Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    course.courseType === 0 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {course.courseType === 0 ? 'Teorik' : 'Pratik'}
                  </span>
                </div>

                {/* Progress Bar (öğrenci için) */}
                {user?.role === "Student" && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white bg-opacity-90 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">İlerleme</span>
                        <span className="text-sm text-gray-600">
                          {Math.round((progress.completedLessons || 0) / contents.length * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(progress.completedLessons || 0) / contents.length * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{course.title}</h2>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {course.description || "Bu kurs için henüz açıklama eklenmemiş."}
                </p>

                {/* Kurs İstatistikleri */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2">
                      <BookOpen size={24} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{contents.length}</p>
                    <p className="text-xs text-gray-600">Ders</p>
                  </div>
                </div>

                {/* Etiketler */}
                {course.tags && (
                  <div className="flex flex-wrap gap-2">
                    {course.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: "overview", label: "Genel Bakış", icon: BookOpen },
                    { id: "contents", label: "Dersler", icon: Video }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Genel Bakış Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Kurs Hakkında</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {course.description || "Bu kurs için detaylı açıklama henüz eklenmemiş."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Kurs Türü</h4>
                        <p className="text-gray-600">
                          {course.courseType === 0 ? 'Teorik Eğitim' : 'Pratik Eğitim'}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Kategori</h4>
                        <p className="text-gray-600">{course.category || 'Belirtilmemiş'}</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Oluşturulma Tarihi</h4>
                        <p className="text-gray-600">
                          {new Date(course.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Toplam İçerik</h4>
                        <p className="text-gray-600">{contents.length} ders</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dersler Tab */}
                {activeTab === "contents" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Dersler</h3>
                      {isAdminOrInstructor && (
                        <button 
                          onClick={handleAddContent}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={16} />
                          <span>Yeni Ders</span>
                        </button>
                      )}
                    </div>

                    {/* Ders Ekleme Formu */}
                    {showAddContentForm && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Plus size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900">Yeni Ders Ekle</h4>
                              <p className="text-sm text-gray-600">Kursunuza yeni içerik ekleyin</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setShowAddContentForm(false);
                              setSelectedFile(null);
                              setContentInputType("url");
                            }}
                            className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200"
                          >
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <form onSubmit={handleContentSubmit} className="space-y-6">
                          {/* Adım 1: Temel Bilgiler */}
                          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-600">1</span>
                              </div>
                              <h5 className="text-lg font-medium text-gray-900">Temel Bilgiler</h5>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Ders Başlığı *
                                </label>
                                <input
                                  type="text"
                                  name="title"
                                  value={newContent.title}
                                  onChange={handleContentChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="Örn: Trafik İşaretleri Temelleri"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  İçerik Türü *
                                </label>
                                <select
                                  name="contentType"
                                  value={newContent.contentType}
                                  onChange={handleContentChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                >
                                  <option value={0}>🎥 Video</option>
                                  <option value={1}>📝 Metin</option>
                                  <option value={2}>📄 PDF</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="mt-6">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Açıklama
                              </label>
                              <textarea
                                name="description"
                                value={newContent.description}
                                onChange={handleContentChange}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Bu ders hakkında kısa bir açıklama yazın..."
                              />
                            </div>
                          </div>

                          {/* Adım 2: İçerik Kaynağı */}
                          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-green-600">2</span>
                              </div>
                              <h5 className="text-lg font-medium text-gray-900">İçerik Kaynağı</h5>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  İçerik Yöntemi
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <label className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                                    contentInputType === "url" 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}>
                                    <input
                                      type="radio"
                                      name="contentInputType"
                                      value="url"
                                      checked={contentInputType === "url"}
                                      onChange={(e) => setContentInputType(e.target.value)}
                                      className="sr-only"
                                    />
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        contentInputType === "url" 
                                          ? 'border-blue-500 bg-blue-500' 
                                          : 'border-gray-300'
                                      }`}>
                                        {contentInputType === "url" && (
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">URL ile Ekle</div>
                                        <div className="text-sm text-gray-600">Video linki veya dosya URL'si</div>
                                      </div>
                                    </div>
                                  </label>
                                  
                                  <label className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                                    contentInputType === "file" 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}>
                                    <input
                                      type="radio"
                                      name="contentInputType"
                                      value="file"
                                      checked={contentInputType === "file"}
                                      onChange={(e) => setContentInputType(e.target.value)}
                                      className="sr-only"
                                    />
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        contentInputType === "file" 
                                          ? 'border-blue-500 bg-blue-500' 
                                          : 'border-gray-300'
                                      }`}>
                                        {contentInputType === "file" && (
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">Dosya Yükle</div>
                                        <div className="text-sm text-gray-600">Bilgisayarınızdan dosya seçin</div>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              </div>
                              
                              {contentInputType === "url" ? (
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    İçerik URL'si *
                                  </label>
                                  <input
                                    type="text"
                                    name="contentUrl"
                                    value={newContent.contentUrl}
                                    onChange={handleContentChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder={
                                      newContent.contentType === 0 ? "https://example.com/video.mp4" :
                                      newContent.contentType === 2 ? "https://example.com/document.pdf" :
                                      "İçerik metni veya URL"
                                    }
                                    required
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Dosya Seçin *
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="file"
                                      onChange={handleFileChange}
                                      accept={
                                        newContent.contentType === 0 ? "video/*" :
                                        newContent.contentType === 2 ? ".pdf" :
                                        "image/*"
                                      }
                                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                  </div>
                                  
                                  {selectedFile && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        <span className="text-sm font-medium text-green-800">
                                          Seçilen dosya: {selectedFile.name}
                                        </span>
                                      </div>
                                      <p className="text-xs text-green-600 mt-1">
                                        Dosya boyutu: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Adım 3: Ek Ayarlar */}
                          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-purple-600">3</span>
                              </div>
                              <h5 className="text-lg font-medium text-gray-900">Ek Ayarlar</h5>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Süre (dakika)
                                </label>
                                <input
                                  type="number"
                                  name="duration"
                                  value={newContent.duration}
                                  onChange={handleContentChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="30"
                                  min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">Tahmini tamamlanma süresi</p>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Sıra Numarası
                                </label>
                                <input
                                  type="number"
                                  name="order"
                                  value={newContent.order}
                                  onChange={handleContentChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="1"
                                  min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">Derslerin görüntülenme sırası</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Form Butonları */}
                          <div className="flex justify-end space-x-4 pt-6">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddContentForm(false);
                                setSelectedFile(null);
                                setContentInputType("url");
                              }}
                              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                            >
                              İptal
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              <div className="flex items-center space-x-2">
                                <Plus size={16} />
                                <span>Ders Ekle</span>
                              </div>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {contents.length === 0 ? (
                      <div className="text-center py-12">
                        <Video size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ders eklenmemiş</h3>
                        <p className="text-gray-600">Bu kurs için henüz içerik eklenmemiş.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contents.map((content, index) => (
                          <div
                            key={content.id}
                            onClick={() => handleContentClick(content)}
                            className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                  {getContentIcon(content.contentType)}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {index + 1}. {content.title}
                                  </span>
                                  {progress.completedLessons?.includes(content.id) && (
                                    <CheckCircle size={16} className="text-green-500" />
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center space-x-1">
                                    {getContentIcon(content.contentType)}
                                    <span>{getContentTypeText(content.contentType)}</span>
                                  </span>
                                  {content.duration && (
                                    <span className="flex items-center space-x-1">
                                      <Clock size={14} />
                                      <span>{formatDuration(content.duration)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}




              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hızlı Eylemler */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Eylemler</h3>
              <div className="space-y-3">
                {/* Kursa Başla butonu kaldırıldı */}
              </div>
            </div>

            {/* Kurs Bilgileri */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kurs Bilgileri</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Oluşturulma</p>
                    <p className="text-sm text-gray-600">
                      {new Date(course.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                

                
                <div className="flex items-center space-x-3">
                  <BookOpen size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ders Sayısı</p>
                    <p className="text-sm text-gray-600">{contents.length} ders</p>
                  </div>
                </div>
                

              </div>
            </div>


          </div>
        </div>
      </div>

      {/* İçerik Modal */}
      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{selectedContent.title}</h2>
                <button
                  onClick={() => setShowContentModal(false)}
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
              {selectedContent.description && (
                <p className="text-gray-600 mb-6">{selectedContent.description}</p>
              )}

                             {selectedContent.contentType === 0 && selectedContent.contentUrl && (
                 <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
                   <video
                     controls
                     className="w-full h-full"
                     src={`http://localhost:5068${selectedContent.contentUrl}`}
                   >
                     Tarayıcınız video oynatmayı desteklemiyor.
                   </video>
                 </div>
               )}

              {selectedContent.contentType === 1 && (
                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Metin İçeriği</h3>
                    <div className="text-gray-700 leading-relaxed">
                      {selectedContent.contentUrl || "Bu ders için metin içeriği henüz eklenmemiş."}
                    </div>
                  </div>
                </div>
              )}

                             {selectedContent.contentType === 2 && selectedContent.contentUrl && (
                 <div className="bg-gray-50 rounded-xl p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF İçeriği</h3>
                   <div className="aspect-[3/4] bg-white rounded-lg shadow-sm overflow-hidden">
                     <iframe
                       src={`http://localhost:5068${selectedContent.contentUrl}`}
                       className="w-full h-full"
                       title={selectedContent.title}
                     />
                   </div>
                   <div className="mt-4">
                     <a
                       href={`http://localhost:5068${selectedContent.contentUrl}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       <Download size={16} />
                       <span>PDF'i İndir</span>
                     </a>
                   </div>
                 </div>
               )}

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    {getContentIcon(selectedContent.contentType)}
                    <span>{getContentTypeText(selectedContent.contentType)}</span>
                  </span>
                  {selectedContent.duration && (
                    <span className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatDuration(selectedContent.duration)}</span>
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Önceki
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kurs Düzenleme Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Kurs Düzenle</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kurs Başlığı
                </label>
                <input
                  type="text"
                  name="title"
                  value={editCourse.title}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={editCourse.description}
                  onChange={handleEditChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kurs Türü
                  </label>
                  <select
                    name="courseType"
                    value={editCourse.courseType}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Teorik</option>
                    <option value={1}>Pratik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editCourse.category}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiketler (virgülle ayırın)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={editCourse.tags}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="örnek, etiket, test"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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

      {/* Silme Onay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Kursu Sil</h3>
                  <p className="text-sm text-gray-600">Bu işlem geri alınamaz</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                <strong>"{course?.title}"</strong> kursunu silmek istediğinizden emin misiniz? 
                Bu işlem tüm kurs içeriklerini ve verilerini kalıcı olarak silecektir.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={confirmDeleteCourse}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 