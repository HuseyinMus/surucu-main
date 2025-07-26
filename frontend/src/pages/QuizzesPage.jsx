import React, { useEffect, useState } from "react";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', totalPoints: 0, courseContentId: '' });
  const [quizFormError, setQuizFormError] = useState('');
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState({ questionText: '', questionType: 'MultipleChoice', mediaFile: null, mediaUrl: '', options: [ { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' } ] });
  const [questionFormError, setQuestionFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showQuizEditModal, setShowQuizEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionEditModal, setShowQuestionEditModal] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [pendingQuestions, setPendingQuestions] = useState([
    { questionText: '', questionType: 'MultipleChoice', mediaFile: null, mediaUrl: '', options: [ { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' } ] }
  ]);

  useEffect(() => {
    async function fetchQuizzes() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://192.168.1.78:5068/api/quizzes");
        if (!res.ok) throw new Error("Sınavlar alınamadı");
        const data = await res.json();
        setQuizzes(data);
      } catch {
        setError("Sınavlar alınamadı.");
      }
      setLoading(false);
    }
    fetchQuizzes();
  }, []);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch("http://192.168.1.78:5068/api/courses");
        if (!res.ok) throw new Error();
        const courses = await res.json();
        // Tüm kursların derslerini birleştir, her derse courseTitle ve courseId ekle
        const allLessons = courses.flatMap(c => (c.courseContents || []).map(l => ({ ...l, courseTitle: c.title, courseId: c.id })));
        setLessons(allLessons);
        console.log("Lessons state:", allLessons);
      } catch {
        setLessons([]);
      }
    }
    if (showQuizModal || showQuizEditModal) fetchLessons();
  }, [showQuizModal, showQuizEditModal]);

  async function handleQuizFormSubmit(e) {
    e.preventDefault();
    setQuizFormError('');
    if (!quizForm.title) { setQuizFormError('Başlık zorunlu'); return; }
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const drivingSchoolId = user.DrivingSchoolId || user.drivingSchoolId;
      // Seçili dersin bağlı olduğu kursun ID'sini bul
      let courseId = undefined;
      if (quizForm.courseContentId) {
        const lesson = lessons.find(l => l.id === quizForm.courseContentId);
        courseId = lesson && lesson.courseId ? lesson.courseId : undefined;
      }
      if (!courseId) {
        setQuizFormError("Lütfen önce bir kurs ve ders seçin.");
        return;
      }
      const bodyObj = {
        title: quizForm.title,
        description: quizForm.description,
        totalPoints: Number(quizForm.totalPoints),
        courseContentId: quizForm.courseContentId || null,
        drivingSchool: drivingSchoolId ? { id: drivingSchoolId } : undefined,
        course: courseId ? { id: courseId } : undefined
      };
      Object.keys(bodyObj).forEach(key => bodyObj[key] === undefined && delete bodyObj[key]);
      const res = await fetch('http://192.168.1.78:5068/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bodyObj)
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (res.ok) {
        setShowQuizModal(false);
        setQuizForm({ title: '', description: '', totalPoints: 0, courseContentId: '' });
        // Listeyi güncelle
        const data = await fetch("http://192.168.1.78:5068/api/quizzes").then(r => r.json());
        setQuizzes(data);
      } else {
        setQuizFormError(data?.message || JSON.stringify(data) || "Sınav eklenemedi!");
      }
    } catch {
      setQuizFormError('Sunucu hatası!');
    }
  }

  async function handleQuizDelete(quizId) {
    if (!window.confirm('Bu sınavı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`http://192.168.1.78:5068/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== quizId));
      } else {
        alert('Sınav silinemedi!');
      }
    } catch {
      alert('Sunucu hatası!');
    }
  }
  function openQuizEditModal(quiz) {
    setEditingQuiz(quiz);
    setQuizForm({ title: quiz.title, description: quiz.description, totalPoints: quiz.totalPoints, courseContentId: quiz.courseContentId || '' });
    setShowQuizEditModal(true);
  }
  async function handleQuizEditSubmit(e) {
    e.preventDefault();
    setQuizFormError('');
    if (!quizForm.title) { setQuizFormError('Başlık zorunlu'); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://192.168.1.78:5068/api/quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: quizForm.title,
          description: quizForm.description,
          totalPoints: Number(quizForm.totalPoints),
          courseContentId: quizForm.courseContentId || null
        })
      });
      if (res.ok) {
        setShowQuizEditModal(false);
        setEditingQuiz(null);
        // Listeyi güncelle
        const data = await fetch("http://192.168.1.78:5068/api/quizzes").then(r => r.json());
        setQuizzes(data);
      } else {
        setQuizFormError('Sınav güncellenemedi!');
      }
    } catch {
      setQuizFormError('Sunucu hatası!');
    }
  }

  async function openQuestionsModal(quiz) {
    setCurrentQuiz(quiz);
    setShowQuestionsModal(true);
    // Soruları çek (örnek, backend'de endpoint yoksa dummy bırak)
    setQuestions(quiz.questions || []);
  }

  function handleOptionChange(i, field, value) {
    setQuestionForm(f => {
      const options = [...f.options];
      options[i][field] = value;
      return { ...f, options };
    });
  }
  function handleOptionFileChange(i, file) {
    setQuestionForm(f => {
      const options = [...f.options];
      options[i].mediaFile = file;
      return { ...f, options };
    });
  }
  function addOption() {
    setQuestionForm(f => ({ ...f, options: [...f.options, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }] }));
  }
  function removeOption(i) {
    setQuestionForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  }
  async function handleQuestionFormSubmit(e) {
    e.preventDefault();
    setQuestionFormError('');
    if (!questionForm.questionText) { setQuestionFormError('Soru metni zorunlu'); return; }
    if (questionForm.options.length < 2) { setQuestionFormError('En az 2 şık olmalı'); return; }
    if (!questionForm.options.some(o => o.isCorrect)) { setQuestionFormError('En az 1 doğru şık seçilmeli'); return; }
    // Medya yükleme örneği (soru ve şıklar için)
    let mediaUrl = '';
    if (questionForm.mediaFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', questionForm.mediaFile); // veya video
      const res = await fetch('http://192.168.1.78:5068/api/courses/upload-media', { method: 'POST', body: formData });
      const data = await res.json();
      mediaUrl = data.imageUrl || data.videoUrl || '';
      setUploading(false);
    }
    // Şıklar için medya yükleme (örnek, sadece ilk şık için)
    const optionsWithMedia = await Promise.all(questionForm.options.map(async (opt) => {
      let optMediaUrl = '';
      if (opt.mediaFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', opt.mediaFile); // veya video
        const res = await fetch('http://192.168.1.78:5068/api/courses/upload-media', { method: 'POST', body: formData });
        const data = await res.json();
        optMediaUrl = data.imageUrl || data.videoUrl || '';
        setUploading(false);
      }
      return { optionText: opt.text, isCorrect: opt.isCorrect, mediaUrl: optMediaUrl };
    }));
    // Soru ekle
    try {
      const res = await fetch(`http://192.168.1.78:5068/api/quizzes/${currentQuiz.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: questionForm.questionText,
          questionType: questionForm.questionType,
          mediaUrl,
          options: optionsWithMedia
        })
      });
      if (res.ok) {
        setQuestionForm({ questionText: '', questionType: 'MultipleChoice', mediaFile: null, mediaUrl: '', options: [ { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' } ] });
        setShowQuestionsModal(false);
      } else {
        setQuestionFormError('Soru eklenemedi!');
      }
    } catch {
      setQuestionFormError('Sunucu hatası!');
    }
  }

  // Soru düzenleme/silme fonksiyonları (dummy, backend endpoint yoksa alert ver)
  function openQuestionEditModal(question) {
    setEditingQuestion(question);
    setQuestionForm({
      questionText: question.questionText,
      questionType: question.questionType,
      mediaFile: null,
      mediaUrl: question.mediaUrl || '',
      options: question.options || [ { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' } ]
    });
    setShowQuestionEditModal(true);
  }
  async function handleQuestionEditSubmit(e) {
    e.preventDefault();
    alert('Soru düzenleme backend endpointi eklenmeli!');
    setShowQuestionEditModal(false);
    setEditingQuestion(null);
  }
  async function handleQuestionDelete(questionId) {
    alert('Soru silme backend endpointi eklenmeli!');
  }

  // Soru ekleme formu her zaman açık, ekledikçe alta yeni form açılır
  async function handleAddPendingQuestion(i, e) {
    e.preventDefault();
    const q = pendingQuestions[i];
    if (!q.questionText) {
      setPendingQuestions(pendingQuestions => {
        const arr = [...pendingQuestions];
        arr[i].formError = 'Soru metni zorunludur.';
        return arr;
      });
      return;
    }
    if (q.options.length < 4) {
      setPendingQuestions(pendingQuestions => {
        const arr = [...pendingQuestions];
        arr[i].formError = 'Her soru için en az 4 şık olmalıdır.';
        return arr;
      });
      return;
    }
    if (!q.options.some(o => o.isCorrect)) {
      setPendingQuestions(pendingQuestions => {
        const arr = [...pendingQuestions];
        arr[i].formError = 'En az 1 doğru şık seçilmeli.';
        return arr;
      });
      return;
    }
    // Medya yükleme (soru ve şıklar için, örnek: sadece ilk şık için)
    let mediaUrl = '';
    if (q.mediaFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', q.mediaFile);
      const res = await fetch('http://192.168.1.78:5068/api/courses/upload-media', { method: 'POST', body: formData });
      const data = await res.json();
      mediaUrl = data.imageUrl || data.videoUrl || '';
      setUploading(false);
    }
    const optionsWithMedia = await Promise.all(q.options.map(async (opt) => {
      let optMediaUrl = '';
      if (opt.mediaFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', opt.mediaFile);
        const res = await fetch('http://192.168.1.78:5068/api/courses/upload-media', { method: 'POST', body: formData });
        const data = await res.json();
        optMediaUrl = data.imageUrl || data.videoUrl || '';
        setUploading(false);
      }
      return { optionText: opt.text, isCorrect: opt.isCorrect, mediaUrl: optMediaUrl };
    }));
    // Soru ekle
    try {
      const res = await fetch(`http://192.168.1.78:5068/api/quizzes/${currentQuiz.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.questionText,
          questionType: q.questionType,
          mediaUrl,
          options: optionsWithMedia
        })
      });
      if (res.ok) {
        // Sorular listesini güncelle (dummy, backend endpoint yoksa elle ekle)
        setQuestions([...questions, { ...q, id: Math.random().toString(36).slice(2) }]);
        // Yeni boş form ekle
        setPendingQuestions(pendingQuestions.concat([{ questionText: '', questionType: 'MultipleChoice', mediaFile: null, mediaUrl: '', options: [ { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' } ] }]));
      } else {
        alert('Soru eklenemedi!');
      }
    } catch {
      alert('Sunucu hatası!');
    }
  }
  function handlePendingOptionChange(qi, oi, field, value) {
    setPendingQuestions(pendingQuestions => {
      const arr = [...pendingQuestions];
      const opts = [...arr[qi].options];
      opts[oi][field] = value;
      arr[qi].options = opts;
      return arr;
    });
  }
  function handlePendingOptionFileChange(qi, oi, file) {
    setPendingQuestions(pendingQuestions => {
      const arr = [...pendingQuestions];
      const opts = [...arr[qi].options];
      opts[oi].mediaFile = file;
      arr[qi].options = opts;
      return arr;
    });
  }
  function addPendingOption(qi) {
    setPendingQuestions(pendingQuestions => {
      const arr = [...pendingQuestions];
      arr[qi].options = [...arr[qi].options, { text: '', isCorrect: false, mediaFile: null, mediaUrl: '' }];
      return arr;
    });
  }
  function removePendingOption(qi, oi) {
    setPendingQuestions(pendingQuestions => {
      const arr = [...pendingQuestions];
      arr[qi].options = arr[qi].options.filter((_, idx) => idx !== oi);
      return arr;
    });
  }

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-[#161B22] rounded-2xl shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Sınavlar</h1>
      <button onClick={() => setShowQuizModal(true)} className="mb-6 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Sınav Ekle</button>
      {loading ? (
        <div className="text-blue-600">Yükleniyor...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : quizzes.length === 0 ? (
        <div className="text-gray-500">Henüz sınav eklenmemiş.</div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-gray-50 dark:bg-[#23272F] rounded-xl p-4 shadow flex flex-col">
              <div className="text-lg font-bold text-blue-600">{quiz.title}</div>
              <div className="text-gray-600 mb-1">{quiz.description}</div>
              <div className="text-xs text-gray-400">Toplam Puan: {quiz.totalPoints}</div>
              <div className="text-xs text-gray-400">Oluşturulma: {quiz.createdAt ? new Date(quiz.createdAt).toLocaleString('tr-TR') : '-'}</div>
              <button onClick={() => openQuestionsModal(quiz)} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs">Soruları Yönet</button>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openQuizEditModal(quiz)} className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-xs">Düzenle</button>
                <button onClick={() => handleQuizDelete(quiz.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs">Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Sınav Ekle Modalı */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowQuizModal(false)}>×</button>
            <h2 className="text-xl font-bold mb-4 text-purple-600 dark:text-purple-400">Yeni Sınav Ekle</h2>
            <form onSubmit={handleQuizFormSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Başlık *</label>
                <input name="title" value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="block mb-1">Açıklama</label>
                <input name="description" value={quizForm.description} onChange={e => setQuizForm(f => ({ ...f, description: e.target.value }))} className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="block mb-1">Toplam Puan</label>
                <input name="totalPoints" type="number" value={quizForm.totalPoints} onChange={e => setQuizForm(f => ({ ...f, totalPoints: e.target.value }))} className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="block mb-1">Ders Seç (isteğe bağlı)</label>
                <select
                  name="courseContentId"
                  value={quizForm.courseContentId || ''}
                  onChange={e => setQuizForm(f => ({ ...f, courseContentId: e.target.value }))}
                  className="w-full p-2 rounded border"
                >
                  <option value="">Ders seçiniz</option>
                  {lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>{lesson.courseTitle} - {lesson.title}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-purple-700 transition">Kaydet</button>
              {quizFormError && <div className="text-red-500 text-sm mt-2">{quizFormError}</div>}
            </form>
          </div>
        </div>
      )}
      {/* Soruları Yönet Modalı */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowQuestionsModal(false)}>×</button>
            <h2 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">Soruları Yönet</h2>
            {questions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Eklenen Sorular</h3>
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-gray-100 dark:bg-[#23272F] rounded p-2 mb-2 flex items-center gap-2">
                    <span className="font-bold">{i + 1}.</span>
                    <span>{q.questionText}</span>
                    <button onClick={() => openQuestionEditModal(q)} className="bg-yellow-400 text-white px-2 py-1 rounded text-xs">Düzenle</button>
                    <button onClick={() => handleQuestionDelete(q.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Sil</button>
                  </div>
                ))}
              </div>
            )}
            {/* Birden fazla soru ekleme alanı */}
            {pendingQuestions.map((q, qi) => (
              <form key={qi} onSubmit={e => handleAddPendingQuestion(qi, e)} className="space-y-4 border-b pb-4 mb-4">
                <div>
                  <label className="block mb-1">Soru Metni *</label>
                  <input name="questionText" value={q.questionText} onChange={e => setPendingQuestions(arr => { const a = [...arr]; a[qi].questionText = e.target.value; return a; })} className="w-full p-2 rounded border" />
                </div>
                <div>
                  <label className="block mb-1">Soru Tipi</label>
                  <select name="questionType" value={q.questionType} onChange={e => setPendingQuestions(arr => { const a = [...arr]; a[qi].questionType = e.target.value; return a; })} className="w-full p-2 rounded border">
                    <option value="MultipleChoice">Çoktan Seçmeli</option>
                    <option value="TrueFalse">Doğru/Yanlış</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Soruya Resim/Video Ekle</label>
                  <input type="file" accept="image/*,video/*" onChange={e => setPendingQuestions(arr => { const a = [...arr]; a[qi].mediaFile = e.target.files[0]; a[qi].mediaPreview = e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null; return a; })} className="w-full p-2 rounded border" />
                  {q.mediaPreview && (
                    <div className="mt-2">
                      {q.mediaFile && q.mediaFile.type.startsWith('image') ? (
                        <img src={q.mediaPreview} alt="Önizleme" className="max-h-32 rounded" />
                      ) : q.mediaFile && q.mediaFile.type.startsWith('video') ? (
                        <video src={q.mediaPreview} controls className="max-h-32 rounded" />
                      ) : null}
                    </div>
                  )}
                  {uploading && <div className="text-xs text-blue-600 mt-1">Yükleniyor...</div>}
                </div>
                <div>
                  <label className="block mb-1">Şıklar (4 adet zorunlu)</label>
                  {[0,1,2,3].map((oi) => (
                    <div key={oi} className="flex items-center gap-2 mb-2">
                      <input value={q.options[oi]?.text || ''} onChange={e => handlePendingOptionChange(qi, oi, 'text', e.target.value)} className="p-2 rounded border flex-1" placeholder={`Şık ${oi + 1}`} />
                      <input type="file" accept="image/*,video/*" onChange={e => handlePendingOptionFileChange(qi, oi, e.target.files[0])} className="w-32 p-1 rounded border" />
                      {q.options[oi]?.mediaFile && (
                        <span className="ml-2">
                          {q.options[oi].mediaFile.type.startsWith('image') ? (
                            <img src={URL.createObjectURL(q.options[oi].mediaFile)} alt="Şık Önizleme" className="max-h-12 rounded" />
                          ) : q.options[oi].mediaFile.type.startsWith('video') ? (
                            <video src={URL.createObjectURL(q.options[oi].mediaFile)} controls className="max-h-12 rounded" />
                          ) : null}
                        </span>
                      )}
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={q.options[oi]?.isCorrect || false} onChange={e => handlePendingOptionChange(qi, oi, 'isCorrect', e.target.checked)} /> Doğru
                      </label>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500">Her soru için 4 şık zorunludur. Şık ekleme/çıkarma yapılamaz.</div>
                </div>
                {q.formError && <div className="text-red-500 text-sm mt-2">{q.formError}</div>}
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 transition">Soruyu Ekle</button>
              </form>
            ))}
          </div>
        </div>
      )}
      {/* Quiz Düzenle Modalı */}
      {showQuizEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowQuizEditModal(false)}>×</button>
            <h2 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">Sınavı Düzenle</h2>
            <form onSubmit={handleQuizEditSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Başlık *</label>
                <input name="title" value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="block mb-1">Açıklama</label>
                <input name="description" value={quizForm.description} onChange={e => setQuizForm(f => ({ ...f, description: e.target.value }))} className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="block mb-1">Toplam Puan</label>
                <input name="totalPoints" type="number" value={quizForm.totalPoints} onChange={e => setQuizForm(f => ({ ...f, totalPoints: e.target.value }))} className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="block mb-1">Ders Seç (isteğe bağlı)</label>
                <select
                  name="courseContentId"
                  value={quizForm.courseContentId || ''}
                  onChange={e => setQuizForm(f => ({ ...f, courseContentId: e.target.value }))}
                  className="w-full p-2 rounded border"
                >
                  <option value="">Ders seçiniz</option>
                  {lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>{lesson.courseTitle} - {lesson.title}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-yellow-400 text-white font-semibold py-3 rounded-xl shadow hover:bg-yellow-500 transition">Kaydet</button>
              {quizFormError && <div className="text-red-500 text-sm mt-2">{quizFormError}</div>}
            </form>
          </div>
        </div>
      )}
      {/* Soru Düzenle Modalı */}
      {showQuestionEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowQuestionEditModal(false)}>×</button>
            <h2 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">Soruyu Düzenle</h2>
            <form onSubmit={handleQuestionEditSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Soru Metni *</label>
                <input name="questionText" value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} className="w-full p-2 rounded border" />
              </div>
              <div>
                <label className="block mb-1">Soru Tipi</label>
                <select name="questionType" value={questionForm.questionType} onChange={e => setQuestionForm(f => ({ ...f, questionType: e.target.value }))} className="w-full p-2 rounded border">
                  <option value="MultipleChoice">Çoktan Seçmeli</option>
                  <option value="TrueFalse">Doğru/Yanlış</option>
                </select>
              </div>
              {/* Diğer alanlar ve şıklar buraya eklenebilir */}
              <button type="submit" className="w-full bg-yellow-400 text-white font-semibold py-3 rounded-xl shadow hover:bg-yellow-500 transition">Kaydet</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 