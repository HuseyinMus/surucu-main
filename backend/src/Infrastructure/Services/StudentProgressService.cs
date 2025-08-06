using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class StudentProgressService : IStudentProgressService
{
    private readonly AppDbContext _db;
    public StudentProgressService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<StudentProgressResponse> LogProgressAsync(StudentProgressCreateRequest request)
    {
        var progress = new StudentProgress
        {
            Id = Guid.NewGuid(),
            StudentId = request.StudentId,
            CourseId = request.CourseId,
            ContentId = request.CourseContentId, // Eski alan adını koruyoruz
            Progress = request.Progress,
            TimeSpent = request.TimeSpent,
            ViewedAt = DateTime.UtcNow,
            LastAccessed = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _db.StudentProgresses.Add(progress);
        await _db.SaveChangesAsync();
        return new StudentProgressResponse
        {
            Id = progress.Id,
            StudentId = progress.StudentId,
            CourseContentId = progress.ContentId, // Eski alan adını koruyoruz
            ViewedAt = progress.ViewedAt,
            Progress = progress.Progress,
            TimeSpent = progress.TimeSpent
        };
    }

    public async Task<List<StudentProgressResponse>> GetProgressAsync(Guid studentId)
    {
        var progresses = await _db.StudentProgresses
            .Where(sp => sp.StudentId == studentId)
            .ToListAsync();
        return progresses.Select(progress => new StudentProgressResponse
        {
            Id = progress.Id,
            StudentId = progress.StudentId,
            CourseContentId = progress.ContentId, // Eski alan adını koruyoruz
            ViewedAt = progress.ViewedAt,
            Progress = progress.Progress,
            TimeSpent = progress.TimeSpent
        }).ToList();
    }

    public async Task<List<StudentProgressReport>> GetProgressReportAsync(Guid studentId, Guid drivingSchoolId)
    {
        // For each course, calculate total and viewed contents
        var courses = await _db.Courses.Where(c => c.DrivingSchoolId == drivingSchoolId).ToListAsync();
        var reports = new List<StudentProgressReport>();
        foreach (var course in courses)
        {
            var totalContents = await _db.CourseContents.CountAsync(cc => cc.CourseId == course.Id);
            var viewedContents = await _db.StudentProgresses
                .CountAsync(sp => sp.StudentId == studentId && sp.CourseId == course.Id);
            double percent = totalContents == 0 ? 0 : (viewedContents * 100.0) / totalContents;
            reports.Add(new StudentProgressReport
            {
                StudentId = studentId,
                CourseId = course.Id,
                TotalContents = totalContents,
                ViewedContents = viewedContents,
                CompletionPercent = percent
            });
        }
        return reports;
    }
} 