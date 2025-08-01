import React, { useState, useEffect, useRef } from 'react';
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
  Clock as ClockIcon,
  Tag,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Zap,
  Star,
  Target,
  Award
} from 'lucide-react';

const CRMDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedStudentForTag, setSelectedStudentForTag] = useState(null);
  const [showStageUpdateModal, setShowStageUpdateModal] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [selectedStudentForStage, setSelectedStudentForStage] = useState(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadDashboardData();
      }, 30000); // 30 saniyede bir güncelle
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

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
      } else {
        console.error('Overview Response:', overviewResponse.status, overviewResponse.statusText);
        console.error('Pipeline Response:', pipelineResponse.status, pipelineResponse.statusText);
        
        if (!overviewResponse.ok) {
          const overviewError = await overviewResponse.text();
          console.error('Overview Error:', overviewError);
        }
        
        if (!pipelineResponse.ok) {
          const pipelineError = await pipelineResponse.text();
          console.error('Pipeline Error:', pipelineError);
        }
      }
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStudentStage = async (studentId, newStage) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5068/api/CRMDashboard/students/${studentId}/update-stage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newStage })
      });

      if (response.ok) {
        await loadDashboardData();
        setShowStageUpdateModal(false);
      }
    } catch (error) {
      console.error('Aşama güncellenirken hata:', error);
    }
  };

  const addStudentTag = async (studentId, tag) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5068/api/CRMDashboard/students/${studentId}/add-tag`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tag })
      });

      if (response.ok) {
        await loadDashboardData();
        setShowAddTagModal(false);
        setNewTag('');
      }
    } catch (error) {
      console.error('Etiket eklenirken hata:', error);
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
    const stageData = pipelineData?.pipelineStages?.find(s => s.name === stage);
    return stageData?.color || '#6B7280';
  };

  const getStageIcon = (stage) => {
    const stageData = pipelineData?.pipelineStages?.find(s => s.name === stage);
    return stageData?.icon || '👤';
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CRM Dashboard
              </h1>
              <p className="text-gray-600">Sürücü kursu yönetim sistemi</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Otomatik Güncelleme</label>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <button
                onClick={loadDashboardData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
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

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
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

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
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

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
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
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg mb-8 border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900">Öğrenci Pipeline</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {pipelineData?.pipelineStages?.map((stage) => (
                <div
                  key={stage.name}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedStage === stage.name 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                  onClick={() => setSelectedStage(selectedStage === stage.name ? 'all' : stage.name)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{stage.icon}</div>
                    <p className="text-2xl font-bold">{stage.count}</p>
                    <p className="text-sm capitalize">{stage.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Öğrenci Listesi */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Öğrenci Listesi</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Öğrenci ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  />
                </div>
                <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gray-50/50">
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
              <tbody className="bg-white/50 divide-y divide-gray-200/50">
                {filteredStudents.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-gray-50/50 transition-all duration-200 transform hover:scale-[1.01]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt="" className="h-12 w-12 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium text-white">
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
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStageIcon(student.currentStage)}</span>
                        <span 
                          className="inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: getStageColor(student.currentStage) }}
                        >
                          {student.currentStage}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${student.overallProgress}%`,
                              background: `linear-gradient(90deg, ${getStageColor(student.currentStage)}, ${getStageColor(student.currentStage)}80)`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 font-medium">{Math.round(student.overallProgress)}%</span>
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
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-lg hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudentForStage(student);
                            setNewStage(student.currentStage);
                            setShowStageUpdateModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors p-1 rounded-lg hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudentForTag(student);
                            setShowAddTagModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded-lg hover:bg-purple-50"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button className="text-orange-600 hover:text-orange-900 transition-colors p-1 rounded-lg hover:bg-orange-50">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Yaklaşan Sınavlar</h3>
            </div>
            <div className="p-6">
              {dashboardData?.upcomingExams?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcomingExams.map((exam) => (
                    <div key={exam.studentId} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 transform hover:scale-105 transition-all duration-200">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Ödeme Hatırlatmaları</h3>
            </div>
            <div className="p-6">
              {dashboardData?.paymentReminders?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.paymentReminders.map((reminder) => (
                    <div key={reminder.studentId} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200/50 transform hover:scale-105 transition-all duration-200">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Öğrenci Detayları</h3>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Kişisel Bilgiler</h4>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-medium">Ad Soyad:</span> {selectedStudent.fullName}</p>
                    <p><span className="font-medium">E-posta:</span> {selectedStudent.email}</p>
                    <p><span className="font-medium">Telefon:</span> {selectedStudent.phone}</p>
                    <p><span className="font-medium">TC No:</span> {selectedStudent.tcNumber}</p>
                    <p><span className="font-medium">Adres:</span> {selectedStudent.address || 'Belirtilmemiş'}</p>
                    <p><span className="font-medium">Acil İletişim:</span> {selectedStudent.emergencyContact || 'Belirtilmemiş'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Kurs Bilgileri</h4>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-medium">Mevcut Aşama:</span> 
                      <span 
                        className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getStageColor(selectedStudent.currentStage) }}
                      >
                        {selectedStudent.currentStage}
                      </span>
                    </p>
                    <p><span className="font-medium">Kayıt Tarihi:</span> {formatDate(selectedStudent.registrationDate)}</p>
                    <p><span className="font-medium">Son Aktivite:</span> {formatDate(selectedStudent.lastActivityDate)}</p>
                    <p><span className="font-medium">Genel İlerleme:</span> {Math.round(selectedStudent.overallProgress)}%</p>
                  </div>
                </div>
              </div>
              
              {/* Etiketler */}
              {selectedStudent.tags && selectedStudent.tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Etiketler</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: tag.color + '20',
                          color: tag.color,
                          border: `1px solid ${tag.color}40`
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Ödeme Bilgileri</h4>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200/50">
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
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all duration-200"
                >
                  Kapat
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aşama Güncelleme Modal */}
      {showStageUpdateModal && selectedStudentForStage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aşama Güncelle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Aşama</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Registered">Kayıt Oldu</option>
                    <option value="Theory">Teorik Ders</option>
                    <option value="Practice">Pratik Ders</option>
                    <option value="Exam">Sınav</option>
                    <option value="Completed">Tamamlandı</option>
                    <option value="Failed">Başarısız</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowStageUpdateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all duration-200"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => updateStudentStage(selectedStudentForStage.id, newStage)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Etiket Ekleme Modal */}
      {showAddTagModal && selectedStudentForTag && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Etiket Ekle</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Etiket</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Etiket adı..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddTagModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all duration-200"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => addStudentTag(selectedStudentForTag.id, newTag)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDashboardPage; 