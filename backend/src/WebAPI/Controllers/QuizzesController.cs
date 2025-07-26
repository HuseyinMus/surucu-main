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
        
        // GEÇİCİ: Tüm quiz'leri döndür (DrivingSchoolId filtresi kaldırıldı)
        var quizzes = await _db.Quizzes.ToListAsync();
        
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
                    CreatedAt = DateTime.Now.AddDays(-5)
                },
                new Quiz
                {
                    Id = Guid.NewGuid(),
                    Title = "Direksiyon Teorisi",
                    Description = "Direksiyon ve araç kontrolü teorik bilgileri",
                    TotalPoints = 80,
                    CourseId = Guid.NewGuid(),
                    DrivingSchoolId = drivingSchoolId,
                    CreatedAt = DateTime.Now.AddDays(-3)
                },
                new Quiz
                {
                    Id = Guid.NewGuid(),
                    Title = "Motor ve Araç Tekniği",
                    Description = "Motor ve araç parçaları hakkında test",
                    TotalPoints = 120,
                    CourseId = Guid.NewGuid(),
                    DrivingSchoolId = drivingSchoolId,
                    CreatedAt = DateTime.Now.AddDays(-1)
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
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetQuestions([FromRoute] Guid quizId)
    {
        try
        {
            var questions = await _db.QuizQuestions
                .Where(q => q.QuizId == quizId)
                .Select(q => new
                {
                    q.Id,
                    q.QuestionText,
                    q.QuestionType,
                    q.MediaType,
                    q.MediaUrl,
                    options = _db.QuizOptions
                        .Where(o => o.QuestionId == q.Id)
                        .Select(o => new
                        {
                            o.Id,
                            o.OptionText,
                            o.IsCorrect
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(questions);
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
        var quiz = await _db.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null) return NotFound();

        var questionText = form["questionText"].ToString();
        var questionType = form["questionType"].ToString();
        var mediaType = form["mediaType"].ToString();
        var mediaUrl = form["mediaUrl"].ToString();
        var optionsJson = form["options"].ToString();

        if (string.IsNullOrEmpty(questionText))
        {
            return BadRequest("Soru metni gereklidir");
        }

        // Medya dosyası yükleme
        string? uploadedMediaUrl = null;
        if (form.Files.Count > 0)
        {
            var file = form.Files[0];
            Console.WriteLine($"Dosya yükleniyor: {file.FileName}, Boyut: {file.Length}");
            
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

                uploadedMediaUrl = "http://192.168.1.78:5068/uploads/" + fileName;
                Console.WriteLine($"Dosya URL'i: {uploadedMediaUrl}");
            }
        }
        else
        {
            Console.WriteLine("Hiç dosya yüklenmedi");
        }

        var question = new QuizQuestion
        {
            Id = Guid.NewGuid(),
            QuizId = quizId,
            QuestionText = questionText,
            QuestionType = Enum.Parse<QuestionType>(questionType),
            MediaType = mediaType,
            MediaUrl = uploadedMediaUrl ?? mediaUrl
        };

        _db.QuizQuestions.Add(question);
        await _db.SaveChangesAsync();

        // Seçenekleri ekle
        if (!string.IsNullOrEmpty(optionsJson))
        {
            try
            {
                var options = System.Text.Json.JsonSerializer.Deserialize<List<dynamic>>(optionsJson);
                foreach (var option in options)
                {
                    var quizOption = new QuizOption
                    {
                        Id = Guid.NewGuid(),
                        QuestionId = question.Id,
                        OptionText = option.GetProperty("text").GetString(),
                        IsCorrect = option.GetProperty("isCorrect").GetBoolean()
                    };
                    _db.QuizOptions.Add(quizOption);
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
                o.OptionText,
                o.IsCorrect
            })
            .ToList();

        return Ok(new
        {
            question.Id,
            question.QuestionText,
            question.QuestionType,
            question.MediaType,
            question.MediaUrl,
            options = questionOptions
        });
        }
        catch (Exception ex)
        {
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
    public async Task<IActionResult> UpdateQuestion([FromRoute] Guid quizId, [FromRoute] Guid questionId, [FromBody] QuestionUpdateRequest request)
    {
        try
        {
            Console.WriteLine($"UpdateQuestion çağrıldı - QuizId: {quizId}, QuestionId: {questionId}");
            Console.WriteLine($"Request: {System.Text.Json.JsonSerializer.Serialize(request)}");
            
            var question = await _db.QuizQuestions.FirstOrDefaultAsync(q => q.Id == questionId && q.QuizId == quizId);
            if (question == null)
            {
                Console.WriteLine("Soru bulunamadı");
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
                return Forbid("Bu soruyu düzenleme yetkiniz yok");
            }

            // Soru bilgilerini güncelle
            question.QuestionText = request.QuestionText;
            question.QuestionType = Enum.Parse<QuestionType>(request.QuestionType);
            question.MediaType = request.MediaType;
            question.MediaUrl = request.MediaUrl;

            // Mevcut seçenekleri sil
            var existingOptions = await _db.QuizOptions.Where(o => o.QuestionId == questionId).ToListAsync();
            _db.QuizOptions.RemoveRange(existingOptions);

            // Yeni seçenekleri ekle
            foreach (var option in request.Options)
            {
                var quizOption = new QuizOption
                {
                    Id = Guid.NewGuid(),
                    QuestionId = questionId,
                    OptionText = option.Text,
                    IsCorrect = option.IsCorrect
                };
                _db.QuizOptions.Add(quizOption);
            }

            await _db.SaveChangesAsync();

            // Güncellenmiş soruyu döndür
            var updatedOptions = await _db.QuizOptions
                .Where(o => o.QuestionId == questionId)
                .Select(o => new { 
                    id = o.Id, 
                    text = o.OptionText, 
                    isCorrect = o.IsCorrect 
                })
                .ToListAsync();

            return Ok(new
            {
                id = question.Id,
                questionText = question.QuestionText,
                questionType = question.QuestionType.ToString(),
                mediaType = question.MediaType,
                mediaUrl = question.MediaUrl,
                options = updatedOptions
            });
        }
        catch (Exception ex)
        {
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
} 