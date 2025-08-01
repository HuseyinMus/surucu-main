using Microsoft.AspNetCore.Http;

namespace Application.DTOs;

public class StudentTrackingRequest
{
    public decimal TotalFee { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTime? NextPaymentDate { get; set; }
    public string? PaymentStatus { get; set; }
    public DateTime? ExamDate { get; set; }
    public string? ExamStatus { get; set; }
    public string? EmergencyContact { get; set; }
    public string? Address { get; set; }
    public int TheoryLessonsCompleted { get; set; }
    public int PracticeLessonsCompleted { get; set; }
    public int TotalTheoryLessons { get; set; }
    public int TotalPracticeLessons { get; set; }
    public string? Notes { get; set; }
}

public class PaymentCreateRequest
{
    public Guid StudentId { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public string? Description { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? Notes { get; set; }
}

public class ExamResultCreateRequest
{
    public Guid StudentId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime ExamDate { get; set; }
    public string? Location { get; set; }
    public string? Examiner { get; set; }
    public string? Notes { get; set; }
}

public class StudentPhotoUploadRequest
{
    public Guid StudentId { get; set; }
    public IFormFile Photo { get; set; } = null!;
}

public class StudentTrackingResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string TCNumber { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public string CurrentStage { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    
    // Ödeme Bilgileri
    public decimal TotalFee { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingDebt { get; set; }
    public DateTime? NextPaymentDate { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    
    // Sınav Bilgileri
    public DateTime? ExamDate { get; set; }
    public string ExamStatus { get; set; } = string.Empty;
    
    // İletişim Bilgileri
    public string? EmergencyContact { get; set; }
    public string? Address { get; set; }
    
    // Ders Bilgileri
    public int TheoryLessonsCompleted { get; set; }
    public int PracticeLessonsCompleted { get; set; }
    public int TotalTheoryLessons { get; set; }
    public int TotalPracticeLessons { get; set; }
    public double TheoryProgress => TotalTheoryLessons > 0 ? (double)TheoryLessonsCompleted / TotalTheoryLessons * 100 : 0;
    public double PracticeProgress => TotalPracticeLessons > 0 ? (double)PracticeLessonsCompleted / TotalPracticeLessons * 100 : 0;
    
    // Son Aktivite
    public DateTime? LastActivityDate { get; set; }
    public string? Notes { get; set; }
    
    // İlişkili Veriler
    public List<PaymentResponse> Payments { get; set; } = new();
    public List<ExamResultResponse> ExamResults { get; set; } = new();
}

public class PaymentResponse
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Description { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? Notes { get; set; }
}

public class ExamResultResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime ExamDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public int? Score { get; set; }
    public int? MaxScore { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Examiner { get; set; }
    public string? Notes { get; set; }
    public string? CertificateNumber { get; set; }
    public DateTime? CertificateDate { get; set; }
} 