namespace Domain.Entities;

public enum ScheduleType
{
    Theory,
    Practice
}

public enum ScheduleStatus
{
    Scheduled,
    Done,
    Cancelled
}

public enum LessonType
{
    Theory = 0,
    Practice = 1,
    Exam = 2,
    Review = 3
}

public class Schedule
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public int Duration { get; set; } // Dakika cinsinden
    public LessonType LessonType { get; set; }
    public ScheduleStatus Status { get; set; } = ScheduleStatus.Scheduled;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Student Student { get; set; } = null!;
    public Instructor Instructor { get; set; } = null!;
    public DrivingSchool DrivingSchool { get; set; } = null!;
} 