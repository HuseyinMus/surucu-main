namespace Application.DTOs;

public class ScheduleLessonRequest
{
    public LessonType LessonType { get; set; }
    public DateTime ScheduledDate { get; set; }
    public int Duration { get; set; } // Dakika cinsinden
    public string? Notes { get; set; }
}

public enum LessonType
{
    Theory = 0,
    Practice = 1,
    Exam = 2,
    Review = 3
} 