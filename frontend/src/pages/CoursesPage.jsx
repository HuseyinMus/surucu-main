import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Play, FileText, Edit, Trash2, Eye, BookOpen } from "lucide-react";

function parseJwt(token) {
  if (!token) return {};
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

const initialForm = {
  title: "",
  description: "",
  courseType: "Theory",
  tags: ""
};

export default function CoursesPage() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [imageError, setImageError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter] = useState("");

  const navigate = useNavigate();

  // JWT'den DrivingSchoolId bul
  const jwtPayload = parseJwt(token);
  const drivingSchoolId = jwtPayload.DrivingSchoolId || jwtPayload.drivingSchoolId;

  const isAdminOrInstructor = user && (user.role === "Admin" || user.role === "Instructor");

  // Kursları çek
  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setError("");
      try {
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch("http://192.168.1.78:5068/api/courses", { headers });
        if (!res.ok) throw new Error("Kurslar alınamadı");
        const data = await res.json();
        setCourses(data);
      } catch {
        setError("Kurslar alınamadı.");
      }
      setLoading(false);
    }
    fetchCourses();
  }, [showForm]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Dosya yükleme fonksiyonu
  async function handleFileUpload(type, file) {
    if (!file) return;
    if (type === "video") { setVideoLoading(true); setVideoError(""); }
    if (type === "image") { setImageLoading(true); setImageError(""); }
    if (type === "pdf") { setPdfLoading(true); setPdfError(""); }
    const formData = new FormData();
    if (type === "video") formData.append("video", file);
    if (type === "image") formData.append("image", file);
    if (type === "pdf") formData.append("pdf", file);
    try {
      const res = await fetch("http://192.168.1.78:5068/api/courses/upload-media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.videoUrl) setVideoUrl(data.videoUrl);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.pdfUrl) setPdfUrl(data.pdfUrl);
    } catch {
      if (type === "video") setVideoError("Video yüklenemedi!");
      if (type === "image") setImageError("Resim yüklenemedi!");
      if (type === "pdf") setPdfError("PDF yüklenemedi!");
    } finally {
      if (type === "video") setVideoLoading(false);
      if (type === "image") setImageLoading(false);
      if (type === "pdf") setPdfLoading(false);
    }
  }



  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    if (!form.title.trim()) {
      setFormError("Kurs başlığı gereklidir.");
      return;
    }

    try {
      const courseData = {
        title: form.title,
        description: form.description,
        courseType: form.courseType,
        tags: form.tags,
        drivingSchoolId: drivingSchoolId,
        videoUrl: videoUrl,
        imageUrl: imageUrl,
        pdfUrl: pdfUrl
      };

      const res = await fetch("http://192.168.1.78:5068/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(courseData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        setFormError(errorData.title || "Kurs eklenemedi!");
        return;
      }

      setSuccess("Kurs başarıyla eklendi!");
      setForm(initialForm);
      setVideoUrl("");
      setImageUrl("");
      setPdfUrl("");
      setShowForm(false);
    } catch {
      setFormError("Kurs eklenemedi!");
    }
  };

  // Filtreleme
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
                         course.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || course.courseType === (typeFilter === "Theory" ? 0 : 1);
    const matchesCategory = !categoryFilter || course.category === categoryFilter;
    const matchesTag = !tagFilter || course.tags?.includes(tagFilter);
    return matchesSearch && matchesType && matchesCategory && matchesTag;
  });

  // Benzersiz kategoriler ve etiketler
  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];

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
              <h1 className="text-2xl font-semibold text-google-gray-900">Kurslar</h1>
              <p className="text-sm text-google-gray-600 mt-1">Kurslarınızı yönetin ve takip edin</p>
            </div>
            
            {isAdminOrInstructor && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
              >
                <Plus size={20} />
                Yeni Kurs
              </button>
            )}
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
                placeholder="Kurs ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
            >
              <option value="">Tüm Türler</option>
              <option value="Theory">Teorik</option>
              <option value="Practice">Pratik</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-google-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Course Image */}
              <div className="relative h-48 bg-gradient-to-br from-google-blue to-blue-600">
                {course.imageUrl ? (
                  <img
                    src={`http://192.168.1.78:5068${course.imageUrl}`}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen size={48} className="text-white opacity-80" />
                  </div>
                )}
                
                {/* Course Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    course.courseType === 0 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {course.courseType === 0 ? 'Teorik' : 'Pratik'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/panel/courses/${course.id}`)}
                    className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-all duration-200"
                  >
                    <Eye size={16} className="text-google-gray-700" />
                  </button>
                  {isAdminOrInstructor && (
                    <>
                      <button className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-all duration-200">
                        <Edit size={16} className="text-google-gray-700" />
                      </button>
                      <button className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-all duration-200">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-google-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                
                <p className="text-sm text-google-gray-600 mb-4 line-clamp-3">
                  {course.description || "Açıklama bulunmuyor"}
                </p>

                {/* Course Stats */}
                <div className="flex items-center gap-4 text-sm text-google-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Play size={16} />
                    <span>{course.courseContents?.length || 0} Ders</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText size={16} />
                    <span>{course.quizzes?.length || 0} Sınav</span>
                  </div>
                </div>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-google-gray-100 text-google-gray-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {course.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-google-gray-100 text-google-gray-700 rounded-full">
                        +{course.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* View Button */}
                <button
                  onClick={() => navigate(`/panel/courses/${course.id}`)}
                  className="w-full py-2 px-4 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                >
                  Kursu Görüntüle
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen size={64} className="mx-auto text-google-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-google-gray-900 mb-2">Kurs bulunamadı</h3>
            <p className="text-google-gray-600">Arama kriterlerinize uygun kurs bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-google-gray-200">
              <h2 className="text-xl font-semibold text-google-gray-900">Yeni Kurs Ekle</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">
                    Kurs Başlığı *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    placeholder="Kurs başlığını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    placeholder="Kurs açıklamasını girin"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-google-gray-700 mb-2">
                      Kurs Türü
                    </label>
                    <select
                      name="courseType"
                      value={form.courseType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    >
                      <option value="Theory">Teorik</option>
                      <option value="Practice">Pratik</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-google-gray-700 mb-2">
                      Etiketler
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={form.tags}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                      placeholder="Virgülle ayırarak etiketler girin"
                    />
                  </div>
                </div>

                {/* File Uploads */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-google-gray-900">Medya Dosyaları</h3>
                  
                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-medium text-google-gray-700 mb-2">
                      Video
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files[0]) handleFileUpload("video", e.target.files[0]);
                      }}
                      className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    />
                    {videoLoading && <p className="text-sm text-google-blue mt-1">Yükleniyor...</p>}
                    {videoError && <p className="text-sm text-red-600 mt-1">{videoError}</p>}
                    {videoUrl && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">Video yüklendi</p>
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-google-gray-700 mb-2">
                      Görsel
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) handleFileUpload("image", e.target.files[0]);
                      }}
                      className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    />
                    {imageLoading && <p className="text-sm text-google-blue mt-1">Yükleniyor...</p>}
                    {imageError && <p className="text-sm text-red-600 mt-1">{imageError}</p>}
                    {imageUrl && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">Görsel yüklendi</p>
                      </div>
                    )}
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <label className="block text-sm font-medium text-google-gray-700 mb-2">
                      PDF
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) handleFileUpload("pdf", e.target.files[0]);
                      }}
                      className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                    />
                    {pdfLoading && <p className="text-sm text-google-blue mt-1">Yükleniyor...</p>}
                    {pdfError && <p className="text-sm text-red-600 mt-1">{pdfError}</p>}
                    {pdfUrl && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">PDF yüklendi</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-google-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-google-gray-300 text-google-gray-700 rounded-lg hover:bg-google-gray-50 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Kurs Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 