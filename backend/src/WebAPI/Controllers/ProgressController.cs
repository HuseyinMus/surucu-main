using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgressController : ControllerBase
{
    private readonly IProgressTrackingService _progressService;

    public ProgressController(IProgressTrackingService progressService)
    {
        _progressService = progressService;
    }

    [HttpGet("summary/{studentId}/{courseId}")]
    public async Task<ActionResult<ProgressSummaryDto>> GetProgressSummary(Guid studentId, Guid courseId)
    {
        try
        {
            var summary = await _progressService.GetStudentProgressSummaryAsync(studentId, courseId);
            return Ok(summary);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, "İlerleme bilgileri alınamadı");
        }
    }

    [HttpGet("lessons/{studentId}/{courseId}")]
    public async Task<ActionResult<List<LessonProgressDto>>> GetLessonProgress(Guid studentId, Guid courseId)
    {
        try
        {
            var progress = await _progressService.GetLessonProgressAsync(studentId, courseId);
            return Ok(progress);
        }
        catch (Exception)
        {
            return StatusCode(500, "Ders ilerleme bilgileri alınamadı");
        }
    }

    [HttpGet("daily/{studentId}/{courseId}")]
    public async Task<ActionResult<List<DailyProgressDto>>> GetDailyProgress(
        Guid studentId, 
        Guid courseId, 
        [FromQuery] int days = 30)
    {
        try
        {
            var progress = await _progressService.GetDailyProgressAsync(studentId, courseId, days);
            return Ok(progress);
        }
        catch (Exception)
        {
            return StatusCode(500, "Günlük ilerleme bilgileri alınamadı");
        }
    }

    [HttpGet("analytics/{studentId}")]
    public async Task<ActionResult<AnalyticsDto>> GetStudentAnalytics(
        Guid studentId, 
        [FromQuery] DateTime date)
    {
        try
        {
            var analytics = await _progressService.GetStudentAnalyticsAsync(studentId, date);
            return Ok(analytics);
        }
        catch (Exception)
        {
            return StatusCode(500, "Analitik bilgiler alınamadı");
        }
    }

    [HttpPost("update")]
    public async Task<ActionResult> UpdateProgress([FromBody] UpdateProgressRequest request)
    {
        try
        {
            await _progressService.UpdateProgressAsync(
                request.StudentId, 
                request.CourseContentId, 
                request.Progress, 
                request.TimeSpent);
            
            return Ok("İlerleme güncellendi");
        }
        catch (Exception)
        {
            return StatusCode(500, "İlerleme güncellenemedi");
        }
    }

    [HttpPost("complete-lesson")]
    public async Task<ActionResult> CompleteLesson([FromBody] CompleteLessonRequest request)
    {
        try
        {
            await _progressService.CompleteLessonAsync(request.StudentId, request.CourseContentId);
            return Ok("Ders tamamlandı");
        }
        catch (Exception)
        {
            return StatusCode(500, "Ders tamamlanamadı");
        }
    }

    [HttpPost("quiz-result")]
    public async Task<ActionResult> UpdateQuizResult([FromBody] QuizResultRequest request)
    {
        try
        {
            await _progressService.UpdateQuizResultAsync(request.StudentId, request.QuizId, request.Score);
            return Ok("Quiz sonucu güncellendi");
        }
        catch (Exception)
        {
            return StatusCode(500, "Quiz sonucu güncellenemedi");
        }
    }

    [HttpGet("class-analytics/{courseId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<ActionResult<List<AnalyticsDto>>> GetClassAnalytics(
        Guid courseId, 
        [FromQuery] DateTime date)
    {
        try
        {
            var analytics = await _progressService.GetClassAnalyticsAsync(courseId, date);
            return Ok(analytics);
        }
        catch (Exception)
        {
            return StatusCode(500, "Sınıf analitikleri alınamadı");
        }
    }

    [HttpGet("overall-progress/{studentId}/{courseId}")]
    public async Task<ActionResult<double>> GetOverallProgress(Guid studentId, Guid courseId)
    {
        try
        {
            var progress = await _progressService.CalculateOverallProgressAsync(studentId, courseId);
            return Ok(progress);
        }
        catch (Exception)
        {
            return StatusCode(500, "Genel ilerleme hesaplanamadı");
        }
    }
}

public class UpdateProgressRequest
{
    public Guid StudentId { get; set; }
    public Guid CourseContentId { get; set; }
    public int Progress { get; set; }
    public int TimeSpent { get; set; }
}

public class CompleteLessonRequest
{
    public Guid StudentId { get; set; }
    public Guid CourseContentId { get; set; }
}

public class QuizResultRequest
{
    public Guid StudentId { get; set; }
    public Guid QuizId { get; set; }
    public int Score { get; set; }
} 