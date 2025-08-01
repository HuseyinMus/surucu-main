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
    public bool IsActive { get; set; } = true;
    
    // Öğrenci Takip Sistemi - Yeni Alanlar
    public decimal TotalFee { get; set; } = 0; // Toplam ücret
    public decimal PaidAmount { get; set; } = 0; // Ödenen miktar
    public decimal RemainingDebt { get; set; } = 0; // Kalan borç
    public DateTime? NextPaymentDate { get; set; } // Sonraki ödeme tarihi
    public string? PaymentStatus { get; set; } = "Pending"; // Ödeme durumu: Pending, Partial, Completed
    public DateTime? ExamDate { get; set; } // Sınav tarihi
    public string? ExamStatus { get; set; } = "NotScheduled"; // Sınav durumu: NotScheduled, Scheduled, Passed, Failed
    public string? PhotoUrl { get; set; } // Öğrenci fotoğrafı
    public string? EmergencyContact { get; set; } // Acil durum iletişim
    public string? Address { get; set; } // Adres
    public DateTime? LastActivityDate { get; set; } // Son aktivite tarihi
    public int TheoryLessonsCompleted { get; set; } = 0; // Tamamlanan teorik ders sayısı
    public int PracticeLessonsCompleted { get; set; } = 0; // Tamamlanan pratik ders sayısı
    public int TotalTheoryLessons { get; set; } = 12; // Toplam teorik ders sayısı
    public int TotalPracticeLessons { get; set; } = 20; // Toplam pratik ders sayısı
    public string? Tags { get; set; } // Öğrenci etiketleri (virgülle ayrılmış)
    // Navigation properties
    public User User { get; set; } = null!;
    public DrivingSchool DrivingSchool { get; set; } = null!;
    public ICollection<QuizResult> QuizResults { get; set; } = new List<QuizResult>();
    public ICollection<QuizSession> QuizSessions { get; set; } = new List<QuizSession>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<StudentProgress> StudentProgresses { get; set; } = new List<StudentProgress>();
    public ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
} 