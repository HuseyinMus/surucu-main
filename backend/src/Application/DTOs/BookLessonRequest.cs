namespace Application.DTOs;

public class BookLessonRequest
{
    public Guid InstructorId { get; set; }
    public LessonType LessonType { get; set; }
    public DateTime ScheduledDate { get; set; }
    public int Duration { get; set; } // Dakika cinsinden
    public string? Notes { get; set; }
} 