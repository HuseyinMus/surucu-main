using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Application.DTOs;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizzesController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly AppDbContext _db;
    public QuizzesController(IQuizService quizService, AppDbContext db)
    {
        _quizService = quizService;
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        Guid drivingSchoolId = Guid.Empty;
        var claim = User.FindFirst("DrivingSchoolId")?.Value;
        if (claim != null && Guid.TryParse(claim, out var parsedId))
            drivingSchoolId = parsedId;
        
        // DrivingSchoolId'ye göre filtrele
        var quizzes = await _db.Quizzes
            .Where(q => q.DrivingSchoolId == drivingSchoolId)
            .ToListAsync();
        
        // Test verileri ekle (eğer hiç quiz yoksa)
        if (!quizzes.Any())
        {
            quizzes = new List<Quiz>
            {
                new Quiz
                {
                    Id = Guid.NewGuid(),
                    Title = "Trafik İşaretleri Sınavı",
                    Description = "Temel trafik işaretleri hakkında bilgi testi",
                    TotalPoints = 100,
                    CourseId = Guid.NewGuid(),
                    DrivingSchoolId = drivingSchoolId,
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new Quiz
                {
                    Id = Guid.NewGuid(),
                    Title = "Direksiyon Teorisi",
                    Description = "Direksiyon ve araç kontrolü teorik bilgileri",
                    TotalPoints = 80,
                    CourseId = Guid.NewGuid(),
                    DrivingSchoolId = drivingSchoolId,
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new Quiz
                {
                    Id = Guid.NewGuid(),
                    Title = "Motor ve Araç Tekniği",
                    Description = "Motor ve araç parçaları hakkında test",
                    TotalPoints = 120,
                    CourseId = Guid.NewGuid(),
                    DrivingSchoolId = drivingSchoolId,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                }
            };
        }

        var results = new List<object>();
        foreach (var q in quizzes)
        {
            // Gerçek soru sayısını al
            var questionCount = await _db.QuizQuestions.CountAsync(qu => qu.QuizId == q.Id);
            
            // Gerçek katılımcı sayısını al (QuizResult tablosundan)
            var participantCount = await _db.QuizResults.CountAsync(qr => qr.QuizId == q.Id);
            
            results.Add(new
            {
                id = q.Id,
                title = q.Title,
                description = q.Description,
                totalPoints = q.TotalPoints,
                courseId = q.CourseId,
                drivingSchoolId = q.DrivingSchoolId,
                createdAt = q.CreatedAt,
                status = q.Status ?? "active",
                startDate = q.CreatedAt.AddDays(7),
                duration = q.Duration ?? 60,
                participantCount = participantCount,
                questionCount = questionCount
            });
        }

        return Ok(results);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CreateQuiz([FromBody] QuizCreateRequest request)
    {
        // JWT token'dan DrivingSchoolId'yi al
        var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
        if (string.IsNullOrEmpty(drivingSchoolIdClaim) || !Guid.TryParse(drivingSchoolIdClaim, out var drivingSchoolId))
        {
            return BadRequest("Geçersiz sürücü kursu bilgisi");
        }

        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            DrivingSchoolId = drivingSchoolId,
            CourseId = request.CourseId,
            Title = request.Title,
            Description = request.Description,
            TotalPoints = request.TotalPoints,
            Duration = request.Duration,
            Status = request.Status ?? "active",
            CreatedAt = DateTime.UtcNow
        };
        _db.Quizzes.Add(quiz);
        await _db.SaveChangesAsync();
        return Ok(new {
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.TotalPoints,
            quiz.CourseId,
            quiz.DrivingSchoolId,
            quiz.CreatedAt,
            quiz.Status
        });
    }

    [HttpGet("{quizId}/questions")]
    [AllowAnonymous]
    public async Task<IActionResult> GetQuestions([FromRoute] Guid quizId)
    {
        try
        {
            var dbQuestions = await _db.QuizQuestions
                .Where(q => q.QuizId == quizId)
                .Select(q => new
                {
                    id = q.Id,
                    questionText = q.QuestionText,
                    questionType = q.QuestionType.ToString(), // Enum'u string olarak döndür
                    mediaType = q.MediaType,
                    mediaUrl = q.MediaUrl,
                    options = _db.QuizOptions
                        .Where(o => o.QuestionId == q.Id)
                        .Select(o => new
                        {
                            id = o.Id,
                            optionText = o.OptionText,
                            isCorrect = o.IsCorrect
                        })
                        .ToList()
                })
                .ToListAsync();

            // Eğer soru yoksa test soruları döndür
            if (!dbQuestions.Any())
            {
                var testQuestions = new List<object>
                {
                    new
                    {
                        id = Guid.NewGuid(),
                        questionText = "Trafik ışığında sarı ışık ne anlama gelir?",
                        questionType = "MultipleChoice",
                        mediaType = "Image",
                        mediaUrl = "https://picsum.photos/400/300?random=1",
                        options = new List<object>
                        {
                            new { id = Guid.NewGuid(), optionText = "Hızlanabilirsiniz", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Dikkatli geçebilirsiniz", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Durmanız gerekir", isCorrect = true },
                            new { id = Guid.NewGuid(), optionText = "Geri gidebilirsiniz", isCorrect = false }
                        }
                    },
                    new
                    {
                        id = Guid.NewGuid(),
                        questionText = "Yaşlılara yol verme zorunluluğu hangi durumda vardır?",
                        questionType = "MultipleChoice",
                        mediaType = "Video",
                        mediaUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                        options = new List<object>
                        {
                            new { id = Guid.NewGuid(), optionText = "Sadece yaya geçidinde", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Her durumda", isCorrect = true },
                            new { id = Guid.NewGuid(), optionText = "Sadece park yerinde", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Hiçbir zaman", isCorrect = false }
                        }
                    },
                    new
                    {
                        id = Guid.NewGuid(),
                        questionText = "Şehir içinde maksimum hız limiti kaç km/saat'tir?",
                        questionType = "MultipleChoice",
                        mediaType = "Image",
                        mediaUrl = "https://picsum.photos/400/300?random=2",
                        options = new List<object>
                        {
                            new { id = Guid.NewGuid(), optionText = "30 km/s", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "50 km/s", isCorrect = true },
                            new { id = Guid.NewGuid(), optionText = "70 km/s", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "90 km/s", isCorrect = false }
                        }
                    },
                    new
                    {
                        id = Guid.NewGuid(),
                        questionText = "Kırmızı ışıkta geçmek için ne yapmalısınız?",
                        questionType = "MultipleChoice",
                        mediaType = "None",
                        mediaUrl = "",
                        options = new List<object>
                        {
                            new { id = Guid.NewGuid(), optionText = "Hızla geçerim", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Durur beklerim", isCorrect = true },
                            new { id = Guid.NewGuid(), optionText = "Kornaya basarım", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Sağa dönebilirim", isCorrect = false }
                        }
                    },
                    new
                    {
                        id = Guid.NewGuid(),
                        questionText = "Alkollü araç kullanmak yasak mıdır?",
                        questionType = "MultipleChoice",
                        mediaType = "Image",
                        mediaUrl = "https://picsum.photos/400/300?random=3",
                        options = new List<object>
                        {
                            new { id = Guid.NewGuid(), optionText = "Hayır, az miktarda içilebilir", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Evet, tamamen yasaktır", isCorrect = true },
                            new { id = Guid.NewGuid(), optionText = "Sadece gece yasaktır", isCorrect = false },
                            new { id = Guid.NewGuid(), optionText = "Sadece otoyolda yasaktır", isCorrect = false }
                        }
                    }
                };

                return Ok(testQuestions);
            }

            return Ok(dbQuestions);
        }
        catch (Exception ex)
        {
            return BadRequest($"Sorular getirilirken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("{quizId}/questions")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddQuestion([FromRoute] Guid quizId, [FromForm] IFormCollection form)
    {
        try
        {
            Console.WriteLine($"=== SORU EKLEME BAŞLADI ===");
            Console.WriteLine($"Quiz ID: {quizId}");
            Console.WriteLine($"Form keys: {string.Join(", ", form.Keys)}");
            
            var quiz = await _db.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Id == quizId);
            if (quiz == null) return NotFound();

            var questionText = form["questionText"].ToString();
            var questionType = form["questionType"].ToString();
            var mediaType = form["mediaType"].ToString();
            var mediaUrl = form["mediaUrl"].ToString();
            var optionsJson = form["options"].ToString();

            Console.WriteLine($"Soru metni: {questionText}");
            Console.WriteLine($"Soru tipi: {questionType}");
            Console.WriteLine($"Medya tipi: {mediaType}");
            Console.WriteLine($"Medya URL: {mediaUrl}");
            Console.WriteLine($"Seçenekler JSON: {optionsJson}");

            if (string.IsNullOrEmpty(questionText))
            {
                return BadRequest("Soru metni gereklidir");
            }

            // Medya dosyası yükleme
            string? uploadedMediaUrl = null;
            Console.WriteLine($"Dosya sayısı: {form.Files.Count}");
            
            if (form.Files.Count > 0)
            {
                var file = form.Files[0];
                Console.WriteLine($"Dosya yükleniyor: {file.FileName}, Boyut: {file.Length}, ContentType: {file.ContentType}");
                
                if (file.Length > 0)
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                    var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    
                    Console.WriteLine($"Upload path: {uploadPath}");
                    
                    if (!Directory.Exists(uploadPath))
                    {
                        Directory.CreateDirectory(uploadPath);
                        Console.WriteLine("Uploads klasörü oluşturuldu");
                    }

                    var filePath = Path.Combine(uploadPath, fileName);
                    Console.WriteLine($"Dosya kaydediliyor: {filePath}");
                    
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    uploadedMediaUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
                    Console.WriteLine($"Dosya URL'i: {uploadedMediaUrl}");
                }
            }
            else
            {
                Console.WriteLine("Hiç dosya yüklenmedi");
            }

                                // QuestionType enum parsing - case insensitive ve daha güvenli
                    QuestionType parsedQuestionType;
                    Console.WriteLine($"AddQuestion - QuestionType parsing - Gelen değer: '{questionType}'");
                    if (string.IsNullOrEmpty(questionType))
                    {
                        Console.WriteLine("QuestionType boş, varsayılan olarak MultipleChoice kullanılıyor");
                        parsedQuestionType = QuestionType.MultipleChoice;
                    }
                    else
                    {
                        try
                        {
                            parsedQuestionType = Enum.Parse<QuestionType>(questionType, true); // true = case insensitive
                            Console.WriteLine($"QuestionType başarıyla parse edildi: {parsedQuestionType}");
                        }
                        catch (Exception parseEx)
                        {
                            Console.WriteLine($"QuestionType parse hatası: {parseEx.Message}");
                            Console.WriteLine("Varsayılan olarak MultipleChoice kullanılıyor");
                            parsedQuestionType = QuestionType.MultipleChoice;
                        }
                    }

                    var question = new QuizQuestion
                    {
                        Id = Guid.NewGuid(),
                        QuizId = quizId,
                        QuestionText = questionText,
                        QuestionType = parsedQuestionType,
                        MediaType = mediaType,
                        MediaUrl = uploadedMediaUrl ?? mediaUrl
                    };

            Console.WriteLine($"Soru kaydediliyor: {question.Id}");
            _db.QuizQuestions.Add(question);
            await _db.SaveChangesAsync();

            // Seçenekleri ekle
            if (!string.IsNullOrEmpty(optionsJson))
            {
                try
                {
                    var options = System.Text.Json.JsonSerializer.Deserialize<List<dynamic>>(optionsJson);
                    Console.WriteLine($"Seçenek sayısı: {options.Count}");
                    
                    int correctCount = 0;
                    foreach (var option in options)
                    {
                        var optionText = option.GetProperty("text").GetString();
                        var isCorrect = option.GetProperty("isCorrect").GetBoolean();
                        
                        if (isCorrect) correctCount++;
                        
                        var quizOption = new QuizOption
                        {
                            Id = Guid.NewGuid(),
                            QuestionId = question.Id,
                            OptionText = optionText,
                            IsCorrect = isCorrect
                        };
                        _db.QuizOptions.Add(quizOption);
                        Console.WriteLine($"Seçenek eklendi: {quizOption.OptionText} (Doğru: {quizOption.IsCorrect})");
                    }
                    
                    Console.WriteLine($"Toplam doğru şık sayısı: {correctCount}");
                    
                    if (correctCount == 0)
                    {
                        Console.WriteLine("UYARI: Hiç doğru şık seçilmemiş!");
                    }
                    
                    await _db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    // Seçenek ekleme hatası olsa bile soru kaydedildi
                    Console.WriteLine("Seçenek ekleme hatası: " + ex.Message);
                }
            }

            // Seçenekleri manuel olarak oluştur, navigation property'leri dahil etme
            var questionOptions = _db.QuizOptions
                .Where(o => o.QuestionId == question.Id)
                .Select(o => new
                {
                    o.Id,
                    optionText = o.OptionText,
                    o.IsCorrect
                })
                .ToList();

            var response = new
            {
                id = question.Id,
                questionText = question.QuestionText,
                questionType = question.QuestionType.ToString(),
                mediaType = question.MediaType,
                mediaUrl = question.MediaUrl,
                options = questionOptions
            };

            Console.WriteLine($"=== SORU EKLEME TAMAMLANDI ===");
            Console.WriteLine($"Response: {System.Text.Json.JsonSerializer.Serialize(response)}");

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== SORU EKLEME HATASI ===");
            Console.WriteLine($"Hata: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest($"Soru eklenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("{quizId}/questions/{questionId}/options")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddOption([FromRoute] Guid quizId, [FromRoute] Guid questionId, [FromBody] QuizOption option)
    {
        var question = await _db.QuizQuestions.FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId);
        if (question == null) return NotFound();
        option.Id = Guid.NewGuid();
        option.QuestionId = questionId;
        _db.QuizOptions.Add(option);
        await _db.SaveChangesAsync();
        return Ok(option);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateQuiz(Guid id, [FromBody] QuizUpdateRequest request)
    {
        try
        {
            var quiz = await _db.Quizzes.FindAsync(id);
            if (quiz == null)
            {
                return NotFound("Sınav bulunamadı");
            }

            // JWT token'dan DrivingSchoolId'yi kontrol et
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
            if (string.IsNullOrEmpty(drivingSchoolIdClaim) || !Guid.TryParse(drivingSchoolIdClaim, out var drivingSchoolId))
            {
                return BadRequest("Geçersiz sürücü kursu bilgisi");
            }

            if (quiz.DrivingSchoolId != drivingSchoolId)
            {
                return Forbid("Bu sınavı düzenleme yetkiniz yok");
            }

            // Quiz bilgilerini güncelle
            quiz.Title = request.Title;
            quiz.Description = request.Description;
            quiz.TotalPoints = request.TotalPoints;
            quiz.Duration = request.Duration;
            quiz.Status = request.Status;
            quiz.CourseId = request.CourseId; // null olabilir

            await _db.SaveChangesAsync();

            return Ok(new
            {
                quiz.Id,
                quiz.Title,
                quiz.Description,
                quiz.TotalPoints,
                quiz.CourseId,
                quiz.DrivingSchoolId,
                quiz.CreatedAt,
                quiz.Status,
                quiz.Duration
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Sınav güncellenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> DeleteQuiz(Guid id)
    {
        try
        {
            var quiz = await _db.Quizzes.FindAsync(id);
            if (quiz == null)
            {
                return NotFound("Sınav bulunamadı");
            }

            // JWT token'dan DrivingSchoolId'yi kontrol et
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
            if (string.IsNullOrEmpty(drivingSchoolIdClaim) || !Guid.TryParse(drivingSchoolIdClaim, out var drivingSchoolId))
            {
                return BadRequest("Geçersiz sürücü kursu bilgisi");
            }

            if (quiz.DrivingSchoolId != drivingSchoolId)
            {
                return Forbid("Bu sınavı silme yetkiniz yok");
            }

            // İlişkili soruları ve seçenekleri sil
            var questions = await _db.QuizQuestions.Where(q => q.QuizId == id).ToListAsync();
            foreach (var question in questions)
            {
                var options = await _db.QuizOptions.Where(o => o.QuestionId == question.Id).ToListAsync();
                _db.QuizOptions.RemoveRange(options);
            }
            _db.QuizQuestions.RemoveRange(questions);

            // Quiz'i sil
            _db.Quizzes.Remove(quiz);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Sınav başarıyla silindi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Sınav silinirken hata oluştu: {ex.Message}");
        }
    }

    [HttpPut("{quizId}/questions/{questionId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateQuestion([FromRoute] Guid quizId, [FromRoute] Guid questionId, [FromForm] IFormCollection? form = null, [FromBody] QuestionUpdateRequest? request = null)
    {
        try
        {
            Console.WriteLine($"=== SORU GÜNCELLEME BAŞLADI ===");
            Console.WriteLine($"Quiz ID: {quizId}, Question ID: {questionId}");
            
            // FormData veya JSON kontrolü
            string questionText = "";
            string questionType = "";
            string mediaType = "";
            string mediaUrl = "";
            List<QuestionOptionRequest> options = new();
            
            Console.WriteLine($"Form null mu: {form == null}");
            Console.WriteLine($"Request null mu: {request == null}");
            Console.WriteLine($"Content-Type: {Request.ContentType}");
            Console.WriteLine($"Content-Length: {Request.ContentLength}");
            
            // Content-Type'a göre request tipini belirle
            bool isFormData = Request.ContentType?.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase) == true;
            bool isJson = Request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) == true;
            
            Console.WriteLine($"isFormData: {isFormData}");
            Console.WriteLine($"isJson: {isJson}");
            
            if (isFormData && form != null)
            {
                // FormData ile gelen veri
                Console.WriteLine("FormData ile güncelleme yapılıyor...");
                Console.WriteLine($"Form keys: {string.Join(", ", form.Keys)}");
                
                questionText = form["questionText"].ToString();
                questionType = form["questionType"].ToString();
                mediaType = form["mediaType"].ToString();
                mediaUrl = form["mediaUrl"].ToString();
                var optionsJson = form["options"].ToString();
                
                Console.WriteLine($"Soru metni: {questionText}");
                Console.WriteLine($"Soru tipi: {questionType}");
                Console.WriteLine($"Medya tipi: {mediaType}");
                Console.WriteLine($"Medya URL: {mediaUrl}");
                Console.WriteLine($"Seçenekler JSON: {optionsJson}");
                
                // Medya dosyası yükleme
                if (form.Files.Count > 0)
                {
                    var file = form.Files[0];
                    Console.WriteLine($"Dosya yükleniyor: {file.FileName}, Boyut: {file.Length}, ContentType: {file.ContentType}");
                    
                    if (file.Length > 0)
                    {
                        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                        
                        Console.WriteLine($"Upload path: {uploadPath}");
                        
                        if (!Directory.Exists(uploadPath))
                        {
                            Directory.CreateDirectory(uploadPath);
                            Console.WriteLine("Uploads klasörü oluşturuldu");
                        }

                        var filePath = Path.Combine(uploadPath, fileName);
                        Console.WriteLine($"Dosya kaydediliyor: {filePath}");
                        
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        mediaUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
                        Console.WriteLine($"Dosya URL'i: {mediaUrl}");
                    }
                }
                
                // Seçenekleri parse et
                if (!string.IsNullOrEmpty(optionsJson))
                {
                    try
                    {
                        var optionsData = System.Text.Json.JsonSerializer.Deserialize<List<dynamic>>(optionsJson);
                        foreach (var option in optionsData)
                        {
                            options.Add(new QuestionOptionRequest
                            {
                                Text = option.GetProperty("text").GetString(),
                                IsCorrect = option.GetProperty("isCorrect").GetBoolean()
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Seçenek parse hatası: " + ex.Message);
                    }
                }
            }
            else if (isJson && request != null)
            {
                // JSON ile gelen veri
                        Console.WriteLine("JSON ile güncelleme yapılıyor...");
                        Console.WriteLine($"Request JSON: {System.Text.Json.JsonSerializer.Serialize(request)}");
                        Console.WriteLine($"QuestionType değeri: '{request.QuestionType}' (Tip: {request.QuestionType?.GetType().Name})");
                        Console.WriteLine($"QuestionText değeri: '{request.QuestionText}'");
                        Console.WriteLine($"MediaType değeri: '{request.MediaType}'");
                        Console.WriteLine($"MediaUrl değeri: '{request.MediaUrl}'");
                        Console.WriteLine($"Options sayısı: {request.Options?.Count ?? 0}");
                        
                        questionText = request.QuestionText;
                        questionType = request.QuestionType;
                        mediaType = request.MediaType;
                        mediaUrl = request.MediaUrl;
                        options = request.Options;
                        
                        Console.WriteLine($"İşlenen veriler:");
                        Console.WriteLine($"  questionText: '{questionText}'");
                        Console.WriteLine($"  questionType: '{questionType}'");
                        Console.WriteLine($"  mediaType: '{mediaType}'");
                        Console.WriteLine($"  mediaUrl: '{mediaUrl}'");
                        Console.WriteLine($"  options count: {options?.Count ?? 0}");
            }
            else
            {
                Console.WriteLine("Geçersiz veri formatı - FormData veya JSON değil");
                return BadRequest("Geçersiz veri formatı. FormData veya JSON bekleniyor.");
            }
            
            Console.WriteLine($"Seçenek sayısı: {options?.Count ?? 0}");
            
            var question = await _db.QuizQuestions.FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId);
            if (question == null)
            {
                Console.WriteLine("Soru bulunamadı");
                return NotFound("Soru bulunamadı");
            }
            
            Console.WriteLine($"Soru bulundu - ID: {question.Id}, Quiz ID: {question.QuizId}");
            Console.WriteLine($"Entity State: {_db.Entry(question).State}");

            // Quiz'in DrivingSchoolId'sini kontrol et
            var quiz = await _db.Quizzes.FindAsync(quizId);
            if (quiz == null)
            {
                return NotFound("Sınav bulunamadı");
            }

            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
            if (string.IsNullOrEmpty(drivingSchoolIdClaim) || !Guid.TryParse(drivingSchoolIdClaim, out var drivingSchoolId))
            {
                return BadRequest("Geçersiz sürücü kursu bilgisi");
            }

            if (quiz.DrivingSchoolId != drivingSchoolId)
            {
                return Forbid("Bu soruyu düzenleme yetkiniz yok");
            }

            // Soru bilgilerini güncelle
            Console.WriteLine($"Soru güncelleniyor - Önceki değerler:");
            Console.WriteLine($"  Önceki QuestionText: '{question.QuestionText}'");
            Console.WriteLine($"  Önceki QuestionType: '{question.QuestionType}'");
            Console.WriteLine($"  Önceki MediaType: '{question.MediaType}'");
            Console.WriteLine($"  Önceki MediaUrl: '{question.MediaUrl}'");
            
            question.QuestionText = questionText;
            
            // QuestionType enum parsing - case insensitive ve daha güvenli
            Console.WriteLine($"QuestionType parsing - Gelen değer: '{questionType}'");
            if (string.IsNullOrEmpty(questionType))
            {
                Console.WriteLine("QuestionType boş, varsayılan olarak MultipleChoice kullanılıyor");
                question.QuestionType = QuestionType.MultipleChoice;
            }
            else
            {
                try
                {
                    question.QuestionType = Enum.Parse<QuestionType>(questionType, true); // true = case insensitive
                    Console.WriteLine($"QuestionType başarıyla parse edildi: {question.QuestionType}");
                }
                catch (Exception parseEx)
                {
                    Console.WriteLine($"QuestionType parse hatası: {parseEx.Message}");
                    Console.WriteLine("Varsayılan olarak MultipleChoice kullanılıyor");
                    question.QuestionType = QuestionType.MultipleChoice;
                }
            }
            
            question.MediaType = mediaType;
            question.MediaUrl = mediaUrl;

            Console.WriteLine($"Soru güncellendi - Yeni değerler:");
            Console.WriteLine($"  Yeni QuestionText: '{question.QuestionText}'");
            Console.WriteLine($"  Yeni QuestionType: '{question.QuestionType}'");
            Console.WriteLine($"  Yeni MediaType: '{question.MediaType}'");
            Console.WriteLine($"  Yeni MediaUrl: '{question.MediaUrl}'");
            
            // Entity'yi modified olarak işaretle
            _db.Entry(question).State = EntityState.Modified;
            Console.WriteLine($"Entity State güncellendi: {_db.Entry(question).State}");

            // Mevcut seçenekleri sil
            var existingOptions = await _db.QuizOptions.Where(o => o.QuestionId == questionId).ToListAsync();
            Console.WriteLine($"Silinecek seçenek sayısı: {existingOptions.Count}");
            _db.QuizOptions.RemoveRange(existingOptions);

            // Yeni seçenekleri ekle
            int correctCount = 0;
            foreach (var option in options)
            {
                var quizOption = new QuizOption
                {
                    Id = Guid.NewGuid(),
                    QuestionId = questionId,
                    OptionText = option.Text,
                    IsCorrect = option.IsCorrect
                };
                
                if (option.IsCorrect) correctCount++;
                
                _db.QuizOptions.Add(quizOption);
                Console.WriteLine($"Seçenek eklendi: {quizOption.OptionText} (Doğru: {quizOption.IsCorrect})");
            }
            
            Console.WriteLine($"Toplam doğru şık sayısı: {correctCount}");

            Console.WriteLine("Veritabanına kaydediliyor...");
            
            // Entity'lerin durumunu kontrol et
            Console.WriteLine($"Question entity state: {_db.Entry(question).State}");
            var optionEntities = _db.ChangeTracker.Entries<QuizOption>().ToList();
            Console.WriteLine($"Option entities count: {optionEntities.Count}");
            foreach (var entry in optionEntities)
            {
                Console.WriteLine($"Option {entry.Entity.Id}: {entry.State}");
            }
            
            var saveResult = await _db.SaveChangesAsync();
            Console.WriteLine($"SaveChangesAsync sonucu: {saveResult} satır etkilendi");
            Console.WriteLine("Veritabanına kaydedildi");

            // Güncellenmiş soruyu döndür
            var updatedOptions = await _db.QuizOptions
                .Where(o => o.QuestionId == questionId)
                .Select(o => new { 
                    id = o.Id, 
                    optionText = o.OptionText, 
                    isCorrect = o.IsCorrect 
                })
                .ToListAsync();

            // Veritabanından güncellenmiş soruyu tekrar çek
            Console.WriteLine("Veritabanından soru çekiliyor...");
            var updatedQuestion = await _db.QuizQuestions
                .FirstOrDefaultAsync(q => q.Id == questionId);
            
            Console.WriteLine($"Veritabanından çekilen soru: {updatedQuestion?.QuestionText}");
            Console.WriteLine($"Veritabanından çekilen seçenek sayısı: {updatedOptions.Count}");
            
            // Seçenekleri de ayrıca kontrol et
            var allOptions = await _db.QuizOptions
                .Where(o => o.QuestionId == questionId)
                .ToListAsync();
            Console.WriteLine($"Tüm seçenekler sayısı: {allOptions.Count}");
            foreach (var opt in allOptions)
            {
                Console.WriteLine($"Seçenek: {opt.OptionText} (Doğru: {opt.IsCorrect})");
            }

            // Response'u güncellenmiş entity'den oluştur, eğer null ise mevcut entity'yi kullan
            var response = new
            {
                id = question.Id,
                questionText = question.QuestionText,
                questionType = question.QuestionType.ToString(),
                mediaType = question.MediaType,
                mediaUrl = question.MediaUrl,
                options = updatedOptions
            };

            Console.WriteLine($"=== SORU GÜNCELLEME TAMAMLANDI ===");
            Console.WriteLine($"Response: {System.Text.Json.JsonSerializer.Serialize(response)}");

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== SORU GÜNCELLEME HATASI ===");
            Console.WriteLine($"Hata: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest($"Soru güncellenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpDelete("{quizId}/questions/{questionId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> DeleteQuestion([FromRoute] Guid quizId, [FromRoute] Guid questionId)
    {
        try
        {
            var question = await _db.QuizQuestions.FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId);
            if (question == null)
            {
                return NotFound("Soru bulunamadı");
            }

            // Quiz'in DrivingSchoolId'sini kontrol et
            var quiz = await _db.Quizzes.FindAsync(quizId);
            if (quiz == null)
            {
                return NotFound("Sınav bulunamadı");
            }

            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
            if (string.IsNullOrEmpty(drivingSchoolIdClaim) || !Guid.TryParse(drivingSchoolIdClaim, out var drivingSchoolId))
            {
                return BadRequest("Geçersiz sürücü kursu bilgisi");
            }

            if (quiz.DrivingSchoolId != drivingSchoolId)
            {
                return Forbid("Bu soruyu silme yetkiniz yok");
            }

            // Seçenekleri sil
            var options = await _db.QuizOptions.Where(o => o.QuestionId == questionId).ToListAsync();
            _db.QuizOptions.RemoveRange(options);

            // Soruyu sil
            _db.QuizQuestions.Remove(question);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Soru başarıyla silindi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Soru silinirken hata oluştu: {ex.Message}");
        }
    }

    // START QUIZ
    [HttpPost("{quizId}/start")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> StartQuiz([FromRoute] Guid quizId)
    {
        try
        {
            // JWT token'dan user ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenci bilgilerini al
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Quiz'i kontrol et
            var quiz = await _db.Quizzes
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null)
            {
                return NotFound("Quiz bulunamadı");
            }

            // Quiz başlatma kaydı oluştur
            var quizSession = new QuizSession
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                QuizId = quizId,
                StartTime = DateTime.UtcNow,
                IsCompleted = false
            };

            _db.QuizSessions.Add(quizSession);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                sessionId = quizSession.Id,
                quizId = quizId,
                startTime = quizSession.StartTime,
                duration = quiz.Duration ?? 60
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Quiz başlatılırken hata: {ex.Message}");
        }
    }

    // SUBMIT QUIZ
    [HttpPost("{quizId}/submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SubmitQuiz([FromRoute] Guid quizId, [FromBody] QuizSubmitRequest request)
    {
        try
        {
            // JWT token'dan user ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenci bilgilerini al
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Quiz'i kontrol et
            var quiz = await _db.Quizzes
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null)
            {
                return NotFound("Quiz bulunamadı");
            }

            // Quiz sonucunu kaydet
            var quizResult = new QuizResult
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                QuizId = quizId,
                Score = request.Score,
                TotalQuestions = request.TotalQuestions,
                CorrectAnswers = request.CorrectAnswers,
                TimeSpent = request.TimeSpent,
                CompletedAt = DateTime.UtcNow
            };

            _db.QuizResults.Add(quizResult);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                resultId = quizResult.Id,
                score = quizResult.Score,
                totalQuestions = quizResult.TotalQuestions,
                correctAnswers = quizResult.CorrectAnswers,
                percentage = Math.Round((double)quizResult.CorrectAnswers / quizResult.TotalQuestions * 100, 1)
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Quiz sonucu kaydedilirken hata: {ex.Message}");
        }
    }

    // QUIZ PROGRESS
    [HttpGet("progress/{studentId}/{quizId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetQuizProgress(Guid studentId, Guid quizId)
    {
        try
        {
            var quizResult = await _db.QuizResults
                .Where(qr => qr.StudentId == studentId && qr.QuizId == quizId)
                .OrderByDescending(qr => qr.CompletedAt)
                .FirstOrDefaultAsync();

            if (quizResult == null)
            {
                return Ok(new
                {
                    hasAttempted = false,
                    bestScore = 0,
                    attempts = 0,
                    lastAttempt = (DateTime?)null
                });
            }

            var attempts = await _db.QuizResults
                .Where(qr => qr.StudentId == studentId && qr.QuizId == quizId)
                .CountAsync();

            return Ok(new
            {
                hasAttempted = true,
                bestScore = quizResult.Score,
                attempts = attempts,
                lastAttempt = quizResult.CompletedAt,
                percentage = Math.Round((double)quizResult.CorrectAnswers / quizResult.TotalQuestions * 100, 1)
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Quiz progress alınırken hata: {ex.Message}");
        }
    }
} 