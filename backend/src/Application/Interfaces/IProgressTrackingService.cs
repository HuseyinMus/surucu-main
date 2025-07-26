using Application.DTOs;

namespace Application.Interfaces;

public interface IProgressTrackingService
{
    Task<ProgressSummaryDto> GetStudentProgressSummaryAsync(Guid studentId, Guid courseId);
    Task<List<LessonProgressDto>> GetLessonProgressAsync(Guid studentId, Guid courseId);
    Task<List<DailyProgressDto>> GetDailyProgressAsync(Guid studentId, Guid courseId, int days = 30);
    Task<AnalyticsDto> GetStudentAnalyticsAsync(Guid studentId, DateTime date);
    Task UpdateProgressAsync(Guid studentId, Guid courseContentId, int progress, int timeSpent);
    Task CompleteLessonAsync(Guid studentId, Guid courseContentId);
    Task UpdateQuizResultAsync(Guid studentId, Guid quizId, int score);
    Task<List<AnalyticsDto>> GetClassAnalyticsAsync(Guid courseId, DateTime date);
    Task<double> CalculateOverallProgressAsync(Guid studentId, Guid courseId);
} 