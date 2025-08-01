import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { buildApiUrl, API_ENDPOINTS } from "../config/api";

function LoginPage() {
  const [loginType, setLoginType] = useState("email"); // "email" veya "tc"
  const [form, setForm] = useState({ email: "", password: "", tcNumber: "" });
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
      let response;
      let data;

      if (loginType === "tc") {
        // TC ile eğitmen girişi
        response = await fetch(buildApiUrl(API_ENDPOINTS.LOGIN_INSTRUCTOR_TC), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tcNumber: form.tcNumber }),
        });
        data = await response.json();
      } else {
        // Email ile normal giriş
        response = await fetch(buildApiUrl(API_ENDPOINTS.LOGIN), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        data = await response.json();
      }

      if (response.ok) {
        login(data.token, data); // token ve user bilgisini kaydet
        
        // Role göre yönlendirme
        if (data.role === "Instructor") {
          navigate("/panel/instructors"); // Eğitmen paneli
        } else if (data.role === "Student") {
          navigate("/panel/students"); // Öğrenci paneli
        } else {
          navigate("/panel"); // Admin paneli
        }
      } else {
        setMessage(data.message || "Giriş başarısız!");
      }
    } catch (err) {
      setMessage("Sunucu hatası!");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-[#0D1117]">
      <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400">Giriş Yap</h2>
        
        {/* Giriş Tipi Seçimi */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginType("email")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "email"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            E-posta
          </button>
          <button
            type="button"
            onClick={() => setLoginType("tc")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              loginType === "tc"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            TC (Eğitmen)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginType === "tc" ? (
            <input
              name="tcNumber"
              type="text"
              placeholder="TC Kimlik Numarası"
              value={form.tcNumber}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              maxLength={11}
            />
          ) : (
            <>
              <input
                name="email"
                type="email"
                placeholder="E-posta"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Şifre"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#23272F] focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition"
          >
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
        
        {message && <div className="text-center text-sm text-red-600 dark:text-red-400 mt-2">{message}</div>}
      </div>
    </div>
  );
}

export default LoginPage; 