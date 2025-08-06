using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class ProgressTrackingService : IProgressTrackingService
{
    private readonly AppDbContext _context;

    public ProgressTrackingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ProgressSummaryDto> GetStudentProgressSummaryAsync(Guid studentId, Guid courseId)
    {
        var course = await _context.Courses
            .Include(c => c.CourseContents)
            .Include(c => c.Quizzes)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course == null)
            throw new ArgumentException("Kurs bulunamadı");

        var progressRecords = await _context.StudentProgresses
            .Where(sp => sp.StudentId == studentId && sp.CourseId == courseId)
            .ToListAsync();

        var totalLessons = course.CourseContents.Count;
        var completedLessons = progressRecords.Count(sp => sp.IsCompleted);
        var totalQuizzes = course.Quizzes.Count;
        var completedQuizzes = await _context.QuizResults
            .CountAsync(qr => qr.StudentId == studentId && 
                             course.Quizzes.Any(q => q.Id == qr.QuizId));

        var averageQuizScore = await _context.QuizResults
            .Where(qr => qr.StudentId == studentId && 
                        course.Quizzes.Any(q => q.Id == qr.QuizId))
            .AverageAsync(qr => qr.Score);

        var totalTimeSpent = progressRecords.Sum(sp => sp.TimeSpent);
        var overallProgress = totalLessons > 0 ? (double)completedLessons / totalLessons * 100 : 0;
        var lastActivity = progressRecords.Any() ? progressRecords.Max(sp => sp.LastAccessed) : DateTime.UtcNow;

        var dailyProgress = await GetDailyProgressAsync(studentId, courseId, 7);

        return new ProgressSummaryDto
        {
            StudentId = studentId,
            CourseId = courseId,
            CourseTitle = course.Title,
            TotalLessons = totalLessons,
            CompletedLessons = completedLessons,
            TotalQuizzes = totalQuizzes,
            CompletedQuizzes = completedQuizzes,
            AverageQuizScore = averageQuizScore,
            TotalTimeSpent = totalTimeSpent,
            OverallProgress = overallProgress,
            LastActivity = lastActivity,
            DailyProgress = dailyProgress
        };
    }

    public async Task<List<LessonProgressDto>> GetLessonProgressAsync(Guid studentId, Guid courseId)
    {
        var courseContents = await _context.CourseContents
            .Where(cc => cc.CourseId == courseId)
            .ToListAsync();

        var progressRecords = await _context.StudentProgresses
            .Where(sp => sp.StudentId == studentId && sp.CourseId == courseId)
            .ToListAsync();

        var lessonProgress = new List<LessonProgressDto>();

        foreach (var content in courseContents)
        {
            var progress = progressRecords.FirstOrDefault(sp => sp.ContentId == content.Id);
            
            lessonProgress.Add(new LessonProgressDto
            {
                CourseContentId = content.Id,
                Title = content.Title,
                Progress = progress?.Progress ?? 0,
                TimeSpent = progress?.TimeSpent ?? 0,
                IsCompleted = progress?.IsCompleted ?? false,
                CompletedAt = progress?.CompletedAt,
                QuizScore = progress?.QuizScore ?? 0,
                Attempts = progress?.Attempts ?? 0,
                LastAccessed = progress?.LastAccessed ?? DateTime.UtcNow
            });
        }

        return lessonProgress.OrderBy(lp => lp.LastAccessed).ToList();
    }

    public async Task<List<DailyProgressDto>> GetDailyProgressAsync(Guid studentId, Guid courseId, int days = 30)
    {
        var endDate = DateTime.UtcNow;
        var startDate = endDate.AddDays(-days);

        var progressRecords = await _context.StudentProgresses
            .Where(sp => sp.StudentId == studentId && 
                        sp.CourseId == courseId &&
                        sp.LastAccessed >= startDate)
            .ToListAsync();

        var dailyProgress = new List<DailyProgressDto>();

        for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
        {
            var dayRecords = progressRecords.Where(sp => sp.LastAccessed.Date == date).ToList();
            
            dailyProgress.Add(new DailyProgressDto
            {
                Date = date,
                LessonsCompleted = dayRecords.Count(sp => sp.IsCompleted),
                TimeSpent = dayRecords.Sum(sp => sp.TimeSpent),
                Progress = dayRecords.Any() ? dayRecords.Average(sp => sp.Progress) : 0
            });
        }

        return dailyProgress;
    }

    public async Task<AnalyticsDto> GetStudentAnalyticsAsync(Guid studentId, DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);

        var progressRecords = await _context.StudentProgresses
            .Where(sp => sp.StudentId == studentId && 
                        sp.LastAccessed >= startOfDay && 
                        sp.LastAccessed < endOfDay)
            .ToListAsync();

        return new AnalyticsDto
        {
            StudentId = studentId,
            Date = date,
            TotalTimeSpent = progressRecords.Sum(sp => sp.TimeSpent),
            LessonsCompleted = progressRecords.Count(sp => sp.IsCompleted),
            AverageProgress = progressRecords.Any() ? progressRecords.Average(sp => sp.Progress) : 0,
            TotalAttempts = progressRecords.Sum(sp => sp.Attempts ?? 0)
        };
    }

    public async Task UpdateProgressAsync(Guid studentId, Guid courseContentId, int progress, int timeSpent)
    {
        var courseContent = await _context.CourseContents
            .FirstOrDefaultAsync(cc => cc.Id == courseContentId);

        if (courseContent == null)
            throw new ArgumentException("Kurs içeriği bulunamadı");

        var existingProgress = await _context.StudentProgresses
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && 
                                      sp.CourseId == courseContent.CourseId &&
                                      sp.ContentId == courseContentId);

        if (existingProgress == null)
        {
            existingProgress = new StudentProgress
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                CourseId = courseContent.CourseId,
                ContentId = courseContentId,
                Progress = progress,
                TimeSpent = timeSpent,
                IsCompleted = progress >= 100,
                LastAccessed = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                ViewedAt = DateTime.UtcNow
            };

            _context.StudentProgresses.Add(existingProgress);
        }
        else
        {
            existingProgress.Progress = progress;
            existingProgress.TimeSpent += timeSpent;
            existingProgress.LastAccessed = DateTime.UtcNow;
            existingProgress.IsCompleted = progress >= 100;
            
            if (progress >= 100 && !existingProgress.CompletedAt.HasValue)
            {
                existingProgress.CompletedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task CompleteLessonAsync(Guid studentId, Guid courseContentId)
    {
        var courseContent = await _context.CourseContents
            .FirstOrDefaultAsync(cc => cc.Id == courseContentId);

        if (courseContent == null)
            throw new ArgumentException("Kurs içeriği bulunamadı");

        var existingProgress = await _context.StudentProgresses
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && 
                                      sp.CourseId == courseContent.CourseId &&
                                      sp.ContentId == courseContentId);

        if (existingProgress == null)
        {
            existingProgress = new StudentProgress
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                CourseId = courseContent.CourseId,
                ContentId = courseContentId,
                Progress = 100,
                TimeSpent = 0,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow,
                LastAccessed = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                ViewedAt = DateTime.UtcNow
            };

            _context.StudentProgresses.Add(existingProgress);
        }
        else
        {
            existingProgress.Progress = 100;
            existingProgress.IsCompleted = true;
            existingProgress.CompletedAt = DateTime.UtcNow;
            existingProgress.LastAccessed = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task UpdateQuizResultAsync(Guid studentId, Guid quizId, int score)
    {
        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
            throw new ArgumentException("Quiz bulunamadı");

        if (!quiz.CourseId.HasValue || quiz.CourseId.Value == Guid.Empty)
            throw new ArgumentException("Quiz'in bağlı olduğu kurs bulunamadı");

        var existingProgress = await _context.StudentProgresses
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && 
                                      sp.CourseId == quiz.CourseId.Value &&
                                      sp.ContentId == quizId);

        if (existingProgress == null)
        {
            existingProgress = new StudentProgress
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                CourseId = quiz.CourseId.Value,
                ContentId = quizId,
                Progress = 100,
                TimeSpent = 0,
                IsCompleted = true,
                QuizScore = score,
                CompletedAt = DateTime.UtcNow,
                LastAccessed = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                ViewedAt = DateTime.UtcNow
            };

            _context.StudentProgresses.Add(existingProgress);
        }
        else
        {
            existingProgress.QuizScore = score;
            existingProgress.Progress = 100;
            existingProgress.IsCompleted = true;
            existingProgress.CompletedAt = DateTime.UtcNow;
            existingProgress.LastAccessed = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<AnalyticsDto>> GetClassAnalyticsAsync(Guid courseId, DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);

        var progressRecords = await _context.StudentProgresses
            .Where(sp => sp.CourseId == courseId && 
                        sp.LastAccessed >= startOfDay && 
                        sp.LastAccessed < endOfDay)
            .ToListAsync();

        var studentIds = progressRecords.Select(sp => sp.StudentId).Distinct();
        var analytics = new List<AnalyticsDto>();

        foreach (var studentId in studentIds)
        {
            var studentRecords = progressRecords.Where(sp => sp.StudentId == studentId).ToList();
            
            analytics.Add(new AnalyticsDto
            {
                StudentId = studentId,
                Date = date,
                TotalTimeSpent = studentRecords.Sum(sp => sp.TimeSpent),
                LessonsCompleted = studentRecords.Count(sp => sp.IsCompleted),
                AverageProgress = studentRecords.Any() ? studentRecords.Average(sp => sp.Progress) : 0,
                TotalAttempts = studentRecords.Sum(sp => sp.Attempts ?? 0)
            });
        }

        return analytics;
    }

    public async Task<double> CalculateOverallProgressAsync(Guid studentId, Guid courseId)
    {
        var course = await _context.Courses
            .Include(c => c.CourseContents)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course == null)
            return 0;

        var totalContents = course.CourseContents.Count;
        if (totalContents == 0)
            return 0;

        var completedContents = await _context.StudentProgresses
            .CountAsync(sp => sp.StudentId == studentId && 
                             sp.CourseId == courseId && 
                             sp.IsCompleted);

        return (double)completedContents / totalContents * 100;
    }
} 