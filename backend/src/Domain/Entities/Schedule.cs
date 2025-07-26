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
    Canceled
}

public class Schedule
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid InstructorId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public ScheduleType Type { get; set; }
    public ScheduleStatus Status { get; set; } = ScheduleStatus.Scheduled;
    // Navigation properties
    public Student Student { get; set; } = null!;
    public Instructor Instructor { get; set; } = null!;
    public Course Course { get; set; } = null!;
} 