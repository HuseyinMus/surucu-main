import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  User,
  MapPin,
  Star
} from "lucide-react";

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    fullName: "",
    email: "",
    phone: "",
    tcNumber: "",
    specialization: "",
    experience: 0,
    branch: "Theory"
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [editingInstructor, setEditingInstructor] = useState(null);

  useEffect(() => {
    async function fetchInstructors() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch("http://192.168.1.78:5068/api/instructors", { headers });
        if (!res.ok) throw new Error("Eğitmenler alınamadı");
        const data = await res.json();
        setInstructors(data);
      } catch {
        setError("Eğitmen listesi alınamadı.");
      }
      setLoading(false);
    }
    fetchInstructors();
  }, []);

  const filteredInstructors = instructors.filter(instructor =>
    instructor.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleAddInstructor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const instructorData = {
        fullName: newInstructor.fullName,
        email: newInstructor.email,
        phone: newInstructor.phone,
        tcNumber: newInstructor.tcNumber,
        specialization: newInstructor.specialization,
        experience: newInstructor.experience,
        branch: newInstructor.branch
      };

      const res = await fetch("http://192.168.1.78:5068/api/instructors", {
        method: "POST",
        headers,
        body: JSON.stringify(instructorData)
      });

      if (res.ok) {
        const newInstructorData = await res.json();
        setInstructors([...instructors, newInstructorData]);
        setShowAddModal(false);
        setNewInstructor({
          fullName: "",
          email: "",
          phone: "",
          tcNumber: "",
          specialization: "",
          experience: 0,
          branch: "Theory"
        });
      } else {
        const errorText = await res.text();
        console.error("Backend response:", res.status, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      setError("Eğitmen eklenirken hata oluştu: " + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInstructor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setShowDetailModal(true);
  };

  const handleEditInstructor = (instructor) => {
    setEditingInstructor({
      id: instructor.id,
      fullName: instructor.user.fullName,
      email: instructor.user.email,
      phone: instructor.user.phone,
      tcNumber: instructor.user.tcNumber,
      specialization: instructor.specialization || "",
      experience: instructor.experience || 0,
      branch: instructor.branch || "Theory"
    });
    setShowEditModal(true);
  };

  const handleUpdateInstructor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const instructorData = {
        fullName: editingInstructor.fullName,
        email: editingInstructor.email,
        phone: editingInstructor.phone,
        specialization: editingInstructor.specialization,
        experience: editingInstructor.experience,
        branch: editingInstructor.branch
      };

      const res = await fetch(`http://192.168.1.78:5068/api/instructors/${editingInstructor.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(instructorData)
      });

      if (res.ok) {
        const updatedInstructor = await res.json();
        setInstructors(instructors.map(instructor => 
          instructor.id === editingInstructor.id ? updatedInstructor : instructor
        ));
        setShowEditModal(false);
        setEditingInstructor(null);
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      setError("Eğitmen güncellenirken hata oluştu: " + error.message);
    }
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (!window.confirm("Bu eğitmeni silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`http://192.168.1.78:5068/api/instructors/${instructorId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setInstructors(instructors.filter(instructor => instructor.id !== instructorId));
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      setError("Eğitmen silinirken hata oluştu: " + error.message);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingInstructor(prev => ({
      ...prev,
      [name]: value
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
              <h1 className="text-2xl font-semibold text-google-gray-900">Eğitmenler</h1>
              <p className="text-sm text-google-gray-600 mt-1">Eğitmen kayıtlarını yönetin</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
            >
              <Plus size={20} />
              Yeni Eğitmen
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
                placeholder="Eğitmen ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
              />
            </div>
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

        {/* Instructor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <div key={instructor.id} className="bg-white rounded-xl shadow-sm border border-google-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Instructor Header */}
              <div className="p-6 border-b border-google-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-google-gray-900">
                        {instructor.user?.fullName || "İsimsiz Eğitmen"}
                      </h3>
                      <p className="text-sm text-google-gray-600">
                        {instructor.specialization || "Genel Eğitmen"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewInstructor(instructor)}
                      className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Eye size={16} className="text-google-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleEditInstructor(instructor)}
                      className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Edit size={16} className="text-google-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDeleteInstructor(instructor.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={16} 
                        className={`${star <= (instructor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-google-gray-600">
                    {instructor.rating || 0}/5
                  </span>
                </div>
              </div>

              {/* Instructor Details */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">{instructor.user?.email || "E-posta yok"}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">{instructor.user?.phone || "Telefon yok"}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">
                    Başlangıç: {formatDate(instructor.hireDate)}
                  </span>
                </div>

                {instructor.experience && (
                  <div className="pt-3 border-t border-google-gray-100">
                    <p className="text-sm text-google-gray-600 line-clamp-2">
                      Deneyim: {instructor.experience} yıl
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredInstructors.length === 0 && !loading && (
          <div className="text-center py-12">
            <GraduationCap size={64} className="mx-auto text-google-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-google-gray-900 mb-2">Eğitmen bulunamadı</h3>
            <p className="text-google-gray-600">Arama kriterlerinize uygun eğitmen bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Add Instructor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Yeni Eğitmen Ekle</h2>
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

            <form onSubmit={handleAddInstructor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={newInstructor.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newInstructor.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newInstructor.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TC Kimlik No *
                  </label>
                  <input
                    type="text"
                    name="tcNumber"
                    value={newInstructor.tcNumber}
                    onChange={handleInputChange}
                    required
                    maxLength={11}
                    pattern="[0-9]{11}"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uzmanlık Alanı
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={newInstructor.specialization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deneyim (Yıl)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={newInstructor.experience}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branş
                  </label>
                  <select
                    name="branch"
                    value={newInstructor.branch}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Theory">Teori</option>
                    <option value="Practice">Pratik</option>
                  </select>
                </div>
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
                  Eğitmen Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructor Detail Modal */}
      {showDetailModal && selectedInstructor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Eğitmen Detayları</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Kapat</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedInstructor.user?.fullName}
                  </h3>
                  <p className="text-gray-600">{selectedInstructor.specialization}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                  <p className="text-gray-900">{selectedInstructor.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <p className="text-gray-900">{selectedInstructor.user?.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TC Kimlik No</label>
                  <p className="text-gray-900">{selectedInstructor.user?.tcNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branş</label>
                  <p className="text-gray-900">{selectedInstructor.branch === "Theory" ? "Teori" : "Pratik"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deneyim</label>
                  <p className="text-gray-900">{selectedInstructor.experience} yıl</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">İşe Başlama</label>
                  <p className="text-gray-900">{formatDate(selectedInstructor.hireDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700">Değerlendirme</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={16} 
                      className={`${star <= (selectedInstructor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {selectedInstructor.rating || 0}/5
                </span>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Instructor Modal */}
      {showEditModal && editingInstructor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Eğitmen Düzenle</h2>
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

            <form onSubmit={handleUpdateInstructor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={editingInstructor.fullName}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingInstructor.email}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editingInstructor.phone}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TC Kimlik No
                  </label>
                  <input
                    type="text"
                    name="tcNumber"
                    value={editingInstructor.tcNumber}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">TC kimlik numarası değiştirilemez</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uzmanlık Alanı
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={editingInstructor.specialization}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deneyim (Yıl)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={editingInstructor.experience}
                    onChange={handleEditInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branş
                  </label>
                  <select
                    name="branch"
                    value={editingInstructor.branch}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Theory">Teori</option>
                    <option value="Practice">Pratik</option>
                  </select>
                </div>
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
    </div>
  );
} 