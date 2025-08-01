using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class ScheduleService : IScheduleService
{
    private readonly AppDbContext _db;
    public ScheduleService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ScheduleResponse> CreateScheduleAsync(ScheduleCreateRequest request)
    {
        var schedule = new Schedule
        {
            Id = Guid.NewGuid(),
            StudentId = request.StudentId,
            InstructorId = request.InstructorId,
            DrivingSchoolId = request.DrivingSchoolId,
            ScheduledDate = request.ScheduledDate,
            Duration = request.Duration,
            LessonType = (Domain.Entities.LessonType)request.LessonType,
            Status = ScheduleStatus.Scheduled,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };
        _db.Schedules.Add(schedule);
        await _db.SaveChangesAsync();
        return new ScheduleResponse
        {
            Id = schedule.Id,
            StudentId = schedule.StudentId,
            InstructorId = schedule.InstructorId,
            DrivingSchoolId = schedule.DrivingSchoolId,
            ScheduledDate = schedule.ScheduledDate,
            Duration = schedule.Duration,
            LessonType = schedule.LessonType.ToString(),
            Status = schedule.Status.ToString(),
            Notes = schedule.Notes,
            CreatedAt = schedule.CreatedAt
        };
    }

    public async Task<List<ScheduleResponse>> GetStudentSchedulesAsync(Guid studentId)
    {
        var schedules = await _db.Schedules
            .Where(s => s.StudentId == studentId)
            .ToListAsync();
        return schedules.Select(schedule => new ScheduleResponse
        {
            Id = schedule.Id,
            StudentId = schedule.StudentId,
            InstructorId = schedule.InstructorId,
            DrivingSchoolId = schedule.DrivingSchoolId,
            ScheduledDate = schedule.ScheduledDate,
            Duration = schedule.Duration,
            LessonType = schedule.LessonType.ToString(),
            Status = schedule.Status.ToString(),
            Notes = schedule.Notes,
            CreatedAt = schedule.CreatedAt
        }).ToList();
    }
} 