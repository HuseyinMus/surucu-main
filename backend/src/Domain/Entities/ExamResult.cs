namespace Domain.Entities;

public enum ExamType
{
    Theory,          // Teorik sınav
    Practice,        // Pratik sınav
    Final            // Final sınav
}

public enum ExamResultStatus
{
    Scheduled,       // Planlandı
    Completed,       // Tamamlandı
    Passed,          // Geçti
    Failed,          // Kaldı
    Cancelled,       // İptal edildi
    Retake           // Tekrar sınav
}

public class ExamResult : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public ExamType Type { get; set; }
    public DateTime ExamDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public int? Score { get; set; }
    public int? MaxScore { get; set; }
    public ExamResultStatus Status { get; set; } = ExamResultStatus.Scheduled;
    public string? Location { get; set; }
    public string? Examiner { get; set; }
    public string? Notes { get; set; }
    public string? CertificateNumber { get; set; }
    public DateTime? CertificateDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Student Student { get; set; } = null!;
    public DrivingSchool DrivingSchool { get; set; } = null!;
} 