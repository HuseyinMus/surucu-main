import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Car, 
  GraduationCap, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Plus,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from 'lucide-react';

const CRMDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Dashboard overview
      const overviewResponse = await fetch('http://localhost:5068/api/CRMDashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Pipeline data
      const pipelineResponse = await fetch('http://localhost:5068/api/CRMDashboard/students/pipeline', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (overviewResponse.ok && pipelineResponse.ok) {
        const overview = await overviewResponse.json();
        const pipeline = await pipelineResponse.json();
        
        setDashboardData(overview);
        setPipelineData(pipeline);
      }
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = pipelineData?.students?.filter(student => {
    const matchesStage = selectedStage === 'all' || student.currentStage === selectedStage;
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.tcNumber.includes(searchTerm);
    return matchesStage && matchesSearch;
  }) || [];

  const getStageColor = (stage) => {
    const colors = {
      'Registered': 'bg-blue-100 text-blue-800',
      'Theory': 'bg-yellow-100 text-yellow-800',
      'Practice': 'bg-green-100 text-green-800',
      'Exam': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-emerald-100 text-emerald-800',
      'Failed': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Completed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
              <p className="text-gray-600">Sürücü kursu yönetim sistemi</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Öğrenci
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.statistics?.totalStudents || 0}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+{dashboardData?.statistics?.newStudentsThisMonth || 0} bu ay</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.statistics?.totalRevenue || 0)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600">{dashboardData?.statistics?.overduePayments || 0} gecikmiş ödeme</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teorik Ders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.statistics?.studentsInTheory || 0}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Car className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-600">{dashboardData?.statistics?.studentsInPractice || 0} pratik ders</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.statistics?.completedStudents || 0}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-orange-600">{dashboardData?.statistics?.studentsInExam || 0} sınavda</span>
            </div>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Öğrenci Pipeline</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {pipelineData?.pipelineStages?.map((stage) => (
                <div
                  key={stage.name}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedStage === stage.name ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedStage(selectedStage === stage.name ? 'all' : stage.name)}
                >
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
                    <p className="text-sm text-gray-600 capitalize">{stage.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Öğrenci Listesi */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Öğrenci Listesi</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Öğrenci ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öğrenci
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aşama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İlerleme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödeme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sınav
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Aktivite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt="" className="h-10 w-10 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              {student.fullName.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          <div className="text-sm text-gray-500">{student.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(student.currentStage)}`}>
                        {student.currentStage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${student.overallProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{Math.round(student.overallProgress)}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Teorik: {Math.round(student.theoryProgress)}% | Pratik: {Math.round(student.practiceProgress)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(student.paidAmount)} / {formatCurrency(student.totalFee)}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(student.paymentStatus)}`}>
                        {student.paymentStatus}
                      </span>
                      {student.nextPaymentDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Sonraki: {formatDate(student.nextPaymentDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.examDate ? (
                        <div>
                          <div className="text-sm text-gray-900">{formatDate(student.examDate)}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.examStatus === 'Passed' ? 'bg-green-100 text-green-800' :
                            student.examStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.examStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Planlanmadı</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.lastActivityDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowStudentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-purple-600 hover:text-purple-900">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yaklaşan Sınavlar ve Ödeme Hatırlatmaları */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Yaklaşan Sınavlar */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Yaklaşan Sınavlar</h3>
            </div>
            <div className="p-6">
              {dashboardData?.upcomingExams?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcomingExams.map((exam) => (
                    <div key={exam.studentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{exam.studentName}</p>
                        <p className="text-sm text-gray-500">{formatDate(exam.examDate)}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        exam.examStatus === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exam.examStatus}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Yaklaşan sınav bulunmuyor</p>
              )}
            </div>
          </div>

          {/* Ödeme Hatırlatmaları */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Ödeme Hatırlatmaları</h3>
            </div>
            <div className="p-6">
              {dashboardData?.paymentReminders?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.paymentReminders.map((reminder) => (
                    <div key={reminder.studentId} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{reminder.studentName}</p>
                        <p className="text-sm text-gray-500">{formatDate(reminder.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">{formatCurrency(reminder.amount)}</p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {reminder.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Ödeme hatırlatması bulunmuyor</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Öğrenci Detay Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Öğrenci Detayları</h3>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Kişisel Bilgiler</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Ad Soyad:</span> {selectedStudent.fullName}</p>
                    <p><span className="font-medium">E-posta:</span> {selectedStudent.email}</p>
                    <p><span className="font-medium">Telefon:</span> {selectedStudent.phone}</p>
                    <p><span className="font-medium">TC No:</span> {selectedStudent.tcNumber}</p>
                    <p><span className="font-medium">Adres:</span> {selectedStudent.address || 'Belirtilmemiş'}</p>
                    <p><span className="font-medium">Acil İletişim:</span> {selectedStudent.emergencyContact || 'Belirtilmemiş'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Kurs Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Mevcut Aşama:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(selectedStudent.currentStage)}`}>
                        {selectedStudent.currentStage}
                      </span>
                    </p>
                    <p><span className="font-medium">Kayıt Tarihi:</span> {formatDate(selectedStudent.registrationDate)}</p>
                    <p><span className="font-medium">Son Aktivite:</span> {formatDate(selectedStudent.lastActivityDate)}</p>
                    <p><span className="font-medium">Genel İlerleme:</span> {Math.round(selectedStudent.overallProgress)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Ödeme Bilgileri</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Toplam Ücret:</span> {formatCurrency(selectedStudent.totalFee)}</p>
                      <p><span className="font-medium">Ödenen:</span> {formatCurrency(selectedStudent.paidAmount)}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Kalan Borç:</span> {formatCurrency(selectedStudent.remainingDebt)}</p>
                      <p><span className="font-medium">Durum:</span> 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedStudent.paymentStatus)}`}>
                          {selectedStudent.paymentStatus}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Kapat
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDashboardPage; 