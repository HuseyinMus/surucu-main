namespace Application.DTOs;

public class DocumentUploadRequest
{
    public Guid StudentId { get; set; }
    public string DocumentType { get; set; } = null!; // Identity, HealthReport, PaymentReceipt
} 