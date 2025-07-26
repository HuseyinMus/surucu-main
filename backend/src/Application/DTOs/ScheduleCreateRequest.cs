namespace Application.DTOs;

public class ScheduleCreateRequest
{
    public Guid StudentId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string Type { get; set; } = null!; // Theory, Practice
} 