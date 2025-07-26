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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [editingNotification, setEditingNotification] = useState(null);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info",
    recipientType: "all",
    scheduledDate: ""
  });

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

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleEditNotification = (notification) => {
    setEditingNotification({
      id: notification.id,
      title: notification.title || "",
      message: notification.message || "",
      type: notification.type || "info",
      recipientType: notification.recipientType || "all",
      scheduledDate: notification.scheduledDate || ""
    });
    setShowEditModal(true);
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm("Bu bildirimi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`http://192.168.1.78:5068/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setNotifications(notifications.filter(notification => notification.id !== notificationId));
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Bildirim silinirken hata:", error);
    }
  };

  const handleAddNotification = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      // Add a dummy UserId for "all" recipients, or get from user context
      const notificationData = {
        ...newNotification,
        userId: "00000000-0000-0000-0000-000000000000" // Empty GUID for "all" recipients
      };

      const res = await fetch("http://192.168.1.78:5068/api/notifications", {
        method: "POST",
        headers,
        body: JSON.stringify(notificationData)
      });

      if (res.ok) {
        const addedNotification = await res.json();
        setNotifications([...notifications, addedNotification]);
        setShowAddModal(false);
        setNewNotification({
          title: "",
          message: "",
          type: "info",
          recipientType: "all",
          scheduledDate: ""
        });
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Bildirim eklenirken hata:", error);
    }
  };

  const handleUpdateNotification = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`http://192.168.1.78:5068/api/notifications/${editingNotification.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editingNotification)
      });

      if (res.ok) {
        const updatedNotification = await res.json();
        setNotifications(notifications.map(notification => 
          notification.id === editingNotification.id ? updatedNotification : notification
        ));
        setShowEditModal(false);
        setEditingNotification(null);
      } else {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Bildirim güncellenirken hata:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNotification(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingNotification(prev => ({
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
              <h1 className="text-2xl font-semibold text-google-gray-900">Bildirimler</h1>
              <p className="text-sm text-google-gray-600 mt-1">Bildirim kayıtlarını yönetin</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
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
                    <button
                      onClick={() => handleViewNotification(notification)}
                      className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Eye size={16} className="text-google-gray-600" />
                    </button>
                    <button
                      onClick={() => handleEditNotification(notification)}
                      className="p-2 hover:bg-google-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Edit size={16} className="text-google-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                    >
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

      {/* Add Notification Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-google-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-google-gray-900">Yeni Bildirim Ekle</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-google-gray-400 hover:text-google-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAddNotification} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Başlık *
                </label>
                <input
                  type="text"
                  name="title"
                  value={newNotification.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="Bildirim başlığı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Mesaj *
                </label>
                <textarea
                  name="message"
                  value={newNotification.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="Bildirim mesajı"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">
                    Tür *
                  </label>
                  <select
                    name="type"
                    value={newNotification.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  >
                    <option value="info">Bilgi</option>
                    <option value="success">Başarı</option>
                    <option value="warning">Uyarı</option>
                    <option value="error">Hata</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">
                    Alıcı Türü *
                  </label>
                  <select
                    name="recipientType"
                    value={newNotification.recipientType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  >
                    <option value="all">Tüm Kullanıcılar</option>
                    <option value="students">Öğrenciler</option>
                    <option value="instructors">Eğitmenler</option>
                    <option value="admins">Yöneticiler</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Zamanlanmış Tarih
                </label>
                <input
                  type="datetime-local"
                  name="scheduledDate"
                  value={newNotification.scheduledDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-google-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-google-gray-300 text-google-gray-700 rounded-lg hover:bg-google-gray-50 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Bildirim Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-google-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-google-gray-900">Bildirim Detayları</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-google-gray-400 hover:text-google-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${getTypeBgColor(selectedNotification.type)} rounded-lg flex items-center justify-center`}>
                  {getTypeIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-google-gray-900">
                    {selectedNotification.title || "İsimsiz Bildirim"}
                  </h3>
                  <p className="text-google-gray-600">{selectedNotification.recipientType || "Genel"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Başlık</label>
                  <p className="text-google-gray-900">{selectedNotification.title || "İsimsiz Bildirim"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Mesaj</label>
                  <p className="text-google-gray-900 bg-google-gray-50 p-3 rounded-lg">{selectedNotification.message || "Mesaj yok"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Tür</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedNotification.type)}`}>
                    {getTypeIcon(selectedNotification.type)}
                    {selectedNotification.type === "info" ? "Bilgi" : 
                     selectedNotification.type === "success" ? "Başarı" : 
                     selectedNotification.type === "warning" ? "Uyarı" : 
                     selectedNotification.type === "error" ? "Hata" : "Bilinmiyor"}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Alıcı Türü</label>
                  <p className="text-google-gray-900">{selectedNotification.recipientType || "Genel"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Oluşturulma Tarihi</label>
                  <p className="text-google-gray-900">{formatDate(selectedNotification.createdAt)} {formatTime(selectedNotification.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Gönderen</label>
                  <p className="text-google-gray-900">{selectedNotification.sender || "Sistem"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Alıcı Sayısı</label>
                  <p className="text-google-gray-900">{selectedNotification.recipientCount || 0} kişi</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-1">Durum</label>
                  <span className={`text-sm font-medium ${
                    selectedNotification.isRead ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {selectedNotification.isRead ? 'Okundu' : 'Okunmadı'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-google-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-google-gray-300 text-google-gray-700 rounded-lg hover:bg-google-gray-50 transition-colors duration-200"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notification Modal */}
      {showEditModal && editingNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-google-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-google-gray-900">Bildirim Düzenle</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-google-gray-400 hover:text-google-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateNotification} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Başlık *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editingNotification.title}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="Bildirim başlığı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Mesaj *
                </label>
                <textarea
                  name="message"
                  value={editingNotification.message}
                  onChange={handleEditInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="Bildirim mesajı"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">
                    Tür *
                  </label>
                  <select
                    name="type"
                    value={editingNotification.type}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  >
                    <option value="info">Bilgi</option>
                    <option value="success">Başarı</option>
                    <option value="warning">Uyarı</option>
                    <option value="error">Hata</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">
                    Alıcı Türü *
                  </label>
                  <select
                    name="recipientType"
                    value={editingNotification.recipientType}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  >
                    <option value="all">Tüm Kullanıcılar</option>
                    <option value="students">Öğrenciler</option>
                    <option value="instructors">Eğitmenler</option>
                    <option value="admins">Yöneticiler</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Zamanlanmış Tarih
                </label>
                <input
                  type="datetime-local"
                  name="scheduledDate"
                  value={editingNotification.scheduledDate}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-google-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-google-gray-300 text-google-gray-700 rounded-lg hover:bg-google-gray-50 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
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