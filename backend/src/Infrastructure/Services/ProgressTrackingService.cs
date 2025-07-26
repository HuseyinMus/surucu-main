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
            .Where(sp => sp.StudentId == studentId && 
                        course.CourseContents.Any(cc => cc.Id == sp.CourseContentId))
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
            .Where(sp => sp.StudentId == studentId && 
                        courseContents.Any(cc => cc.Id == sp.CourseContentId))
            .ToListAsync();

        var lessonProgress = new List<LessonProgressDto>();

        foreach (var content in courseContents)
        {
            var progress = progressRecords.FirstOrDefault(sp => sp.CourseContentId == content.Id);
            
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
        var endDate = DateTime.UtcNow.Date;
        var startDate = endDate.AddDays(-days + 1);

        var analytics = await _context.StudentAnalytics
            .Where(sa => sa.StudentId == studentId && 
                        sa.CourseId == courseId &&
                        sa.Date >= startDate && sa.Date <= endDate)
            .OrderBy(sa => sa.Date)
            .ToListAsync();

        var dailyProgress = new List<DailyProgressDto>();

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var dayAnalytics = analytics.FirstOrDefault(a => a.Date.Date == date);
            
            dailyProgress.Add(new DailyProgressDto
            {
                Date = date,
                TimeSpent = dayAnalytics?.TotalTimeSpent ?? 0,
                LessonsCompleted = dayAnalytics?.LessonsCompleted ?? 0,
                QuizzesTaken = dayAnalytics?.QuizzesTaken ?? 0,
                AverageScore = dayAnalytics?.AverageQuizScore ?? 0,
                FocusScore = dayAnalytics?.FocusScore ?? 0
            });
        }

        return dailyProgress;
    }

    public async Task<AnalyticsDto> GetStudentAnalyticsAsync(Guid studentId, DateTime date)
    {
        var analytics = await _context.StudentAnalytics
            .Include(sa => sa.Student)
            .FirstOrDefaultAsync(sa => sa.StudentId == studentId && sa.Date.Date == date.Date);

        if (analytics == null)
            return new AnalyticsDto
            {
                StudentId = studentId,
                Date = date,
                StudentName = "Bilinmeyen Öğrenci"
            };

        return new AnalyticsDto
        {
            StudentId = analytics.StudentId,
            StudentName = analytics.Student.User.FullName,
            Date = analytics.Date,
            TotalTimeSpent = analytics.TotalTimeSpent,
            LessonsCompleted = analytics.LessonsCompleted,
            QuizzesTaken = analytics.QuizzesTaken,
            AverageQuizScore = analytics.AverageQuizScore,
            PreferredTimeSlot = analytics.PreferredTimeSlot,
            LearningStyle = analytics.LearningStyle,
            FocusScore = analytics.FocusScore
        };
    }

    public async Task UpdateProgressAsync(Guid studentId, Guid courseContentId, int progress, int timeSpent)
    {
        var existingProgress = await _context.StudentProgresses
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && sp.CourseContentId == courseContentId);

        if (existingProgress != null)
        {
            existingProgress.Progress = progress;
            existingProgress.TimeSpent += timeSpent;
            existingProgress.LastAccessed = DateTime.UtcNow;
            
            if (progress >= 100 && !existingProgress.IsCompleted)
            {
                existingProgress.IsCompleted = true;
                existingProgress.CompletedAt = DateTime.UtcNow;
            }
        }
        else
        {
            var newProgress = new StudentProgress
            {
                StudentId = studentId,
                CourseContentId = courseContentId,
                Progress = progress,
                TimeSpent = timeSpent,
                IsCompleted = progress >= 100,
                CompletedAt = progress >= 100 ? DateTime.UtcNow : null,
                LastAccessed = DateTime.UtcNow
            };
            
            _context.StudentProgresses.Add(newProgress);
        }

        await _context.SaveChangesAsync();
    }

    public async Task CompleteLessonAsync(Guid studentId, Guid courseContentId)
    {
        var progress = await _context.StudentProgresses
            .FirstOrDefaultAsync(sp => sp.StudentId == studentId && sp.CourseContentId == courseContentId);

        if (progress != null)
        {
            progress.IsCompleted = true;
            progress.CompletedAt = DateTime.UtcNow;
            progress.Progress = 100;
        }
        else
        {
            var newProgress = new StudentProgress
            {
                StudentId = studentId,
                CourseContentId = courseContentId,
                Progress = 100,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow,
                LastAccessed = DateTime.UtcNow
            };
            
            _context.StudentProgresses.Add(newProgress);
        }

        await _context.SaveChangesAsync();
    }

    public async Task UpdateQuizResultAsync(Guid studentId, Guid quizId, int score)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) return;

        // Quiz'in bağlı olduğu course'u bul
        var course = await _context.Courses
            .Include(c => c.CourseContents)
            .FirstOrDefaultAsync(c => c.Id == quiz.CourseId);

        if (course == null) return;

        // Quiz sonucunu kaydet
        var quizResult = new QuizResult
        {
            StudentId = studentId,
            QuizId = quizId,
            Score = score,
            CompletedAt = DateTime.UtcNow
        };

        _context.QuizResults.Add(quizResult);

        // İlgili course content'in progress'ini güncelle
        var courseContent = course.CourseContents.FirstOrDefault();
        if (courseContent != null)
        {
            var progress = await _context.StudentProgresses
                .FirstOrDefaultAsync(sp => sp.StudentId == studentId && sp.CourseContentId == courseContent.Id);

            if (progress != null)
            {
                progress.QuizScore = score;
                progress.Attempts++;
                progress.LastAccessed = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<AnalyticsDto>> GetClassAnalyticsAsync(Guid courseId, DateTime date)
    {
        var analytics = await _context.StudentAnalytics
            .Include(sa => sa.Student)
            .ThenInclude(s => s.User)
            .Where(sa => sa.CourseId == courseId && sa.Date.Date == date.Date)
            .ToListAsync();

        return analytics.Select(a => new AnalyticsDto
        {
            StudentId = a.StudentId,
            StudentName = a.Student.User.FullName,
            Date = a.Date,
            TotalTimeSpent = a.TotalTimeSpent,
            LessonsCompleted = a.LessonsCompleted,
            QuizzesTaken = a.QuizzesTaken,
            AverageQuizScore = a.AverageQuizScore,
            PreferredTimeSlot = a.PreferredTimeSlot,
            LearningStyle = a.LearningStyle,
            FocusScore = a.FocusScore
        }).ToList();
    }

    public async Task<double> CalculateOverallProgressAsync(Guid studentId, Guid courseId)
    {
        var course = await _context.Courses
            .Include(c => c.CourseContents)
            .FirstOrDefaultAsync(c => c.Id == courseId);

        if (course == null || !course.CourseContents.Any())
            return 0;

        var progressRecords = await _context.StudentProgresses
            .Where(sp => sp.StudentId == studentId && 
                        course.CourseContents.Any(cc => cc.Id == sp.CourseContentId))
            .ToListAsync();

        var totalLessons = course.CourseContents.Count;
        var completedLessons = progressRecords.Count(sp => sp.IsCompleted);

        return totalLessons > 0 ? (double)completedLessons / totalLessons * 100 : 0;
    }
} 