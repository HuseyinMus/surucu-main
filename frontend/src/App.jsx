import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import CoursesPage from "./pages/CoursesPage";
import ExamsPage from "./pages/ExamsPage";
import InstructorsPage from "./pages/InstructorsPage";
import NotificationsPage from "./pages/NotificationsPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import LandingPage from "./pages/LandingPage";
import { useAuth } from "./components/AuthContext";
import CourseDetailPage from "./pages/CourseDetailPage";
import QuizzesPage from "./pages/QuizzesPage";
import ProfilePage from "./pages/ProfilePage";
import ProgressTrackingPage from "./pages/ProgressTrackingPage";
import TestPage from "./pages/TestPage";
import CRMDashboardPage from "./pages/CRMDashboardPage";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/panel"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="crm" element={<CRMDashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="courses/:courseId/progress" element={<ProgressTrackingPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="instructors" element={<InstructorsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="progress" element={<ProgressTrackingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="sinavlar" element={<QuizzesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
} 