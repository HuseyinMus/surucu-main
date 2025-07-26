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
            CourseId = request.CourseId,
            ScheduledDate = request.ScheduledDate,
            Type = Enum.Parse<ScheduleType>(request.Type, true),
            Status = ScheduleStatus.Scheduled
        };
        _db.Schedules.Add(schedule);
        await _db.SaveChangesAsync();
        return new ScheduleResponse
        {
            Id = schedule.Id,
            StudentId = schedule.StudentId,
            InstructorId = schedule.InstructorId,
            CourseId = schedule.CourseId,
            ScheduledDate = schedule.ScheduledDate,
            Type = schedule.Type.ToString(),
            Status = schedule.Status.ToString()
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
            CourseId = schedule.CourseId,
            ScheduledDate = schedule.ScheduledDate,
            Type = schedule.Type.ToString(),
            Status = schedule.Status.ToString()
        }).ToList();
    }
} 