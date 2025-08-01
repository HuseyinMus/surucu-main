// API Configuration
export const API_BASE_URL = 'http://localhost:5068';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGIN_INSTRUCTOR_TC: '/api/auth/login-instructor-tc',
  SIGNUP: '/api/drivingschools',
  
  // Courses
  COURSES: '/api/courses',
  COURSE_CONTENTS: (id) => `/api/courses/${id}/contents`,
  UPLOAD_MEDIA: '/api/courses/upload-media',
  
  // Students
  STUDENTS: '/api/students',
  STUDENT_PROGRESS: (id) => `/api/students/progress/${id}`,
  
  // Instructors
  INSTRUCTORS: '/api/instructors',
  
  // Quizzes/Exams
  QUIZZES: '/api/quizzes',
  QUIZ_QUESTIONS: (quizId) => `/api/quizzes/${quizId}/questions`,
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  
  // Driving Schools
  DRIVING_SCHOOLS: '/api/drivingschools',
  DRIVING_SCHOOL_ME: '/api/drivingschools/me',
  UPLOAD_LOGO: '/api/drivingschools/upload-logo',
  
  // Progress
  PROGRESS_SUMMARY: (userId, courseId) => `/api/progress/summary/${userId}/${courseId}`,
  PROGRESS_LESSONS: (userId, courseId) => `/api/progress/lessons/${userId}/${courseId}`,
  PROGRESS_DAILY: (userId, courseId, days) => `/api/progress/daily/${userId}/${courseId}?days=${days}`,
  
  // Student Tracking
  STUDENT_TRACKING: '/api/studenttracking',
  STUDENT_TRACKING_DETAIL: (studentId) => `/api/studenttracking/${studentId}`,
  STUDENT_TRACKING_UPDATE: (studentId) => `/api/studenttracking/${studentId}`,
  STUDENT_PAYMENT_ADD: '/api/studenttracking/payment',
  STUDENT_EXAM_RESULT_ADD: '/api/studenttracking/exam-result',
  STUDENT_EXAM_RESULT_UPDATE: (examResultId) => `/api/studenttracking/exam-result/${examResultId}`,
  STUDENT_PHOTO_UPLOAD: '/api/studenttracking/upload-photo',
  STUDENT_PAYMENT_REPORT: '/api/studenttracking/payment-report',
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`; 