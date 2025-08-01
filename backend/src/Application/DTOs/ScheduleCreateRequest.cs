using Domain.Entities;

namespace Application.DTOs;

public class ScheduleCreateRequest
{
    public Guid StudentId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public int Duration { get; set; } // Dakika cinsinden
    public LessonType LessonType { get; set; }
    public string? Notes { get; set; }
} 