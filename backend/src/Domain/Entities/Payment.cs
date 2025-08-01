namespace Domain.Entities;

public enum PaymentType
{
    Registration,    // Kayıt ücreti
    Theory,          // Teorik ders ücreti
    Practice,        // Pratik ders ücreti
    Exam,            // Sınav ücreti
    Retake,          // Tekrar sınav ücreti
    Other            // Diğer
}

public enum PaymentMethod
{
    Cash,            // Nakit
    CreditCard,      // Kredi kartı
    BankTransfer,    // Banka havalesi
    Check,           // Çek
    Online           // Online ödeme
}

public enum PaymentStatus
{
    Pending,         // Bekliyor
    Completed,       // Tamamlandı
    Failed,          // Başarısız
    Refunded,        // İade edildi
    Cancelled        // İptal edildi
}

public class Payment : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public decimal Amount { get; set; }
    public PaymentType Type { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public string? Description { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Student Student { get; set; } = null!;
    public DrivingSchool DrivingSchool { get; set; } = null!;
} 