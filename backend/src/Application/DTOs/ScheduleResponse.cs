namespace Application.DTOs;

public class ScheduleResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string Type { get; set; } = null!;
    public string Status { get; set; } = null!;
} 