import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Mail,
  MessageSquare
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch("http://192.168.1.78:5068/api/notifications", { headers });
        if (!res.ok) throw new Error("Bildirimler alınamadı");
        const data = await res.json();
        setNotifications(data);
      } catch {
        setError("Bildirim listesi alınamadı.");
      }
      setLoading(false);
    }
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification =>
    notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getTypeColor = (type) => {
    switch (type) {
      case "info": return "bg-blue-100 text-blue-800";
      case "success": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "info": return <Info size={16} />;
      case "success": return <CheckCircle size={16} />;
      case "warning": return <AlertCircle size={16} />;
      case "error": return <XCircle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getTypeBgColor = (type) => {
    switch (type) {
      case "info": return "bg-blue-600";
      case "success": return "bg-green-600";
      case "warning": return "bg-yellow-600";
      case "error": return "bg-red-600";
      default: return "bg-gray-600";
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
              <h1 className="text-2xl font-semibold text-google-gray-900">Bildirimler</h1>
              <p className="text-sm text-google-gray-600 mt-1">Bildirim kayıtlarını yönetin</p>
            </div>
            
            <button
              onClick={() => {/* TODO: Add notification modal */}}
              className="inline-flex items-center gap-2 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
            >
              <Plus size={20} />
              Yeni Bildirim
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
                placeholder="Bildirim ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
            >
              <option value="">Tüm Türler</option>
              <option value="info">Bilgi</option>
              <option value="success">Başarı</option>
              <option value="warning">Uyarı</option>
              <option value="error">Hata</option>
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

        {/* Notification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className="bg-white rounded-xl shadow-sm border border-google-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Notification Header */}
              <div className="p-6 border-b border-google-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${getTypeBgColor(notification.type)} rounded-lg flex items-center justify-center`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-google-gray-900">
                        {notification.title || "İsimsiz Bildirim"}
                      </h3>
                      <p className="text-sm text-google-gray-600">
                        {notification.recipientType || "Genel"}
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

                {/* Type */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                    {notification.type === "info" ? "Bilgi" : 
                     notification.type === "success" ? "Başarı" : 
                     notification.type === "warning" ? "Uyarı" : 
                     notification.type === "error" ? "Hata" : "Bilinmiyor"}
                  </span>
                </div>
              </div>

              {/* Notification Details */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">
                    Tarih: {formatDate(notification.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <MessageSquare className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">
                    Gönderen: {notification.sender || "Sistem"}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-google-gray-400" />
                  <span className="text-google-gray-700">
                    Alıcı: {notification.recipientCount || 0} kişi
                  </span>
                </div>

                {notification.message && (
                  <div className="pt-3 border-t border-google-gray-100">
                    <p className="text-sm text-google-gray-600 line-clamp-3">
                      {notification.message}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="pt-3 border-t border-google-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-google-gray-600">Durum</span>
                    <span className={`text-sm font-medium ${
                      notification.isRead ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {notification.isRead ? 'Okundu' : 'Okunmadı'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && !loading && (
          <div className="text-center py-12">
            <Bell size={64} className="mx-auto text-google-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-google-gray-900 mb-2">Bildirim bulunamadı</h3>
            <p className="text-google-gray-600">Arama kriterlerinize uygun bildirim bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
} 