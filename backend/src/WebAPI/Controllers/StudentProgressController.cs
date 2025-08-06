using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Domain.Entities;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentProgressController : ControllerBase
{
    private readonly IStudentProgressService _service;
    private readonly AppDbContext _db;
    public StudentProgressController(IStudentProgressService service, AppDbContext db)
    {
        _service = service;
        _db = db;
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Log([FromBody] StudentProgressCreateRequest request)
    {
        var result = await _service.LogProgressAsync(request);
        return Ok(result);
    }

    [HttpGet("{studentId}")]
    [Authorize(Roles = "Student,Instructor,Admin")]
    public async Task<IActionResult> GetProgress(Guid studentId)
    {
        var result = await _service.GetProgressAsync(studentId);
        return Ok(result);
    }

    [HttpGet("/api/students/{studentId}/progress")]
    [Authorize(Roles = "Student,Instructor,Admin")]
    public async Task<IActionResult> GetProgressReport(Guid studentId)
    {
        var student = await _db.Students.FindAsync(studentId);
        if (student == null)
            return NotFound();
        var result = await _service.GetProgressReportAsync(studentId, student.DrivingSchoolId);
        return Ok(result);
    }

    // DASHBOARD PROGRESS
    [HttpGet("dashboard")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetDashboardProgress()
    {
        try
        {
            // JWT token'dan user ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // User'ı veritabanından bul
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return NotFound("Kullanıcı bulunamadı");
            }

            // Öğrenci bilgilerini al - studentId parametresini kullanma, JWT'den gelen userId'yi kullan
            var student = await _db.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Kurs sayısını al
            var totalCourses = await _db.Courses
                .Where(c => c.DrivingSchoolId == user.DrivingSchoolId)
                .CountAsync();

            // Tamamlanan kurs sayısını al
            var completedCourses = await _db.StudentProgresses
                .Where(cp => cp.StudentId == student.Id && cp.Progress >= 100)
                .CountAsync();

            // Quiz sayısını al
            var totalQuizzes = await _db.Quizzes
                .Where(q => q.DrivingSchoolId == user.DrivingSchoolId)
                .CountAsync();

            // Tamamlanan quiz sayısını al
            var completedQuizzes = await _db.QuizResults
                .Where(qr => qr.StudentId == student.Id)
                .CountAsync();

            // Ortalama quiz puanını al
            var quizResults = await _db.QuizResults
                .Where(qr => qr.StudentId == student.Id)
                .ToListAsync();

            double averageQuizScore = 0;
            if (quizResults.Any())
            {
                averageQuizScore = quizResults.Average(qr => (double)qr.Score);
            }

            var result = new
            {
                totalCourses = totalCourses,
                completedCourses = completedCourses,
                totalQuizzes = totalQuizzes,
                completedQuizzes = completedQuizzes,
                averageQuizScore = Math.Round(averageQuizScore, 1),
                overallProgress = totalCourses > 0 ? Math.Round((double)completedCourses / totalCourses * 100, 1) : 0,
                lastActivity = DateTime.UtcNow.AddDays(-1), // Şimdilik sabit
                currentStreak = 3 // Şimdilik sabit
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Dashboard progress alınırken hata: {ex.Message}");
        }
    }

    // COURSE PROGRESS
    [HttpGet("course/{courseId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetCourseProgress(Guid courseId)
    {
        try
        {
            // JWT token'dan user ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenci bilgilerini al - studentId parametresini kullanma, JWT'den gelen userId'yi kullan
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // CourseContent'i Include ederek sorgula
            var progress = await _db.StudentProgresses
                .Include(sp => sp.CourseContent)
                .Where(sp => sp.StudentId == student.Id && sp.CourseContent.CourseId == courseId)
                .FirstOrDefaultAsync();

            if (progress == null)
            {
                // Yeni progress oluştur - CourseContentId gerekli
                // Şimdilik basit bir yaklaşım kullanıyoruz
                var courseContent = await _db.CourseContents
                    .Where(cc => cc.CourseId == courseId)
                    .FirstOrDefaultAsync();
                
                if (courseContent == null)
                {
                    return BadRequest("Kurs içeriği bulunamadı");
                }

                progress = new StudentProgress
                {
                    Id = Guid.NewGuid(),
                    StudentId = student.Id, // student.Id kullan
                    CourseId = courseId,
                    ContentId = courseContent.Id,
                    Progress = 0,
                    TimeSpent = 0,
                    LastAccessed = DateTime.UtcNow
                };
                _db.StudentProgresses.Add(progress);
                await _db.SaveChangesAsync();
            }

            return Ok(new
            {
                progress = progress.Progress,
                timeSpent = progress.TimeSpent,
                lastAccessed = progress.LastAccessed,
                isCompleted = progress.Progress >= 100
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Kurs progress alınırken hata: {ex.Message}");
        }
    }

    // CONTENT PROGRESS
    [HttpGet("content/{studentId}/{courseId}/{contentId}")]
    [Authorize(Roles = "Student,Instructor,Admin")]
    public async Task<IActionResult> GetContentProgress(Guid studentId, Guid courseId, Guid contentId)
    {
        try
        {
            // Öğrenciyi kontrol et
            var student = await _db.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == studentId);
            
            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Kursu kontrol et
            var course = await _db.Courses
                .Include(c => c.CourseContents)
                .FirstOrDefaultAsync(c => c.Id == courseId);
            
            if (course == null)
            {
                return NotFound("Kurs bulunamadı");
            }

            // Content'i kontrol et
            var content = course.CourseContents.FirstOrDefault(cc => cc.Id == contentId);
            if (content == null)
            {
                return NotFound("İçerik bulunamadı");
            }

            // Progress verisini al veya oluştur
            var progress = await _db.StudentProgresses
                .FirstOrDefaultAsync(sp => 
                    sp.StudentId == studentId && 
                    sp.CourseId == courseId &&
                    sp.ContentId == contentId);

            if (progress == null)
            {
                // Yeni progress kaydı oluştur
                progress = new StudentProgress
                {
                    Id = Guid.NewGuid(),
                    StudentId = studentId,
                    CourseId = courseId,
                    ContentId = contentId,
                    Progress = 0,
                    TimeSpent = 0,
                    IsCompleted = false,
                    LastAccessed = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                _db.StudentProgresses.Add(progress);
                await _db.SaveChangesAsync();
            }

            var result = new
            {
                progress.Id,
                progress.Progress,
                progress.TimeSpent,
                progress.IsCompleted,
                progress.LastAccessed,
                progress.CompletedAt,
                progress.Attempts,
                ContentTitle = content.Title,
                ContentType = content.ContentType,
                ContentUrl = content.ContentUrl
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"İçerik progress verisi alınırken hata oluştu: {ex.Message}");
        }
    }

    // CONTENT PROGRESS UPDATE
    [HttpPost("content/{studentId}/{courseId}/{contentId}/update")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> UpdateContentProgress(
        Guid studentId, 
        Guid courseId, 
        Guid contentId,
        [FromBody] ContentProgressUpdateRequest request)
    {
        try
        {
            var progress = await _db.StudentProgresses
                .FirstOrDefaultAsync(sp => 
                    sp.StudentId == studentId && 
                    sp.CourseId == courseId &&
                    sp.ContentId == contentId);

            if (progress == null)
            {
                progress = new StudentProgress
                {
                    Id = Guid.NewGuid(),
                    StudentId = studentId,
                    CourseId = courseId,
                    ContentId = contentId,
                    Progress = 0,
                    TimeSpent = 0,
                    IsCompleted = false,
                    LastAccessed = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                _db.StudentProgresses.Add(progress);
            }

            // Progress verilerini güncelle
            progress.Progress = request.Progress;
            progress.TimeSpent += request.TimeSpent;
            progress.LastAccessed = DateTime.UtcNow;
            progress.Attempts = (progress.Attempts ?? 0) + 1;

            // Eğer progress %100 ise tamamlandı olarak işaretle
            if (request.Progress >= 100 && !progress.IsCompleted)
            {
                progress.IsCompleted = true;
                progress.CompletedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            var result = new
            {
                progress.Id,
                progress.Progress,
                progress.TimeSpent,
                progress.IsCompleted,
                progress.LastAccessed,
                progress.CompletedAt,
                progress.Attempts
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"İçerik progress güncellenirken hata oluştu: {ex.Message}");
        }
    }

    // UPDATE PROGRESS
    [HttpPost("update")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> UpdateProgress([FromBody] ProgressUpdateRequest request)
    {
        try
        {
            // JWT token'dan user ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenci bilgilerini al - request.StudentId kullanma, JWT'den gelen userId'yi kullan
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // CourseContent'i Include ederek sorgula
            var progress = await _db.StudentProgresses
                .Include(sp => sp.CourseContent)
                .Where(sp => sp.StudentId == student.Id && sp.CourseContent.CourseId == request.CourseId)
                .FirstOrDefaultAsync();

            if (progress == null)
            {
                // CourseContentId gerekli
                var courseContent = await _db.CourseContents
                    .Where(cc => cc.CourseId == request.CourseId)
                    .FirstOrDefaultAsync();
                
                if (courseContent == null)
                {
                    return BadRequest("Kurs içeriği bulunamadı");
                }

                progress = new StudentProgress
                {
                    Id = Guid.NewGuid(),
                    StudentId = student.Id, // student.Id kullan
                    CourseId = request.CourseId,
                    ContentId = courseContent.Id,
                    Progress = request.Progress,
                    TimeSpent = request.TimeSpent,
                    LastAccessed = DateTime.UtcNow
                };
                _db.StudentProgresses.Add(progress);
            }
            else
            {
                progress.Progress = request.Progress;
                progress.TimeSpent = request.TimeSpent;
                progress.LastAccessed = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new { success = true, progress = progress.Progress });
        }
        catch (Exception ex)
        {
            return BadRequest($"Progress güncellenirken hata: {ex.Message}");
        }
    }

    // COMPLETE LESSON
    [HttpPost("complete-lesson")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> CompleteLesson([FromBody] LessonCompleteRequest request)
    {
        try
        {
            // JWT token'dan user ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenci bilgilerini al - request.StudentId kullanma, JWT'den gelen userId'yi kullan
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // CourseContent'i Include ederek sorgula
            var progress = await _db.StudentProgresses
                .Include(sp => sp.CourseContent)
                .Where(sp => sp.StudentId == student.Id && sp.CourseContent.CourseId == request.CourseId)
                .FirstOrDefaultAsync();

            if (progress == null)
            {
                // CourseContentId gerekli
                var courseContent = await _db.CourseContents
                    .Where(cc => cc.CourseId == request.CourseId)
                    .FirstOrDefaultAsync();
                
                if (courseContent == null)
                {
                    return BadRequest("Kurs içeriği bulunamadı");
                }

                progress = new StudentProgress
                {
                    Id = Guid.NewGuid(),
                    StudentId = student.Id, // student.Id kullan
                    CourseId = request.CourseId,
                    ContentId = courseContent.Id,
                    Progress = 100,
                    TimeSpent = request.TimeSpent,
                    LastAccessed = DateTime.UtcNow
                };
                _db.StudentProgresses.Add(progress);
            }
            else
            {
                progress.Progress = 100;
                progress.TimeSpent = request.TimeSpent;
                progress.LastAccessed = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Ders tamamlandı" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Ders tamamlanırken hata: {ex.Message}");
        }
    }
} 