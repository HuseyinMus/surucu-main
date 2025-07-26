import React, { useEffect, useState } from "react";
import { 
  User, 
  Save, 
  Upload, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard,
  Camera,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", taxNumber: "", logoUrl: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://192.168.1.78:5068/api/drivingschools/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Profil alınamadı");
        const data = await res.json();
        setProfile(data);
        setForm({
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          taxNumber: data.taxNumber || "",
          logoUrl: data.logoUrl || "",
        });
        setLogoPreview(data.logoUrl || null);
      } catch (err) {
        setError("Profil alınamadı.");
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("logo", logoFile);
      const res = await fetch("http://192.168.1.78:5068/api/drivingschools/upload-logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.logoUrl) {
        setForm((f) => ({ ...f, logoUrl: data.logoUrl }));
        setMessage("Logo başarıyla yüklendi. Profil kaydediliyor...");
        // Otomatik profil güncelle
        await handleSubmit({ preventDefault: () => {} });
      } else {
        setError("Logo yüklenemedi.");
      }
    } catch {
      setError("Logo yüklenemedi.");
    }
    setSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submit edildi", form);
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://192.168.1.78:5068/api/drivingschools/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (res.ok) {
        setMessage("Profil başarıyla güncellendi.");
        setProfile(data);
      } else {
        setError(data.message || "Profil güncellenemedi.");
      }
    } catch {
      setError("Sunucu hatası.");
    }
    setSaving(false);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-semibold text-google-gray-900">Profil</h1>
              <p className="text-sm text-google-gray-600 mt-1">Kurs bilgilerinizi yönetin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle size={20} />
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-google-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 border-b border-google-gray-100 bg-gradient-to-r from-google-blue to-blue-600">
            <div className="flex items-center gap-6">
              {/* Logo Section */}
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Kurs Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="w-12 h-12 text-google-gray-400" />
                  )}
                </div>
                
                {/* Upload Button */}
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-google-gray-50 transition-colors duration-200">
                  <Camera size={16} className="text-google-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {profile?.name || "Kurs Adı"}
                </h2>
                <p className="text-blue-100">
                  {profile?.email || "E-posta adresi"}
                </p>
              </div>

              {/* Upload Logo Button */}
              {logoFile && (
                <button
                  onClick={handleLogoUpload}
                  disabled={saving}
                  className="px-4 py-2 bg-white text-google-blue rounded-lg hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload size={16} />
                  {saving ? "Yükleniyor..." : "Logo Yükle"}
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kurs Adı */}
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  <Building className="inline w-4 h-4 mr-2" />
                  Kurs Adı *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="Kurs adını girin"
                  required
                />
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  E-posta *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="05XX XXX XX XX"
                />
              </div>

              {/* Vergi Numarası */}
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  <CreditCard className="inline w-4 h-4 mr-2" />
                  Vergi Numarası
                </label>
                <input
                  type="text"
                  name="taxNumber"
                  value={form.taxNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                  placeholder="Vergi numarasını girin"
                />
              </div>
            </div>

            {/* Adres */}
            <div>
              <label className="block text-sm font-medium text-google-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-2" />
                Adres
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-google-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-transparent"
                placeholder="Kurs adresini girin"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-google-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-google-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Kaydediliyor..." : "Profili Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 