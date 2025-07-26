namespace Domain.Entities;

public class Quiz : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public DrivingSchool DrivingSchool { get; set; } = null!;
    public Guid CourseId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public int TotalPoints { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Status { get; set; } = "active"; // active, inactive, draft
    // Navigation properties
    public Course Course { get; set; } = null!;
    public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
    public ICollection<QuizResult> Results { get; set; } = new List<QuizResult>();
} 