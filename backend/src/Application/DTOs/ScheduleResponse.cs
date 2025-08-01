namespace Application.DTOs;

public class ScheduleResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public int Duration { get; set; }
    public string LessonType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
} 