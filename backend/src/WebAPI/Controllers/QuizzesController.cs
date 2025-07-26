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

        var quizResponses = quizzes.Select(q => new
        {
            id = q.Id,
            title = q.Title,
            description = q.Description,
            totalPoints = q.TotalPoints,
            courseId = q.CourseId,
            drivingSchoolId = q.DrivingSchoolId,
            createdAt = q.CreatedAt,
            status = "active", // Default status
            startDate = q.CreatedAt.AddDays(7),
            duration = 60,
            participantCount = 25,
            questionCount = 20
        });

        return Ok(quizResponses);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CreateQuiz([FromBody] QuizCreateRequest request)
    {
        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            DrivingSchoolId = request.DrivingSchoolId,
            CourseId = request.CourseId,
            Title = request.Title,
            Description = request.Description,
            TotalPoints = request.TotalPoints,
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
            quiz.CreatedAt
        });
    }

    [HttpPost("{quizId}/questions")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddQuestion([FromRoute] Guid quizId, [FromBody] QuizQuestion question)
    {
        var quiz = await _db.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null) return NotFound();
        question.Id = Guid.NewGuid();
        question.QuizId = quizId;
        _db.QuizQuestions.Add(question);
        await _db.SaveChangesAsync();
        return Ok(question);
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
} 