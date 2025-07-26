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
              onClick={() => {/* TODO: Add instructor modal */}}
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
    </div>
  );
} 