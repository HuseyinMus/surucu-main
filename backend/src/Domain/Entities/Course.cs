namespace Domain.Entities;

public enum CourseType
{
    Theory,
    Practice
}

public class Course : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; } // Virgülle ayrılmış etiketler
    public CourseType CourseType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? VideoUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? PdfUrl { get; set; }
    // Navigation properties
    public DrivingSchool DrivingSchool { get; set; } = null!;
    public ICollection<CourseContent> CourseContents { get; set; } = new List<CourseContent>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
} 