import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Clock, 
  Phone,
  Search,
  RefreshCw,
  XCircle,
  UserCheck,
  Award,
  FileText,
  BookOpen,
  Car,
  CheckCircle,
  AlertTriangle,
  User,
  Tag,
  Calendar,
  CreditCard,
  Target,
  TrendingUp
} from 'lucide-react';

const CRMDashboardPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');
  const [selectedNewStage, setSelectedNewStage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    revenue: 0
  });

  // Pipeline stages
  const pipelineStages = [
    { id: 'registered', name: 'Kayıt Oldu', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <User className="w-5 h-5" /> },
    { id: 'theory', name: 'Teorik Ders', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'practice', name: 'Pratik Ders', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <Car className="w-5 h-5" /> },
    { id: 'exam', name: 'Sınav', color: 'bg-red-50 text-red-700 border-red-200', icon: <FileText className="w-5 h-5" /> },
    { id: 'completed', name: 'Tamamlandı', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-5 h-5" /> },
    { id: 'failed', name: 'Başarısız', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: <XCircle className="w-5 h-5" /> }
  ];

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5068/api/students/crm', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        
        // Calculate stats
        const total = data.length;
        const active = data.filter(s => s.currentStage !== 'completed' && s.currentStage !== 'failed').length;
        const completed = data.filter(s => s.currentStage === 'completed').length;
        const pending = data.filter(s => s.paymentStatus === 'Pending').length;
        const revenue = data.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        
        setStats({ total, active, completed, pending, revenue });
      } else {
        console.error('Failed to load students:', response.status);
        // Fallback to mock data if API fails
        const mockStudents = [
          {
            id: '1',
            fullName: 'Ahmet Yılmaz',
            tcNumber: '12345678901',
            phone: '0555 123 4567',
            email: 'ahmet@email.com',
            currentStage: 'theory',
            paymentStatus: 'Partial',
            totalFee: 5000,
            paidAmount: 3000,
            remainingDebt: 2000,
            examDate: '2024-02-15',
            examStatus: 'Scheduled',
            lastActivityDate: '2024-01-20',
            theoryLessonsCompleted: 8,
            practiceLessonsCompleted: 0,
            totalTheoryLessons: 12,
            totalPracticeLessons: 20,
            tags: 'vip, acele',
            photoUrl: null
          },
          {
            id: '2',
            fullName: 'Ayşe Demir',
            tcNumber: '98765432109',
            phone: '0555 987 6543',
            email: 'ayse@email.com',
            currentStage: 'practice',
            paymentStatus: 'Completed',
            totalFee: 5000,
            paidAmount: 5000,
            remainingDebt: 0,
            examDate: '2024-02-20',
            examStatus: 'Scheduled',
            lastActivityDate: '2024-01-22',
            theoryLessonsCompleted: 12,
            practiceLessonsCompleted: 5,
            totalTheoryLessons: 12,
            totalPracticeLessons: 20,
            tags: 'başarılı',
            photoUrl: null
          },
          {
            id: '3',
            fullName: 'Mehmet Kaya',
            tcNumber: '45678912301',
            phone: '0555 456 7890',
            email: 'mehmet@email.com',
            currentStage: 'registered',
            paymentStatus: 'Pending',
            totalFee: 5000,
            paidAmount: 0,
            remainingDebt: 5000,
            examDate: null,
            examStatus: 'NotScheduled',
            lastActivityDate: '2024-01-15',
            theoryLessonsCompleted: 0,
            practiceLessonsCompleted: 0,
            totalTheoryLessons: 12,
            totalPracticeLessons: 20,
            tags: 'yeni',
            photoUrl: null
          }
        ];
        
        setStudents(mockStudents);
        setStats({
          total: mockStudents.length,
          active: mockStudents.filter(s => s.currentStage !== 'completed' && s.currentStage !== 'failed').length,
          completed: mockStudents.filter(s => s.currentStage === 'completed').length,
          pending: mockStudents.filter(s => s.paymentStatus === 'Pending').length,
          revenue: mockStudents.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
        });
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };



  const getPaymentStatusInfo = (status) => {
    switch (status) {
      case 'Completed':
        return { text: 'Tamamlandı', color: 'text-green-600 bg-green-50', icon: <CheckCircle className="w-4 h-4" /> };
      case 'Partial':
        return { text: 'Kısmi', color: 'text-orange-600 bg-orange-50', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'Pending':
        return { text: 'Bekliyor', color: 'text-red-600 bg-red-50', icon: <Clock className="w-4 h-4" /> };
      default:
        return { text: 'Bilinmiyor', color: 'text-gray-600 bg-gray-50', icon: <XCircle className="w-4 h-4" /> };
    }
  };

  const getProgressPercentage = (completed, total) => {
    return Math.round((completed / total) * 100);
  };

  // Öğrenci aşamasını güncelle
  const updateStudentStage = async (studentId, newStage, notes = '', tags = '') => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('Güncelleme isteği gönderiliyor:', {
        studentId,
        newStage,
        notes,
        tags
      });
      
      const response = await fetch(`http://localhost:5068/api/students/${studentId}/stage`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newStage: newStage,
          notes: notes,
          tags: tags
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Stage updated:', result);
        
        // Öğrenci listesini yenile
        await loadStudents();
        
        // Modal'ı kapat
        setShowStudentModal(false);
        setSelectedStudent(null);
        
        return true;
      } else {
        const error = await response.text();
        console.error('Failed to update stage:', error);
        alert('Aşama güncellenirken hata oluştu: ' + error);
        return false;
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Aşama güncellenirken hata oluştu');
      return false;
    }
  };

  // Öğrenci notlarını güncelle
  const updateStudentNotes = async (studentId, notes = '', tags = '') => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5068/api/students/${studentId}/notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: notes,
          tags: tags
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Notes updated:', result);
        
        // Öğrenci listesini yenile
        await loadStudents();
        
        // Seçili öğrenciyi güncelle
        if (selectedStudent && selectedStudent.id === studentId) {
          setSelectedStudent({
            ...selectedStudent,
            notes: result.student.notes,
            tags: result.student.tags
          });
        }
        
        return true;
      } else {
        const error = await response.text();
        console.error('Failed to update notes:', error);
        alert('Notlar güncellenirken hata oluştu: ' + error);
        return false;
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Notlar güncellenirken hata oluştu');
      return false;
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.tcNumber.includes(searchTerm) ||
                         student.phone.includes(searchTerm);
    const matchesStage = selectedStage === 'all' || student.currentStage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const studentsByStage = pipelineStages.map(stage => ({
    ...stage,
    students: filteredStudents.filter(s => s.currentStage === stage.id)
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
                         <div>
               <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
               <p className="text-sm text-gray-600">Öğrenci takip sistemi ve pipeline yönetimi</p>
             </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadStudents}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} />
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                             <div>
                 <p className="text-sm font-medium text-gray-600">Toplam Öğrenci</p>
                 <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
               </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                             <div>
                 <p className="text-sm font-medium text-gray-600">Aktif Öğrenci</p>
                 <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
               </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                             <div>
                 <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                 <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
               </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                             <div>
                 <p className="text-sm font-medium text-gray-600">Bekleyen Ödeme</p>
                 <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
               </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                             <div>
                 <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                 <p className="text-2xl font-bold text-gray-900">₺{stats.revenue.toLocaleString()}</p>
               </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                 <input
                   type="text"
                   placeholder="Öğrenci ara (isim, TC, telefon)..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
              </div>
            </div>
            <div className="flex gap-2">
                             <select
                 value={selectedStage}
                 onChange={(e) => setSelectedStage(e.target.value)}
                 className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                 <option value="all">Tüm Aşamalar</option>
                 {pipelineStages.map(stage => (
                   <option key={stage.id} value={stage.id}>
                     {stage.name}
                   </option>
                 ))}
               </select>
            </div>
          </div>
        </div>

        {/* Pipeline View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Öğrenciler yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            {studentsByStage.map(stage => (
            <div key={stage.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className={`p-4 border-b ${stage.color} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                   <div className="text-blue-600">{stage.icon}</div>
                   <div>
                     <h3 className="font-semibold">{stage.name}</h3>
                     <p className="text-sm opacity-75">{stage.students.length} öğrenci</p>
                   </div>
                 </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                 {stage.students.length === 0 ? (
                   <div className="text-center py-8 text-gray-500">
                     <div className="mb-2">
                       <User className="w-12 h-12 mx-auto text-gray-300" />
                     </div>
                     <p className="text-sm">Bu aşamada öğrenci yok</p>
                   </div>
                 ) : (
                  stage.students.map(student => (
                    <div
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowStudentModal(true);
                      }}
                      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                                                 <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                             <User className="w-5 h-5 text-blue-600" />
                           </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{student.fullName}</h4>
                            <p className="text-sm text-gray-600">{student.tcNumber}</p>
                          </div>
                        </div>
                                                 <div className="text-right">
                           <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusInfo(student.paymentStatus).color}`}>
                             {getPaymentStatusInfo(student.paymentStatus).icon}
                             {getPaymentStatusInfo(student.paymentStatus).text}
                           </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {student.phone}
                        </div>
                        
                                                 <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600 flex items-center gap-1">
                             <BookOpen className="w-4 h-4" />
                             Teorik:
                           </span>
                           <span className="font-medium">{student.theoryLessonsCompleted}/{student.totalTheoryLessons}</span>
                         </div>
                         
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600 flex items-center gap-1">
                             <Car className="w-4 h-4" />
                             Pratik:
                           </span>
                           <span className="font-medium">{student.practiceLessonsCompleted}/{student.totalPracticeLessons}</span>
                         </div>

                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600 flex items-center gap-1">
                             <CreditCard className="w-4 h-4" />
                             Ödeme:
                           </span>
                           <span className="font-medium">₺{student.paidAmount?.toLocaleString()}</span>
                         </div>
                         
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600 flex items-center gap-1">
                             <DollarSign className="w-4 h-4" />
                             Borç:
                           </span>
                           <span className={`font-medium ${student.remainingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                             ₺{student.remainingDebt?.toLocaleString()}
                           </span>
                         </div>

                                                 {student.tags && (
                           <div className="flex flex-wrap gap-1 mt-2">
                             {student.tags.split(',').map((tag, index) => (
                               <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                 <Tag className="w-3 h-3 mr-1" />
                                 {tag.trim()}
                               </span>
                             ))}
                           </div>
                         )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                                 <h2 className="text-xl font-bold text-gray-900">Öğrenci Detayları</h2>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Student Info */}
                             <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                   <User className="w-8 h-8 text-blue-600" />
                 </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStudent.fullName}</h3>
                  <p className="text-gray-600">TC: {selectedStudent.tcNumber}</p>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="font-semibold mb-3 flex items-center gap-2">
                     <BookOpen className="w-5 h-5" />
                     Teorik İlerleme
                   </h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tamamlanan</span>
                    <span className="font-medium">{selectedStudent.theoryLessonsCompleted}/{selectedStudent.totalTheoryLessons}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(selectedStudent.theoryLessonsCompleted, selectedStudent.totalTheoryLessons)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    %{getProgressPercentage(selectedStudent.theoryLessonsCompleted, selectedStudent.totalTheoryLessons)} tamamlandı
                  </p>
                </div>

                                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="font-semibold mb-3 flex items-center gap-2">
                     <Car className="w-5 h-5" />
                     Pratik İlerleme
                   </h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tamamlanan</span>
                    <span className="font-medium">{selectedStudent.practiceLessonsCompleted}/{selectedStudent.totalPracticeLessons}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(selectedStudent.practiceLessonsCompleted, selectedStudent.totalPracticeLessons)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    %{getProgressPercentage(selectedStudent.practiceLessonsCompleted, selectedStudent.totalPracticeLessons)} tamamlandı
                  </p>
                </div>
              </div>

              {/* Payment Info */}
                             <div className="bg-gray-50 rounded-lg p-4">
                 <h4 className="font-semibold mb-3 flex items-center gap-2">
                   <CreditCard className="w-5 h-5" />
                   Ödeme Bilgileri
                 </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Ücret</p>
                    <p className="font-semibold text-lg">₺{selectedStudent.totalFee?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ödenen</p>
                    <p className="font-semibold text-lg text-green-600">₺{selectedStudent.paidAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kalan Borç</p>
                    <p className={`font-semibold text-lg ${selectedStudent.remainingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₺{selectedStudent.remainingDebt?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ödeme Yüzdesi</p>
                    <p className="font-semibold text-lg text-blue-600">
                      %{selectedStudent.totalFee > 0 ? Math.round((selectedStudent.paidAmount / selectedStudent.totalFee) * 100) : 0}
                    </p>
                  </div>
                </div>
                
                {/* Ödeme Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Ödeme İlerlemesi</span>
                    <span className="font-medium">
                      ₺{selectedStudent.paidAmount?.toLocaleString()} / ₺{selectedStudent.totalFee?.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${selectedStudent.totalFee > 0 ? Math.min((selectedStudent.paidAmount / selectedStudent.totalFee) * 100, 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-3">
                                   <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusInfo(selectedStudent.paymentStatus).color}`}>
                   {getPaymentStatusInfo(selectedStudent.paymentStatus).icon}
                   {getPaymentStatusInfo(selectedStudent.paymentStatus).text}
                 </div>
                </div>
              </div>

              {/* Exam Info */}
              {selectedStudent.examDate && (
                                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="font-semibold mb-3 flex items-center gap-2">
                     <FileText className="w-5 h-5" />
                     Sınav Bilgileri
                   </h4>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Sınav Tarihi</p>
                      <p className="font-semibold">{new Date(selectedStudent.examDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Durum</p>
                      <p className="font-semibold">{selectedStudent.examStatus}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedStudent.tags && (
                                 <div className="bg-gray-50 rounded-lg p-4">
                   <h4 className="font-semibold mb-3 flex items-center gap-2">
                     <Tag className="w-5 h-5" />
                     Etiketler
                   </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.tags.split(',').map((tag, index) => (
                                             <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                         <Tag className="w-4 h-4 mr-1" />
                         {tag.trim()}
                       </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

                         <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
               <button
                 onClick={() => setShowStudentModal(false)}
                 className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
               >
                 Kapat
               </button>
               <button 
                 onClick={() => {
                   setShowNotesModal(true);
                   setNewNote('');
                   setNewTags(selectedStudent.tags || '');
                 }}
                 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
               >
                 Not Ekle
               </button>
               <button 
                 onClick={() => {
                   setShowStageModal(true);
                   setSelectedNewStage(selectedStudent.currentStage);
                   setNewNote('');
                   setNewTags(selectedStudent.tags || '');
                 }}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 Aşama Güncelle
               </button>
             </div>
          </div>
                 </div>
       )}

       {/* Stage Update Modal */}
       {showStageModal && selectedStudent && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl max-w-md w-full">
             <div className="p-6 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-gray-900">Aşama Güncelle</h2>
                 <button
                   onClick={() => setShowStageModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <XCircle size={24} />
                 </button>
               </div>
               <p className="text-sm text-gray-600 mt-2">
                 {selectedStudent.fullName} - Mevcut Aşama: {selectedStudent.currentStage}
               </p>
             </div>
             
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Yeni Aşama
                 </label>
                 <select
                   value={selectedNewStage}
                   onChange={(e) => setSelectedNewStage(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   {pipelineStages.map(stage => (
                     <option key={stage.id} value={stage.id}>
                       {stage.name}
                     </option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Not (Opsiyonel)
                 </label>
                 <textarea
                   value={newNote}
                   onChange={(e) => setNewNote(e.target.value)}
                   placeholder="Aşama geçişi hakkında not..."
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   rows={3}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Etiketler (Opsiyonel)
                 </label>
                 <input
                   type="text"
                   value={newTags}
                   onChange={(e) => setNewTags(e.target.value)}
                   placeholder="vip, acele, başarılı..."
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>
             </div>

             <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
               <button
                 onClick={() => setShowStageModal(false)}
                 className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
               >
                 İptal
               </button>
               <button 
                 onClick={async () => {
                   const success = await updateStudentStage(
                     selectedStudent.id, 
                     selectedNewStage, 
                     newNote, 
                     newTags
                   );
                   if (success) {
                     setShowStageModal(false);
                   }
                 }}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 Güncelle
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Notes Modal */}
       {showNotesModal && selectedStudent && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl max-w-md w-full">
             <div className="p-6 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-gray-900">Not ve Etiket Ekle</h2>
                 <button
                   onClick={() => setShowNotesModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <XCircle size={24} />
                 </button>
               </div>
               <p className="text-sm text-gray-600 mt-2">
                 {selectedStudent.fullName}
               </p>
             </div>
             
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Yeni Not
                 </label>
                 <textarea
                   value={newNote}
                   onChange={(e) => setNewNote(e.target.value)}
                   placeholder="Öğrenci hakkında not..."
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   rows={4}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Etiketler
                 </label>
                 <input
                   type="text"
                   value={newTags}
                   onChange={(e) => setNewTags(e.target.value)}
                   placeholder="vip, acele, başarılı..."
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>
             </div>

             <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
               <button
                 onClick={() => setShowNotesModal(false)}
                 className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
               >
                 İptal
               </button>
               <button 
                 onClick={async () => {
                   const success = await updateStudentNotes(
                     selectedStudent.id, 
                     newNote, 
                     newTags
                   );
                   if (success) {
                     setShowNotesModal(false);
                   }
                 }}
                 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
               >
                 Kaydet
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default CRMDashboardPage; 