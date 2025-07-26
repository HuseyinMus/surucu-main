import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  Bell,
  LogOut,
  User,
  BarChart3,
} from "lucide-react";
import { useEffect, useState } from "react";

const menu = [
  { to: "/panel", label: "Kontrol Paneli", icon: <LayoutDashboard size={20} /> },
  { to: "/panel/students", label: "Öğrenciler", icon: <Users size={20} /> },
  { to: "/panel/courses", label: "Kurslar", icon: <BookOpen size={20} /> },
  { to: "/panel/exams", label: "Sınavlar", icon: <FileText size={20} /> },
  { to: "/panel/instructors", label: "Eğitmenler", icon: <GraduationCap size={20} /> },
  { to: "/panel/notifications", label: "Bildirimler", icon: <Bell size={20} /> },
  { to: "/panel/progress", label: "İlerleme Takibi", icon: <BarChart3 size={20} /> },
  { to: "/panel/test", label: "Test", icon: <User size={20} /> },
  { to: "/panel/profile", label: "Profilim", icon: <User size={20} /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState(null);
  
  useEffect(() => {
    async function fetchLogo() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5068/api/drivingschools/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setLogoUrl(data.logoUrl || null);
      } catch (error) {
        console.error("Logo yükleme hatası:", error);
      }
    }
    fetchLogo();
  }, []);

  // Aktif menü kontrolü
  const isActive = (path) => {
    if (path === "/panel") {
      return location.pathname === "/panel";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen font-['Inter',sans-serif]">
      {/* Logo ve Başlık */}
      <div className="h-20 flex flex-col items-center justify-center border-b border-gray-100 bg-white">
        {logoUrl ? (
          <img src={`http://localhost:5068${logoUrl}`} alt="Logo" className="h-10 w-10 object-contain rounded-lg mb-2" />
        ) : (
          <div className="h-10 w-10 flex items-center justify-center bg-blue-50 rounded-lg mb-2">
            <User size={24} className="text-blue-600" />
          </div>
        )}
        <span className="font-medium text-sm text-gray-700 tracking-wide">Admin Paneli</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 bg-white">
        {menu.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 relative group
                ${active 
                  ? "text-blue-700 bg-blue-50 border-r-2 border-blue-600" 
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
            >
              <span className={`transition-colors duration-200 ${active ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Çıkış Butonu */}
      <button
        onClick={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
        className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors duration-200 group"
      >
        <LogOut size={20} className="text-red-500 group-hover:text-red-600 transition-colors duration-200" />
        Çıkış Yap
      </button>
    </aside>
  );
} 