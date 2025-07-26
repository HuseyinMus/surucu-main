namespace Domain.Entities;

public enum StudentStage
{
    Registered,
    Theory,
    Practice,
    Exam,
    Completed,
    Failed
}

public class Student : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string TCNumber { get; set; } = null!;
    public DateTime BirthDate { get; set; }
    public string LicenseType { get; set; } = null!;
    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
    public StudentStage CurrentStage { get; set; } = StudentStage.Registered;
    public string? PhoneNumber { get; set; }
    public string? Gender { get; set; }
    public string? Notes { get; set; }
    // Navigation properties
    public User User { get; set; } = null!;
    public DrivingSchool DrivingSchool { get; set; } = null!;
    public ICollection<QuizResult> QuizResults { get; set; } = new List<QuizResult>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
} 