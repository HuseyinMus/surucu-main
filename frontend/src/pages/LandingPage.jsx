import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-green-100 dark:from-[#0D1117] dark:to-[#23272F]">
      <div className="bg-white dark:bg-[#161B22] rounded-3xl shadow-xl p-10 max-w-md w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-4">Sürücü Kursu Yönetim Sistemi</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">Modern, hızlı ve güvenli sürücü kursu yönetimi için dijital panel.</p>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 dark:hover:bg-blue-400 transition mb-4"
        >
          Giriş Yap
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="w-full bg-green-500 dark:bg-green-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-green-600 dark:hover:bg-green-500 transition"
        >
          Sürücü Kursu Kaydı
        </button>
      </div>
    </div>
  );
} 