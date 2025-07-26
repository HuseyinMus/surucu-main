import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

function SignUpPage() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    taxNumber: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // Sürücü kursu kaydı için backend endpointini güncelle
      const response = await fetch("http://192.168.1.78:5068/api/drivingschools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        // Kayıt başarılıysa giriş ekranına yönlendir
        setMessage("Kayıt başarılı! Giriş yapabilirsiniz.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(data.message || "Kayıt başarısız!");
      }
    } catch {
      setMessage("Sunucu hatası!");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-[#0D1117]">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#161B22] p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-green-600 dark:text-green-400">Sürücü Kursu Kaydı</h2>
        <input
          name="name"
          placeholder="Kurs Adı"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          name="address"
          placeholder="Adres"
          value={form.address}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          name="phone"
          type="tel"
          placeholder="Telefon"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          name="taxNumber"
          placeholder="Vergi Numarası"
          value={form.taxNumber}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="E-posta"
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Şifre"
          value={form.password}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 dark:bg-green-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-green-600 dark:hover:bg-green-500 transition"
        >
          {loading ? "Kayıt Olunuyor..." : "Kayıt Ol"}
        </button>
        {message && <div className="text-center text-sm text-green-600 dark:text-green-400 mt-2">{message}</div>}
      </form>
    </div>
  );
}

export default SignUpPage; 